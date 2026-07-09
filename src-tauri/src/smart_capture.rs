use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub struct LogicalRect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl LogicalRect {
    pub fn contains(&self, x: f64, y: f64) -> bool {
        x >= self.x && x < self.x + self.w && y >= self.y && y < self.y + self.h
    }

    pub fn approx_eq(&self, other: &LogicalRect, eps: f64) -> bool {
        (self.x - other.x).abs() <= eps
            && (self.y - other.y).abs() <= eps
            && (self.w - other.w).abs() <= eps
            && (self.h - other.h).abs() <= eps
    }

    pub fn intersects(&self, other: &LogicalRect) -> bool {
        self.x < other.x + other.w
            && other.x < self.x + self.w
            && self.y < other.y + other.h
            && other.y < self.y + self.h
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct WindowInfo {
    pub rect: LogicalRect,
    pub title: String,
    pub app_name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChainNode {
    pub rect: LogicalRect,
    pub role: String,
    pub label: String,
}

/// Selections narrower than this (logical points) are treated as misclicks.
pub const MIN_SELECTION_PT: f64 = 2.0;

/// Map a selection in global logical points onto the frozen snapshot's pixel
/// grid. This is the single logical→pixel conversion in the feature.
pub fn selection_to_snapshot_pixels(
    sel: LogicalRect,
    monitor_origin: (f64, f64),
    scale: f64,
    snap_w: u32,
    snap_h: u32,
) -> Option<(u32, u32, u32, u32)> {
    if sel.w < MIN_SELECTION_PT || sel.h < MIN_SELECTION_PT {
        return None;
    }
    let x0 = ((sel.x - monitor_origin.0) * scale).round().max(0.0);
    let y0 = ((sel.y - monitor_origin.1) * scale).round().max(0.0);
    let x1 = (((sel.x + sel.w) - monitor_origin.0) * scale).round().min(snap_w as f64);
    let y1 = (((sel.y + sel.h) - monitor_origin.1) * scale).round().min(snap_h as f64);
    if x1 <= x0 || y1 <= y0 {
        return None;
    }
    Some((x0 as u32, y0 as u32, (x1 - x0) as u32, (y1 - y0) as u32))
}

/// `windows` must be sorted topmost-first; the first hit wins.
pub fn topmost_window_at(windows: &[WindowInfo], x: f64, y: f64) -> Option<usize> {
    windows.iter().position(|w| w.rect.contains(x, y))
}

/// Drop degenerate nodes and consecutive near-duplicate rects so wheel steps
/// always change the highlight visibly.
pub fn dedupe_chain(nodes: Vec<ChainNode>) -> Vec<ChainNode> {
    let mut out: Vec<ChainNode> = Vec::with_capacity(nodes.len());
    for node in nodes {
        if node.rect.w < 1.0 || node.rect.h < 1.0 {
            continue;
        }
        if let Some(last) = out.last() {
            if last.rect.approx_eq(&node.rect, 0.5) {
                continue;
            }
        }
        out.push(node);
    }
    out
}

/// One in-flight smart-capture session: the frozen snapshot plus everything
/// hit-testing and finalize need. Present between start and finalize/cancel.
pub struct SmartSession {
    pub mode: String,
    pub monitor_rect: LogicalRect,
    pub scale_factor: f64,
    pub snapshot: image::RgbaImage,
    pub windows: Vec<WindowInfo>,
    pub ax_available: bool,
}

#[derive(Default)]
pub struct SmartCaptureState(pub std::sync::Mutex<Option<SmartSession>>);

#[cfg(test)]
mod tests {
    use super::*;

    fn rect(x: f64, y: f64, w: f64, h: f64) -> LogicalRect {
        LogicalRect { x, y, w, h }
    }

    // --- selection_to_snapshot_pixels ---

    #[test]
    fn maps_identity_at_1x() {
        let px = selection_to_snapshot_pixels(rect(10.0, 20.0, 100.0, 50.0), (0.0, 0.0), 1.0, 1920, 1080);
        assert_eq!(px, Some((10, 20, 100, 50)));
    }

    #[test]
    fn maps_retina_at_2x() {
        let px = selection_to_snapshot_pixels(rect(10.0, 20.0, 100.0, 50.0), (0.0, 0.0), 2.0, 3840, 2160);
        assert_eq!(px, Some((20, 40, 200, 100)));
    }

    #[test]
    fn subtracts_negative_monitor_origin() {
        // Secondary display placed left of the primary: origin is negative.
        let px = selection_to_snapshot_pixels(rect(-1910.0, 20.0, 100.0, 50.0), (-1920.0, 0.0), 2.0, 3840, 2160);
        assert_eq!(px, Some((20, 40, 200, 100)));
    }

    #[test]
    fn clamps_selection_hanging_off_the_edges() {
        let px = selection_to_snapshot_pixels(rect(-10.0, -10.0, 40.0, 40.0), (0.0, 0.0), 1.0, 100, 100);
        assert_eq!(px, Some((0, 0, 30, 30)));
        let px = selection_to_snapshot_pixels(rect(90.0, 90.0, 40.0, 40.0), (0.0, 0.0), 1.0, 100, 100);
        assert_eq!(px, Some((90, 90, 10, 10)));
    }

    #[test]
    fn rejects_sub_2pt_selection() {
        assert_eq!(selection_to_snapshot_pixels(rect(5.0, 5.0, 1.9, 50.0), (0.0, 0.0), 1.0, 100, 100), None);
        assert_eq!(selection_to_snapshot_pixels(rect(5.0, 5.0, 50.0, 1.9), (0.0, 0.0), 1.0, 100, 100), None);
    }

    #[test]
    fn rejects_selection_entirely_outside_snapshot() {
        assert_eq!(selection_to_snapshot_pixels(rect(500.0, 500.0, 50.0, 50.0), (0.0, 0.0), 1.0, 100, 100), None);
    }

    // --- topmost_window_at ---

    #[test]
    fn picks_first_hit_in_z_order() {
        let wins = vec![
            WindowInfo { rect: rect(0.0, 0.0, 100.0, 100.0), title: "top".into(), app_name: "A".into() },
            WindowInfo { rect: rect(0.0, 0.0, 500.0, 500.0), title: "bottom".into(), app_name: "B".into() },
        ];
        assert_eq!(topmost_window_at(&wins, 50.0, 50.0), Some(0));
        assert_eq!(topmost_window_at(&wins, 300.0, 300.0), Some(1));
        assert_eq!(topmost_window_at(&wins, 900.0, 900.0), None);
    }

    // --- dedupe_chain ---

    #[test]
    fn drops_consecutive_duplicate_and_degenerate_rects() {
        let node = |x: f64, w: f64| ChainNode { rect: rect(x, 0.0, w, 50.0), role: "AXGroup".into(), label: String::new() };
        let chain = dedupe_chain(vec![
            node(0.0, 0.5),   // degenerate (< 1pt wide): dropped
            node(10.0, 50.0),
            node(10.0, 50.0), // consecutive duplicate: dropped
            node(10.0, 50.3), // within 0.5pt epsilon of previous: dropped
            node(0.0, 200.0),
        ]);
        assert_eq!(chain.len(), 2);
        assert_eq!(chain[0].rect.x, 10.0);
        assert_eq!(chain[1].rect.w, 200.0);
    }
}
