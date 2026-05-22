use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use chrono::Local;
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::common::get_images_dir;

static RECORDING_PROCESS: Mutex<Option<Child>> = Mutex::new(None);
static RECORDING_PATH: Mutex<Option<String>> = Mutex::new(None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingConfig {
    pub mode: String,
    pub include_cursor: bool,
    pub include_audio: bool,
    pub fps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingResult {
    pub file_path: String,
    pub filename: String,
    pub duration_estimate_ms: u64,
}

#[tauri::command]
pub async fn start_recording(
    app_handle: tauri::AppHandle,
    path: String,
    config: RecordingConfig,
) -> Result<String, String> {
    if let Ok(proc) = RECORDING_PROCESS.lock() {
        if proc.is_some() {
            return Err("Recording already in progress".to_string());
        }
    }

    let recordings_dir = get_images_dir(&app_handle, path)?;
    let recordings_dir = recordings_dir.parent().unwrap_or(&recordings_dir).join("recordings");
    std::fs::create_dir_all(&recordings_dir).map_err(|e| e.to_string())?;

    let filename = format!("recording_{}.mov", Local::now().format("%Y%m%d_%H%M%S"));
    let output_path = recordings_dir.join(&filename);

    #[cfg(target_os = "macos")]
    {
        let mut args = vec!["-v".to_string()];

        if !config.include_audio {
            args.push("-x".to_string());
        }

        if config.mode == "region" {
            args.push("-i".to_string());
        }

        args.push(output_path.to_str().unwrap().to_string());

        let child = Command::new("screencapture")
            .args(&args)
            .spawn()
            .map_err(|e| format!("Failed to start recording: {}", e))?;

        if let Ok(mut proc) = RECORDING_PROCESS.lock() {
            *proc = Some(child);
        }
        if let Ok(mut rp) = RECORDING_PATH.lock() {
            *rp = Some(output_path.to_string_lossy().to_string());
        }

        info!("Started recording to {}", output_path.display());
        Ok(output_path.to_string_lossy().to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Screen recording not available on this platform yet".to_string())
    }
}

#[tauri::command]
pub fn stop_recording() -> Result<RecordingResult, String> {
    let file_path = if let Ok(mut proc) = RECORDING_PROCESS.lock() {
        if let Some(mut child) = proc.take() {
            #[cfg(unix)]
            {
                unsafe {
                    libc::kill(child.id() as i32, libc::SIGINT);
                }
            }
            let _ = child.wait();
        }
        if let Ok(rp) = RECORDING_PATH.lock() {
            rp.clone().unwrap_or_default()
        } else {
            String::new()
        }
    } else {
        return Err("No recording in progress".to_string());
    };

    if let Ok(mut rp) = RECORDING_PATH.lock() {
        *rp = None;
    }

    let path = PathBuf::from(&file_path);
    let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();

    info!("Stopped recording: {}", file_path);
    Ok(RecordingResult {
        file_path,
        filename,
        duration_estimate_ms: 0,
    })
}

#[tauri::command]
pub fn is_recording() -> bool {
    RECORDING_PROCESS
        .lock()
        .map(|p| p.is_some())
        .unwrap_or(false)
}

#[tauri::command]
pub async fn convert_to_gif(
    input_path: String,
    output_path: String,
    fps: u32,
    width: u32,
) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        let filter = format!("fps={},scale={}:-1:flags=lanczos", fps.min(15), width.min(800));
        let output = Command::new("ffmpeg")
            .args(["-i", &input_path, "-vf", &filter, "-loop", "0", "-y", &output_path])
            .output()
            .map_err(|e| format!("ffmpeg not found or failed: {}. Install with: brew install ffmpeg", e))?;

        if output.status.success() {
            info!("Converted to GIF: {}", output_path);
            Ok(output_path)
        } else {
            let err = String::from_utf8_lossy(&output.stderr);
            Err(format!("GIF conversion failed: {}", err))
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("GIF conversion not available on this platform yet".to_string())
    }
}
