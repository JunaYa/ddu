use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
#[cfg(target_os = "macos")]
use tauri::window::{Effect, EffectState, EffectsBuilder};
use tracing::info;

use crate::constants::{MAIN_WINDOW, PREVIEW_WINDOW, SETTING_WINDOW, STARTUP_WINDOW, CAPTURE_WINDOW};
use crate::placement;
use crate::platform;

/// Move a settings/startup window onto the display under the
/// cursor, horizontally centered near the top. Call before `show()` so it
/// never flashes on the display it was last on.
pub fn place_on_cursor_screen(window: &WebviewWindow) {
    let (Some(screen), Some(frame)) = (placement::cursor_screen(window), placement::window_frame(window)) else {
        info!("Unable to detect the cursor's display.");
        return;
    };
    let (x, y) = placement::place_top_center((frame.w, frame.h), screen.work_area);
    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
}

#[cfg(target_os = "macos")]
fn macos_glass_effect() -> tauri::utils::config::WindowEffectsConfig {
    EffectsBuilder::new()
        .effect(Effect::WindowBackground)
        .state(EffectState::Active)
        .radius(8.0)
        .build()
}

/// Runs an AppKit call against a window's `NSWindow` on the main thread.
///
/// AppKit is main-thread-only, and macOS 26 routes `NSWindow` mutations through
/// WindowManagement, which traps the process (`EXC_BREAKPOINT`, "Must only be
/// used from the main thread") rather than misbehaving quietly. Capture flows
/// run on the async runtime, so every `ns_window()` call has to be marshalled
/// back. The closure is queued, not awaited — Tauri's own window operations go
/// through the same event loop, so ordering with them is preserved.
#[cfg(target_os = "macos")]
fn with_ns_window_on_main_thread(
    window: &WebviewWindow,
    f: impl FnOnce(*mut objc::runtime::Object) + Send + 'static,
) {
    let app = window.app_handle().clone();
    let window = window.clone();
    let dispatched = app.run_on_main_thread(move || {
        // The window can be closed between queueing and execution; degrade
        // rather than panic on the main thread.
        let Ok(ns_window) = window.ns_window() else { return };
        f(ns_window as *mut objc::runtime::Object);
    });
    if let Err(e) = dispatched {
        info!("failed to dispatch AppKit call to the main thread: {e}");
    }
}

#[cfg(target_os = "macos")]
fn move_macos_window_to_active_space(window: &WebviewWindow) {
    use objc::runtime::Sel;
    use objc::Message;

    type NSUInteger = libc::c_ulong;
    const NS_WINDOW_COLLECTION_BEHAVIOR_MOVE_TO_ACTIVE_SPACE: NSUInteger = 1 << 1;

    with_ns_window_on_main_thread(window, |ns_window| unsafe {
        let result: Result<(), _> = (&*ns_window).send_message(
            Sel::register("setCollectionBehavior:"),
            (NS_WINDOW_COLLECTION_BEHAVIOR_MOVE_TO_ACTIVE_SPACE,),
        );
        if let Err(e) = result {
            info!("failed to set NSWindow collection behavior: {e}");
        }
    });
}

