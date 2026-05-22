use serde::{Deserialize, Serialize};
use tracing::info;

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
            reason: Some("macOS Vision framework".to_string()),
        });
        caps.push(PlatformCapability {
            key: "systemAudio".to_string(),
            status: "limited".to_string(),
            reason: Some("Requires additional setup on macOS".to_string()),
        });
        caps.push(PlatformCapability {
            key: "scrollingCapture".to_string(),
            status: "unavailable".to_string(),
            reason: Some("Not yet implemented".to_string()),
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
        perms.push(PlatformCapability {
            key: "screenRecording".to_string(),
            status: "unknown".to_string(),
            reason: Some("Check System Settings > Privacy > Screen Recording".to_string()),
        });
    }

    perms
}
