use crate::window;
use tauri::WebviewWindow;

pub fn is_visible(window: &WebviewWindow) -> bool {
    window.is_visible().unwrap_or_default()
}

pub fn show_preview_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
    window::bottom_right_preview(window);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
}

pub fn hide_preview_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_main_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
}

pub fn hide_main_window(window: &WebviewWindow) {
    let _ = window.minimize();
}
