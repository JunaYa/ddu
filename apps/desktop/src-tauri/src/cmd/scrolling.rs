//! Manual scrolling with automatic stable-frame collection. No input is injected.
use crate::{
    platform,
    smart_capture::{selection_to_snapshot_pixels, LogicalRect},
};
use image::RgbaImage;
use serde::Serialize;
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};

static SAVING: AtomicBool = AtomicBool::new(false);
static SESSION: Mutex<Option<ScrollSession>> = Mutex::new(None);
struct ScrollSession {
    stop: Arc<AtomicBool>,
    data: Arc<Mutex<ScrollData>>,
    rect: LogicalRect,
    app: tauri::AppHandle,
}
struct ScrollData {
    frames: Vec<(RgbaImage, u32)>,
    height: u32,
    message: String,
}
#[derive(Serialize)]
pub struct ScrollStatus {
    pub active: bool,
    frames: usize,
    height: u32,
    message: String,
}

// Compare interior pixels: exclude scrollbars and a narrow edge. Require both
// textured content and an unambiguous alignment; blank/repeated rows are unsafe.
fn error(a: &RgbaImage, b: &RgbaImage, shift: u32) -> f64 {
    let overlap = a.height() - shift;
    let mut total = 0u64;
    let mut count = 0u64;
    for y in (0..overlap).step_by((overlap / 48).max(1) as usize) {
        for x in (a.width() / 20..a.width() * 19 / 20).step_by((a.width() / 64).max(1) as usize) {
            for c in 0..3 {
                total += a.get_pixel(x, y + shift)[c].abs_diff(b.get_pixel(x, y)[c]) as u64;
                count += 1;
            }
        }
    }
    total as f64 / count.max(1) as f64
}
fn displacement(a: &RgbaImage, b: &RgbaImage) -> Result<u32, &'static str> {
    if a.dimensions() != b.dimensions() {
        return Err("显示区域尺寸已改变，请重新开始");
    }
    if error(a, b, 0) < 0.5 {
        return Ok(0);
    }
    let max_shift = a.height() * 3 / 4;
    let scores: Vec<_> = (1..=max_shift).map(|d| (d, error(a, b, d))).collect();
    let &(best, score) = scores
        .iter()
        .min_by(|a, b| a.1.total_cmp(&b.1))
        .ok_or("区域太小")?;
    let runner = scores
        .iter()
        .filter(|(d, _)| d.abs_diff(best) > 3)
        .map(|(_, s)| *s)
        .fold(f64::INFINITY, f64::min);
    if score > 2.0 || runner < score + 1.0 {
        return Err("未找到可靠重叠：请向上回滚一些，再缓慢向下滚动；避开固定标题栏和动画");
    }
    Ok(best)
}

