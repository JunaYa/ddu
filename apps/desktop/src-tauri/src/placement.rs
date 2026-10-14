//! Where to put the preview floater after a capture: on the display the
//! capture came from, right next to the captured area.
//!
//! Everything here is in global *logical* points (top-left origin, displays
//! left of / above the main one have negative coordinates). On macOS this is
//! the only coordinate space that is consistent across displays: tao reports
//! each monitor's "physical" position scaled by that monitor's own backing
//! factor, so physical coordinates from a Retina and a 1x display don't line
//! up, and `set_position(Physical)` converts with the *window's* current
//! factor rather than the target display's.

use tauri::{Monitor, WebviewWindow};

use crate::smart_capture::LogicalRect;

/// Space between the captured area and the floater.
const GAP: f64 = 12.0;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Screen {
    pub bounds: LogicalRect,
    /// `bounds` minus the menu bar and Dock.
    pub work_area: LogicalRect,
}

impl Screen {
    pub fn from_monitor(monitor: &Monitor) -> Self {
        let scale = monitor.scale_factor();
        let (pos, size) = (monitor.position(), monitor.size());
        let work = monitor.work_area();
        Self {
            bounds: LogicalRect {
                x: pos.x as f64 / scale,
                y: pos.y as f64 / scale,
                w: size.width as f64 / scale,
                h: size.height as f64 / scale,
            },
            work_area: LogicalRect {
                x: work.position.x as f64 / scale,
                y: work.position.y as f64 / scale,
                w: work.size.width as f64 / scale,
                h: work.size.height as f64 / scale,
            },
        }
    }
}

pub fn screens(window: &WebviewWindow) -> Vec<Screen> {
    window
        .available_monitors()
        .map(|monitors| monitors.iter().map(Screen::from_monitor).collect())
        .unwrap_or_default()
}

/// The screen containing the center of `anchor`, else the one nearest to it.
pub fn screen_for(anchor: LogicalRect, screens: &[Screen]) -> Option<Screen> {
    let (cx, cy) = (anchor.x + anchor.w / 2.0, anchor.y + anchor.h / 2.0);
    let distance = |s: &Screen| {
        let b = s.bounds;
        let dx = (b.x - cx).max(cx - (b.x + b.w)).max(0.0);
        let dy = (b.y - cy).max(cy - (b.y + b.h)).max(0.0);
        dx * dx + dy * dy
    };
    screens
        .iter()
        .find(|s| s.bounds.contains(cx, cy))
        .or_else(|| screens.iter().min_by(|a, b| distance(a).total_cmp(&distance(b))))
        .copied()
}

/// Top-left for a `size` window beside `anchor`, kept inside `work`.
///
/// Prefers the right of the capture, bottom-aligned with it; then the left;
/// when neither side has room (e.g. a full-screen capture) it sits inside
/// the capture's bottom-right corner.
pub fn place_beside(anchor: LogicalRect, size: (f64, f64), work: LogicalRect) -> (f64, f64) {
    let (w, h) = size;
    let right = anchor.x + anchor.w + GAP;
    let left = anchor.x - GAP - w;
    let x = if right + w <= work.x + work.w {
        right
    } else if left >= work.x {
        left
    } else {
        anchor.x + anchor.w - GAP - w
    };
    let y = anchor.y + anchor.h - h;
    (clamp_into(x, w, work.x, work.w), clamp_into(y, h, work.y, work.h))
}

/// Attach the permission guide below System Settings. If the display has no
/// room below, inset it at the window's bottom so the guide remains reachable.
/// Constrain width to the target window and keep the entire guide on-screen.
pub fn permission_frame(anchor: LogicalRect, work: LogicalRect) -> LogicalRect {
    let w = 580.0_f64.min(anchor.w).min(work.w);
    let h = 230.0_f64.min(work.h);
    let below = anchor.y + anchor.h + GAP;
    let y = if below + h <= work.y + work.h { below } else { anchor.y + anchor.h - h - GAP };
    LogicalRect {
        x: clamp_into(anchor.x + (anchor.w - w) / 2.0, w, work.x, work.w),
        y: clamp_into(y, h, work.y, work.h),
        w,
        h,
    }
}

/// Distance from the top of the work area for settings/startup windows.
const TOP_MARGIN: f64 = 88.0;

