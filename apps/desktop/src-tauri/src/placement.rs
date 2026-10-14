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
