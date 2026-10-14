//! Read System Settings window geometry without requesting Accessibility access.
use crate::smart_capture::LogicalRect;
use core_foundation::{
    array::{CFArray, CFArrayRef},
    base::{CFType, TCFType},
    dictionary::CFDictionary,
    number::CFNumber,
    string::CFString,
};
use objc::{
    runtime::{Class, Object, Sel},
    Message,
};

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGWindowListCopyWindowInfo(options: u32, relative_to: u32) -> CFArrayRef;
}

fn number(dictionary: &CFDictionary<CFString, CFType>, key: &str) -> Option<f64> {
    dictionary
        .find(CFString::new(key))?
        .downcast::<CFNumber>()?
        .to_f64()
}

/// Bounds are global logical points with the same top-left origin as placement.
/// Match the bundle's PID, not a localized title or private window content.
pub fn system_settings_frame() -> Option<LogicalRect> {
    objc::rc::autoreleasepool(|| unsafe {
        let class = Class::get("NSRunningApplication")?;
        let bundle = CFString::new("com.apple.systempreferences");
        let apps: *mut Object = class
            .send_message(
                Sel::register("runningApplicationsWithBundleIdentifier:"),
                (bundle.as_concrete_TypeRef(),),
            )
            .ok()?;
        if apps.is_null() {
            return None;
        }
        let count: usize = (&*apps).send_message(Sel::register("count"), ()).ok()?;
        if count == 0 {
            return None;
        }
        let app: *mut Object = (&*apps)
            .send_message(Sel::register("objectAtIndex:"), (0usize,))
            .ok()?;
        if app.is_null() {
            return None;
        }
        let pid: i32 = (&*app)
            .send_message(Sel::register("processIdentifier"), ())
            .ok()?;
        // On-screen, non-desktop windows, returned front to back. Neither window
        // titles nor screenshots are needed, including before permission is granted.
        let raw = CGWindowListCopyWindowInfo(1 | (1 << 4), 0);
        if raw.is_null() {
            return None;
        }
        let windows = CFArray::<CFDictionary<CFString, CFType>>::wrap_under_create_rule(raw);
        for info in windows.iter() {
            if number(&info, "kCGWindowOwnerPID") != Some(pid as f64)
                || number(&info, "kCGWindowLayer") != Some(0.0)
            {
                continue;
            }
            let Some(bounds) = info
                .find(CFString::new("kCGWindowBounds"))
                .and_then(|value| value.downcast::<CFDictionary>())
            else {
                continue;
            };
            let bounds =
                CFDictionary::<CFString, CFType>::wrap_under_get_rule(bounds.as_concrete_TypeRef());
            let (Some(x), Some(y), Some(w), Some(h)) = (
                number(&bounds, "X"),
                number(&bounds, "Y"),
                number(&bounds, "Width"),
                number(&bounds, "Height"),
            ) else {
                continue;
            };
            if [x, y, w, h].iter().all(|n| n.is_finite()) && w >= 300.0 && h >= 200.0 {
                return Some(LogicalRect { x, y, w, h });
            }
        }
        None
    })
}