/// Top-left for an app window: horizontally centered near the top of `work`.
pub fn place_top_center(size: (f64, f64), work: LogicalRect) -> (f64, f64) {
    let x = work.x + (work.w - size.0) / 2.0;
    (clamp_into(x, size.0, work.x, work.w), clamp_into(work.y + TOP_MARGIN, size.1, work.y, work.h))
}

/// The screen under the mouse cursor.
pub fn cursor_screen(window: &WebviewWindow) -> Option<Screen> {
    let (x, y) = crate::platform::cursor_position_logical();
    screen_for(LogicalRect { x, y, w: 0.0, h: 0.0 }, &screens(window))
}

/// A window's outer frame in global logical points. Dividing by the window's
/// own scale factor matches how tao reports the monitor it is on.
pub fn window_frame(window: &WebviewWindow) -> Option<LogicalRect> {
    let scale = window.scale_factor().ok()?;
    let pos = window.outer_position().ok()?;
    let size = window.outer_size().ok()?;
    Some(LogicalRect {
        x: pos.x as f64 / scale,
        y: pos.y as f64 / scale,
        w: size.width as f64 / scale,
        h: size.height as f64 / scale,
    })
}

/// Top-left that centers a `size` window in `work`.
pub fn center_in(size: (f64, f64), work: LogicalRect) -> (f64, f64) {
    (work.x + (work.w - size.0) / 2.0, work.y + (work.h - size.1) / 2.0)
}