pub fn begin_scroll(
    app: &tauri::AppHandle,
    rect: LogicalRect,
    monitor: LogicalRect,
    scale: f64,
    first: RgbaImage,
) -> Result<(), String> {
    if first.width() < 32 || first.height() < 64 {
        return Err("滚动区域至少需要 32 × 64 像素".into());
    }
    if u64::from(first.width()) * u64::from(first.height()) > 40_000_000 {
        return Err("所选区域过大".into());
    }
    if SAVING.load(Ordering::Relaxed) {
        return Err("正在保存上一张长图".into());
    }
    let mut session = SESSION.lock().map_err(|e| e.to_string())?;
    if session.is_some() {
        return Err("请先完成或取消当前滚动截图".into());
    }
    let stop = Arc::new(AtomicBool::new(false));
    let data = Arc::new(Mutex::new(ScrollData {
        height: first.height(),
        frames: vec![(first, 0)],
        message: "缓慢向下滚动，每次保留至少 1/4 重叠；从托盘完成或取消".into(),
    }));
    *session = Some(ScrollSession {
        stop: stop.clone(),
        data: data.clone(),
        rect,
        app: app.clone(),
    });
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let started = Instant::now();
        let mut previous: Option<RgbaImage> = None;
        while !stop.load(Ordering::Relaxed) {
            if let Some(tray) = app.tray_by_id("main-tray") {
                let (count, message) = {
                    let d = data.lock().unwrap();
                    (d.frames.len(), d.message.clone())
                };
                let _ = tray.set_tooltip(Some(&format!("滚动截图：已采集 {count} 帧\n{message}")));
            }
            std::thread::sleep(Duration::from_millis(450));
            if stop.load(Ordering::Relaxed) {
                break;
            }
            let frame = (|| {
                let frozen =
                    platform::freeze_screen_at(rect.x + rect.w / 2.0, rect.y + rect.h / 2.0)?;
                if frozen.monitor_rect != monitor || frozen.scale_factor != scale {
                    return Err("显示器布局已改变，请完成或取消后重新开始".into());
                }
                let (x, y, w, h) = selection_to_snapshot_pixels(
                    rect,
                    (monitor.x, monitor.y),
                    scale,
                    frozen.snapshot.width(),
                    frozen.snapshot.height(),
                )
                .ok_or("区域无效")?;
                Ok::<_, String>(image::imageops::crop_imm(&frozen.snapshot, x, y, w, h).to_image())
            })();
            let mut guard = data.lock().unwrap();
            if stop.load(Ordering::Relaxed) {
                break;
            }
            if started.elapsed() > Duration::from_secs(300) {
                guard.message = "已达 5 分钟上限，请从托盘完成或取消".into();
                break;
            }
            let frame = match frame {
                Ok(f) => f,
                Err(e) => {
                    guard.message = e;
                    break;
                }
            };
            let stable = previous
                .as_ref()
                .is_some_and(|p| p.dimensions() == frame.dimensions() && error(p, &frame, 0) < 0.5);
            previous = Some(frame.clone());
            if !stable {
                continue;
            }
            let last = &guard.frames.last().unwrap().0;
            match displacement(last, &frame) {
                Ok(0) => {}
                Ok(shift) => {
                    let height = guard.height + shift;
                    // Stored full frames are also bounded, not just the final image.
                    if u64::from(height) * u64::from(frame.width()) > 40_000_000
                        || guard
                            .frames
                            .iter()
                            .map(|(f, _)| u64::from(f.width()) * u64::from(f.height()))
                            .sum::<u64>()
                            + u64::from(frame.width()) * u64::from(frame.height())
                            > 64_000_000
                        || height > 32_000
                    {
                        guard.message = "已达长图大小上限，请从托盘完成".into();
                        break;
                    }
                    guard.height = height;
                    guard.frames.push((frame, shift));
                    guard.message = format!(
                        "已拼接 {} 段 · {} px；可继续向下滚动或从托盘完成",
                        guard.frames.len(),
                        height
                    );
                }
                Err(e) => guard.message = e.into(),
            }
        }
        if !stop.load(Ordering::Relaxed) {
            if let Some(tray) = app.tray_by_id("main-tray") {
                let message = data.lock().unwrap().message.clone();
                let _ = tray.set_tooltip(Some(&message));
            }
        }
    });
    Ok(())
}

