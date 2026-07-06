use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Mutex;
use std::{thread::sleep, time::Duration};

use tauri::{plugin::TauriPlugin, AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;
use tracing::info;

use crate::{platform, window};

const DEFAULT_HOTKEY_FULLSCREEN: &str = "CmdOrCtrl+Shift+A";
const DEFAULT_HOTKEY_REGION: &str = "CmdOrCtrl+Shift+S";
const DEFAULT_HOTKEY_WINDOW: &str = "CmdOrCtrl+Shift+W";

#[derive(Clone, Copy)]
pub enum CaptureAction {
    FullScreen,
    Region,
    Window,
}

/// Runtime registry of the currently-bound capture shortcuts. `map` powers the
/// plugin handler's dispatch (shortcut id -> action); `registered` keeps the
/// active (key-string, action) set so `apply_shortcuts` can roll back to it if
/// re-registration fails partway.
#[derive(Default)]
pub struct ShortcutRegistry {
    map: Mutex<HashMap<u32, CaptureAction>>,
    registered: Mutex<Vec<(String, CaptureAction)>>,
}

fn handle_capture_result(app: &AppHandle, result: Result<platform::CaptureResult, String>) {
    if let Ok(capture) = result {
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
            let _ = window.emit("image-prepared", payload);
        });
    }
}

/// Read the three capture hotkeys from the settings store, falling back to the
/// defaults when a value is missing or empty. Stored shape mirrors the settings
/// UI: `{ "value": "CmdOrCtrl+Shift+A" }`.
fn read_hotkeys(app: &AppHandle) -> Vec<(String, CaptureAction)> {
    let store = app.get_store("settings.json");
    let read = |key: &str, default: &str| -> String {
        store
            .as_ref()
            .and_then(|s| s.get(key))
            .and_then(|v| {
                v.as_object()
                    .and_then(|o| o.get("value"))
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string())
            })
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| default.to_string())
    };
    vec![
        (
            read("hotkey_fullscreen", DEFAULT_HOTKEY_FULLSCREEN),
            CaptureAction::FullScreen,
        ),
        (
            read("hotkey_region", DEFAULT_HOTKEY_REGION),
            CaptureAction::Region,
        ),
        (
            read("hotkey_window", DEFAULT_HOTKEY_WINDOW),
            CaptureAction::Window,
        ),
    ]
}

/// Register a set of shortcuts, returning the id -> action dispatch map. Fails
/// (after the caller has cleared existing registrations) if any combo is
/// invalid or already taken by the system.
fn register_set(
    app: &AppHandle,
    set: &[(String, CaptureAction)],
) -> Result<HashMap<u32, CaptureAction>, String> {
    let gs = app.global_shortcut();
    let mut map = HashMap::new();
    for (key, action) in set {
        let shortcut = Shortcut::from_str(key).map_err(|e| format!("invalid shortcut '{key}': {e}"))?;
        gs.register(shortcut)
            .map_err(|e| format!("could not register '{key}': {e}"))?;
        map.insert(shortcut.id, *action);
    }
    Ok(map)
}

/// Re-read the hotkeys from the store and re-register them. On failure, roll
/// back to the previously-registered working set so the app never lands in a
/// zero-shortcut state, and surface the offending combo.
pub fn apply_shortcuts_inner(app: &AppHandle) -> Result<(), String> {
    let registry = app.state::<ShortcutRegistry>();
    let old = registry.registered.lock().unwrap().clone();
    let new = read_hotkeys(app);

    let gs = app.global_shortcut();
    let _ = gs.unregister_all();

    match register_set(app, &new) {
        Ok(map) => {
            *registry.map.lock().unwrap() = map;
            *registry.registered.lock().unwrap() = new;
            Ok(())
        }
        Err(e) => {
            info!("Shortcut registration failed ({e}); rolling back");
            let _ = gs.unregister_all();
            if let Ok(map) = register_set(app, &old) {
                *registry.map.lock().unwrap() = map;
            }
            Err(e)
        }
    }
}

#[tauri::command]
pub fn apply_shortcuts(app: tauri::AppHandle) -> Result<(), String> {
    apply_shortcuts_inner(&app)
}

pub fn register_global_shortcut(app: &tauri::App) -> anyhow::Result<()> {
    info!("Registering global shortcuts");
    app.manage(ShortcutRegistry::default());
    if let Err(e) = apply_shortcuts_inner(app.handle()) {
        info!("Initial shortcut registration failed: {e}");
    }
    Ok(())
}

pub fn tauri_plugin_global_shortcut() -> TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if event.state() != ShortcutState::Pressed {
                return;
            }
            let action = {
                let registry = app.state::<ShortcutRegistry>();
                let map = registry.map.lock().unwrap();
                map.get(&shortcut.id).copied()
            };
            let Some(action) = action else { return };
            let result = match action {
                CaptureAction::FullScreen => {
                    info!("Capture Screen Pressed!");
                    tauri::async_runtime::block_on(platform::capture_screen(app, "images".to_string()))
                }
                CaptureAction::Region => {
                    info!("Capture Select Pressed!");
                    tauri::async_runtime::block_on(platform::capture_select(app, "images".to_string()))
                }
                CaptureAction::Window => {
                    info!("Capture Window Pressed!");
                    tauri::async_runtime::block_on(platform::capture_window(app, "images".to_string()))
                }
            };
            handle_capture_result(app, result);
        })
        .build()
}
