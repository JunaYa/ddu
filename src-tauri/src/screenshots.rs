use std::path::PathBuf;

use screenshots::Screen;
use tauri::{fs, Manager};

#[tauri::command]
pub async fn take_screenshot(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    // Take screenshot of primary screen
    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;

        // Create screenshots directory if it doesn't exist
        // 获取 AppLocalData 路径
        let app_local_data = app_handle.path().app_local_data_dir().unwrap();
        println!("app_local_data: {:?}", app_local_data);

        // 创建 images 文件夹
        let images_dir = app_local_data.join(path);
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
