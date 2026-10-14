use serde::Serialize;

/// Machine-readable prefix for permission failures. The frontend matches on
/// this to route errors into the permission-guide UI instead of a raw toast.
pub const PERMISSION_DENIED_PREFIX: &str = "PERMISSION_DENIED:";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PermissionKind {
    ScreenRecording,
    Accessibility,
    Microphone,
}

impl PermissionKind {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "screenRecording" => Some(Self::ScreenRecording),
            "accessibility" => Some(Self::Accessibility),
            "microphone" => Some(Self::Microphone),
            _ => None,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Self::ScreenRecording => "screenRecording",
            Self::Accessibility => "accessibility",
            Self::Microphone => "microphone",
        }
    }
}

pub fn permission_denied_error(kind: PermissionKind, hint: &str) -> String {
    format!("{PERMISSION_DENIED_PREFIX}{}: {hint}", kind.as_str())
}

/// AVAuthorizationStatus for the microphone, decoupled from the raw FFI value.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MicAuthStatus {
    NotDetermined,
    Restricted,
    Denied,
    Authorized,
    Unknown,
}

impl MicAuthStatus {
    /// Maps a raw AVAuthorizationStatus (0-3); anything else is Unknown.
    pub fn from_raw(raw: i64) -> Self {
        match raw {
            0 => Self::NotDetermined,
            1 => Self::Restricted,
            2 => Self::Denied,
            3 => Self::Authorized,
            _ => Self::Unknown,
        }
    }
}

/// Capture preflight is silent. Only an explicit grant action requests access.
fn screen_recording_gate(preflight: bool) -> Result<(), String> {
    if preflight { return Ok(()); }
    Err(permission_denied_error(PermissionKind::ScreenRecording, "请在设置的权限管理中授权屏幕录制"))
}

/// Audio access is requested explicitly from Settings, never during recording.
fn microphone_gate(include_audio: bool, status: MicAuthStatus) -> Result<(), String> {
    if !include_audio {
        return Ok(());
    }
    match status {
        MicAuthStatus::Authorized => Ok(()),
        _ => Err(permission_denied_error(
            PermissionKind::Microphone,
            "grant Microphone access in System Settings to record audio",
        )),
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatusDto {
    pub screen_recording: String,
    pub accessibility: String,
    pub microphone: String,
}

/// All capture entry points route missing access to the same settings section.
pub fn ensure_screen_recording(app: &tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let result = screen_recording_gate(crate::platform::has_screen_recording_permission());
        if result.is_err() { crate::window::show_permission_settings(app); }
        result
    }
    #[cfg(not(target_os = "macos"))]
    { let _ = app; Ok(()) }
}

/// Missing microphone access also routes to central permission management.
pub fn ensure_microphone(app: &tauri::AppHandle, include_audio: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let status = MicAuthStatus::from_raw(crate::platform::microphone_auth_status_raw());
        let result = microphone_gate(include_audio, status);
        if result.is_err() {
            crate::window::show_permission_settings(app);
        }
        result
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, include_audio);
        Ok(())
    }
}

fn permission_state(granted: bool) -> String {
    if granted { "granted" } else { "denied" }.to_string()
}

#[cfg(target_os = "macos")]
pub fn microphone_status() -> MicAuthStatus {
    MicAuthStatus::from_raw(crate::platform::microphone_auth_status_raw())
}

#[tauri::command]
pub fn permission_status() -> PermissionStatusDto {
    #[cfg(target_os = "macos")]
    return PermissionStatusDto {
        screen_recording: permission_state(crate::platform::has_screen_recording_permission()),
        accessibility: permission_state(crate::platform::check_accessibility_permissions()),
        microphone: match microphone_status() {
            MicAuthStatus::Authorized => "granted",
            MicAuthStatus::NotDetermined => "undetermined",
            MicAuthStatus::Restricted => "restricted",
            MicAuthStatus::Denied => "denied",
            MicAuthStatus::Unknown => "unknown",
        }
        .to_string(),
    };

    #[cfg(not(target_os = "macos"))]
    PermissionStatusDto {
        screen_recording: permission_state(true),
        accessibility: permission_state(true),
        microphone: permission_state(true),
    }
}

