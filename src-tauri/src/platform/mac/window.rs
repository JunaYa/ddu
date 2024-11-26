use crate::window;
use tauri::{PhysicalSize, WebviewWindow};

pub fn show_preview_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
    window::bottom_right_position(window);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
}

pub fn update_preview_window(window: &WebviewWindow) {
    if (!window.is_visible().unwrap_or_default()) {
        show_preview_window(window);
    }
    let _ = window.unminimize();
    window::center_position(window);
    let _ = window.set_decorations(true);
    let _ = window.set_focus();
    let _ = window.set_resizable(true);
    let _ = window.set_always_on_top(false);
    if let Some(monitor) = window::find_monitor(window) {
        let screen_size = monitor.size();
        let size = PhysicalSize {
            width: screen_size.width - 360,
            height: screen_size.height - 860,
        };
        let _ = window.set_size(tauri::Size::Physical(size));
    }
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
    let _ = window.set_focus();
    let _ = window.unminimize();
}

pub fn hide_startup_window(window: &WebviewWindow) {
    let _ = window.minimize();
}
