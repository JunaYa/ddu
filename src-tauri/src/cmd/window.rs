use tauri::AppHandle;

use crate::window;

#[tauri::command]
pub fn show_preview_window(app: AppHandle, path: String) -> Result<String, String> {
    window::show_preview_window(&app);
    Ok(path)
}

#[tauri::command]
pub fn update_preview_window(app: AppHandle) -> Result<(), String> {
    window::update_preview_window(&app);
    Ok(())
}

#[tauri::command]
pub fn hide_preview_window(app: AppHandle) -> Result<(), String> {
    window::hide_preview_window(&app);
    Ok(())
}

#[tauri::command]
pub fn show_main_window(app: AppHandle) -> Result<(), String> {
    window::show_main_window(&app);
    Ok(())
}

#[tauri::command]
pub fn hide_main_window(app: AppHandle) -> Result<(), String> {
    window::hide_main_window(&app);
    Ok(())
}

#[tauri::command]
pub fn show_setting_window(app: AppHandle) -> Result<(), String> {
    window::show_setting_window(&app);
    Ok(())
}

#[tauri::command]
pub fn hide_setting_window(app: AppHandle) -> Result<(), String> {
    window::hide_setting_window(&app);
    Ok(())
}
