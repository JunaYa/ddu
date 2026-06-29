use std::path::Path;

use crate::common::{copy_picture_to_clipboard, ensure_within_images_dir, get_image_base64_by_path};

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

#[tauri::command]
pub async fn get_image_base64(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<String, String> {
    let guarded = ensure_within_images_dir(&app_handle, Path::new(&path))?;
    get_image_base64_by_path(guarded.to_string_lossy().to_string()).await
}
