use std::{path::PathBuf, process::Command};

use chrono::Local;
use tauri::{Manager, Runtime};
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn capture_screen<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
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

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    Ok(filename)
}

#[tauri::command]
pub async fn capture_select<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
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

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-i")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    Ok(filename)
}

#[tauri::command]
pub async fn capture_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
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

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-w")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    Ok(filename)
}
