use serde_json::json;
use tauri::{ActivationPolicy, Manager};
use tauri_plugin_store::StoreExt;

mod cmd;
mod common;
mod constants;
mod global_shortcut;
mod menu;
mod platform;
mod smart_capture;
mod window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .manage(smart_capture::SmartCaptureState::default())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(desktop)]
            configure_autostart(app);

            #[cfg(desktop)]
            let _ = global_shortcut::register_global_shortcut(app);

            app.set_activation_policy(ActivationPolicy::Accessory);

            menu::create_tray(app)?;

            let store = app.store("settings.json")?;
            // Only seed the default screenshot path when the user has not set
            // one yet. Previously this ran unconditionally on every launch and
            // clobbered any custom path the user configured in settings.
            let has_custom_path = store
                .get("screenshot_path")
                .and_then(|v| {
                    v.as_object()
                        .and_then(|obj| obj.get("value"))
                        .and_then(|value| value.as_str())
                        .map(|s| !s.is_empty())
                })
                .unwrap_or(false);
            if !has_custom_path {
                let app_local_data = app
                    .path()
                    .app_local_data_dir()
                    .expect("could not resolve app local data path");
                store.set(
                    "screenshot_path".to_string(),
                    json!({ "value": app_local_data.to_string_lossy() }),
                );
            }

            // First launch: show the startup window, which doubles as the
            // permission-guide (Screen Recording / Accessibility / Microphone).
            if is_first_run(store.get("first_run")) {
                store.set("first_run".to_string(), json!({ "value": true }));
                window::show_startup_window(app.handle());
            }

            // Enforce history retention on launch (no-op unless the user opted in).
            cmd::prune_history(app.handle());

            Ok(())
        })
        .menu(menu::get_app_menu)
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(global_shortcut::tauri_plugin_global_shortcut())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event| {
            // This is a tray/menu-bar (Accessory) app: closing a primary window
            // should hide it and keep the app running in the tray, not quit.
            // Only the transient preview floater closes for real.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if should_hide_instead_of_close(window.label()) {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            cmd::greet,
            cmd::capture_screen,
            cmd::capture_select,
            cmd::capture_delayed,
            cmd::capture_current_screen,
            cmd::get_last_capture_path,
            cmd::xcap_window,
            cmd::xcap_monitor,
            cmd::show_preview_window,
            cmd::hide_preview_window,
            cmd::update_preview_window,
            cmd::show_main_window,
            cmd::hide_main_window,
            cmd::show_setting_window,
            cmd::hide_setting_window,
            cmd::open_screen_capture_preferences,
            cmd::check_accessibility_permissions,
            cmd::permission_status,
            cmd::permission_request,
            cmd::permission_open_settings,
            cmd::restart_app,
            cmd::smart_capture_start,
            cmd::smart_capture_get_session,
            cmd::smart_capture_hit_test,
            cmd::smart_capture_finalize,
            cmd::smart_capture_cancel,
            cmd::open_accessibility_preferences,
            cmd::copy_image_to_clipboard,
            cmd::copy_image_bytes,
            cmd::get_image_base64,
            cmd::open_combined_image,
            cmd::list_history_items,
            cmd::delete_history_items,
            cmd::get_history_item_detail,
            cmd::export_image,
            cmd::save_annotated_image,
            cmd::get_image_info,
            cmd::perform_ocr,
            cmd::detect_sensitive_info,
            cmd::list_workflow_rules,
            cmd::save_workflow_rule,
            cmd::delete_workflow_rule,
            cmd::execute_workflow,
            cmd::start_recording,
            cmd::stop_recording,
            cmd::is_recording,
            cmd::convert_to_gif,
            cmd::get_platform_capabilities,
            cmd::get_diagnostics_bundle,
            global_shortcut::apply_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// The startup/permission-guide window shows only when the `first_run` marker
/// has never been written. An explicit `null` (from older builds) also counts
/// as a first run.
fn is_first_run(stored: Option<serde_json::Value>) -> bool {
    match stored {
        None => true,
        Some(value) => value.is_null(),
    }
}

fn should_hide_instead_of_close(label: &str) -> bool {
    matches!(
        label,
        constants::MAIN_WINDOW | constants::SETTING_WINDOW | constants::STARTUP_WINDOW
    )
}

#[cfg(desktop)]
fn configure_autostart(app: &tauri::App) {
    use tauri_plugin_autostart::MacosLauncher;
    use tauri_plugin_autostart::ManagerExt;

    let _ = app.handle().plugin(tauri_plugin_autostart::init(
        MacosLauncher::LaunchAgent,
        Some(vec!["--flag1", "--flag2"]),
    ));

    // Get the autostart manager
    let autostart_manager = app.autolaunch();
    // Enable autostart
    let _ = autostart_manager.enable();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn primary_windows_hide_instead_of_closing() {
        for label in [
            constants::MAIN_WINDOW,
            constants::SETTING_WINDOW,
            constants::STARTUP_WINDOW,
        ] {
            assert!(should_hide_instead_of_close(label));
        }
    }

    #[test]
    fn transient_preview_window_can_close_normally() {
        assert!(!should_hide_instead_of_close(constants::PREVIEW_WINDOW));
    }

    #[test]
    fn fresh_install_with_no_marker_is_first_run() {
        assert!(is_first_run(None));
    }

    #[test]
    fn explicit_null_marker_is_first_run() {
        assert!(is_first_run(Some(serde_json::Value::Null)));
    }

    #[test]
    fn written_marker_is_not_first_run() {
        assert!(!is_first_run(Some(json!({ "value": true }))));
    }
}
