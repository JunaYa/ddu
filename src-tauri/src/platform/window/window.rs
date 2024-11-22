use tauri::{Emitter, WebviewWindow};

pub fn is_visible(window: &WebviewWindow) -> bool {
    if let Ok(handle) = window.hwnd() {
        let mut lpwndpl = WINDOWPLACEMENT::default();
        unsafe {
            let _ = GetWindowPlacement::<HWND>(handle, &mut lpwndpl);
            // SHOW_WINDOW_CMD(2) == minimized

            return lpwndpl.showCmd != 2;
        }
    }

    false
}

pub fn show_search_bar(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.unminimize();
    window::center_search_bar(window);
    let _ = window.set_focus();
}

pub fn hide_search_bar(window: &WebviewWindow) {
    let _ = window.minimize();
    let _ = window.emit(ClientEvent::ClearSearch.as_ref(), true);
}
