use tracing::info;

use crate::common::copy_picture_to_clipboard;

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn copy_image_to_clipboard(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<(), String> {
    info!("path {}", path);
    copy_picture_to_clipboard(app_handle, path).await
}
