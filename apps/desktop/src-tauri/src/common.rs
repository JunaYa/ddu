use std::path::{Path, PathBuf};

use image::ImageReader;
use tauri::{image::Image, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_store::StoreExt;
use tracing::info;

pub fn get_images_dir(app_handle: &tauri::AppHandle, path: String) -> Result<PathBuf, String> {
    validate_images_subdirectory(&path)?;
    let store = app_handle
        .get_store("settings.json")
        .ok_or_else(|| "Could not get settings store".to_string())?;

    let screenshot_path = store
        .get("screenshot_path")
        .ok_or_else(|| "Screenshot path not found in settings".to_string())?;
    info!("screenshot_path: {:?}", screenshot_path);

    // get value from Option<JsonValue>; treat a malformed/missing value as empty
    // so we fall back to the app local data dir instead of panicking.
    let screenshot_path = screenshot_path
        .as_object()
        .and_then(|obj| obj.get("value"))
        .and_then(|value| value.as_str())
        .unwrap_or("");

    // 获取 AppLocalData 路径
    // 如果 screenshot_path 为空，则使用 app_local_data
    let app_local_data = if screenshot_path.is_empty() {
        app_handle
            .path()
            .app_local_data_dir()
            .map_err(|e| format!("could not resolve app local data dir: {e}"))?
    } else {
        PathBuf::from(screenshot_path)
    };
    info!("app_local_data: {:?}", app_local_data);

    prepare_images_dir(&app_local_data)
}

fn prepare_images_dir(root: &Path) -> Result<PathBuf, String> {
    prepare_storage_subdirectory(root, "images")
}

pub(crate) fn prepare_recordings_dir(images: &Path) -> Result<PathBuf, String> {
    prepare_storage_subdirectory(images.parent().ok_or("missing storage root")?, "recordings")
}

fn prepare_storage_subdirectory(root: &Path, name: &str) -> Result<PathBuf, String> {
    if !root.is_absolute() {
        return Err("screenshot root must be absolute".into());
    }
    std::fs::create_dir_all(root).map_err(|e| e.to_string())?;
    let root = std::fs::canonicalize(root).map_err(|e| e.to_string())?;
    let images = root.join(name);
    if std::fs::symlink_metadata(&images).is_ok_and(|m| m.file_type().is_symlink()) {
        return Err("screenshot directory must not be a symbolic link".into());
    }
    std::fs::create_dir_all(&images).map_err(|e| e.to_string())?;
    let images = std::fs::canonicalize(images).map_err(|e| e.to_string())?;
    if !images.starts_with(&root) {
        return Err("screenshot directory escaped its root".into());
    }
    Ok(images)
}

/// Resolve the controlled screenshot directory (`<screenshot_path>/images`),
/// canonicalized so symlinks and `..` segments are collapsed.
fn controlled_images_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = get_images_dir(app_handle, "images".to_string())?;
    std::fs::canonicalize(&dir).map_err(|e| format!("cannot resolve images dir: {e}"))
}

/// Ensure `candidate` resolves to a path inside the controlled screenshot
/// directory and return the canonicalized path.
///
/// Uses component-wise `Path::starts_with` (not a string prefix, so a sibling
/// such as `.../images-evil` cannot pass) and fails closed when a path cannot
/// be canonicalized. For a not-yet-existing target the parent directory is
/// canonicalized and the file name re-joined, so callers can validate a write
/// destination before it exists.
pub fn ensure_within_images_dir(
    app_handle: &tauri::AppHandle,
    candidate: &Path,
) -> Result<PathBuf, String> {
    let base = controlled_images_dir(app_handle)?;
    let resolved = match std::fs::canonicalize(candidate) {
        Ok(p) => p,
        Err(_) => {
            let parent = candidate
                .parent()
                .ok_or_else(|| "invalid path: no parent".to_string())?;
            let file = candidate
                .file_name()
                .ok_or_else(|| "invalid path: no file name".to_string())?;
            let parent = std::fs::canonicalize(parent)
                .map_err(|e| format!("path is outside the controlled directory: {e}"))?;
            parent.join(file)
        }
    };
    if resolved.starts_with(&base) {
        Ok(resolved)
    } else {
        Err("path is outside the controlled screenshot directory".to_string())
    }
}