/// Clamp a span starting at `start` with length `len` into `[lo, lo + room]`.
/// A span longer than the room is pinned to `lo` so its top/left stays visible.
fn clamp_into(start: f64, len: f64, lo: f64, room: f64) -> f64 {
    start.min(lo + room - len).max(lo)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rect(x: f64, y: f64, w: f64, h: f64) -> LogicalRect {
        LogicalRect { x, y, w, h }
    }

    /// Retina laptop as main display, a 1x monitor to its left whose top is
    /// higher — negative x and y, the case physical coordinates get wrong.
    fn two_screens() -> Vec<Screen> {
        vec![
            Screen { bounds: rect(0.0, 0.0, 1512.0, 982.0), work_area: rect(0.0, 33.0, 1512.0, 880.0) },
            Screen { bounds: rect(-1920.0, -300.0, 1920.0, 1080.0), work_area: rect(-1920.0, -300.0, 1920.0, 1080.0) },
        ]
    }

    #[test]
    fn picks_the_screen_holding_the_capture_center() {
        let screens = two_screens();
        let on_left = screen_for(rect(-800.0, 100.0, 200.0, 100.0), &screens).unwrap();
        assert_eq!(on_left.bounds.x, -1920.0);
        let on_main = screen_for(rect(100.0, 100.0, 200.0, 100.0), &screens).unwrap();
        assert_eq!(on_main.bounds.x, 0.0);
    }

    #[test]
    fn a_capture_straddling_screens_follows_its_center() {
        let screens = two_screens();
        // Mostly on the left screen, a sliver on the main one.
        let s = screen_for(rect(-300.0, 100.0, 340.0, 100.0), &screens).unwrap();
        assert_eq!(s.bounds.x, -1920.0);
    }

    #[test]
    fn an_off_screen_anchor_falls_back_to_the_nearest_screen() {
        let s = screen_for(rect(1600.0, 500.0, 0.0, 0.0), &two_screens()).unwrap();
        assert_eq!(s.bounds.x, 0.0);
        assert!(screen_for(rect(0.0, 0.0, 1.0, 1.0), &[]).is_none());
    }

    #[test]
    fn sits_right_of_the_capture_bottom_aligned() {
        let work = rect(0.0, 33.0, 1512.0, 880.0);
        let pos = place_beside(rect(100.0, 200.0, 300.0, 200.0), (140.0, 140.0), work);
        assert_eq!(pos, (412.0, 260.0));
    }

    #[test]
    fn flips_left_when_the_right_has_no_room() {
        let work = rect(0.0, 33.0, 1512.0, 880.0);
        let pos = place_beside(rect(1300.0, 200.0, 200.0, 200.0), (140.0, 140.0), work);
        assert_eq!(pos, (1148.0, 260.0));
    }

    #[test]
    fn full_screen_capture_lands_in_the_work_area_corner_of_that_screen() {
        let left = two_screens()[1];
        let pos = place_beside(left.bounds, (140.0, 140.0), left.work_area);
        assert_eq!(pos, (-1920.0 + 1920.0 - GAP - 140.0, -300.0 + 1080.0 - 140.0));
    }

    #[test]
    fn stays_below_the_menu_bar_and_inside_the_screen() {
        let work = rect(0.0, 33.0, 1512.0, 880.0);
        // A thin capture at the very top: bottom-aligning would go above the menu bar.
        let pos = place_beside(rect(100.0, 0.0, 300.0, 40.0), (140.0, 140.0), work);
        assert_eq!(pos.1, 33.0);
        // Too tall for the work area: pinned to its top.
        assert_eq!(place_beside(rect(0.0, 0.0, 10.0, 10.0), (100.0, 2000.0), work).1, 33.0);
    }

    /// Measured on a MacBook (main) with a 4K monitor arranged above it.
    #[test]
    fn capture_on_a_display_above_main_stays_on_that_display() {
        let screens = vec![
            Screen { bounds: rect(0.0, 0.0, 1512.0, 982.0), work_area: rect(0.0, 33.0, 1512.0, 949.0) },
            Screen { bounds: rect(-246.0, -1080.0, 1920.0, 1080.0), work_area: rect(-246.0, -1080.0, 1920.0, 1080.0) },
        ];
        // Selection near the bottom edge of the upper display.
        let anchor = rect(200.0, -300.0, 400.0, 280.0);
        let screen = screen_for(anchor, &screens).unwrap();
        assert_eq!(screen.bounds.y, -1080.0);
        let (x, y) = place_beside(anchor, (140.0, 140.0), screen.work_area);
        assert_eq!((x, y), (612.0, -160.0));
        assert!(y + 140.0 <= 0.0, "must not spill onto the laptop below");
    }

    #[test]
    fn app_windows_open_near_the_top_of_the_cursor_screen() {
        // The external display above the laptop: negative origin on both axes.
        let work = rect(-246.0, -1080.0, 1920.0, 1080.0);
        assert_eq!(place_top_center((800.0, 600.0), work), (-246.0 + 560.0, -1080.0 + TOP_MARGIN));
        // Taller than the room below the margin: pulled up to stay on screen.
        assert_eq!(place_top_center((800.0, 1050.0), work).1, -1080.0 + 30.0);
    }

    #[test]
    fn centers_within_a_negative_origin_work_area() {
        assert_eq!(center_in((960.0, 540.0), rect(-1920.0, -300.0, 1920.0, 1080.0)), (-1440.0, -30.0));
    }

    #[test]
    fn centers_home_on_the_screen_whose_menu_bar_contains_the_cursor() {
        let screens = two_screens();
        for (cursor, expected) in [
            (rect(700.0, 10.0, 0.0, 0.0), (356.0, 173.0)),
            (rect(-900.0, -290.0, 0.0, 0.0), (-1360.0, -60.0)),
        ] {
            let screen = screen_for(cursor, &screens).unwrap();
            // Select using full screen bounds (including its menu bar), then
            // center within the work area so the menu bar/Dock are excluded.
            assert_eq!(center_in((800.0, 600.0), screen.work_area), expected);
        }
    }
}

#[cfg(test)]
mod permission_tests {
    use super::*;
    fn rect(x: f64, y: f64, w: f64, h: f64) -> LogicalRect { LogicalRect { x, y, w, h } }
    #[test]
    fn follows_settings_move_and_resize() {
        let work = rect(0.0, 25.0, 1920.0, 1055.0);
        assert_eq!(permission_frame(rect(100.0, 50.0, 700.0, 600.0), work), rect(160.0, 662.0, 580.0, 230.0));
        assert_eq!(permission_frame(rect(500.0, 100.0, 500.0, 400.0), work), rect(500.0, 512.0, 500.0, 230.0));
    }
    #[test]
    fn stays_at_bottom_inside_a_full_height_settings_window() {
        let work = rect(0.0, 25.0, 1440.0, 850.0);
        assert_eq!(permission_frame(rect(200.0, 25.0, 700.0, 850.0), work), rect(260.0, 633.0, 580.0, 230.0));
    }
    #[test]
    fn follows_settings_to_a_negative_origin_display() {
        let work = rect(-1920.0, -300.0, 1920.0, 1080.0);
        assert_eq!(permission_frame(rect(-1500.0, -250.0, 700.0, 500.0), work), rect(-1440.0, 262.0, 580.0, 230.0));
    }
    #[test]
    fn keeps_partially_offscreen_settings_guide_visible() {
        let work = rect(0.0, 25.0, 1000.0, 700.0);
        let frame = permission_frame(rect(900.0, 600.0, 600.0, 600.0), work);
        assert_eq!(frame, rect(420.0, 495.0, 580.0, 230.0));
    }
}

