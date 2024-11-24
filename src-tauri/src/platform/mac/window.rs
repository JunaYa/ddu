use crate::window;
use tauri::WebviewWindow;

pub fn show_preview_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
    window::bottom_right_position(window);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
}

pub fn hide_preview_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_main_window(window: &WebviewWindow) {
    let _ = window.show();
    window::center_position(window);
    let _ = window.unminimize();
}

pub fn hide_main_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_setting_window(window: &WebviewWindow) {
    let _ = window.show();
    window::center_position(window);
    let _ = window.unminimize();
}

pub fn hide_setting_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_startup_window(window: &WebviewWindow) {
    let _ = window.show();
    window::center_position(window);
    let _ = window.unminimize();
}

pub fn hide_startup_window(window: &WebviewWindow) {
    let _ = window.minimize();
}
