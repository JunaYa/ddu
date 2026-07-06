use std::{
    path::Path, process::Command, sync::Mutex, thread, time::{Duration, Instant}
};

use chrono::Local;
use core_foundation::{base::TCFType, boolean::CFBoolean, string::CFString};
use serde::{Deserialize, Serialize};
use tracing::info;

use tauri_plugin_store::StoreExt;

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
        filename: output_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default(),
        full_path: output_path.to_string_lossy().to_string(),
        width,
        height,
        mode: mode.to_string(),
        captured_at: Local::now().to_rfc3339(),
    })
}

struct CaptureSettings {
    delay: u32,
    include_cursor: bool,
    include_window_shadow: bool,
}

/// Read the user's capture preferences from the store (shape `{ "value": ... }`).
/// Defaults are conservative: no delay, no cursor, keep the window shadow — so an
/// untouched install behaves exactly as before.
fn read_capture_settings(app: &tauri::AppHandle) -> CaptureSettings {
    let store = app.get_store("settings.json");
    let num = |key: &str, default: u32| -> u32 {
        store
            .as_ref()
            .and_then(|s| s.get(key))
            .and_then(|v| v.as_object().and_then(|o| o.get("value")).and_then(|x| x.as_u64()))
            .map(|n| n as u32)
            .unwrap_or(default)
    };
    let flag = |key: &str, default: bool| -> bool {
        store
            .as_ref()
            .and_then(|s| s.get(key))
            .and_then(|v| v.as_object().and_then(|o| o.get("value")).and_then(|x| x.as_bool()))
            .unwrap_or(default)
    };
    CaptureSettings {
        delay: num("capture_delay", 0),
        include_cursor: flag("include_cursor", false),
        include_window_shadow: flag("include_window_shadow", true),
    }
}

pub async fn capture_screen(app_handle: &tauri::AppHandle, path: String) -> Result<CaptureResult, String> {
    let start = Instant::now();
    let images_dir = get_images_dir(app_handle, path)?;
    std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = images_dir.join(&filename);

    let settings = read_capture_settings(app_handle);
    let out = output_path.to_str().ok_or("invalid output path")?;
    let mut args: Vec<String> = vec!["-x".into()];
    if settings.include_cursor {
        args.push("-C".into()); // full-screen is non-interactive, so -C is honored
    }
    if settings.delay > 0 {
        args.push("-T".into());
        args.push(settings.delay.to_string());
    }
    args.push(out.to_string());
    Command::new("screencapture")
        .args(&args)
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

    let settings = read_capture_settings(app_handle);
    let out = output_path.to_str().ok_or("invalid output path")?;
    // Region capture is interactive (-i); -C (cursor) has no effect here, so only
    // the delay preference applies.
    let mut args: Vec<String> = vec!["-i".into(), "-x".into()];
    if settings.delay > 0 {
        args.push("-T".into());
        args.push(settings.delay.to_string());
    }
    args.push(out.to_string());
    Command::new("screencapture")
        .args(&args)
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

    let settings = read_capture_settings(app_handle);
    let out = output_path.to_str().ok_or("invalid output path")?;
    let mut args: Vec<String> = vec!["-iw".into(), "-t".into(), "png".into()];
    if !settings.include_window_shadow {
        args.push("-o".into()); // -o excludes the window shadow
    }
    if settings.delay > 0 {
        args.push("-T".into());
        args.push(settings.delay.to_string());
    }
    args.push(out.to_string());
    Command::new("screencapture")
        .args(&args)
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

    let out = output_path.to_str().ok_or("invalid output path")?;
    Command::new("screencapture")
        .args(["-i", "-x", "-T", &delay_secs.to_string(), out])
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

    let settings = read_capture_settings(app_handle);
    let out = output_path.to_str().ok_or("invalid output path")?;
    let mut args: Vec<String> = vec!["-x".into(), "-m".into()];
    if settings.include_cursor {
        args.push("-C".into()); // -m single-display is non-interactive, so -C is honored
    }
    if settings.delay > 0 {
        args.push("-T".into());
        args.push(settings.delay.to_string());
    }
    args.push(out.to_string());
    Command::new("screencapture")
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    info!("capture_current_screen took: {:?}", start.elapsed());
    build_capture_result(&output_path, "currentScreen")
}

pub fn get_last_capture_path() -> Option<String> {
    LAST_REGION.lock().ok().and_then(|r| r.clone())
}

pub fn open_screen_capture_preferences() {
    let _ = Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
        .spawn();
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
