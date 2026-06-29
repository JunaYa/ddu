use tauri::{AppHandle, Manager, Monitor, PhysicalPosition, WebviewWindow};
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
#[cfg(target_os = "macos")]
use tauri::window::{Effect, EffectState, EffectsBuilder};
use tracing::info;

use crate::constants::{MAIN_WINDOW, PREVIEW_WINDOW, SETTING_WINDOW, STARTUP_WINDOW};
use crate::platform;

pub fn find_monitor(window: &WebviewWindow) -> Option<Monitor> {
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

pub fn center_position(window: &WebviewWindow) {
    let window_size = match window.inner_size() {
        Ok(size) => size,
        // Nothing to do if the window is not created yet.
        Err(_) => return,
    };

    if let Some(monitor) = find_monitor(window) {
        let screen_position = monitor.position();
        let screen_size = monitor.size();

        let y = (120f64 * monitor.scale_factor()) as i32;
        let x =
            screen_position.x + ((screen_size.width as i32 / 2) - (window_size.width as i32 / 2));
        let new_position = PhysicalPosition { x, y };

        let _ = window.set_position(tauri::Position::Physical(new_position));
    } else {
        info!("Unable to detect any monitors.");
    }
}

pub fn bottom_right_position(window: &WebviewWindow) {
    let window_size = match window.inner_size() {
        Ok(size) => size,
        // Nothing to do if the window is not created yet.
        Err(_) => return,
    };

    if let Some(monitor) = find_monitor(window) {
        let screen_size = monitor.size();

        let y = (screen_size.height as f64
            - monitor.scale_factor()
            - window_size.height as f64
            - 128.0) as i32;
        let x =
            (screen_size.width as f64 - monitor.scale_factor() - window_size.width as f64 - 128.0)
                as i32;

        let new_position = PhysicalPosition { x, y };

        let _ = window.set_position(tauri::Position::Physical(new_position));
    } else {
        info!("Unable to detect any monitors.");
    }
}

#[cfg(target_os = "macos")]
fn macos_glass_effect() -> tauri::utils::config::WindowEffectsConfig {
    EffectsBuilder::new()
        .effect(Effect::WindowBackground)
        .state(EffectState::Active)
        .radius(8.0)
        .build()
}

#[cfg(target_os = "macos")]
fn move_macos_window_to_active_space(window: &WebviewWindow) {
    use objc::runtime::{Object, Sel};
    use objc::Message;

    type NSUInteger = libc::c_ulong;
    const NS_WINDOW_COLLECTION_BEHAVIOR_MOVE_TO_ACTIVE_SPACE: NSUInteger = 1 << 1;

    unsafe {
        let ns_window = window.ns_window().unwrap() as *mut Object;
        let _: () = (&*ns_window)
            .send_message(
                Sel::register("setCollectionBehavior:"),
                (NS_WINDOW_COLLECTION_BEHAVIOR_MOVE_TO_ACTIVE_SPACE,),
            )
            .expect("failed to set NSWindow collection behavior");
    }
}

pub fn get_main_window(app: &AppHandle) -> WebviewWindow {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        window
    } else {
        let win_builder =
            WebviewWindowBuilder::new(app, MAIN_WINDOW, WebviewUrl::App("/main.html".into()))
                .title("ddu")
                .title_bar_style(TitleBarStyle::Transparent)
                .transparent(true)
                .skip_taskbar(true)
                .inner_size(800.0, 600.0);

        #[cfg(target_os = "macos")]
        let win_builder = win_builder.effects(macos_glass_effect());

        win_builder.build().unwrap()
    }
}

pub fn get_setting_window(app: &AppHandle) -> WebviewWindow {
    if let Some(window) = app.get_webview_window(SETTING_WINDOW) {
        window
    } else {
        let win_builder =
            WebviewWindowBuilder::new(app, SETTING_WINDOW, WebviewUrl::App("/setting.html".into()))
                .title("Setting")
                .minimizable(false)
                .maximizable(false)
                .resizable(true)
                .transparent(true)
                .skip_taskbar(true)
                .fullscreen(false)
                .inner_size(600.0, 620.0);

        #[cfg(target_os = "macos")]
        let win_builder = win_builder.effects(macos_glass_effect());

        win_builder.build().unwrap()
    }
}

pub fn get_preview_window(app: &AppHandle) -> WebviewWindow {
    if let Some(window) = app.get_webview_window(PREVIEW_WINDOW) {
        window
    } else {
        let window =
            WebviewWindowBuilder::new(app, PREVIEW_WINDOW, WebviewUrl::App("/preview.html".into()))
                .title("preview")
                .decorations(false)
                .transparent(true)
                .visible(true)
                .skip_taskbar(true)
                .shadow(false)
                .resizable(false)
                .inner_size(140.0, 140.0);

        let window = window.build().expect("Unable to build startup window");

        #[cfg(target_os = "macos")]
        {
            move_macos_window_to_active_space(&window);
        }

        window
    }
}

pub fn get_startup_window(app: &AppHandle) -> WebviewWindow {
    if let Some(window) = app.get_webview_window(STARTUP_WINDOW) {
        window
    } else {
        let win_builder =
            WebviewWindowBuilder::new(app, STARTUP_WINDOW, WebviewUrl::App("/startup.html".into()))
                .title("Startup")
                .decorations(true)
                .transparent(true)
                .visible(true)
                .skip_taskbar(false)
                .shadow(true)
                .resizable(false)
                .inner_size(360.0, 280.0);

        #[cfg(target_os = "macos")]
        let win_builder = win_builder.effects(macos_glass_effect());

        win_builder.build().unwrap()
    }
}

pub fn show_preview_window(app: &AppHandle) -> WebviewWindow {
    let window = get_preview_window(app);
    platform::show_preview_window(&window);
    window
}

pub fn update_preview_window(app: &AppHandle) -> WebviewWindow {
    let window = get_preview_window(app);
    platform::update_preview_window(&window);
    window
}

pub fn hide_preview_window(app: &AppHandle) {
    if let Some(preview_window) = app.get_webview_window(PREVIEW_WINDOW) {
        if preview_window.is_visible().unwrap_or_default() {
            platform::hide_preview_window(&preview_window);
        }
    }
}

pub fn show_main_window(app: &AppHandle) {
    let window = get_main_window(app);
    platform::show_main_window(&window);
}

pub fn hide_main_window(app: &AppHandle) {
    if let Some(main_window) = app.get_webview_window(MAIN_WINDOW) {
        if main_window.is_visible().unwrap_or_default() {
            platform::hide_main_window(&main_window);
        }
    }
}

pub fn show_setting_window(app: &AppHandle) {
    let window = get_setting_window(app);
    platform::show_setting_window(&window);
}

pub fn hide_setting_window(app: &AppHandle) {
    if let Some(setting_window) = app.get_webview_window(SETTING_WINDOW) {
        if setting_window.is_visible().unwrap_or_default() {
            platform::hide_setting_window(&setting_window);
        }
    }
}

pub fn show_startup_window(app: &AppHandle) {
    let window = get_startup_window(app);
    platform::show_startup_window(&window);
}
