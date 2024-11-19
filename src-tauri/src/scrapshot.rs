use std::path::PathBuf;

use chrono::Local;
use std::time::Instant;
use tauri::{Manager, Runtime};
use tauri_plugin_store::StoreExt;
use xcap::{Monitor, Window};

#[tauri::command]
pub async fn xcap_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    let images_dir = get_images_dir(app_handle, path).unwrap();

    let filename = window_capture(images_dir)?;

    Ok(filename)
}

#[tauri::command]
pub async fn xcap_monitor<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    let images_dir = get_images_dir(app_handle, path).unwrap();

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

pub fn get_images_dir<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<PathBuf, String> {
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

    // let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    // let output_path = images_dir.join(&filename);

    Ok(images_dir)
}