#[tauri::command]
pub fn scroll_status() -> ScrollStatus {
    let busy = || ScrollStatus {
        active: true,
        frames: 0,
        height: 0,
        message: "正在处理长图…".into(),
    };
    let Ok(session) = SESSION.try_lock() else {
        return busy();
    };
    match session.as_ref() {
        Some(s) => {
            let Ok(d) = s.data.try_lock() else {
                return busy();
            };
            ScrollStatus {
                active: true,
                frames: d.frames.len(),
                height: d.height,
                message: d.message.clone(),
            }
        }
        None => ScrollStatus {
            active: false,
            frames: 0,
            height: 0,
            message: String::new(),
        },
    }
}
#[tauri::command]
pub fn scroll_cancel() {
    if let Some(s) = SESSION.lock().unwrap().take() {
        s.stop.store(true, Ordering::Relaxed);
        if let Some(tray) = s.app.tray_by_id("main-tray") {
            let _ = tray.set_title(None::<&str>);
            let _ = tray.set_tooltip(Some("DDU"));
        }
    }
}
#[tauri::command]
pub async fn scroll_finish(app: tauri::AppHandle) -> Result<(), String> {
    let result = tauri::async_runtime::spawn_blocking({
        let app = app.clone();
        move || {
            if SAVING.swap(true, Ordering::SeqCst) {
                return Err("长图正在保存".into());
            }
            struct SavingGuard;
            impl Drop for SavingGuard {
                fn drop(&mut self) {
                    SAVING.store(false, Ordering::SeqCst);
                }
            }
            let _saving = SavingGuard;
            let (shared, rect) = {
                let session = SESSION.lock().unwrap();
                let s = session.as_ref().ok_or("没有进行中的滚动截图")?;
                s.stop.store(true, Ordering::Relaxed);
                (s.data.clone(), s.rect)
            };
            let data = shared.lock().unwrap();
            let width = data.frames[0].0.width();
            let output = compose(&data);
            let now = chrono::Local::now();
            let filename = format!("scroll_{}.png", now.format("%Y%m%d_%H%M%S_%3f"));
            let path = crate::common::get_images_dir(&app, "images".into())?.join(&filename);
            output.save(&path).map_err(|e| e.to_string())?;
            let result = platform::CaptureResult {
                filename,
                full_path: path.to_string_lossy().into(),
                width,
                height: data.height,
                mode: "scroll".into(),
                captured_at: now.to_rfc3339(),
            };
            drop(data);
            let mut session = SESSION.lock().unwrap();
            if !session
                .as_ref()
                .is_some_and(|s| Arc::ptr_eq(&s.data, &shared))
            {
                let _ = std::fs::remove_file(&path);
                return Err("滚动截图已取消".into());
            }
            session.take();
            drop(session);
            if let Some(tray) = app.tray_by_id("main-tray") {
                let _ = tray.set_title(None::<&str>);
                let _ = tray.set_tooltip(Some("DDU"));
            }
            Ok::<_, String>((result, rect))
        }
    })
    .await
    .map_err(|e| e.to_string())??;
    platform::set_last_capture_path(result.0.full_path.clone());
    crate::global_shortcut::post_capture_flow(&app, Ok(result.0), Some(result.1));
    Ok(())
}

fn compose(data: &ScrollData) -> RgbaImage {
    let width = data.frames[0].0.width();
    let mut output = RgbaImage::new(width, data.height);
    let mut y = 0;
    for (index, (frame, shift)) in data.frames.iter().enumerate() {
        let height = if index == 0 { frame.height() } else { *shift };
        let strip = image::imageops::crop_imm(frame, 0, frame.height() - height, width, height);
        image::imageops::replace(&mut output, &strip.to_image(), 0, y as i64);
        y += height;
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    fn content() -> RgbaImage {
        RgbaImage::from_fn(160, 600, |x, y| {
            let mut hash = x.wrapping_mul(7919) ^ y.wrapping_mul(104729);
            hash ^= hash >> 16;
            hash = hash.wrapping_mul(0x7feb352d);
            hash ^= hash >> 15;
            let v = hash as u8;
            image::Rgba([v, v.wrapping_mul(17), v.wrapping_mul(31), 255])
        })
    }
    #[test]
    fn detects_overlap_and_duplicates() {
        let source = content();
        let a = image::imageops::crop_imm(&source, 0, 0, 160, 240).to_image();
        let b = image::imageops::crop_imm(&source, 0, 100, 160, 240).to_image();
        assert_eq!(displacement(&a, &b), Ok(100));
        assert_eq!(displacement(&a, &a), Ok(0));
        assert!(displacement(&b, &a).is_err());
    }
    #[test]
    fn assembled_pixels_match_source_without_duplicate_rows() {
        let source = content();
        let a = image::imageops::crop_imm(&source, 0, 0, 160, 240).to_image();
        let b = image::imageops::crop_imm(&source, 0, 100, 160, 240).to_image();
        let shift = displacement(&a, &b).unwrap();
        let output = compose(&ScrollData {
            frames: vec![(a, 0), (b, shift)],
            height: 340,
            message: String::new(),
        });
        assert_eq!(
            output,
            image::imageops::crop_imm(&source, 0, 0, 160, 340).to_image()
        );
    }
    #[test]
    fn rejects_missing_overlap_and_resizing() {
        let source = content();
        let a = image::imageops::crop_imm(&source, 0, 0, 160, 240).to_image();
        let b = image::imageops::crop_imm(&source, 0, 300, 160, 240).to_image();
        assert!(displacement(&a, &b).is_err());
        assert!(displacement(&a, &RgbaImage::new(80, 120)).is_err());
    }
}
