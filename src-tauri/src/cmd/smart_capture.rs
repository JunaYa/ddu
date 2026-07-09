use std::sync::atomic::{AtomicU64, Ordering};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Local;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageEncoder;
use serde::Serialize;
use tauri::Manager;
use tracing::info;

use crate::common::get_images_dir;
use crate::global_shortcut::post_capture_flow;
use crate::platform;
use crate::smart_capture::{
    dedupe_chain, selection_to_snapshot_pixels, topmost_window_at, ChainNode, LogicalRect,
    SmartCaptureState, SmartSession,
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

/// Freeze the cursor's monitor, cache the session and raise the overlay.
/// Shared by the `smart_capture_start` command, global hotkeys and the tray.
pub async fn start_smart_capture(app: &tauri::AppHandle, mode: &str) -> Result<(), String> {
    // C1: preflight Screen Recording permission before touching xcap. xcap
    // succeeds silently without it (returns blanked frames for other apps), so
    // the old error path after freeze_screen_at never fired in practice.
    if !platform::has_screen_recording_permission() {
        // Registers this process in the System Settings list and shows the
        // system prompt (once per TCC reset). Returns true if access is
        // already effective; after a fresh grant macOS requires a relaunch,
        // so we still bail and guide the user to the settings pane.
        if !platform::request_screen_recording_permission() {
            platform::open_screen_capture_preferences();
            return Err(
                "screen recording permission not granted (grant it in System Settings, then relaunch the app)"
                    .into(),
            );
        }
    }

    let (cursor_x, cursor_y) = platform::cursor_position_logical();
    let frozen = platform::freeze_screen_at(cursor_x, cursor_y)
        .inspect_err(|_| platform::open_screen_capture_preferences())?;

    let windows = platform::list_windows_on_monitor(&frozen.monitor_rect);
    let ax_available = platform::check_accessibility_permissions();
    let monitor_rect = frozen.monitor_rect;

    let session_id = SESSION_COUNTER.fetch_add(1, Ordering::Relaxed);

    {
        let state = app.state::<SmartCaptureState>();
        *state.0.lock().unwrap() = Some(SmartSession {
            mode: mode.to_string(),
            monitor_rect,
            scale_factor: frozen.scale_factor,
            snapshot: frozen.snapshot,
            windows,
            ax_available,
            session_id,
            handshake_done: false,
        });
    }

    // I2: create_capture_window is now fallible; on failure, clean up the
    // session so the app is not stranded in a started-but-windowless state.
    if let Err(e) = window::create_capture_window(app, monitor_rect.x, monitor_rect.y, monitor_rect.w, monitor_rect.h) {
        app.state::<SmartCaptureState>().0.lock().unwrap().take();
        return Err(e);
    }

    // I3: watchdog — if the overlay page never calls smart_capture_get_session
    // within 3 s, tear down the session so the user is never stranded behind a
    // frozen overlay with no JS escape hatch.
    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        std::thread::sleep(std::time::Duration::from_secs(3));
        let state = app_handle.state::<SmartCaptureState>();
        let mut guard = state.0.lock().unwrap();
        let tear_down = guard
            .as_ref()
            .map(|s| s.session_id == session_id && !s.handshake_done)
            .unwrap_or(false);
        if tear_down {
            guard.take();
            drop(guard);
            info!("capture overlay never handshook; tearing down");
            window::close_capture_window(&app_handle);
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn smart_capture_start(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    start_smart_capture(&app, &mode).await
}

#[tauri::command]
pub async fn smart_capture_get_session(app: tauri::AppHandle) -> Result<SessionDto, String> {
    // Copy the raw pixels out under the lock, then encode with the lock released
    // so concurrent hit_test calls are never starved.
    let (raw, width, height, mode, ax_available, monitor, scale_factor) = {
        let state = app.state::<SmartCaptureState>();
        let mut guard = state.0.lock().unwrap();
        let session = guard.as_mut().ok_or("no active capture session")?;
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
pub async fn smart_capture_hit_test(app: tauri::AppHandle, x: f64, y: f64) -> Result<HitTestDto, String> {
    // Copy what we need and drop the lock before the potentially slow AX call.
    // C2: also extract the window pid so we can scope AX to that app, avoiding
    // resolution into our own screensaver-level overlay.
    let (window_node, app_name, ax_available, window_pid) = {
        let state = app.state::<SmartCaptureState>();
        let guard = state.0.lock().unwrap();
        let session = guard.as_ref().ok_or("no active capture session")?;
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
    x: f64,
    y: f64,
    w: f64,
    h: f64,
) -> Result<(), String> {
    let session = {
        let state = app.state::<SmartCaptureState>();
        let session = state.0.lock().unwrap().take();
        session
    };

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
            mode: if session.mode == "window" { "activeWindow".into() } else { "region".into() },
            captured_at: now.to_rfc3339(),
        })
    })();

    // Whatever happened above, the overlay must come down — never leave the
    // user stuck behind a frozen screen (R8).
    window::close_capture_window(&app);

    match result {
        Ok(capture) => {
            post_capture_flow(&app, Ok(capture));
            Ok(())
        }
        Err(e) => {
            info!("smart_capture_finalize failed: {e}");
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn smart_capture_cancel(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<SmartCaptureState>();
    state.0.lock().unwrap().take();
    window::close_capture_window(&app);
    Ok(())
}

#[tauri::command]
pub fn open_accessibility_preferences() {
    platform::open_accessibility_preferences();
}
