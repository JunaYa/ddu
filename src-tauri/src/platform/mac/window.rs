use std::{thread::sleep, time::Duration};

use crate::window;
use tauri::{PhysicalSize, WebviewWindow};
use tauri_plugin_positioner::{Position, WindowExt};

pub fn show_preview_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
    // Keep the floating preview out of the app switcher / Mission Control so it
    // behaves like an overlay rather than a normal window.
    let _ = window.set_skip_taskbar(true);
    window::bottom_right_position(window);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
}

pub fn update_preview_window(window: &WebviewWindow) {
    if !window.is_visible().unwrap_or_default() {
        show_preview_window(window);
    }
    let _ = window.unminimize();
    let _ = window.set_decorations(true);
    let _ = window.set_focus();
    let _ = window.set_resizable(true);
    let _ = window.set_always_on_top(false);
    if let Some(monitor) = window::find_monitor(window) {
        let screen_size = monitor.size();
        let size = PhysicalSize {
            width: screen_size.width / 2,
            height: screen_size.height / 2,
        };
        let _ = window.set_size(tauri::Size::Physical(size));
        // sleep 0.3
        let window = window.clone();
        tauri::async_runtime::spawn(async move {
            sleep(Duration::from_millis(100));
            let _ = window.move_window(Position::Center);
        });
    }
}

pub fn hide_preview_window(window: &WebviewWindow) {
    // Use hide() rather than minimize(): a minimized floating preview lingers in
    // the Dock / Mission Control, whereas hide() removes it cleanly (R9, AE7).
    let _ = window.hide();
}

pub fn show_main_window(window: &WebviewWindow) {
    let _ = window.show();
    window::center_position(window);
    let _ = window.set_focus();
    let _ = window.unminimize();
}

pub fn hide_main_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_setting_window(window: &WebviewWindow) {
    let _ = window.show();
    window::center_position(window);
    let _ = window.set_focus();
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
