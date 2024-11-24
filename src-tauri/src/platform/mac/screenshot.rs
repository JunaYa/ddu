use std::{
    process::Command,
    thread,
    time::{Duration, Instant},
};

use chrono::Local;
use tracing::info;

use crate::common::get_images_dir;

pub async fn capture_screen(app_handle: &tauri::AppHandle, path: String) -> Result<String, String> {
    let start = Instant::now();

    let images_dir = get_images_dir(&app_handle, path)?;

    info!("images_dir: {:?}", images_dir);
    std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_screen 运行耗时: {:?}", start.elapsed());
    Ok(filename)
}

pub async fn capture_select(app_handle: &tauri::AppHandle, path: String) -> Result<String, String> {
    let start = Instant::now();

    let images_dir = get_images_dir(&app_handle, path)?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-i")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_select 运行耗时: {:?}", start.elapsed());
    Ok(filename)
}

pub async fn capture_window(app_handle: &tauri::AppHandle, path: String) -> Result<String, String> {
    let start = Instant::now();

    let images_dir = get_images_dir(&app_handle, path)?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("osascript")
        .args([
            "-e",
            "tell application \"System Events\" to key code 48 using {command down}",
        ]) // Cmd+Tab
        .output()
        .map_err(|e| e.to_string())?;

    thread::sleep(Duration::from_secs(1));

    let output = Command::new("screencapture")
        .args([
            "-iw", // 交互式窗口选择
            "-t",
            "png", // 明确指定 PNG 格式
            "-C",  // 捕获鼠标光标
            "-o",  // 不包含窗口阴影
            "-T",
            "0", // 没有延迟
            output_path.to_str().unwrap(),
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        info!("screencapture -wx 失败: {:?}", output.status);
    }

    info!("capture_window 运行耗时: {:?}", start.elapsed());

    Ok(filename)
}

pub fn open_screen_capture_preferences() {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
        .spawn()
        .expect("failed to open system preferences");
}
