use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformCapability {
    pub key: String,
    pub status: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticsBundle {
    pub app_version: String,
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub capabilities: Vec<PlatformCapability>,
    pub permissions: Vec<PlatformCapability>,
}

#[tauri::command]
pub fn get_platform_capabilities() -> Vec<PlatformCapability> {
    let mut caps = Vec::new();

    #[cfg(target_os = "macos")]
    {
        caps.push(PlatformCapability {
            key: "regionCapture".to_string(),
            status: "available".to_string(),
            reason: None,
        });
        caps.push(PlatformCapability {
            key: "windowCapture".to_string(),
            status: "available".to_string(),
            reason: None,
        });
        caps.push(PlatformCapability {
            key: "fullScreenCapture".to_string(),
            status: "available".to_string(),
            reason: None,
        });
        caps.push(PlatformCapability {
            key: "screenRecording".to_string(),
            status: "available".to_string(),
            reason: None,
        });
        caps.push(PlatformCapability {
            key: "globalShortcuts".to_string(),
            status: "available".to_string(),
            reason: None,
        });
        caps.push(PlatformCapability {
            key: "ocr".to_string(),
            status: "available".to_string(),
            reason: Some("Local PP-OCRv6 via LiteParse (macOS Vision fallback)".to_string()),
        });
        caps.push(PlatformCapability {
            key: "systemAudio".to_string(),
            status: if super::system_audio_supported() { "available" } else { "unavailable" }.to_string(),
            reason: Some(if super::system_audio_supported() { "设置 → 录屏：开启系统声音" } else { "此 macOS 版本的原生录屏不支持系统声音" }.to_string()),
        });
        caps.push(PlatformCapability {
            key: "scrollingCapture".to_string(),
            status: "available".to_string(),
            reason: Some("托盘 → 滚动截图：选区后手动向下滚动，停稳后自动拼接".to_string()),
        });
    }

    #[cfg(target_os = "linux")]
    {
        let is_wayland = std::env::var("WAYLAND_DISPLAY").is_ok();
        let desktop = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();

        caps.push(PlatformCapability {
            key: "regionCapture".to_string(),
            status: if is_wayland { "limited" } else { "available" }.to_string(),
            reason: if is_wayland { Some("Uses xdg-desktop-portal on Wayland".to_string()) } else { None },
        });
        caps.push(PlatformCapability {
            key: "globalShortcuts".to_string(),
            status: if is_wayland { "unavailable" } else { "available" }.to_string(),
            reason: if is_wayland { Some("Wayland restricts global shortcuts".to_string()) } else { None },
        });
        caps.push(PlatformCapability {
            key: "desktopEnvironment".to_string(),
            status: "available".to_string(),
            reason: Some(desktop),
        });
    }

    #[cfg(target_os = "windows")]
    {
        caps.push(PlatformCapability {
            key: "regionCapture".to_string(),
            status: "available".to_string(),
            reason: None,
        });
        caps.push(PlatformCapability {
            key: "globalShortcuts".to_string(),
            status: "available".to_string(),
            reason: None,
        });
    }

    caps
}

#[tauri::command]
pub fn get_diagnostics_bundle(app_handle: tauri::AppHandle) -> DiagnosticsBundle {
    let version = app_handle.config().version.clone().unwrap_or_else(|| "unknown".to_string());

    DiagnosticsBundle {
        app_version: version,
        os: std::env::consts::OS.to_string(),
        os_version: os_info::get().version().to_string(),
        arch: std::env::consts::ARCH.to_string(),
        capabilities: get_platform_capabilities(),
        permissions: get_permission_status(),
    }
}

fn get_permission_status() -> Vec<PlatformCapability> {
    let mut perms = Vec::new();

    #[cfg(target_os = "macos")]
    {
        let has_accessibility = crate::platform::check_accessibility_permissions();
        perms.push(PlatformCapability {
            key: "accessibility".to_string(),
            status: if has_accessibility { "available" } else { "unavailable" }.to_string(),
            reason: if !has_accessibility {
                Some("Grant in System Settings > Privacy > Accessibility".to_string())
            } else {
                None
            },
        });
        let has_screen_recording = crate::platform::has_screen_recording_permission();
        perms.push(PlatformCapability {
            key: "screenRecording".to_string(),
            status: if has_screen_recording { "available" } else { "unavailable" }.to_string(),
            reason: if !has_screen_recording {
                Some("Grant in System Settings > Privacy > Screen Recording".to_string())
            } else {
                None
            },
        });
        let mic = super::microphone_status();
        perms.push(PlatformCapability {
            key: "microphone".to_string(),
            status: match mic {
                super::MicAuthStatus::Authorized => "available",
                super::MicAuthStatus::NotDetermined => "unknown",
                _ => "unavailable",
            }
            .to_string(),
            reason: match mic {
                super::MicAuthStatus::Authorized => None,
                super::MicAuthStatus::NotDetermined => {
                    Some("macOS will ask on first audio recording".to_string())
                }
                _ => Some("Grant in System Settings > Privacy > Microphone".to_string()),
            },
        });
    }

    perms
}
