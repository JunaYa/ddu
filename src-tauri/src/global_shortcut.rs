use std::{str::FromStr, thread::sleep, time::Duration};
use tauri::{plugin::TauriPlugin, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tracing::info;

use crate::{platform, window};

const DEFAULT_HOTKEY_A: &str = "CmdOrCtrl+Shift+A";
const DEFAULT_HOTKEY_S: &str = "CmdOrCtrl+Shift+S";
const DEFAULT_HOTKEY_W: &str = "CmdOrCtrl+Shift+W";

fn handle_capture_result(
    app: &tauri::AppHandle,
    result: Result<platform::CaptureResult, String>,
) {
    match result {
        Ok(capture) => {
            window::hide_main_window(app);
            let window = window::show_preview_window(app);
            let payload = serde_json::json!({
                "filename": capture.filename,
                "fullPath": capture.full_path,
                "width": capture.width,
                "height": capture.height,
                "mode": capture.mode,
                "capturedAt": capture.captured_at,
            });
            tauri::async_runtime::spawn(async move {
                sleep(Duration::from_millis(500));
                window.emit("image-prepared", payload).unwrap();
            });
        }
        Err(_) => {}
    }
}

pub fn register_global_shortcut(app: &tauri::App) -> anyhow::Result<()> {
    info!("Registering global shortcuts");
    let shortcuts = app.global_shortcut();
    if let Err(error) = shortcuts.unregister_all() {
        info!("Unable to unregister shortcuts {}", error.to_string());
    }

    let hotkeys = [DEFAULT_HOTKEY_A, DEFAULT_HOTKEY_S, DEFAULT_HOTKEY_W];
    for key in hotkeys {
        let shortcut = Shortcut::from_str(key)?;
        if !shortcuts.is_registered(shortcut) {
            app.global_shortcut().register(shortcut)?;
        }
    }

    Ok(())
}

pub fn tauri_plugin_global_shortcut() -> TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if event.state() != ShortcutState::Pressed {
                return;
            }

            if shortcut.id == Shortcut::from_str(DEFAULT_HOTKEY_A).unwrap().id {
                info!("Capture Screen Pressed!");
                let result = tauri::async_runtime::block_on(
                    platform::capture_screen(&app, "images".to_string()),
                );
                handle_capture_result(&app, result);
            } else if shortcut.id == Shortcut::from_str(DEFAULT_HOTKEY_S).unwrap().id {
                info!("Capture Select Pressed!");
                let result = tauri::async_runtime::block_on(
                    platform::capture_select(&app, "images".to_string()),
                );
                handle_capture_result(&app, result);
            } else if shortcut.id == Shortcut::from_str(DEFAULT_HOTKEY_W).unwrap().id {
                info!("Capture Window Pressed!");
                let result = tauri::async_runtime::block_on(
                    platform::capture_window(&app, "images".to_string()),
                );
                handle_capture_result(&app, result);
            }
        })
        .build()
}
