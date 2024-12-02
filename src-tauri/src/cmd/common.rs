use tracing::info;

use crate::common::{get_image_base64_by_path, copy_picture_to_clipboard};

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

#[tauri::command]
pub async fn get_image_base64(
    path: String,
) -> Result<String, String> {
    get_image_base64_by_path(path).await
}