#[cfg(target_os = "macos")]
fn open_settings_pane(kind: PermissionKind) {
    match kind {
        PermissionKind::ScreenRecording => crate::platform::open_screen_capture_preferences(),
        PermissionKind::Accessibility => crate::platform::open_accessibility_preferences(),
        PermissionKind::Microphone => crate::platform::open_microphone_preferences(),
    }
}

/// Opens System Settings and the permission guide. Accessibility is checked
/// silently because users add the app by dragging it into the system list.
/// Returns whether the permission is effective right now.
#[derive(Clone, Copy, serde::Deserialize)]
pub struct PermissionOrigin { x: f64, y: f64 }

#[tauri::command]
pub async fn permission_request(app: tauri::AppHandle, window: tauri::WebviewWindow, kind: String, origin: Option<PermissionOrigin>) -> Result<bool, String> {
    let origin = origin.filter(|p| p.x.is_finite() && p.y.is_finite()).and_then(|p| {
        let scale = window.scale_factor().ok()?;
        let position = window.inner_position().ok()?;
        Some((position.x as f64 / scale + p.x, position.y as f64 / scale + p.y))
    });
    let kind =
        PermissionKind::parse(&kind).ok_or_else(|| format!("unknown permission kind: {kind}"))?;

    #[cfg(target_os = "macos")]
    {
        let granted = match kind {
            PermissionKind::ScreenRecording => {
                crate::platform::has_screen_recording_permission()
                    || crate::platform::request_screen_recording_permission()
            }
            PermissionKind::Accessibility => crate::platform::check_accessibility_permissions(),
            PermissionKind::Microphone => {
                crate::platform::request_microphone_permission();
                microphone_status() == MicAuthStatus::Authorized
            },
        };
        crate::window::show_permission_window(&app, kind.as_str(), origin)?;
        open_settings_pane(kind);
        Ok(granted)
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (kind, app, origin);
        Ok(true)
    }
}

#[tauri::command]
pub fn permission_open_settings(kind: String) -> Result<(), String> {
    let kind =
        PermissionKind::parse(&kind).ok_or_else(|| format!("unknown permission kind: {kind}"))?;

    #[cfg(target_os = "macos")]
    open_settings_pane(kind);

    #[cfg(not(target_os = "macos"))]
    let _ = kind;

    Ok(())
}

/// Relaunches the app — required after granting Screen Recording, which macOS
/// only applies to a fresh process.
#[tauri::command]
pub fn restart_app(app_handle: tauri::AppHandle) {
    app_handle.restart();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn permission_kind_parses_frontend_names() {
        assert_eq!(PermissionKind::parse("screenRecording"), Some(PermissionKind::ScreenRecording));
        assert_eq!(PermissionKind::parse("accessibility"), Some(PermissionKind::Accessibility));
        assert_eq!(PermissionKind::parse("microphone"), Some(PermissionKind::Microphone));
        assert_eq!(PermissionKind::parse("camera"), None);
    }

    #[test]
    fn permission_kind_round_trips_through_as_str() {
        for kind in [
            PermissionKind::ScreenRecording,
            PermissionKind::Accessibility,
            PermissionKind::Microphone,
        ] {
            assert_eq!(PermissionKind::parse(kind.as_str()), Some(kind));
        }
    }

    #[test]
    fn permission_denied_error_is_machine_readable() {
        let err = permission_denied_error(PermissionKind::ScreenRecording, "grant it in System Settings");
        assert_eq!(err, "PERMISSION_DENIED:screenRecording: grant it in System Settings");
        assert!(err.starts_with(PERMISSION_DENIED_PREFIX));
    }

    #[test]
    fn screen_recording_preflight_is_silent_and_reports_missing_permission() {
        assert!(screen_recording_gate(true).is_ok());
        assert!(screen_recording_gate(false).unwrap_err().starts_with("PERMISSION_DENIED:screenRecording:"));
    }

    #[test]
    fn microphone_gate_ignores_status_when_audio_disabled() {
        assert!(microphone_gate(false, MicAuthStatus::Denied).is_ok());
    }

    #[test]
    fn microphone_gate_passes_when_authorized() {
        assert!(microphone_gate(true, MicAuthStatus::Authorized).is_ok());

    }

    #[test]
    fn microphone_gate_fails_when_denied_or_restricted() {
        for status in [MicAuthStatus::Denied, MicAuthStatus::Restricted, MicAuthStatus::NotDetermined, MicAuthStatus::Unknown] {
            let err = microphone_gate(true, status).unwrap_err();
            assert!(err.starts_with("PERMISSION_DENIED:microphone:"), "got: {err}");
        }
    }

    #[test]
    fn mic_auth_status_maps_av_authorization_values() {
        assert_eq!(MicAuthStatus::from_raw(0), MicAuthStatus::NotDetermined);
        assert_eq!(MicAuthStatus::from_raw(1), MicAuthStatus::Restricted);
        assert_eq!(MicAuthStatus::from_raw(2), MicAuthStatus::Denied);
        assert_eq!(MicAuthStatus::from_raw(3), MicAuthStatus::Authorized);
        assert_eq!(MicAuthStatus::from_raw(-1), MicAuthStatus::Unknown);
        assert_eq!(MicAuthStatus::from_raw(42), MicAuthStatus::Unknown);
    }
}

