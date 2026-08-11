use std::{
    path::Path,
    sync::atomic::{AtomicU64, Ordering},
};

use base64::{engine::general_purpose, Engine as _};
use image::ImageReader;
use serde::{Deserialize, Serialize};
use tracing::info;

const MAX_ANNOTATED_IMAGE_BYTES: usize = 50 * 1024 * 1024;
static ANNOTATED_IMAGE_SEQUENCE: AtomicU64 = AtomicU64::new(1);

fn annotated_filename(original_filename: &str, sequence: u64) -> String {
    let stem = Path::new(original_filename)
        .file_stem()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .unwrap_or("screenshot");
    format!("{stem}_edited_{sequence}.png")
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

/// Save an edited PNG as a distinct history item next to its guarded source.
/// The renderer never selects a destination path, so an edit cannot become an
/// arbitrary-write primitive or overwrite its original capture.
#[tauri::command]
pub async fn save_annotated_image(
    app_handle: tauri::AppHandle,
    base64: String,
    source_path: String,
) -> Result<String, String> {
    let source = crate::common::ensure_within_images_dir(&app_handle, Path::new(&source_path))?;
    let bytes = general_purpose::STANDARD
        .decode(base64.as_bytes())
        .map_err(|e| e.to_string())?;
    if bytes.len() > MAX_ANNOTATED_IMAGE_BYTES {
        return Err("edited image is too large to save".to_string());
    }

    image::load_from_memory(&bytes).map_err(|e| format!("edited image is invalid: {e}"))?;

    let images_dir = crate::common::get_images_dir(&app_handle, "images".to_string())?;
    let filename = annotated_filename(
        source.file_name().and_then(|name| name.to_str()).unwrap_or("screenshot.png"),
        ANNOTATED_IMAGE_SEQUENCE.fetch_add(1, Ordering::Relaxed),
    );
    let output_path = images_dir.join(filename);
    std::fs::write(&output_path, &bytes).map_err(|e| e.to_string())?;

    let saved = output_path.to_string_lossy().to_string();
    info!("Saved annotated image to {saved}");
    Ok(saved)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn annotated_filename_preserves_the_original_and_marks_the_copy() {
        assert_eq!(
            annotated_filename("screenshot_20260811_093045_123_7.png", 2),
            "screenshot_20260811_093045_123_7_edited_2.png"
        );
    }
}
