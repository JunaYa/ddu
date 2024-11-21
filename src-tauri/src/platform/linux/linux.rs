use tauri::{Emitter, WebviewWindow};

pub fn show_search_bar(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
    window::center_search_bar(window);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
}

pub fn hide_search_bar(window: &WebviewWindow) {
    let _ = window.minimize();
    let _ = window.emit(ClientEvent::ClearSearch.as_ref(), true);
}
