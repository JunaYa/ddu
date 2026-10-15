use std::fs::{self, OpenOptions};
use std::io::BufWriter;
use std::path::Path;
use std::sync::Mutex;

use image::ImageDecoder;
use tauri::Emitter;
use tauri_plugin_dialog::DialogExt;

// A cold preview can subscribe after the import completes. Keep the payload
// until it is consumed, rather than relying on a timed event delivery.
static PENDING_IMAGE: Mutex<Option<serde_json::Value>> = Mutex::new(None);

#[tauri::command]
pub fn take_imported_image() -> Result<Option<serde_json::Value>, String> {
    Ok(PENDING_IMAGE.lock().map_err(|e| e.to_string())?.take())
}

#[tauri::command]
pub async fn open_image_for_ocr(app: tauri::AppHandle) -> Result<bool, String> {
    let picker = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        picker
            .dialog()
            .file()
            .set_title("打开图片识别文字")
            .add_filter(
                "图片",
                &["png", "jpg", "jpeg", "webp", "bmp", "tif", "tiff"],
            )
            .blocking_pick_file()
    })
    .await
    .map_err(|e| e.to_string())?;
    let Some(selected) = selected else {
        return Ok(false);
    };
    let source = selected.into_path().map_err(|e| e.to_string())?;
    let directory = crate::common::get_images_dir(&app, "images".to_string())?;
    let payload = tauri::async_runtime::spawn_blocking(move || import_image(&source, &directory))
        .await
        .map_err(|e| e.to_string())??;
    *PENDING_IMAGE.lock().map_err(|e| e.to_string())? = Some(payload);
    let preview = crate::window::update_preview_window(&app);
    // Startup consumes the same pending slot if this notification is missed.
    let _ = preview.emit("imported-image-ready", ());
    crate::window::hide_main_window(&app);
    Ok(true)
}

fn import_image(source: &Path, directory: &Path) -> Result<serde_json::Value, String> {
    if fs::metadata(source).map_err(|e| e.to_string())?.len() > 50 * 1024 * 1024 {
        return Err("图片不能超过 50 MB".to_string());
    }
    let mut reader = image::ImageReader::open(source)
        .map_err(|e| format!("无法打开图片：{e}"))?
        .with_guessed_format()
        .map_err(|e| e.to_string())?;
    let mut limits = image::Limits::default();
    limits.max_image_width = Some(16_384);
    limits.max_image_height = Some(16_384);
    limits.max_alloc = Some(256 * 1024 * 1024);
    reader.limits(limits);
    let mut decoder = reader
        .into_decoder()
        .map_err(|e| format!("无法读取图片：{e}"))?;
    let orientation = decoder.orientation().map_err(|e| e.to_string())?;
    let mut image =
        image::DynamicImage::from_decoder(decoder).map_err(|e| format!("无法解码图片：{e}"))?;
    image.apply_orientation(orientation);
    let now = chrono::Local::now();
    let filename = format!("screenshot_{}_imported.png", now.format("%Y%m%d_%H%M%S_%f"));
    let output = directory.join(&filename);
    let file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&output)
        .map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);
    use std::io::Write;
    let saved = image
        .write_to(&mut writer, image::ImageFormat::Png)
        .map_err(|e| e.to_string())
        .and_then(|_| writer.flush().map_err(|e| e.to_string()));
    if let Err(error) = saved {
        drop(writer);
        let _ = fs::remove_file(&output);
        return Err(format!("无法保存图片副本：{error}"));
    }
    Ok(serde_json::json!({
        "filename": filename,
        "fullPath": output.to_string_lossy(),
        "width": image.width(),
        "height": image.height(),
        "mode": "imported",
        "capturedAt": now.to_rfc3339(),
        "copyError": null,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Fixture(std::path::PathBuf);
    impl Fixture {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "ddu-import-test-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            fs::create_dir_all(path.join("images")).unwrap();
            Self(path)
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn imports_decoded_image_as_unique_png_without_modifying_source() {
        let fixture = Fixture::new();
        let source = fixture.0.join("photo.bmp");
        image::RgbImage::from_pixel(20, 10, image::Rgb([12, 34, 56]))
            .save(&source)
            .unwrap();
        let original = fs::read(&source).unwrap();
        let first = import_image(&source, &fixture.0.join("images")).unwrap();
        let second = import_image(&source, &fixture.0.join("images")).unwrap();
        assert_ne!(first["fullPath"], second["fullPath"]);
        assert_eq!(first["mode"], "imported");
        assert_eq!(first["width"], 20);
        assert_eq!(first["height"], 10);
        let saved = image::open(first["fullPath"].as_str().unwrap())
            .unwrap()
            .to_rgb8();
        assert_eq!(*saved.get_pixel(0, 0), image::Rgb([12, 34, 56]));
        assert_eq!(fs::read(source).unwrap(), original);
    }

    #[test]
    fn invalid_and_oversized_files_do_not_create_history_entries() {
        let fixture = Fixture::new();
        let source = fixture.0.join("invalid.png");
        fs::write(&source, b"not an image").unwrap();
        assert!(import_image(&source, &fixture.0.join("images")).is_err());
        let file = fs::File::create(&source).unwrap();
        file.set_len(50 * 1024 * 1024 + 1).unwrap();
        assert!(import_image(&source, &fixture.0.join("images"))
            .unwrap_err()
            .contains("50 MB"));
        assert_eq!(fs::read_dir(fixture.0.join("images")).unwrap().count(), 0);
    }
}
