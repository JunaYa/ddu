use tauri::{window::Color, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use tauri::{AppHandle, Manager, Monitor, PhysicalPosition, WebviewWindow};

use crate::constants::{MAIN_WINDOW, PREVIEW_WINDOW};
use crate::platform;

pub fn create_window(app: &mut tauri::App) -> Result<(), tauri::Error> {
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("ddu")
        .title_bar_style(TitleBarStyle::Transparent)
        .background_color(Color(10, 100, 100, 1))
        .inner_size(800.0, 600.0);

    let window = win_builder.build().unwrap();

    // set background color only when building for macOS
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                0.5,
            );
            ns_window.setBackgroundColor_(bg_color);
        }
    }

    Ok(())
}

pub fn get_preview_window(app: &AppHandle) -> WebviewWindow {
    if let Some(window) = app.get_webview_window(PREVIEW_WINDOW) {
        window
    } else {
        let window =
            WebviewWindowBuilder::new(app, PREVIEW_WINDOW, WebviewUrl::App("/preview".into()))
                .title("Spyglass")
                .decorations(false)
                .transparent(true)
                .visible(true)
                .shadow(false)
                .resizable(false)
                .inner_size(240.0, 240.0)
                .position(100.0, 100.0);

        let window = window.build().expect("Unable to build startup window");
        #[cfg(target_os = "macos")]
        {
            use cocoa::appkit::{NSColor, NSWindow};
            use cocoa::base::{id, nil};

            let ns_window = window.ns_window().unwrap() as id;
            unsafe {
                // macOS: Handle multiple spaces correctly
                ns_window.setCollectionBehavior_(cocoa::appkit::NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace);

                let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                    nil,
                    50.0 / 255.0,
                    158.0 / 255.0,
                    163.5 / 255.0,
                    0.5,
                );
                ns_window.setBackgroundColor_(bg_color);
            }
        }

        window
    }
}

fn find_monitor(window: &WebviewWindow) -> Option<Monitor> {
    if let Ok(Some(mon)) = window.primary_monitor() {
        Some(mon)
    } else if let Ok(Some(mon)) = window.current_monitor() {
        Some(mon)
    } else if let Ok(mut monitors) = window.available_monitors() {
        if monitors.is_empty() {
            None
        } else {
            monitors.pop()
        }
    } else {
        None
    }
}

pub fn bottom_right_preview(window: &WebviewWindow) {
    let window_size = match window.inner_size() {
        Ok(size) => size,
        // Nothing to do if the window is not created yet.
        Err(_) => return,
    };

    if let Some(monitor) = find_monitor(window) {
        let screen_position = monitor.position();
        let screen_size = monitor.size();

        let y = (120f64 * monitor.scale_factor()) as i32;
        let new_position = PhysicalPosition {
            x: screen_position.x
                + ((screen_size.width as i32 / 2) - (window_size.width as i32 / 2)),
            y,
        };

        let _ = window.set_position(tauri::Position::Physical(new_position));
    } else {
        println!("Unable to detect any monitors.");
    }
}

pub fn show_preview_window(window: &WebviewWindow) {
    platform::show_preview_window(window);

    // let window = window.clone();
    // tauri::async_runtime::spawn(async move {
    //     tokio::time::sleep(tokio::time::Duration::from_millis(256)).await;
    //     let _ = window.emit(ClientEvent::FocusWindow.as_ref(), true);
    // });
}

pub fn hide_preview_window(window: &WebviewWindow) {
    let handle = window.app_handle();
    // don't hide if the settings window is open
    if let Some(preview_window) = handle.get_webview_window(PREVIEW_WINDOW) {
        if preview_window.is_visible().unwrap_or_default() {
            return;
        }
    }

    platform::hide_preview_window(window);
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        platform::show_main_window(&window);
    } else {
        return;
    };
}

pub fn hide_main_window(app: &AppHandle) {
    if let Some(main_window) = app.get_webview_window(MAIN_WINDOW) {
        if main_window.is_visible().unwrap_or_default() {
            platform::hide_main_window(&main_window);
            return;
        }
    }
}
