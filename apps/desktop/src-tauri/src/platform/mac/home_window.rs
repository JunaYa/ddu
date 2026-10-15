//! Place Home using AppKit points throughout, with no deferred tao position setter.
use objc::{
    runtime::{Class, Object, Sel},
    Encode, Encoding, Message,
};
use tauri::WebviewWindow;
use tracing::warn;

use crate::{placement, smart_capture::LogicalRect};

#[repr(C)]
#[derive(Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}
#[repr(C)]
#[derive(Clone, Copy)]
struct Size {
    w: f64,
    h: f64,
}
#[repr(C)]
#[derive(Clone, Copy)]
struct Rect {
    origin: Point,
    size: Size,
}

// CGFloat is double on the supported arm64/x86_64 macOS targets. These
// repr(C) layouts match AppKit's NSPoint/NSSize/NSRect (CoreGraphics aliases).
unsafe impl Encode for Point {
    fn encode() -> Encoding {
        unsafe { Encoding::from_str("{CGPoint=dd}") }
    }
}
unsafe impl Encode for Rect {
    fn encode() -> Encoding {
        unsafe { Encoding::from_str("{CGRect={CGPoint=dd}{CGSize=dd}}") }
    }
}

fn centered_frame(window: Rect, screen: Rect) -> Rect {
    let (x, y) = placement::center_in(
        (window.size.w, window.size.h),
        LogicalRect {
            x: screen.origin.x,
            y: screen.origin.y,
            w: screen.size.w,
            h: screen.size.h,
        },
    );
    Rect {
        origin: Point { x, y },
        size: window.size,
    }
}

pub fn show_centered(window: &WebviewWindow) {
    let handle = window.clone();
    if let Err(error) = window.run_on_main_thread(move || {
        let result = objc::rc::autoreleasepool(|| unsafe { place_and_show(&handle) });
        if let Err(error) = result {
            warn!("Could not center Home: {error}");
            let _ = handle.show();
            let _ = handle.set_focus();
        }
    }) {
        warn!("Could not dispatch Home placement: {error}");
    }
}

/// All geometry and mutations run on the AppKit main thread. No logical /
/// physical conversion is needed, including across mixed-DPI displays.
unsafe fn place_and_show(window: &WebviewWindow) -> Result<(), String> {
    let native = window.ns_window().map_err(|e| e.to_string())? as *mut Object;
    let native = native.as_ref().ok_or("missing NSWindow")?;
    let nil = std::ptr::null_mut::<Object>();
    let event = Class::get("NSEvent").ok_or("missing NSEvent")?;
    let cursor: Point = event
        .send_message(Sel::register("mouseLocation"), ())
        .map_err(|e| e.to_string())?;
    let screens = Class::get("NSScreen").ok_or("missing NSScreen")?;
    let list: *mut Object = screens
        .send_message(Sel::register("screens"), ())
        .map_err(|e| e.to_string())?;
    let list = list.as_ref().ok_or("missing screens")?;
    let count: usize = list
        .send_message(Sel::register("count"), ())
        .map_err(|e| e.to_string())?;
    let mut bounds = Vec::new();
    for index in 0..count {
        let screen: *mut Object = list
            .send_message(Sel::register("objectAtIndex:"), (index,))
            .map_err(|e| e.to_string())?;
        let screen = screen.as_ref().ok_or("missing screen")?;
        let frame: Rect = screen
            .send_message(Sel::register("frame"), ())
            .map_err(|e| e.to_string())?;
        let rect = LogicalRect {
            x: frame.origin.x,
            y: frame.origin.y,
            w: frame.size.w,
            h: frame.size.h,
        };
        bounds.push(placement::Screen {
            bounds: rect,
            work_area: rect,
        });
    }
    let screen = placement::screen_for(
        LogicalRect {
            x: cursor.x,
            y: cursor.y,
            w: 0.0,
            h: 0.0,
        },
        &bounds,
    )
    .ok_or("no displays")?
    .bounds;
    let _: () = native
        .send_message(Sel::register("deminiaturize:"), (nil,))
        .map_err(|e| e.to_string())?;
    let frame: Rect = native
        .send_message(Sel::register("frame"), ())
        .map_err(|e| e.to_string())?;
    let target = centered_frame(
        frame,
        Rect {
            origin: Point {
                x: screen.x,
                y: screen.y,
            },
            size: Size {
                w: screen.w,
                h: screen.h,
            },
        },
    );
    let _: () = native
        .send_message(Sel::register("setFrameOrigin:"), (target.origin,))
        .map_err(|e| e.to_string())?;
    let _: () = native
        .send_message(Sel::register("makeKeyAndOrderFront:"), (nil,))
        .map_err(|e| e.to_string())?;
    // Tauri also activates the accessory app so Home comes above other apps.
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn centers_the_outer_frame_on_each_display_without_scaling() {
        for (x, y, w, h) in [
            (0.0, 0.0, 1512.0, 982.0),
            (-1920.0, -300.0, 1920.0, 1080.0),
            (0.0, 982.0, 1920.0, 1080.0),
        ] {
            let screen = Rect {
                origin: Point { x, y },
                size: Size { w, h },
            };
            for (ww, wh) in [(800.0, 628.0), (1100.0, 740.0)] {
                let frame = centered_frame(
                    Rect {
                        origin: Point {
                            x: 3000.0,
                            y: -900.0,
                        },
                        size: Size { w: ww, h: wh },
                    },
                    screen,
                );
                assert_eq!(frame.origin.x + ww / 2.0, x + w / 2.0);
                assert_eq!(frame.origin.y + wh / 2.0, y + h / 2.0);
            }
        }
    }
}
