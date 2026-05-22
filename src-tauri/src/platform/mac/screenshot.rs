use std::{
    path::Path, process::Command, sync::Mutex, thread, time::{Duration, Instant}
};

use chrono::Local;
use core_foundation::{base::TCFType, boolean::CFBoolean, string::CFString};
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::common::get_images_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResult {
    pub filename: String,
    pub full_path: String,
    pub width: u32,
    pub height: u32,
    pub mode: String,
    pub captured_at: String,
}

static LAST_REGION: Mutex<Option<String>> = Mutex::new(None);

fn build_capture_result(output_path: &Path, mode: &str) -> Result<CaptureResult, String> {
    if !output_path.exists() {
        return Err("NoExist".to_string());
    }
    let (width, height) = match image::image_dimensions(output_path) {
        Ok(dims) => dims,
        Err(_) => (0, 0),
    };
    Ok(CaptureResult {
        filename: output_path.file_name().unwrap().to_string_lossy().to_string(),
        full_path: output_path.to_string_lossy().to_string(),
        width,
        height,
        mode: mode.to_string(),
        captured_at: Local::now().to_rfc3339(),
    })
}

pub async fn capture_screen(app_handle: &tauri::AppHandle, path: String) -> Result<CaptureResult, String> {
    let start = Instant::now();
    let images_dir = get_images_dir(app_handle, path)?;
    std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_screen took: {:?}", start.elapsed());
    build_capture_result(&output_path, "fullScreen")
}

pub async fn capture_select(app_handle: &tauri::AppHandle, path: String) -> Result<CaptureResult, String> {
    let start = Instant::now();
    let images_dir = get_images_dir(app_handle, path)?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .arg("-i")
        .arg("-x")
        .arg(output_path.to_str().unwrap())
        .output()
        .map_err(|e| e.to_string())?;

    let result = build_capture_result(&output_path, "region")?;
    if let Ok(mut last) = LAST_REGION.lock() {
        *last = Some(output_path.to_string_lossy().to_string());
    }
    info!("capture_select took: {:?}", start.elapsed());
    Ok(result)
}

pub async fn capture_window(app_handle: &tauri::AppHandle, path: String) -> Result<CaptureResult, String> {
    let start = Instant::now();
    let images_dir = get_images_dir(app_handle, path)?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("osascript")
        .args(["-e", "tell application \"System Events\" to key code 48 using {command down}"])
        .output()
        .map_err(|e| e.to_string())?;

    thread::sleep(Duration::from_secs(1));

    Command::new("screencapture")
        .args(["-iw", "-t", "png", "-C", "-o", "-T", "0", output_path.to_str().unwrap()])
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_window took: {:?}", start.elapsed());
    build_capture_result(&output_path, "activeWindow")
}

pub async fn capture_delayed(app_handle: &tauri::AppHandle, path: String, delay_secs: u32) -> Result<CaptureResult, String> {
    let start = Instant::now();
    let images_dir = get_images_dir(app_handle, path)?;
    std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .args(["-i", "-x", "-T", &delay_secs.to_string(), output_path.to_str().unwrap()])
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_delayed ({}s) took: {:?}", delay_secs, start.elapsed());
    build_capture_result(&output_path, "delayed")
}

pub async fn capture_current_screen(app_handle: &tauri::AppHandle, path: String) -> Result<CaptureResult, String> {
    let start = Instant::now();
    let images_dir = get_images_dir(app_handle, path)?;
    std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    Command::new("screencapture")
        .args(["-x", "-m", output_path.to_str().unwrap()])
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_current_screen took: {:?}", start.elapsed());
    build_capture_result(&output_path, "currentScreen")
}

pub fn get_last_capture_path() -> Option<String> {
    LAST_REGION.lock().ok().and_then(|r| r.clone())
}

pub fn open_screen_capture_preferences() {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
        .spawn()
        .expect("failed to open system preferences");
}

pub fn check_accessibility_permissions() -> bool {
    let options = {
        let key = CFString::new("AXTrustedCheckOptionPrompt");
        let value = CFBoolean::false_value();
        let pairs = &[(key, value)];
        core_foundation::dictionary::CFDictionary::from_CFType_pairs(pairs)
    };

    unsafe {
        let accessibility = CFString::new("AXIsProcessTrustedWithOptions");
        let func: extern "C" fn(*const core_foundation::dictionary::CFDictionary) -> bool =
            std::mem::transmute(libc::dlsym(
                libc::RTLD_DEFAULT,
                accessibility.to_string().as_ptr() as *const _,
            ));
        func(options.as_concrete_TypeRef() as *const _)
    }
}
