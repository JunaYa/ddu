use tauri::{
    tray::TrayIconBuilder, window::Color, TitleBarStyle, WebviewUrl, WebviewWindowBuilder,
};

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
        .setup(|app| {
            #[cfg(desktop)]
            configure_autostart(app);

            create_window(app)?;

            create_tray(app)?;

            Ok(())
        })
        .plugin(tauri_plugin_clipboard_manager::init())
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

fn create_window(app: &mut tauri::App) -> Result<(), tauri::Error> {
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

fn create_tray(app: &mut tauri::App) -> Result<(), tauri::Error> {
    let _ = TrayIconBuilder::with_id("main-tray")
        .menu(&menu::get_tray_menu(app.handle())?)
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(true)
        .menu_on_left_click(true)
        .on_menu_event(menu::handle_tray_menu_events)
        .on_tray_icon_event(menu::handle_tray_icon_events)
        .build(app)?;
    Ok(())
}
