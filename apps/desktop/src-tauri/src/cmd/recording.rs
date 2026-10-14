use crate::common::get_images_dir;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use tracing::info;

struct Recording {
    child: Child,
    path: PathBuf,
    started: Instant,
}
static RECORDING: Mutex<Option<Recording>> = Mutex::new(None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingConfig {
    pub mode: String,
    pub include_cursor: bool,
    /// Microphone (kept compatible with the original command).
    pub include_audio: bool,
    #[serde(default)]
    pub system_audio: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingResult {
    pub file_path: String,
    pub filename: String,
    pub duration_estimate_ms: u64,
}

pub fn system_audio_supported() -> bool {
    static SUPPORTED: OnceLock<bool> = OnceLock::new();
    *SUPPORTED.get_or_init(|| {
        #[cfg(target_os = "macos")]
        {
            Command::new("/usr/sbin/screencapture")
                .arg("-h")
                .output()
                .map(|o| {
                    let help = format!(
                        "{}{}",
                        String::from_utf8_lossy(&o.stdout),
                        String::from_utf8_lossy(&o.stderr)
                    );
                    help.lines()
                        .any(|line| line.trim_start().starts_with("-A "))
                })
                .unwrap_or(false)
        }
        #[cfg(not(target_os = "macos"))]
        {
            false
        }
    })
}
pub fn stop_recording_on_exit() {
    if let Ok(mut slot) = RECORDING.lock() {
        if let Some(mut r) = slot.take() {
            #[cfg(unix)]
            unsafe {
                libc::kill(r.child.id() as i32, libc::SIGINT);
            }
            // Do not orphan a capture process when quitting DDU.
            let deadline = Instant::now() + Duration::from_secs(3);
            while matches!(r.child.try_wait(), Ok(None)) && Instant::now() < deadline {
                std::thread::sleep(Duration::from_millis(50));
            }
            if matches!(r.child.try_wait(), Ok(None)) {
                let _ = r.child.kill();
            }
            let _ = r.child.wait();
        }
    }
}
fn recording_args(config: &RecordingConfig) -> Result<Vec<&'static str>, String> {
    let mut args = vec!["-v", "-x"];
    match config.mode.as_str() {
        "region" => args.push("-i"),
        "fullscreen" => {}
        _ => return Err("Unknown recording mode".into()),
    }
    if config.include_cursor {
        args.push("-C");
    }
    if config.include_audio {
        args.push("-g");
    }
    if config.system_audio {
        args.push("-A");
    }
    Ok(args)
}
#[tauri::command]
pub async fn start_recording(
    app_handle: tauri::AppHandle,
    path: String,
    config: RecordingConfig,
) -> Result<String, String> {
    if !cfg!(target_os = "macos") {
        return Err("Screen recording is currently supported on macOS".into());
    }
    let args = recording_args(&config)?;
    if config.system_audio && !system_audio_supported() {
        return Err("此 macOS 版本不支持原生系统音频录制".into());
    }
    super::ensure_screen_recording(&app_handle)?;
    super::ensure_microphone(&app_handle, config.include_audio)?;
    let mut slot = RECORDING.lock().map_err(|e| e.to_string())?;
    if slot.is_some() {
        return Err("请先停止当前录屏".into());
    }
    let images = get_images_dir(&app_handle, path)?;
    let dir = images.parent().unwrap_or(&images).join("recordings");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let output = dir.join(format!(
        "recording_{}.mov",
        Local::now().format("%Y%m%d_%H%M%S_%3f")
    ));
    let child = Command::new("/usr/sbin/screencapture")
        .args(args)
        .arg(&output)
        .spawn()
        .map_err(|e| e.to_string())?;
    let result = output.to_string_lossy().into_owned();
    *slot = Some(Recording {
        child,
        path: output,
        started: Instant::now(),
    });
    Ok(result)
}
#[tauri::command]
pub async fn stop_recording() -> Result<RecordingResult, String> {
    tauri::async_runtime::spawn_blocking(|| {
        // Keep the slot occupied until the encoder has flushed the movie.
        let mut slot = RECORDING.lock().map_err(|e| e.to_string())?;
        let recording = slot.as_mut().ok_or("没有进行中的录屏")?;
        if recording
            .child
            .try_wait()
            .map_err(|e| e.to_string())?
            .is_none()
        {
            #[cfg(unix)]
            unsafe {
                libc::kill(recording.child.id() as i32, libc::SIGINT);
            }
            let deadline = Instant::now() + Duration::from_secs(15);
            while recording
                .child
                .try_wait()
                .map_err(|e| e.to_string())?
                .is_none()
            {
                if Instant::now() > deadline {
                    return Err("录屏仍在保存，请稍后重试停止".into());
                }
                std::thread::sleep(Duration::from_millis(100));
            }
        }
        let recording = slot.take().unwrap();
        if !recording.path.metadata().is_ok_and(|m| m.len() > 0) {
            return Err("录屏已取消或未生成视频，请检查屏幕录制和音频权限".into());
        }
        Ok(RecordingResult {
            file_path: recording.path.to_string_lossy().into(),
            filename: recording
                .path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into(),
            duration_estimate_ms: recording.started.elapsed().as_millis() as u64,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub fn is_recording() -> bool {
    // Includes an ended process awaiting collection, so Stop can report its output/error.
    RECORDING.try_lock().map(|s| s.is_some()).unwrap_or(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn audio_sources_are_independent() {
        let mut c = RecordingConfig {
            mode: "fullscreen".into(),
            include_cursor: false,
            include_audio: false,
            system_audio: true,
        };
        assert_eq!(recording_args(&c).unwrap(), vec!["-v", "-x", "-A"]);
        c.include_audio = true;
        assert!(recording_args(&c).unwrap().contains(&"-g"));
        c.system_audio = false;
        assert!(!recording_args(&c).unwrap().contains(&"-A"));
        c.mode = "invalid".into();
        assert!(recording_args(&c).is_err());
    }
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
        let filter = format!(
            "fps={},scale={}:-1:flags=lanczos",
            fps.min(15),
            width.min(800)
        );
        let output = Command::new("ffmpeg")
            .args([
                "-i",
                &input_path,
                "-vf",
                &filter,
                "-loop",
                "0",
                "-y",
                &output_path,
            ])
            .output()
            .map_err(|e| {
                format!(
                    "ffmpeg not found or failed: {}. Install with: brew install ffmpeg",
                    e
                )
            })?;

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
