use std::{str::FromStr, thread::sleep, time::Duration};
use tauri::{plugin::TauriPlugin, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tracing::info;

use crate::{platform, window};

const DEFUALT_HOTKEY_A: &str = "CmdOrCtrl+Shift+A";
const DEFUALT_HOTKEY_S: &str = "CmdOrCtrl+Shift+S";
const DEFUALT_HOTKEY_W: &str = "CmdOrCtrl+Shift+W";

pub fn register_global_shortcut(app: &tauri::App) -> anyhow::Result<()> {
    info!("Registering global shortcuts");
    let shortcuts = app.global_shortcut();
    if let Err(error) = shortcuts.unregister_all() {
        info!("Unable to unregister shortcuts {}", error.to_string());
    }

    // capture_screen: ctrl + shift + A
    let shift_ctrl_a_shortcut = Shortcut::from_str(DEFUALT_HOTKEY_A)?;
    // capture_select: ctrl + shift + S
    let shift_ctrl_s_shortcut = Shortcut::from_str(DEFUALT_HOTKEY_S)?;
    // capture_window: ctrl + shift + W
    let shift_ctrl_w_shortcut = Shortcut::from_str(DEFUALT_HOTKEY_W)?;

    if !shortcuts.is_registered(shift_ctrl_a_shortcut) {
        app.global_shortcut().register(shift_ctrl_a_shortcut)?;
    }

    if !shortcuts.is_registered(shift_ctrl_s_shortcut) {
        app.global_shortcut().register(shift_ctrl_s_shortcut)?;
    }

    if !shortcuts.is_registered(shift_ctrl_w_shortcut) {
        app.global_shortcut().register(shift_ctrl_w_shortcut)?;
    }

    Ok(())
}

pub fn tauri_plugin_global_shortcut() -> TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if shortcut.id == Shortcut::from_str(DEFUALT_HOTKEY_A).unwrap().id {
                match event.state() {
                    ShortcutState::Pressed => {
                        info!("Capture Screen Pressed!");
                        let filename = tauri::async_runtime::block_on(platform::capture_screen(
                            &app,
                            "images".to_string(),
                        ));
                        window::hide_main_window(&app);
                        let window = window::show_preview_window(&app);
                        tauri::async_runtime::spawn(async move {
                            sleep(Duration::from_millis(500));
                            window.emit("image-prepared", filename).unwrap();
                        });
                    }
                    ShortcutState::Released => {
                        info!("Capture Screen Released!");
                    }
                }
            } else if shortcut.id == Shortcut::from_str(DEFUALT_HOTKEY_S).unwrap().id {
                match event.state() {
                    ShortcutState::Pressed => {
                        let filename = tauri::async_runtime::block_on(platform::capture_select(
                            &app,
                            "images".to_string(),
                        ));
                        window::hide_main_window(app);
                        let window = window::show_preview_window(app);
                        tauri::async_runtime::spawn(async move {
                            sleep(Duration::from_millis(500));
                            window.emit("image-prepared", filename).unwrap();
                        });
                    }
                    ShortcutState::Released => {
                        info!("Capture Select Released!");
                    }
                }
            } else if shortcut.id == Shortcut::from_str(DEFUALT_HOTKEY_W).unwrap().id {
                match event.state() {
                    ShortcutState::Pressed => {
                        let filename = tauri::async_runtime::block_on(platform::capture_window(
                            &app,
                            "images".to_string(),
                        ));
                        window::hide_main_window(app);
                        let window = window::show_preview_window(app);
                        tauri::async_runtime::spawn(async move {
                            sleep(Duration::from_millis(500));
                            window.emit("image-prepared", filename).unwrap();
                        });
                    }
                    ShortcutState::Released => {
                        info!("Capture Window Released!");
                    }
                }
            }
        })
        .build()
}
