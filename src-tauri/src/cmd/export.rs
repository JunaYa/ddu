use std::path::Path;

use base64::{engine::general_purpose, Engine as _};
use image::ImageReader;
use serde::{Deserialize, Serialize};
use tauri_plugin_dialog::DialogExt;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    pub format: String,
    pub quality: u8,
}

#[tauri::command]
pub async fn export_image(
    app_handle: tauri::AppHandle,
    source_path: String,
    target_path: String,
    format: String,
    quality: u8,
) -> Result<String, String> {
    // Both ends are guarded: source must live in the controlled dir, and the
    // target is constrained too so a compromised renderer cannot use this
    // command as an arbitrary-write primitive. User-chosen export destinations
    // go through `save_annotated_image`, where the path is resolved server-side.
    let source = crate::common::ensure_within_images_dir(&app_handle, Path::new(&source_path))?;
    let target = crate::common::ensure_within_images_dir(&app_handle, Path::new(&target_path))?;

    let img = ImageReader::open(&source)
        .map_err(|e| e.to_string())?
        .decode()
        .map_err(|e| e.to_string())?;

    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    match format.as_str() {
        "png" => {
            img.save_with_format(&target, image::ImageFormat::Png)
                .map_err(|e| e.to_string())?;
        }
        "jpg" | "jpeg" => {
            let mut buf = std::io::BufWriter::new(
                std::fs::File::create(&target).map_err(|e| e.to_string())?,
            );
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, quality);
            img.write_with_encoder(encoder).map_err(|e| e.to_string())?;
        }
        "webp" => {
            img.save_with_format(&target, image::ImageFormat::WebP)
                .map_err(|e| e.to_string())?;
        }
        _ => {
            return Err(format!("Unsupported format: {}", format));
        }
    }

    let target_str = target.to_string_lossy().to_string();
    info!("Exported image to {} as {}", target_str, format);
    Ok(target_str)
}

/// Save annotated image bytes to a user-chosen location. The native save dialog
/// is opened server-side, so the destination path never transits the renderer
/// — a compromised frontend cannot supply an arbitrary write target. Returns
/// the saved path, or `None` if the user cancelled.
#[tauri::command]
pub async fn save_annotated_image(
    app_handle: tauri::AppHandle,
    base64: String,
    default_file_name: String,
) -> Result<Option<String>, String> {
    let bytes = general_purpose::STANDARD
        .decode(base64.as_bytes())
        .map_err(|e| e.to_string())?;

    let file_path = app_handle
        .dialog()
        .file()
        .set_file_name(&default_file_name)
        .add_filter("PNG", &["png"])
        .add_filter("JPEG", &["jpg", "jpeg"])
        .blocking_save_file();

    match file_path {
        Some(fp) => {
            let path = fp.into_path().map_err(|e| e.to_string())?;
            std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;
            info!("Saved annotated image to {}", path.to_string_lossy());
            Ok(Some(path.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn get_image_info(path: String) -> Result<ImageInfo, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("File not found".to_string());
    }
    let metadata = std::fs::metadata(p).map_err(|e| e.to_string())?;
    let (width, height) = image::image_dimensions(p).unwrap_or((0, 0));
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_string();

    Ok(ImageInfo {
        width,
        height,
        file_size: metadata.len(),
        format: ext,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
    pub format: String,
}