fn app_bundle_for_executable(executable: &std::path::Path) -> Option<std::path::PathBuf> {
    // Only the running executable's bundle may be offered, never a different
    // installed copy or the unbundled development binary.
    let macos = executable.parent()?;
    let contents = macos.parent()?;
    let bundle = contents.parent()?;
    (macos.file_name()? == "MacOS" && contents.file_name()? == "Contents"
        && bundle.extension()? == "app").then(|| bundle.to_path_buf())
}

#[tauri::command]
pub fn permission_app_path() -> Result<String, String> {
    let executable = std::env::current_exe().map_err(|e| e.to_string())?;
    app_bundle_for_executable(&executable)
        .map(|p| p.to_string_lossy().into_owned())
        .ok_or_else(|| "当前为开发进程，无法拖拽授权。请打开打包后的 DDU.app，或在系统设置中手动管理当前进程权限。".into())
}

#[tauri::command]
pub async fn permission_drag_app(window: tauri::WebviewWindow) -> Result<(), String> {
    if window.label() != "permission" { return Err("Only the permission helper can drag the app".into()); }
    #[cfg(target_os = "macos")]
    {
        let path = permission_app_path()?;
        let (tx, rx) = std::sync::mpsc::channel();
        let drag_window = window.clone();
        window.run_on_main_thread(move || {
            let result = drag::start_drag(
                &drag_window,
                drag::DragItem::Files(vec![path.into()]),
                drag::Image::Raw(include_bytes!("../../icons/128x128.png").to_vec()),
                |_, _| {},
                drag::Options::default(),
            ).map_err(|e| e.to_string());
            let _ = tx.send(result);
        }).map_err(|e| e.to_string())?;
        tauri::async_runtime::spawn_blocking(move || rx.recv().map_err(|e| e.to_string()))
            .await.map_err(|e| e.to_string())??
    }
    #[cfg(not(target_os = "macos"))]
    Err("Permission dragging is only supported on macOS".into())
}

#[cfg(test)]
mod bundle_tests {
    use super::*;
    #[test]
    fn only_drag_the_running_bundle() {
        use std::path::Path;
        assert_eq!(app_bundle_for_executable(Path::new("/Applications/DDU.app/Contents/MacOS/ddu")), Some("/Applications/DDU.app".into()));
        assert_eq!(app_bundle_for_executable(Path::new("/tmp/target/debug/ddu")), None);
        assert_eq!(app_bundle_for_executable(Path::new("/tmp/fake.app/ddu")), None);
    }
}

#[tauri::command]
pub fn take_permission_navigation() -> bool {
    crate::window::take_permission_navigation()
}

/// Stop automatic placement before handing the gesture to the native window manager.
#[tauri::command]
pub fn permission_move_window(window: tauri::WebviewWindow) -> Result<(), String> {
    use tauri::Emitter;
    if window.label() != "permission" { return Err("Only the permission helper can be moved".into()); }
    window.emit_to("permission", "permission-manual-move", ()).map_err(|e| e.to_string())?;
    window.start_dragging().map_err(|e| e.to_string())
}
