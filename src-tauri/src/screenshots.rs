use std::path::PathBuf;

use screenshots::Screen;

#[tauri::command]
pub async fn take_screenshot(_app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
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
