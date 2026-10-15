use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Local;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageEncoder;
use serde::Serialize;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tracing::info;

use crate::common::get_images_dir;
use crate::global_shortcut::post_capture_flow;
use crate::platform;
use crate::smart_capture::{
    dedupe_chain, selection_to_snapshot_pixels, topmost_window_at, ChainNode, LogicalRect,
    take_capture_session, SmartCaptureState, SmartSession,
};
use crate::window;

/// Monotonically-increasing session counter. Overflow is not a concern in
/// practice: u64::MAX sessions would take astronomical time at human speed.
static SESSION_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionDto {
    pub mode: String,
    pub ax_available: bool,
    pub monitor: LogicalRect,
    pub scale_factor: f64,
    pub snapshot_data_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HitTestDto {
    pub chain: Vec<ChainNode>,
    pub app_name: String,
}

// Serialize startup so two hotkeys cannot freeze each other's overlays.
static STARTING: AtomicBool = AtomicBool::new(false);
struct CaptureStartup;
impl Drop for CaptureStartup {
    fn drop(&mut self) { STARTING.store(false, Ordering::Release); }
}

/// Freeze all displays before showing any overlay. Each window owns its
/// display's pixels, coordinates and scale; finishing one ends the whole batch.
pub async fn start_smart_capture(app: &tauri::AppHandle, mode: &str) -> Result<(), String> {
    if STARTING.swap(true, Ordering::AcqRel) { return Ok(()); }
    let _startup = CaptureStartup;
    if !app.state::<SmartCaptureState>().0.lock().unwrap().is_empty() { return Ok(()); }
    if super::scroll_status().active {
        return Err("请先完成或取消当前滚动截图".into());
    }
    super::ensure_screen_recording(app)?;
    let screens = platform::freeze_all_screens()?;
    let (cursor_x, cursor_y) = platform::cursor_position_logical();
    let ax_available = platform::check_accessibility_permissions();
    let session_id = SESSION_COUNTER.fetch_add(1, Ordering::Relaxed);
    let mut overlays = Vec::new();
    let mut sessions = std::collections::HashMap::new();
    for (index, frozen) in screens.into_iter().enumerate() {
        let label = format!("capture-{session_id}-{index}");
        let monitor_rect = frozen.monitor_rect;
        overlays.push((label.clone(), monitor_rect));
        sessions.insert(label, SmartSession {
            mode: mode.to_string(),
            monitor_rect,
            scale_factor: frozen.scale_factor,
            snapshot: frozen.snapshot,
            windows: platform::list_windows_on_monitor(&monitor_rect),
            ax_available,
            session_id,
            handshake_done: false,
        });
    }
    *app.state::<SmartCaptureState>().0.lock().unwrap() = sessions;
    // Keep the session lock through creation: no fast overlay can finalize
    // while sibling windows are still being built.
    {
        let state = app.state::<SmartCaptureState>();
        let mut guard = state.0.lock().unwrap();
        for (label, rect) in &overlays {
            if let Err(e) = window::create_capture_window(app, label, rect.x, rect.y, rect.w, rect.h) {
                window::close_capture_window(app);
                guard.clear();
                return Err(e);
            }
        }
    }
    if let Some((label, _)) = overlays.iter().find(|(_, rect)| rect.contains(cursor_x, cursor_y)).or(overlays.first()) {
        if let Some(overlay) = app.get_webview_window(label) { let _ = overlay.set_focus(); }
    }
    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        std::thread::sleep(std::time::Duration::from_secs(3));
        let state = app_handle.state::<SmartCaptureState>();
        let mut guard = state.0.lock().unwrap();
        if guard.values().any(|s| s.session_id == session_id && !s.handshake_done) {
            info!("capture overlay never handshook; tearing down all displays");
            window::close_capture_window(&app_handle);
            guard.clear();
        }
    });
    Ok(())
}

#[tauri::command]
pub async fn smart_capture_start(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    start_smart_capture(&app, &mode).await
}

#[tauri::command]
pub async fn smart_capture_get_session(app: tauri::AppHandle, window: tauri::WebviewWindow) -> Result<SessionDto, String> {
    // Copy the raw pixels out under the lock, then encode with the lock released
    // so concurrent hit_test calls are never starved.
    let (raw, width, height, mode, ax_available, monitor, scale_factor) = {
        let state = app.state::<SmartCaptureState>();
        let mut guard = state.0.lock().unwrap();
        let session = guard.get_mut(window.label()).ok_or("no active capture session")?;
        // I3: mark handshake complete so the watchdog knows the overlay loaded.
        session.handshake_done = true;
        (
            session.snapshot.as_raw().to_vec(),
            session.snapshot.width(),
            session.snapshot.height(),
            session.mode.clone(),
            session.ax_available,
            session.monitor_rect,
            session.scale_factor,
        )
    };

    // Fast PNG encode: this is a one-time transfer for on-screen display; the
    // final image is cropped losslessly from the in-memory RGBA instead.
    let mut png = Vec::new();
    let encoder = PngEncoder::new_with_quality(&mut png, CompressionType::Fast, FilterType::NoFilter);
    encoder
        .write_image(&raw, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| e.to_string())?;

    Ok(SessionDto {
        mode,
        ax_available,
        monitor,
        scale_factor,
        snapshot_data_url: format!("data:image/png;base64,{}", STANDARD.encode(&png)),
    })
}

