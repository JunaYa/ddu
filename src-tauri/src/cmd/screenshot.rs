use serde::{Deserialize, Serialize};
use crate::platform;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResultDto {
    pub filename: String,
    pub full_path: String,
    pub width: u32,
    pub height: u32,
    pub mode: String,
    pub captured_at: String,
}

#[tauri::command]
pub async fn capture_screen(app_handle: tauri::AppHandle, path: String) -> Result<CaptureResultDto, String> {
    let result = platform::capture_screen(&app_handle, path).await?;
    Ok(CaptureResultDto {
        filename: result.filename,
        full_path: result.full_path,
        width: result.width,
        height: result.height,
        mode: result.mode,
        captured_at: result.captured_at,
    })
}

#[tauri::command]
pub async fn capture_select(app_handle: tauri::AppHandle, path: String) -> Result<CaptureResultDto, String> {
    let result = platform::capture_select(&app_handle, path).await?;
    Ok(CaptureResultDto {
        filename: result.filename,
        full_path: result.full_path,
        width: result.width,
        height: result.height,
        mode: result.mode,
        captured_at: result.captured_at,
    })
}

#[tauri::command]
pub async fn capture_window(app_handle: tauri::AppHandle, path: String) -> Result<CaptureResultDto, String> {
    let result = platform::capture_window(&app_handle, path).await?;
    Ok(CaptureResultDto {
        filename: result.filename,
        full_path: result.full_path,
        width: result.width,
        height: result.height,
        mode: result.mode,
        captured_at: result.captured_at,
    })
}

#[tauri::command]
pub async fn capture_delayed(app_handle: tauri::AppHandle, path: String, delay_secs: u32) -> Result<CaptureResultDto, String> {
    let result = platform::capture_delayed(&app_handle, path, delay_secs).await?;
    Ok(CaptureResultDto {
        filename: result.filename,
        full_path: result.full_path,
        width: result.width,
        height: result.height,
        mode: result.mode,
        captured_at: result.captured_at,
    })
}

#[tauri::command]
pub async fn capture_current_screen(app_handle: tauri::AppHandle, path: String) -> Result<CaptureResultDto, String> {
    let result = platform::capture_current_screen(&app_handle, path).await?;
    Ok(CaptureResultDto {
        filename: result.filename,
        full_path: result.full_path,
        width: result.width,
        height: result.height,
        mode: result.mode,
        captured_at: result.captured_at,
    })
}

#[tauri::command]
pub fn get_last_capture_path() -> Option<String> {
    platform::get_last_capture_path()
}

#[tauri::command]
pub fn open_screen_capture_preferences() {
    platform::open_screen_capture_preferences();
}

#[tauri::command]
pub fn check_accessibility_permissions() -> bool {
    platform::check_accessibility_permissions()
}
