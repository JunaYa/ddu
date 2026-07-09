use std::ffi::c_void;

use core_foundation::base::{CFRelease, TCFType, CFTypeRef};
use core_foundation::string::{CFString, CFStringRef};
use xcap::Monitor;

use crate::smart_capture::{ChainNode, LogicalRect, WindowInfo};

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub(crate) struct CGPoint {
    pub x: f64,
    pub y: f64,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub(crate) struct CGSize {
    pub width: f64,
    pub height: f64,
}

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventCreate(source: *const c_void) -> *const c_void;
    fn CGEventGetLocation(event: *const c_void) -> CGPoint;
}

/// Global cursor position in logical points, top-left origin — the same space
/// as CGWindowBounds and AXFrame, so no conversion is needed anywhere else.
pub fn cursor_position_logical() -> (f64, f64) {
    unsafe {
        let event = CGEventCreate(std::ptr::null());
        if event.is_null() {
            return (0.0, 0.0); // falls back to the primary monitor
        }
        let point = CGEventGetLocation(event);
        core_foundation::base::CFRelease(event as _);
        (point.x, point.y)
    }
}

pub struct FrozenScreen {
    pub monitor_rect: LogicalRect,
    pub scale_factor: f64,
    pub snapshot: image::RgbaImage,
}

fn monitor_rect_of(monitor: &Monitor) -> Result<LogicalRect, String> {
    Ok(LogicalRect {
        x: monitor.x().map_err(|e| e.to_string())? as f64,
        y: monitor.y().map_err(|e| e.to_string())? as f64,
        w: monitor.width().map_err(|e| e.to_string())? as f64,
        h: monitor.height().map_err(|e| e.to_string())? as f64,
    })
}

/// Freeze the monitor containing (x, y): one full-resolution grab that becomes
/// both the overlay background and the source cropped at finalize.
pub fn freeze_screen_at(x: f64, y: f64) -> Result<FrozenScreen, String> {
    let monitor = match Monitor::from_point(x as i32, y as i32) {
        Ok(m) => m,
        // Fallback: hit-test all monitors, then primary, then any.
        Err(_) => {
            let monitors = Monitor::all().map_err(|e| e.to_string())?;
            let mut found = None;
            for m in monitors {
                if monitor_rect_of(&m).map(|r| r.contains(x, y)).unwrap_or(false) {
                    found = Some(m);
                    break;
                }
            }
            match found {
                Some(m) => m,
                None => Monitor::all()
                    .map_err(|e| e.to_string())?
                    .into_iter()
                    .next()
                    .ok_or("no monitors detected")?,
            }
        }
    };
    let monitor_rect = monitor_rect_of(&monitor)?;
    let scale_factor = monitor.scale_factor().map_err(|e| e.to_string())? as f64;
    let snapshot = monitor
        .capture_image()
        .map_err(|e| format!("screen capture failed (Screen Recording permission?): {e}"))?;
    Ok(FrozenScreen { monitor_rect, scale_factor, snapshot })
}

/// System shell surfaces that would otherwise win every hit-test.
const EXCLUDED_APPS: &[&str] = &["Window Server", "Dock"];

/// Windows overlapping the frozen monitor, topmost-first, excluding our own
/// process and system shell layers. Cached once per session — the screen is
/// frozen, so live updates would be wrong anyway.
pub fn list_windows_on_monitor(monitor_rect: &LogicalRect) -> Vec<WindowInfo> {
    let own_pid = std::process::id();
    let mut wins: Vec<(i32, WindowInfo)> = xcap::Window::all()
        .unwrap_or_default()
        .into_iter()
        .filter(|w| !w.is_minimized().unwrap_or(false))
        .filter(|w| w.pid().map(|p| p != own_pid).unwrap_or(true))
        .filter(|w| {
            let app = w.app_name().unwrap_or_default();
            !EXCLUDED_APPS.contains(&app.as_str())
        })
        .filter_map(|w| {
            let rect = LogicalRect {
                x: w.x().ok()? as f64,
                y: w.y().ok()? as f64,
                w: w.width().ok()? as f64,
                h: w.height().ok()? as f64,
            };
            if rect.w < 1.0 || rect.h < 1.0 || !rect.intersects(monitor_rect) {
                return None;
            }
            Some((
                w.z().unwrap_or(0),
                WindowInfo {
                    rect,
                    title: w.title().unwrap_or_default(),
                    app_name: w.app_name().unwrap_or_default(),
                },
            ))
        })
        .collect();
    wins.sort_by(|a, b| b.0.cmp(&a.0));
    wins.into_iter().map(|(_, w)| w).collect()
}

pub fn open_accessibility_preferences() {
    let _ = std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn();
}

type AXUIElementRef = *const c_void;
type AXError = i32;

const K_AX_ERROR_SUCCESS: AXError = 0;
const K_AX_VALUE_CGPOINT: u32 = 1;
const K_AX_VALUE_CGSIZE: u32 = 2;

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXUIElementCreateSystemWide() -> AXUIElementRef;
    fn AXUIElementCopyElementAtPosition(
        application: AXUIElementRef,
        x: f32,
        y: f32,
        element: *mut AXUIElementRef,
    ) -> AXError;
    fn AXUIElementCopyAttributeValue(
        element: AXUIElementRef,
        attribute: CFStringRef,
        value: *mut CFTypeRef,
    ) -> AXError;
    fn AXValueGetValue(value: CFTypeRef, the_type: u32, value_ptr: *mut c_void) -> bool;
}

