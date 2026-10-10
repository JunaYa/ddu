use tauri::{LogicalPosition, LogicalSize, Position, Size, WebviewWindow};

use crate::placement;
use crate::smart_capture::LogicalRect;
use crate::window;

/// Show the floater beside `anchor` (the captured area, in global logical
/// points) on the display it came from. `None` uses the cursor's display.
pub fn show_preview_window(window: &WebviewWindow, anchor: Option<LogicalRect>) {
    // Position before showing so it never flashes on the previous display.
    place_preview(window, anchor);
    let _ = window.show();
    let _ = window.unminimize();
    // Keep the floating preview out of the app switcher / Mission Control so it
    // behaves like an overlay rather than a normal window.
    let _ = window.set_skip_taskbar(true);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
}

/// Grow the floater into the editor, centered on the display it is on.
pub fn update_preview_window(window: &WebviewWindow) {
    if !window.is_visible().unwrap_or_default() {
        show_preview_window(window, None);
    }
    let _ = window.unminimize();
    let _ = window.set_decorations(true);
    let _ = window.set_focus();
    let _ = window.set_resizable(true);
    let _ = window.set_always_on_top(false);

    let Some(current) = placement::window_frame(window) else { return };
    let Some(screen) = placement::screen_for(current, &placement::screens(window)) else {
        return;
    };
    let size = (screen.work_area.w / 2.0, screen.work_area.h / 2.0);
    let (x, y) = placement::center_in(size, screen.work_area);
    let _ = window.set_size(Size::Logical(LogicalSize::new(size.0, size.1)));
    let _ = window.set_position(Position::Logical(LogicalPosition::new(x, y)));
}

fn place_preview(window: &WebviewWindow, anchor: Option<LogicalRect>) {
    let anchor = anchor.unwrap_or_else(|| {
        let (x, y) = super::cursor_position_logical();
        LogicalRect { x, y, w: 0.0, h: 0.0 }
    });
    let Some(screen) = placement::screen_for(anchor, &placement::screens(window)) else {
        return;
    };
    // A bare point (no captured area) stands for its whole display.
    let anchor = if anchor.w > 0.0 && anchor.h > 0.0 { anchor } else { screen.bounds };
    let Some(frame) = placement::window_frame(window) else { return };
    let (x, y) = placement::place_beside(anchor, (frame.w, frame.h), screen.work_area);
    let _ = window.set_position(Position::Logical(LogicalPosition::new(x, y)));
}

pub fn hide_preview_window(window: &WebviewWindow) {
    // Use hide() rather than minimize(): a minimized floating preview lingers in
    // the Dock / Mission Control, whereas hide() removes it cleanly (R9, AE7).
    let _ = window.hide();
}

pub fn show_main_window(window: &WebviewWindow) {
    window::place_on_cursor_screen(window);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.unminimize();
}

pub fn hide_main_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_setting_window(window: &WebviewWindow) {
    window::place_on_cursor_screen(window);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.unminimize();
}

pub fn hide_setting_window(window: &WebviewWindow) {
    let _ = window.minimize();
}

pub fn show_startup_window(window: &WebviewWindow) {
    window::place_on_cursor_screen(window);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.unminimize();
}
