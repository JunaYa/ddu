use screenshots::Screen;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
async fn take_screenshot(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
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

        Ok(screenshot_path.to_string_lossy().into_owned())
    } else {
        Err("No screen found".into())
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
                // Check enable state
                println!("registered for autostart? {}", autostart_manager.is_enabled().unwrap());
                // Disable autostart
                let _ = autostart_manager.disable();
            }
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, take_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
