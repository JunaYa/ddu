use std::path::Path;

use base64::{engine::general_purpose, Engine as _};
use tauri::Emitter;

use crate::common::{
    copy_image_bytes_to_clipboard, copy_picture_to_clipboard, ensure_within_images_dir,
    get_image_base64_by_path, get_images_dir,
};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn copy_image_to_clipboard(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<(), String> {
    let guarded = ensure_within_images_dir(&app_handle, Path::new(&path))?;
    copy_picture_to_clipboard(app_handle, guarded.to_string_lossy().to_string()).await
}

/// Copy annotated image bytes (base64-encoded PNG from the editor) to the
/// clipboard without writing a temp file.
#[tauri::command]
pub async fn copy_image_bytes(
    app_handle: tauri::AppHandle,
    base64: String,
) -> Result<(), String> {
    let bytes = general_purpose::STANDARD
        .decode(base64.as_bytes())
        .map_err(|e| e.to_string())?;
    copy_image_bytes_to_clipboard(app_handle, bytes).await
}

#[tauri::command]
pub async fn get_image_base64(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<String, String> {
    let guarded = ensure_within_images_dir(&app_handle, Path::new(&path))?;
    get_image_base64_by_path(guarded.to_string_lossy().to_string()).await
}

/// Persist a frontend-composed image (base64 PNG) into the controlled images
/// directory and open it in the preview/editor window, mirroring the post-capture
/// flow. Used by the "combine screenshots" feature.
#[tauri::command]
pub async fn open_combined_image(
    app_handle: tauri::AppHandle,
    base64: String,
) -> Result<(), String> {
    let bytes = general_purpose::STANDARD
        .decode(base64.as_bytes())
        .map_err(|e| e.to_string())?;

    let images_dir = get_images_dir(&app_handle, "images".to_string())?;
    let filename = format!(
        "screenshot_{}_combined.png",
        chrono::Local::now().format("%Y%m%d_%H%M%S")
    );
    let output_path = images_dir.join(&filename);
    std::fs::write(&output_path, &bytes).map_err(|e| e.to_string())?;

    crate::window::hide_main_window(&app_handle);
    let window = crate::window::show_preview_window(&app_handle);
    let payload = serde_json::json!({
        "filename": filename,
        "fullPath": output_path.to_string_lossy(),
        "width": 0,
        "height": 0,
        "mode": "combined",
        "capturedAt": chrono::Local::now().to_rfc3339(),
    });
    tauri::async_runtime::spawn(async move {
        std::thread::sleep(std::time::Duration::from_millis(500));
        let _ = window.emit("image-prepared", payload);
    });

    Ok(())
}
