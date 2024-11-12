use tauri::tray::TrayIconBuilder;

mod menu;
mod screenshot;
mod screenshots;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--flag1", "--flag2"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();
            }

            // setting tray
            let _ = TrayIconBuilder::with_id("main-tray")
                .menu(&menu::get_tray_menu(app.handle())?)
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .menu_on_left_click(true)
                .on_menu_event(menu::handle_tray_menu_events)
                .on_tray_icon_event(menu::handle_tray_icon_events)
                .build(app)?;

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            screenshot::capture_screen,
            screenshot::capture_select,
            screenshot::capture_window,
            screenshot::take_capture_screen,
            screenshots::take_screenshot,
        ])
        .menu(menu::get_app_menu)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