pub fn get_main_window(app: &AppHandle) -> WebviewWindow {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        window
    } else {
        let win_builder =
            WebviewWindowBuilder::new(app, MAIN_WINDOW, WebviewUrl::App("/main.html".into()))
                .title("ddu")
                // Shown by platform::show_* once placed on the right display.
                .visible(false)
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
                // Shown by platform::show_* once placed on the right display.
                .visible(false)
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
                // Shown by platform::show_* once placed on the right display.
                .visible(false)
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

/// `anchor` is the captured area in global logical points; the floater opens
/// beside it on the same display. `None` uses the display under the cursor.
pub fn show_preview_window(
    app: &AppHandle,
    anchor: Option<crate::smart_capture::LogicalRect>,
) -> WebviewWindow {
    let window = get_preview_window(app);
    platform::show_preview_window(&window, anchor);
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

static PERMISSION_NAVIGATION: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

pub fn take_permission_navigation() -> bool {
    PERMISSION_NAVIGATION.swap(false, std::sync::atomic::Ordering::AcqRel)
}

pub fn show_permission_settings(app: &AppHandle) {
    // Persist before creation: the first mount must not depend on receiving an event.
    PERMISSION_NAVIGATION.store(true, std::sync::atomic::Ordering::Release);
    if let Some(startup) = app.get_webview_window(STARTUP_WINDOW) { let _ = startup.hide(); }
    show_setting_window(app);
    let _ = app.emit_to(SETTING_WINDOW, "settings-permissions", ());
}

/// Frameless, opaque, always-on-top overlay covering one monitor. Recreated
/// from scratch on every session so repeated hotkey presses never stack.
/// Returns `Err` if the webview window could not be built; callers must clean
/// up any session state on error.
pub fn create_capture_window(app: &AppHandle, label: &str, x: f64, y: f64, w: f64, h: f64) -> Result<WebviewWindow, String> {
    let window = WebviewWindowBuilder::new(app, label, WebviewUrl::App("/capture.html".into()))
        .title("capture")
        .decorations(false)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .visible_on_all_workspaces(true)
        .accept_first_mouse(true)
        .focused(false)
        .position(x, y)
        .inner_size(w, h)
        .build()
        .map_err(|e| format!("failed to build capture overlay: {e}"))?;

    #[cfg(target_os = "macos")]
    raise_capture_window_above_menu_bar(&window);

    Ok(window)
}

#[cfg(target_os = "macos")]
fn raise_capture_window_above_menu_bar(window: &WebviewWindow) {
    use objc::runtime::Sel;
    use objc::Message;

    // NSScreenSaverWindowLevel: above the menu bar and Dock, which the
    // overlay must cover to offer the full monitor as selection surface.
    const NS_SCREEN_SAVER_WINDOW_LEVEL: libc::c_long = 1000;

    // I2: graceful degradation — if the window is gone, or the level cannot be
    // applied, the overlay is still usable, just below the menu bar.
    with_ns_window_on_main_thread(window, |ns_window| unsafe {
        let result: Result<(), _> =
            (&*ns_window).send_message(Sel::register("setLevel:"), (NS_SCREEN_SAVER_WINDOW_LEVEL,));
        if let Err(e) = result {
            info!("failed to raise capture window level: {e}");
        }
    });
}

pub fn close_capture_window(app: &AppHandle) {
    for (label, window) in app.webview_windows() {
        if is_capture_window(&label) {
            let _ = window.destroy();
        }
    }
}

pub fn is_capture_window(label: &str) -> bool {
    label == CAPTURE_WINDOW || label.starts_with("capture-")
}

/// A small companion to System Settings; never takes over the settings window.
pub fn show_permission_window(app: &AppHandle, kind: &str, origin: Option<(f64, f64)>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("permission") {
        window.destroy().map_err(|e| e.to_string())?;
    }
    let ready = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
    let page_ready = ready.clone();
    let window = WebviewWindowBuilder::new(
        app, "permission", WebviewUrl::App(format!("/permission.html?kind={kind}").into()),
    )
    .on_page_load(move |_, payload| {
        if payload.event() == tauri::webview::PageLoadEvent::Finished {
            page_ready.store(true, std::sync::atomic::Ordering::Release);
        }
    })
    .title("DDU · 权限授权")
    // Transparent native backing lets the web surface clip all four corners.
    .transparent(true)
    .shadow(false)
    .focused(false)
    .decorations(false)
    .resizable(false)
    .always_on_top(true)
    .visible_on_all_workspaces(true)
    .skip_taskbar(true)
    .accept_first_mouse(true)
    .disable_drag_drop_handler()
    .visible(false)
    .inner_size(580.0, 230.0)
    .build().map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    follow_permission_settings(&window, origin, ready);
    #[cfg(not(target_os = "macos"))]
    {
        place_on_cursor_screen(&window);
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Observe only while this specific helper exists. A replacement helper gets
/// its own lifecycle; an old queued tick must never move the new window.
#[cfg(target_os = "macos")]
fn follow_permission_settings(window: &WebviewWindow, origin: Option<(f64, f64)>, ready: std::sync::Arc<std::sync::atomic::AtomicBool>) {
    use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
    use std::time::Duration;
    use tauri::Listener;
    let manual = Arc::new(AtomicBool::new(false));
    let on_manual = manual.clone();
    let listener = window.listen("permission-manual-move", move |_| {
        on_manual.store(true, Ordering::Release);
    });
    let app = window.app_handle().clone();
    let closed = Arc::new(AtomicBool::new(false));
    let on_close = closed.clone();
    window.on_window_event(move |event| {
        if matches!(event, tauri::WindowEvent::Destroyed) {
            on_close.store(true, Ordering::Release);
            app.unlisten(listener);
        }
    });
    let window = window.clone();
    std::thread::spawn(move || {
        let mut found_settings = false;
        let mut attempts = 0;
        let mut entrance_started: Option<std::time::Instant> = None;
        let mut first_display = true;
        while !closed.load(Ordering::Acquire) {
            if !ready.load(Ordering::Acquire) {
                std::thread::sleep(Duration::from_millis(16));
                continue;
            }
            let (tx, rx) = std::sync::mpsc::sync_channel(1);
            let tick_window = window.clone();
            let tick_closed = closed.clone();
            let tick_manual = manual.clone();
            if window.run_on_main_thread(move || {
                if tick_closed.load(Ordering::Acquire) { return; }
                let mut displayed = false;
                let anchor = platform::system_settings_frame();
                let found = anchor.is_some();
                // Wait for System Settings to launch before first paint. If
                // metadata is unavailable, keep the guide usable at DDU's
                // settings window instead of pinning it to the cursor display.
                let anchor = anchor.or_else(|| {
                    if !found_settings && attempts >= 20 {
                        tick_window.app_handle().get_webview_window(SETTING_WINDOW)
                            .or_else(|| tick_window.app_handle().get_webview_window(STARTUP_WINDOW))
                            .and_then(|settings| placement::window_frame(&settings))
                    } else { None }
                });
                if let Some(anchor) = anchor {
                    if let Some(screen) = placement::screen_for(anchor, &placement::screens(&tick_window)) {
                        let destination = placement::permission_frame(anchor, screen.work_area);
                        let progress = entrance_started.map(|t| t.elapsed().as_secs_f64() / placement::PERMISSION_ENTRANCE_DURATION.as_secs_f64()).unwrap_or(0.0);
                        let frame = if first_display {
                            placement::permission_entrance_frame(destination, origin, progress)
                        } else { destination };
                        if first_display && entrance_started.is_none() {
                            // AppKit's automatic window zoom must not compete with translation.
                            use objc::{Message, runtime::{Object, Sel}};
                            if let Ok(native) = tick_window.ns_window() {
                                unsafe {
                                    let native = &*(native as *mut Object);
                                    let _: Result<(), _> = native.send_message(Sel::register("setAnimationBehavior:"), (2isize,));
                                }
                            }
                        }
                        displayed = true;
                        let current = placement::window_frame(&tick_window);
                        if !tick_manual.load(Ordering::Acquire) {
                            if !current.is_some_and(|f| f.w == frame.w && f.h == frame.h) {
                                let _ = tick_window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(frame.w, frame.h)));
                            }
                            if !current.is_some_and(|f| f.x == frame.x && f.y == frame.y) {
                                let _ = tick_window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(frame.x, frame.y)));
                            }
                        }
                        if !tick_window.is_visible().unwrap_or(false) {
                            let _ = tick_window.show();
                        }
                    }
                } else if found_settings && tick_window.is_visible().unwrap_or(false) {
                    // Don't leave an orphaned topmost panel when Settings is
                    // minimized, closed, or moved to another Space.
                    let _ = tick_window.hide();
                }
                let _ = tx.send((found, displayed));
            }).is_err() { break; }
            match rx.recv() {
                Ok((found, displayed)) => {
                    found_settings |= found;
                    if first_display && displayed {
                        let start = entrance_started.get_or_insert_with(std::time::Instant::now);
                        if origin.is_none() || start.elapsed() >= placement::PERMISSION_ENTRANCE_DURATION { first_display = false; }
                    }
                },
                Err(_) => break,
            }
            attempts += 1;
            std::thread::sleep(Duration::from_millis(if first_display && entrance_started.is_some() { 16 } else { 250 }));
        }
    });
}
