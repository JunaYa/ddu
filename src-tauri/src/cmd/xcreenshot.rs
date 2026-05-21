use std::path::PathBuf;

use chrono::Local;
use tracing::info;
use std::time::Instant;
use xcap::{Monitor, Window};

use crate::common::get_images_dir;

#[tauri::command]
pub async fn xcap_window(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
    let images_dir = get_images_dir(&app_handle, path).unwrap();

    let filename = window_capture(images_dir)?;

    Ok(filename)
}

#[tauri::command]
pub async fn xcap_monitor(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
    let images_dir = get_images_dir(&app_handle, path).unwrap();

    let filename = monitor_capture(images_dir)?;

    Ok(filename)
}

fn normalized(filename: &str) -> String {
    filename
        .replace('|', "")
        .replace('\\', "")
        .replace(':', "")
        .replace('/', "")
}

fn window_capture(path: PathBuf) -> Result<String, String> {
    let start = Instant::now();
    let windows = Window::all().map_err(|e| e.to_string())?;

    let mut i = 0;
    let mut filename = String::new();
    for window in windows {
        if window.is_minimized().unwrap_or(false) {
            continue;
        }

        let title = window.title().unwrap_or_default();
        info!(
            "Window: {:?} {:?} {:?}",
            title,
            (window.x().unwrap_or(0), window.y().unwrap_or(0), window.width().unwrap_or(0), window.height().unwrap_or(0)),
            (window.is_minimized().unwrap_or(false), window.is_maximized().unwrap_or(false))
        );

        let image = window.capture_image().map_err(|e| e.to_string())?;

        filename = format!(
            "{}-{}-{}.png",
            Local::now().format("%Y%m%d_%H%M%S"),
            i,
            normalized(&title)
        );

        let output_path = path.join(&filename);

        info!("保存图片: {}", &output_path.to_str().unwrap());

        image.save(output_path).unwrap();

        i += 1;
    }

    info!("运行耗时: {:?}", start.elapsed());

    Ok(filename)
}

fn monitor_capture(path: PathBuf) -> Result<String, String> {
    let start = Instant::now();
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    let mut filename = String::new();

    for monitor in monitors {
        let image = monitor.capture_image().map_err(|e| e.to_string())?;

        let name = monitor.name().unwrap_or_default();
        filename = format!(
            "{}-{}.png",
            Local::now().format("%Y%m%d_%H%M%S"),
            normalized(&name)
        );

        let output_path = path.join(&filename);

        image.save(output_path.to_str().unwrap()).unwrap();
    }

    info!("运行耗时: {:?}", start.elapsed());

    Ok(filename)
}
