use std::{path::PathBuf, thread, time::Duration};

use chrono::Local;
use image::{ImageBuffer, Rgba};
use scrap::{Capturer, Display};
use std::io::ErrorKind::WouldBlock;
use tauri::Runtime;

#[tauri::command]
pub async fn scrap_capture_screen<R: Runtime>(
    _app: tauri::AppHandle<R>,
    path: String,
) -> Result<String, String> {
    // 获取主显示器
    let display = Display::primary().map_err(|e| e.to_string())?;

    let width = display.width() as u32;
    let height = display.height() as u32;

    // 创建截屏器
    let mut capturer = Capturer::new(display).map_err(|e| e.to_string())?;

    // 获取帧
    let mut frame;
    loop {
        match capturer.frame() {
            Ok(buffer) => {
                frame = buffer;
                break;
            }
            Err(error) => {
                if error.kind() == WouldBlock {
                    // 等待新的帧
                    thread::sleep(Duration::from_millis(100));
                    continue;
                }
                return Err(error.to_string());
            }
        }
    }

    // 将原始数据转换为 RGBA 格式
    let mut img = ImageBuffer::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let i = (y * width + x) as usize * 4;
            let pixel = Rgba([
                frame[i + 2], // R
                frame[i + 1], // G
                frame[i],     // B
                255,          // A
            ]);
            img.put_pixel(x, y, pixel);
        }
    }

    // 创建保存目录
    let pictures_dir = PathBuf::from(path);
    std::fs::create_dir_all(&pictures_dir).map_err(|e| e.to_string())?;

    // 生成文件名（使用时间戳）
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();

    let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = pictures_dir.join(&filename);

    // 保存图片
    img.save(&filename).map_err(|e| e.to_string())?;

    Ok(filename)
}