pub async fn copy_picture_to_clipboard(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<(), String> {
    // Validate file exists
    let path = Path::new(&path);
    if !path.exists() {
        return Err("Image file does not exist".to_string());
    }

    let img = ImageReader::open(path)
        .map_err(|e| e.to_string())?
        .decode()
        .map_err(|e| e.to_string())?;

    let rgba = img.into_rgba8();
    let width = rgba.width();
    let height = rgba.height();
    let rgba_data = rgba.into_raw();
    let img = Image::new(&rgba_data, width, height);

    // Copy to clipboard
    app_handle
        .clipboard()
        .write_image(&img)
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Write already-encoded image bytes (e.g. a PNG exported from the editor
/// canvas) straight to the clipboard, without ever touching disk. This avoids
/// the leftover `*_annotated.png` temp files the previous copy path created.
pub async fn copy_image_bytes_to_clipboard(
    app_handle: tauri::AppHandle,
    bytes: Vec<u8>,
) -> Result<(), String> {
    let img = crate::image_limits::decode_image(&bytes)?;
    let rgba = img.into_rgba8();
    let width = rgba.width();
    let height = rgba.height();
    let rgba_data = rgba.into_raw();
    let img = Image::new(&rgba_data, width, height);

    app_handle
        .clipboard()
        .write_image(&img)
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn get_image_base64_by_path(path: String) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    // Validate file exists
    let path = Path::new(&path);
    if !path.exists() {
        return Err("Image file does not exist".to_string());
    }

    // Read the raw, already-encoded image file bytes (PNG/JPEG/WebP) and base64
    // them directly. Encoding `decode().as_bytes()` would emit raw pixel data,
    // which is not a valid image payload for an <img> data URL.
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    let b64 = general_purpose::STANDARD.encode(bytes);

    Ok(b64)
}

/// IPC callers cannot choose a second root or traverse out of the selected directory.
fn validate_images_subdirectory(path: &str) -> Result<(), String> {
    if path == "images" {
        Ok(())
    } else {
        Err("unsupported screenshot directory".into())
    }
}

#[cfg(test)]
mod boundary_tests {
    use super::*;
    #[test]
    fn accepts_only_the_images_directory() {
        assert!(validate_images_subdirectory("images").is_ok());
        for path in [
            "",
            "/tmp",
            "../images",
            "images/../other",
            "images/child",
            "C:\\temp",
            "images\\child",
        ] {
            assert!(validate_images_subdirectory(path).is_err(), "{path}");
        }
    }
    #[cfg(unix)]
    #[test]
    fn images_subdirectory_cannot_redirect_outside_the_selected_root() {
        use std::os::unix::fs::symlink;
        let base = std::env::temp_dir().join(format!("ddu-root-{}", std::process::id()));
        let chosen = base.join("chosen");
        let outside = base.join("outside");
        std::fs::create_dir_all(&outside).unwrap();
        let images = prepare_images_dir(&chosen).unwrap();
        assert!(images.starts_with(std::fs::canonicalize(&chosen).unwrap()));
        let recordings = prepare_recordings_dir(&images).unwrap();
        std::fs::remove_dir(&recordings).unwrap();
        symlink(&outside, chosen.join("recordings")).unwrap();
        assert!(prepare_recordings_dir(&images).is_err());
        std::fs::remove_dir(&images).unwrap();
        symlink(&outside, chosen.join("images")).unwrap();
        assert!(prepare_images_dir(&chosen).is_err());
        assert!(prepare_images_dir(Path::new("relative")).is_err());
        std::fs::remove_dir_all(base).unwrap();
    }
}
