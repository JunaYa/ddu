use std::str::FromStr;
use tauri::plugin::TauriPlugin;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::{platform, window};

const DEFUALT_HOTKEY_A: &str = "CmdOrCtrl+Shift+A";
const DEFUALT_HOTKEY_S: &str = "CmdOrCtrl+Shift+S";
const DEFUALT_HOTKEY_W: &str = "CmdOrCtrl+Shift+W";

pub fn register_global_shortcut(app: &tauri::App) -> anyhow::Result<()> {
    println!("Registering global shortcuts");
    let shortcuts = app.global_shortcut();
    if let Err(error) = shortcuts.unregister_all() {
        println!("Unable to unregister shortcuts {}", error.to_string());
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
                        println!("Capture Screen Pressed!");
                        let _ = tauri::async_runtime::block_on(platform::capture_screen(
                            &app,
                            "images".to_string(),
                        ));
                        window::hide_main_window(&app);
                        window::show_preview_window(&app);
                    }
                    ShortcutState::Released => {
                        println!("Capture Screen Released!");
                    }
                }
            } else if shortcut.id == Shortcut::from_str(DEFUALT_HOTKEY_S).unwrap().id {
                match event.state() {
                    ShortcutState::Pressed => {
                        let _ = tauri::async_runtime::block_on(platform::capture_select(
                            &app,
                            "images".to_string(),
                        ));
                        window::hide_main_window(app);
                        window::show_preview_window(app);
                    }
                    ShortcutState::Released => {
                        println!("Capture Select Released!");
                    }
                }
            } else if shortcut.id == Shortcut::from_str(DEFUALT_HOTKEY_W).unwrap().id {
                match event.state() {
                    ShortcutState::Pressed => {
                        let _ = tauri::async_runtime::block_on(platform::capture_window(
                            &app,
                            "images".to_string(),
                        ));
                        window::hide_main_window(app);
                        window::show_preview_window(app);
                    }
                    ShortcutState::Released => {
                        println!("Capture Window Released!");
                    }
                }
            }
        })
        .build()
}