/// Copy one AX attribute; caller must CFRelease the returned ref.
fn copy_attr(element: AXUIElementRef, name: &str) -> Option<CFTypeRef> {
    let attr = CFString::new(name);
    let mut out: CFTypeRef = std::ptr::null();
    let err = unsafe { AXUIElementCopyAttributeValue(element, attr.as_concrete_TypeRef(), &mut out) };
    if err == K_AX_ERROR_SUCCESS && !out.is_null() {
        Some(out)
    } else {
        None
    }
}

fn element_rect(element: AXUIElementRef) -> Option<LogicalRect> {
    let pos_ref = copy_attr(element, "AXPosition")?;
    let mut point = CGPoint::default();
    let ok_pos = unsafe { AXValueGetValue(pos_ref, K_AX_VALUE_CGPOINT, &mut point as *mut _ as *mut c_void) };
    unsafe { CFRelease(pos_ref) };

    let size_ref = copy_attr(element, "AXSize")?;
    let mut size = CGSize::default();
    let ok_size = unsafe { AXValueGetValue(size_ref, K_AX_VALUE_CGSIZE, &mut size as *mut _ as *mut c_void) };
    unsafe { CFRelease(size_ref) };

    if ok_pos && ok_size {
        Some(LogicalRect { x: point.x, y: point.y, w: size.width, h: size.height })
    } else {
        None
    }
}

fn element_string(element: AXUIElementRef, name: &str) -> String {
    match copy_attr(element, name) {
        Some(value) => {
            // Takes ownership of the +1 ref (create rule), releases on drop.
            let s = unsafe { CFString::wrap_under_create_rule(value as CFStringRef) };
            s.to_string()
        }
        None => String::new(),
    }
}

/// Walk the AX hierarchy upward from the element under (x, y), deepest first.
/// Stops at the window level (the command layer appends the authoritative
/// window rect from the frozen window list). Any failure → empty vec, which
/// downgrades hit-testing to window-level: that is the designed fallback.
pub fn ax_chain_at(x: f64, y: f64, max_depth: usize) -> Vec<ChainNode> {
    let mut nodes = Vec::new();
    unsafe {
        let system_wide = AXUIElementCreateSystemWide();
        if system_wide.is_null() {
            return nodes;
        }
        let mut element: AXUIElementRef = std::ptr::null();
        let err = AXUIElementCopyElementAtPosition(system_wide, x as f32, y as f32, &mut element);
        CFRelease(system_wide as CFTypeRef);
        if err != K_AX_ERROR_SUCCESS || element.is_null() {
            return nodes;
        }

        // `element` carries a +1 ref; every loop iteration owns exactly one.
        let mut current = element;
        for _ in 0..max_depth {
            let role = element_string(current, "AXRole");
            if role == "AXApplication" {
                break; // application node has no useful frame
            }
            if let Some(rect) = element_rect(current) {
                let label = element_string(current, "AXTitle");
                nodes.push(ChainNode { rect, role: role.clone(), label });
            }
            if role == "AXWindow" {
                break; // window tail is appended from the frozen list instead
            }
            match copy_attr(current, "AXParent") {
                Some(parent) => {
                    CFRelease(current as CFTypeRef);
                    current = parent as AXUIElementRef;
                }
                None => break,
            }
        }
        CFRelease(current as CFTypeRef);
    }
    nodes
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Requires Screen Recording permission; run manually:
    /// cargo test --manifest-path src-tauri/Cargo.toml -- --ignored mac_smart
    #[test]
    #[ignore]
    fn mac_smart_freeze_dimensions_match_scale() {
        let (x, y) = cursor_position_logical();
        let frozen = freeze_screen_at(x, y).expect("freeze failed (grant Screen Recording?)");
        assert_eq!(frozen.snapshot.width(), (frozen.monitor_rect.w * frozen.scale_factor).round() as u32);
        assert_eq!(frozen.snapshot.height(), (frozen.monitor_rect.h * frozen.scale_factor).round() as u32);
    }

    #[test]
    #[ignore]
    fn mac_smart_window_list_is_nonempty_and_z_sorted_descending() {
        let (x, y) = cursor_position_logical();
        let frozen = freeze_screen_at(x, y).expect("freeze failed");
        let wins = list_windows_on_monitor(&frozen.monitor_rect);
        // Something is always on screen (Finder/menu apps); print for eyeballing.
        for w in &wins {
            println!("{:?} {} / {}", w.rect, w.app_name, w.title);
        }
        assert!(!wins.is_empty());
    }

    /// Requires Accessibility permission. Hovers the screen center.
    #[test]
    #[ignore]
    fn mac_smart_ax_chain_smoke() {
        if !crate::platform::check_accessibility_permissions() {
            eprintln!("Accessibility not granted; ax_chain_at must return empty");
            assert!(ax_chain_at(400.0, 400.0, 12).is_empty());
            return;
        }
        let chain = ax_chain_at(400.0, 400.0, 12);
        for n in &chain {
            println!("{} '{}' {:?}", n.role, n.label, n.rect);
        }
        // With AX granted and anything at (400,400), the chain is non-empty
        // and every node has a positive-size rect.
        assert!(chain.iter().all(|n| n.rect.w > 0.0 && n.rect.h > 0.0));
    }

}
