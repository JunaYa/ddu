use std::{path::PathBuf, process::Command};

use chrono::Local;
use tauri::Runtime;

#[tauri::command]
pub async fn capture_screen<R: Runtime>(
    _app: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    let pictures_dir = PathBuf::from(path);
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

#[tauri::command]
pub async fn capture_select<R: Runtime>(
    _app: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    let pictures_dir = PathBuf::from(path);
    std::fs::create_dir_all(&pictures_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = pictures_dir.join(&filename);

    Command::new("screencapture")
        .arg("-i")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output_path.to_str().unwrap().to_string())
}

#[tauri::command]
pub async fn capture_window<R: Runtime>(
    _app: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    let pictures_dir = PathBuf::from(path);
    std::fs::create_dir_all(&pictures_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = pictures_dir.join(&filename);

    Command::new("screencapture")
        .arg("-w")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output_path.to_str().unwrap().to_string())
}
