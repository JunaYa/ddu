use serde_json::json;
use tauri::{ActivationPolicy, Manager};
use tauri_plugin_store::StoreExt;

mod cmd;
mod common;
mod constants;
mod global_shortcut;
mod menu;
mod platform;
mod window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(desktop)]
            configure_autostart(app);

            window::show_startup_window(&app.handle());

            #[cfg(desktop)]
            let _ = global_shortcut::register_global_shortcut(app);

            app.set_activation_policy(ActivationPolicy::Accessory);

            menu::create_tray(app)?;

            let app_local_data = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path");
            let store = app.store("settings.json")?;
            store.set(
                "screenshot_path".to_string(),
                json!({ "value": app_local_data.to_string_lossy() }),
            );

            Ok(())
        })
        .menu(menu::get_app_menu)
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(global_shortcut::tauri_plugin_global_shortcut())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            cmd::greet,
            cmd::capture_screen,
            cmd::capture_select,
            cmd::capture_window,
            cmd::xcap_window,
            cmd::xcap_monitor,
            cmd::show_preview_window,
            cmd::hide_preview_window,
            cmd::show_main_window,
            cmd::hide_main_window,
            cmd::show_setting_window,
            cmd::hide_setting_window,
            cmd::open_screen_capture_preferences,
            cmd::check_accessibility_permissions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
