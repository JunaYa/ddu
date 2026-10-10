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

/// Screen Recording gate shared by every capture entry point. `preflight` is
/// the current TCC state; `request` triggers the one-shot system prompt and
/// reports whether access is effective without a relaunch.
fn screen_recording_gate(preflight: bool, request: impl FnOnce() -> bool) -> Result<(), String> {
    if preflight || request() {
        return Ok(());
    }
    Err(permission_denied_error(
        PermissionKind::ScreenRecording,
        "grant Screen Recording in System Settings, then relaunch the app",
    ))
}

/// Audio-recording gate. NotDetermined passes through: the first real use
/// triggers the system prompt, which is attributed to this app.
fn microphone_gate(include_audio: bool, status: MicAuthStatus) -> Result<(), String> {
    if !include_audio {
        return Ok(());
    }
    match status {
        MicAuthStatus::Denied | MicAuthStatus::Restricted => Err(permission_denied_error(
            PermissionKind::Microphone,
            "grant Microphone access in System Settings to record audio",
        )),
        _ => Ok(()),
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatusDto {
    pub screen_recording: String,
    pub accessibility: String,
    pub microphone: String,
}

/// Preflights Screen Recording before any capture entry point. On denial it
/// opens the Screen Recording pane and raises the permission-guide (startup)
/// window so tray/hotkey flows get the same guidance as the UI.
pub fn ensure_screen_recording(app: &tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return screen_recording_gate(crate::platform::has_screen_recording_permission(), || {
        // Registers this process in the System Settings list and shows the
        // system prompt (once per TCC reset). Returns true if access is
        // already effective; after a fresh grant macOS requires a relaunch.
        let effective = crate::platform::request_screen_recording_permission();
        if !effective {
            crate::platform::open_screen_capture_preferences();
            crate::window::show_startup_window(app);
        }
        effective
    });

    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Ok(())
    }
}

/// Gates audio recording on Microphone access. Denied/restricted fails and
/// opens the Microphone pane; not-determined passes through so the first real
/// capture raises the system prompt (attributed to this app).
pub fn ensure_microphone(include_audio: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let status = MicAuthStatus::from_raw(crate::platform::microphone_auth_status_raw());
        let result = microphone_gate(include_audio, status);
        if result.is_err() {
            crate::platform::open_microphone_preferences();
        }
        result
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = include_audio;
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

/// Triggers the system prompt for the given permission (when the platform
/// supports prompting) and falls back to opening the matching System Settings
/// pane. Returns whether the permission is effective right now.
#[tauri::command]
pub fn permission_request(kind: String) -> Result<bool, String> {
    let kind =
        PermissionKind::parse(&kind).ok_or_else(|| format!("unknown permission kind: {kind}"))?;

    #[cfg(target_os = "macos")]
    {
        let granted = match kind {
            PermissionKind::ScreenRecording => {
                crate::platform::has_screen_recording_permission()
                    || crate::platform::request_screen_recording_permission()
            }
            PermissionKind::Accessibility => crate::platform::request_accessibility_permission(),
            // No prompt API without block FFI; the first real audio capture
            // raises the system prompt instead.
            PermissionKind::Microphone => microphone_status() == MicAuthStatus::Authorized,
        };
        if !granted {
            open_settings_pane(kind);
        }
        Ok(granted)
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = kind;
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
    fn screen_recording_gate_passes_without_prompting_when_preflight_ok() {
        let mut requested = false;
        let result = screen_recording_gate(true, || {
            requested = true;
            false
        });
        assert!(result.is_ok());
        assert!(!requested, "must not show the system prompt when access is already granted");
    }

    #[test]
    fn screen_recording_gate_passes_when_request_grants_access() {
        assert!(screen_recording_gate(false, || true).is_ok());
    }

    #[test]
    fn screen_recording_gate_fails_with_permission_error_when_denied() {
        let err = screen_recording_gate(false, || false).unwrap_err();
        assert!(err.starts_with("PERMISSION_DENIED:screenRecording:"), "got: {err}");
    }

    #[test]
    fn microphone_gate_ignores_status_when_audio_disabled() {
        assert!(microphone_gate(false, MicAuthStatus::Denied).is_ok());
    }

    #[test]
    fn microphone_gate_passes_when_authorized_or_undetermined() {
        assert!(microphone_gate(true, MicAuthStatus::Authorized).is_ok());
        // NotDetermined: the first capture attempt raises the system prompt.
        assert!(microphone_gate(true, MicAuthStatus::NotDetermined).is_ok());
    }

    #[test]
    fn microphone_gate_fails_when_denied_or_restricted() {
        for status in [MicAuthStatus::Denied, MicAuthStatus::Restricted] {
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
