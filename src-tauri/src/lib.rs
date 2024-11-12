use chrono::Local;
use screenshots::Screen;
use std::path::PathBuf;
use std::process::Command;
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod menu;

#[tauri::command]
async fn take_screenshots(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    // Take screenshot of primary screen
    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;

        // Create screenshots directory if it doesn't exist
        let mut screenshot_path = PathBuf::from(path);
        std::fs::create_dir_all(&screenshot_path).map_err(|e| e.to_string())?;

        // Save with timestamp yyyy-mm-dd_hh-mm-ss
        let timestamp = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
        screenshot_path.push(format!("{}.png", timestamp));

        image.save(&screenshot_path).map_err(|e| e.to_string())?;

        // app_handle.clipboard().clear().unwrap();
        // // ImageBuffer to Image
        // let rgba_data = image.into_bytes();
        // let picture = Image::from_bytes(rgba_data).unwrap();

        // // let picture = Image::from_rgba(image.width(), image.height(), image.into_raw());
        // app_handle.clipboard().write_image(&picture).unwrap();

        // Write to clipboard
        // app_handle.clipboard().clear().unwrap();
        // app_handle
        //     .clipboard()
        //     .write_text("Tauri is awesome!".to_string())
        //     .unwrap();
        // let content = app_handle.clipboard().read_text();
        // println!("clipboard: {:?}", content.unwrap());

        Ok(screenshot_path.to_string_lossy().into_owned())
    } else {
        Err("No screen found".into())
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn take_screenshot<R: Runtime>(
    app: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    let mut pictures_dir = PathBuf::from(path);
    std::fs::create_dir_all(&pictures_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = pictures_dir.join(&filename);

    Command::new("screencapture")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output_path.to_str().unwrap().to_string())
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
        .invoke_handler(tauri::generate_handler![greet, take_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
