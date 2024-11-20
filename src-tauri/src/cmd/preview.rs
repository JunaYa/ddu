use tauri::{AppHandle, Manager, Runtime};

use crate::{constants::PREVIEW_WINDOW, window};

#[tauri::command]
pub fn show_preview_window(app: AppHandle, path: String) -> Result<String, String> {
    if let Some(window) = app.get_webview_window(PREVIEW_WINDOW) {
        window::show_preview_window(&window);
    }
    window::hide_main_window(&app);
    Ok(path)
}
