//! macOS TCC permission checks and prompts (Screen Recording, Accessibility,
//! Microphone) plus the System Settings deep link for each privacy pane.

use std::ffi::c_void;
use std::process::Command;

use core_foundation::base::TCFType;
use core_foundation::boolean::CFBoolean;
use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
use core_foundation::string::CFString;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
}

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> bool;
}

// Linking AVFoundation guarantees the AVCaptureDevice class is present at
// runtime; the constant resolves to the @"soun" media type NSString.
#[link(name = "AVFoundation", kind = "framework")]
extern "C" {
    static AVMediaTypeAudio: *const c_void;
}

#[link(name = "objc", kind = "dylib")]
extern "C" {
    fn objc_getClass(name: *const libc::c_char) -> *const c_void;
    fn sel_registerName(name: *const libc::c_char) -> *const c_void;
    fn objc_msgSend();
}

/// Returns `true` when Screen Recording permission has been granted.
/// xcap succeeds without it (returns blanked frames for other apps), so we
/// must check explicitly before freezing.
pub fn has_screen_recording_permission() -> bool {
    unsafe { CGPreflightScreenCaptureAccess() }
}

/// Prompt for Screen Recording permission. Registers this process in the
/// System Settings list and shows the system dialog (once per TCC reset);
/// returns `true` if access is already/now granted. Note: after the user
/// grants access, macOS requires the app to be relaunched before capture
/// APIs observe the new permission.
pub fn request_screen_recording_permission() -> bool {
    unsafe { CGRequestScreenCaptureAccess() }
}

fn ax_is_process_trusted(prompt: bool) -> bool {
    let key = CFString::new("AXTrustedCheckOptionPrompt");
    let value = if prompt {
        CFBoolean::true_value()
    } else {
        CFBoolean::false_value()
    };
    let options = CFDictionary::from_CFType_pairs(&[(key, value)]);
    unsafe { AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef()) }
}

pub fn check_accessibility_permissions() -> bool {
    ax_is_process_trusted(false)
}

/// Shows the one-time system prompt for Accessibility (a no-op once the app
/// is already listed in System Settings) and returns the current trust state.
pub fn request_accessibility_permission() -> bool {
    ax_is_process_trusted(true)
}

/// Raw AVAuthorizationStatus for audio capture:
/// 0 = notDetermined, 1 = restricted, 2 = denied, 3 = authorized.
/// Anything negative means the runtime lookup failed.
pub fn microphone_auth_status_raw() -> i64 {
    unsafe {
        let class = objc_getClass(c"AVCaptureDevice".as_ptr());
        if class.is_null() {
            return -1;
        }
        let selector = sel_registerName(c"authorizationStatusForMediaType:".as_ptr());
        // [AVCaptureDevice authorizationStatusForMediaType:] returns an
        // NSInteger and takes one object argument, so the plain msgSend ABI
        // applies on both x86_64 and aarch64.
        let send: extern "C" fn(*const c_void, *const c_void, *const c_void) -> isize =
            std::mem::transmute(objc_msgSend as unsafe extern "C" fn());
        send(class, selector, AVMediaTypeAudio) as i64
    }
}

fn open_privacy_pane(pane: &str) {
    let _ = Command::new("open")
        .arg(format!(
            "x-apple.systempreferences:com.apple.preference.security?{pane}"
        ))
        .spawn();
}

pub fn open_screen_capture_preferences() {
    open_privacy_pane("Privacy_ScreenCapture");
}

pub fn open_accessibility_preferences() {
    open_privacy_pane("Privacy_Accessibility");
}

pub fn open_microphone_preferences() {
    open_privacy_pane("Privacy_Microphone");
}
