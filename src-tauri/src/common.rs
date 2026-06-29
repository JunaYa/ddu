use std::path::{Path, PathBuf};

use image::ImageReader;
use tauri::{image::Image, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_store::StoreExt;
use tracing::info;

pub fn get_images_dir(app_handle: &tauri::AppHandle, path: String) -> Result<PathBuf, String> {
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

    // 创建 images 文件夹
    // path 如果为空，则使用 app_local_data
    let images_dir = if path.is_empty() {
        app_local_data
    } else {
        app_local_data.join(path)
    };

    info!("images_dir: {:?}", images_dir);
    std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    // let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    // let output_path = images_dir.join(&filename);

    Ok(images_dir)
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

    let img = ImageReader::open(&path)
        .map_err(|e| e.to_string())?
        .decode()
        .map_err(|e| e.to_string())?;

    let rgba = img.into_rgba8();
    let width = rgba.width() as u32;
    let height = rgba.height() as u32;
    let rgba_data = rgba.into_raw();
    let img = Image::new(&rgba_data, width, height);

    // Copy to clipboard
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
