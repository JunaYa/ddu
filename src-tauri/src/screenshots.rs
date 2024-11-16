use std::path::PathBuf;

use screenshots::Screen;
use tauri::{fs, Manager};
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn take_screenshot(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    // Take screenshot of primary screen
    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;

        // Create screenshots directory if it doesn't exist
        let store = app_handle
            .get_store("settings.json")
            .ok_or_else(|| "Could not get settings store".to_string())?;

        let screenshot_path = store
            .get("screenshot_path")
            .ok_or_else(|| "Screenshot path not found in settings".to_string())?;
        println!("screenshot_path: {:?}", screenshot_path);

        // get value from Option<JsonValue>
        let screenshot_path = screenshot_path
            .as_object()
            .and_then(|obj| obj.get("value"))
            .and_then(|value| value.as_str())
            .unwrap();

        // 获取 AppLocalData 路径
        // 如果 screenshot_path 为空，则使用 app_local_data
        let app_local_data = if screenshot_path.is_empty() {
            app_handle.path().app_local_data_dir().unwrap()
        } else {
            PathBuf::from(screenshot_path)
        };
        println!("app_local_data: {:?}", app_local_data);

        // 创建 images 文件夹
        // path 如果为空，则使用 app_local_data
        let images_dir = if path.is_empty() {
            app_local_data
        } else {
            app_local_data.join(path)
        };

        println!("images_dir: {:?}", images_dir);
        std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

        // 生成文件名（使用时间戳）
        let timestamp = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
        let filename = format!("{}.png", timestamp);
        let file_path = images_dir.join(&filename);

        image.save(&file_path).map_err(|e| e.to_string())?;

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

        Ok(filename)
    } else {
        Err("No screen found".into())
    }
}
