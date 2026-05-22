use std::path::Path;
use image::ImageReader;
use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    pub format: String,
    pub quality: u8,
}

#[tauri::command]
pub async fn export_image(
    source_path: String,
    target_path: String,
    format: String,
    quality: u8,
) -> Result<String, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("Source file not found".to_string());
    }

    let img = ImageReader::open(source)
        .map_err(|e| e.to_string())?
        .decode()
        .map_err(|e| e.to_string())?;

    let target = Path::new(&target_path);
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    match format.as_str() {
        "png" => {
            img.save_with_format(target, image::ImageFormat::Png)
                .map_err(|e| e.to_string())?;
        }
        "jpg" | "jpeg" => {
            let mut buf = std::io::BufWriter::new(
                std::fs::File::create(target).map_err(|e| e.to_string())?,
            );
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, quality);
            img.write_with_encoder(encoder).map_err(|e| e.to_string())?;
        }
        "webp" => {
            img.save_with_format(target, image::ImageFormat::WebP)
                .map_err(|e| e.to_string())?;
        }
        _ => {
            return Err(format!("Unsupported format: {}", format));
        }
    }

    info!("Exported image to {} as {}", target_path, format);
    Ok(target_path)
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