pub const PERMISSION_ENTRANCE_DURATION: std::time::Duration = std::time::Duration::from_millis(420);

/// cubic-bezier(0.15, 0.5, 0.85, 0.5): fast, slow, fast, without overshoot.
/// Invert its x coordinate so progress is elapsed time, not the curve parameter.
fn permission_entrance_progress(progress: f64) -> f64 {
    let progress = progress.clamp(0.0, 1.0);
    if progress == 0.0 || progress == 1.0 { return progress; }
    let bezier = |t: f64, a: f64, b: f64| {
        3.0 * (1.0-t).powi(2) * t * a + 3.0 * (1.0-t) * t.powi(2) * b + t.powi(3)
    };
    let (mut lo, mut hi) = (0.0, 1.0);
    for _ in 0..24 {
        let t = (lo + hi) / 2.0;
        if bezier(t, 0.15, 0.85) < progress { lo = t; } else { hi = t; }
    }
    bezier((lo + hi) / 2.0, 0.5, 0.5)
}

/// Interpolate the actual desktop distance in a fixed duration. No scaling.
pub fn permission_entrance_frame(destination: LogicalRect, origin: Option<(f64, f64)>, progress: f64) -> LogicalRect {
    let Some((x,y)) = origin else { return destination; };
    let t = permission_entrance_progress(progress);
    let start_x = x - destination.w / 2.0;
    let start_y = y - destination.h / 2.0;
    LogicalRect { x: start_x + (destination.x - start_x)*t, y: start_y + (destination.y - start_y)*t, ..destination }
}

#[cfg(test)]
mod permission_motion_tests {
    use super::*;
    #[test]
    fn motion_is_fast_slow_fast_and_never_reverses() {
        let curve = permission_entrance_progress;
        let early = curve(0.1) - curve(0.0);
        let middle = curve(0.55) - curve(0.45);
        let late = curve(1.0) - curve(0.9);
        assert!(early > middle * 2.0 && late > middle * 2.0);
        for step in 1..=100 {
            assert!(curve(step as f64 / 100.0) > curve((step-1) as f64 / 100.0));
        }
    }
    #[test]
    fn different_distances_share_the_same_duration() {
        let destination = LogicalRect { x: 500.0, y: 600.0, w: 580.0, h: 230.0 };
        for origin in [(400.0, 300.0), (-1800.0, -400.0)] {
            let start = permission_entrance_frame(destination, Some(origin), 0.0);
            let middle = permission_entrance_frame(destination, Some(origin), 0.5);
            let ratio = (middle.x-start.x) / (destination.x-start.x);
            assert!((ratio-0.5).abs() < 0.000001);
            assert_eq!(permission_entrance_frame(destination, Some(origin), 1.0), destination);
        }
        assert_eq!(PERMISSION_ENTRANCE_DURATION.as_millis(), 420);
    }
    #[test]
    fn entrance_only_translates_and_finishes_exactly_at_anchor() {
        let destination = LogicalRect { x: -900.0, y: 500.0, w: 580.0, h: 230.0 };
        let origin = Some((-1200.0, 80.0));
        let start = permission_entrance_frame(destination, origin, 0.0);
        assert_eq!((start.x + start.w/2.0, start.y + start.h/2.0), (-1200.0, 80.0));
        for t in [0.0, 0.25, 0.5, 1.0] {
            let frame = permission_entrance_frame(destination, origin, t);
            assert_eq!((frame.w, frame.h), (destination.w, destination.h));
        }
        assert_eq!(permission_entrance_frame(destination, origin, 1.0), destination);
        assert_eq!(permission_entrance_frame(destination, None, 0.0), destination);
    }
}
