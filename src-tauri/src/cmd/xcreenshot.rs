use std::path::PathBuf;

use chrono::Local;
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
    let windows = Window::all().unwrap();

    let mut i = 0;
    let mut filename = String::new();
    for window in windows {
        // 最小化的窗口不能截屏
        if window.is_minimized() {
            continue;
        }

        println!(
            "Window: {:?} {:?} {:?}",
            window.title(),
            (window.x(), window.y(), window.width(), window.height()),
            (window.is_minimized(), window.is_maximized())
        );

        let image = window.capture_image().unwrap();

        filename = format!(
            "{}-{}-{}.png",
            Local::now().format("%Y%m%d_%H%M%S"),
            i,
            normalized(window.title())
        );

        let output_path = path.join(&filename);

        println!("保存图片: {}", &output_path.to_str().unwrap());

        image.save(output_path).unwrap();

        i += 1;
    }

    println!("运行耗时: {:?}", start.elapsed());

    Ok(filename)
}

fn monitor_capture(path: PathBuf) -> Result<String, String> {
    let start = Instant::now();
    let monitors = Monitor::all().unwrap();

    let mut filename = String::new();

    for monitor in monitors {
        let image = monitor.capture_image().unwrap();

        filename = format!(
            "{}-{}.png",
            Local::now().format("%Y%m%d_%H%M%S"),
            normalized(monitor.name())
        );

        let output_path = path.join(&filename);

        image.save(output_path.to_str().unwrap()).unwrap();
    }

    println!("运行耗时: {:?}", start.elapsed());

    Ok(filename)
}