#[tauri::command]
pub async fn smart_capture_hit_test(app: tauri::AppHandle, window: tauri::WebviewWindow, x: f64, y: f64) -> Result<HitTestDto, String> {
    // Copy what we need and drop the lock before the potentially slow AX call.
    // C2: also extract the window pid so we can scope AX to that app, avoiding
    // resolution into our own screensaver-level overlay.
    let (window_node, app_name, ax_available, window_pid) = {
        let state = app.state::<SmartCaptureState>();
        let guard = state.0.lock().unwrap();
        let session = guard.get(window.label()).ok_or("no active capture session")?;
        match topmost_window_at(&session.windows, x, y) {
            Some(i) => {
                let win = &session.windows[i];
                (
                    ChainNode { rect: win.rect, role: "AXWindow".into(), label: win.title.clone() },
                    win.app_name.clone(),
                    session.ax_available,
                    Some(win.pid),
                )
            }
            None => (
                ChainNode { rect: session.monitor_rect, role: "AXScreen".into(), label: String::new() },
                String::new(),
                // C2: no window under cursor — no pid to scope to, so skip AX
                // entirely; the chain is just the screen fallback node.
                false,
                None,
            ),
        }
    };

    // Keyboard actions follow the display being hovered, without requiring
    // an initial click (which would otherwise capture immediately).
    if !window.is_focused().unwrap_or(false) { let _ = window.set_focus(); }

    let mut chain = if ax_available {
        if let Some(pid) = window_pid {
            // AX calls can block on slow apps; keep them off the async runtime.
            tauri::async_runtime::spawn_blocking(move || platform::ax_chain_at(x, y, pid, 12))
                .await
                .unwrap_or_default()
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };
    chain.push(window_node);
    Ok(HitTestDto { chain: dedupe_chain(chain), app_name })
}

#[tauri::command]
pub async fn smart_capture_finalize(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
) -> Result<(), String> {
    let session = {
        let state = app.state::<SmartCaptureState>();
        let mut guard = state.0.lock().unwrap();
        let session = take_capture_session(&mut guard, window.label()).ok_or("no active capture session")?;
        // Destroy siblings before releasing the batch; stale finalizers cannot
        // close windows belonging to a later capture.
        window::close_capture_window(&app);
        Some(session)
    };

    if session.as_ref().is_some_and(|s| s.mode == "scroll") {
        let s = session.unwrap();
        let rect = LogicalRect { x, y, w, h };
        let result = (|| {
            let (px, py, pw, ph) = selection_to_snapshot_pixels(
                rect,
                (s.monitor_rect.x, s.monitor_rect.y),
                s.scale_factor,
                s.snapshot.width(),
                s.snapshot.height(),
            ).ok_or("selection too small")?;
            let first = image::imageops::crop_imm(&s.snapshot, px, py, pw, ph).to_image();
            super::begin_scroll(&app, rect, s.monitor_rect, s.scale_factor, first)
        })();
        return result.inspect_err(|e| {
            app.dialog().message(e.clone()).show(|_| {});
        });
    }

    let result = (|| -> Result<platform::CaptureResult, String> {
        let session = session.ok_or("no active capture session")?;
        let (px, py, pw, ph) = selection_to_snapshot_pixels(
            LogicalRect { x, y, w, h },
            (session.monitor_rect.x, session.monitor_rect.y),
            session.scale_factor,
            session.snapshot.width(),
            session.snapshot.height(),
        )
        .ok_or("selection too small")?;

        let cropped = image::imageops::crop_imm(&session.snapshot, px, py, pw, ph).to_image();
        let images_dir = get_images_dir(&app, "images".to_string())?;
        let now = Local::now();
        let filename = format!("screenshot_{}.png", now.format("%Y%m%d_%H%M%S"));
        let output_path = images_dir.join(&filename);
        cropped.save(&output_path).map_err(|e| e.to_string())?;
        platform::set_last_capture_path(output_path.to_string_lossy().to_string());

        Ok(platform::CaptureResult {
            filename,
            full_path: output_path.to_string_lossy().to_string(),
            width: pw,
            height: ph,
            mode: match session.mode.as_str() {
                "window" => "activeWindow".into(),
                _ => "region".into(),
            },
            captured_at: now.to_rfc3339(),
        })
    })();

    // All overlays were closed atomically when claiming this session.

    match result {
        Ok(capture) => {
            post_capture_flow(&app, Ok(capture), Some(LogicalRect { x, y, w, h }));
            Ok(())
        }
        Err(e) => {
            info!("smart_capture_finalize failed: {e}");
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn smart_capture_cancel(app: tauri::AppHandle, window: tauri::WebviewWindow) -> Result<(), String> {
    let state = app.state::<SmartCaptureState>();
    let mut guard = state.0.lock().unwrap();
    if guard.contains_key(window.label()) {
        window::close_capture_window(&app);
        guard.clear();
    }
    Ok(())
}

#[tauri::command]
pub fn open_accessibility_preferences() {
    platform::open_accessibility_preferences();
}
