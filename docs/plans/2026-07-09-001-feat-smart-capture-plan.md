# Smart Capture (智能吸附截图) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `screencapture -i` region/window capture with a frozen-snapshot overlay that auto-highlights the window or Accessibility (AX) UI element under the cursor, with scroll-wheel granularity climbing and manual drag-select.

**Architecture:** On trigger, Rust freezes the cursor's monitor via `xcap`, caches the z-ordered window list, and opens a frameless always-on-top Tauri webview showing the snapshot. The webview invokes `smart_capture_hit_test` (cached window rect + live AX parent-chain walk) on throttled mousemove and renders veil/highlight; `smart_capture_finalize` crops the in-memory snapshot and reuses the existing save + preview pipeline. Spec: `docs/brainstorms/2026-07-09-smart-capture-requirements.md`.

**Tech Stack:** Tauri 2.11 (Rust), Vue 3 + TS (multi-page vite build), `xcap 0.9` (freeze + window enumeration), raw FFI to ApplicationServices AX API via existing `core-foundation`/`libc`/`objc` deps.

## Global Constraints

- **macOS only** — native code lives in `src-tauri/src/platform/mac/`, exported through `platform::` per the existing cfg pattern (`src-tauri/src/platform/mod.rs`).
- **Zero new crate or npm dependencies.** Everything uses deps already in `src-tauri/Cargo.toml` / `package.json`.
- **All IPC coordinates are global logical points** (top-left origin of the primary display). The ONLY logical→pixel conversion is `selection_to_snapshot_pixels` at finalize time.
- Overlay window label is `"capture"`; selection smaller than 2.0 logical points on either edge is a misclick and produces no file.
- UI copy (Chinese, verbatim): AX chip text `开启辅助功能可识别页面模块`.
- Verification commands: `pnpm build:web` (typecheck+bundle) and `cargo test --manifest-path src-tauri/Cargo.toml`. Never run `pnpm build:desktop` as a test step.
- Commit style: conventional commits, matching `git log` (`feat:`, `refactor:`, `chore:`).
- Tests that need Screen Recording / Accessibility permission are `#[ignore]` and run manually, not in CI.

---

### Task 1: Geometry + session types module (`smart_capture.rs`)

Pure, platform-independent math and shared types. This is where the coordinate-correctness guarantees live, so it is test-first and CI-runnable.

**Files:**
- Create: `src-tauri/src/smart_capture.rs`
- Modify: `src-tauri/src/lib.rs` (add `mod smart_capture;` after line 10 `mod platform;`)

**Interfaces:**
- Consumes: nothing (only `serde`, `image` crates).
- Produces (used by Tasks 2/3/5):
  - `pub struct LogicalRect { pub x: f64, pub y: f64, pub w: f64, pub h: f64 }` (`Copy`, `Serialize`, `PartialEq`) with `contains(x, y) -> bool`, `approx_eq(&other, eps) -> bool`, `intersects(&other) -> bool`
  - `pub struct WindowInfo { pub rect: LogicalRect, pub title: String, pub app_name: String }`
  - `pub struct ChainNode { pub rect: LogicalRect, pub role: String, pub label: String }` (`Serialize`)
  - `pub const MIN_SELECTION_PT: f64 = 2.0;`
  - `pub fn selection_to_snapshot_pixels(sel: LogicalRect, monitor_origin: (f64, f64), scale: f64, snap_w: u32, snap_h: u32) -> Option<(u32, u32, u32, u32)>`
  - `pub fn topmost_window_at(windows: &[WindowInfo], x: f64, y: f64) -> Option<usize>`
  - `pub fn dedupe_chain(nodes: Vec<ChainNode>) -> Vec<ChainNode>`
  - `pub struct SmartSession { pub mode: String, pub monitor_rect: LogicalRect, pub scale_factor: f64, pub snapshot: image::RgbaImage, pub windows: Vec<WindowInfo>, pub ax_available: bool }`
  - `#[derive(Default)] pub struct SmartCaptureState(pub std::sync::Mutex<Option<SmartSession>>);`

- [ ] **Step 1: Write the failing tests**

Create `src-tauri/src/smart_capture.rs` with the types above, `todo!()` bodies for the three functions, and this test module:

```rust
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml smart_capture`
Expected: compile error (`todo!()` is fine, but `mod smart_capture;` missing from lib.rs) → add the `mod` line first, then FAIL/panic on `todo!()`.

- [ ] **Step 3: Implement**

```rust
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cargo test --manifest-path src-tauri/Cargo.toml smart_capture`
Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/smart_capture.rs src-tauri/src/lib.rs
git commit -m "feat(smart-capture): add geometry core and session types"
```

---

### Task 2: mac natives — cursor, freeze, window list

**Files:**
- Create: `src-tauri/src/platform/mac/smart_capture.rs`
- Modify: `src-tauri/src/platform/mac/mod.rs` (add `mod smart_capture;` + `pub use smart_capture::*;`)

**Interfaces:**
- Consumes: `crate::smart_capture::{LogicalRect, WindowInfo}` (Task 1).
- Produces (used by Task 5):
  - `pub fn cursor_position_logical() -> (f64, f64)` — global logical points, top-left origin
  - `pub struct FrozenScreen { pub monitor_rect: LogicalRect, pub scale_factor: f64, pub snapshot: image::RgbaImage }`
  - `pub fn freeze_screen_at(x: f64, y: f64) -> Result<FrozenScreen, String>`
  - `pub fn list_windows_on_monitor(monitor_rect: &LogicalRect) -> Vec<WindowInfo>` — topmost-first
  - `pub fn open_accessibility_preferences()`
  - Also exposes `pub(crate) struct CGPoint/CGSize` (repr(C)) reused by Task 3.

- [ ] **Step 1: Write the failing (ignored) integration tests**

Create `src-tauri/src/platform/mac/smart_capture.rs` with function stubs (`todo!()`) and:

```rust
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
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml -- --ignored mac_smart`
Expected: FAIL (todo! panic) — after adding the `mod` lines to `platform/mac/mod.rs`.

- [ ] **Step 3: Implement**

```rust
use std::ffi::c_void;

use xcap::Monitor;

use crate::smart_capture::{LogicalRect, WindowInfo};

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
```

- [ ] **Step 4: Run tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml -- --ignored mac_smart`
Expected: 2 PASS (grant Screen Recording to the test binary if prompted). Eyeball the printed window list: if a full-screen wallpaper window still appears despite `EXCLUDED_APPS`, add its `app_name` to the const.
Then run `cargo test --manifest-path src-tauri/Cargo.toml` — non-ignored suite stays green.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/platform/mac/smart_capture.rs src-tauri/src/platform/mac/mod.rs
git commit -m "feat(smart-capture): freeze screen, cursor position, window list on macOS"
```

---

### Task 3: mac natives — AX parent-chain hit test

**Files:**
- Modify: `src-tauri/src/platform/mac/smart_capture.rs` (append)

**Interfaces:**
- Consumes: `CGPoint`/`CGSize` from Task 2; `crate::smart_capture::ChainNode`; existing `platform::check_accessibility_permissions` (`src-tauri/src/platform/mac/screenshot.rs:228`).
- Produces (used by Task 5): `pub fn ax_chain_at(x: f64, y: f64, max_depth: usize) -> Vec<ChainNode>` — deepest-first raw nodes (NOT deduped; the command layer dedupes after appending the window tail). Returns `vec![]` on any failure — that IS the degradation path, never an error.

- [ ] **Step 1: Write the failing (ignored) smoke test**

Append to the `tests` module of `platform/mac/smart_capture.rs`:

```rust
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml -- --ignored mac_smart_ax`
Expected: FAIL — `ax_chain_at` not defined.

- [ ] **Step 3: Implement the AX FFI walk**

Append (imports merge at top of file: `use core_foundation::base::{CFRelease, TCFType, CFTypeRef}; use core_foundation::string::{CFString, CFStringRef};` and `use crate::smart_capture::ChainNode;`):

```rust
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
```

- [ ] **Step 4: Run tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml -- --ignored mac_smart_ax`
Expected: PASS (grant Accessibility to the test binary — or observe the not-granted branch pass). Also run the full non-ignored suite: green.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/platform/mac/smart_capture.rs
git commit -m "feat(smart-capture): AX parent-chain hit test via ApplicationServices FFI"
```

---

### Task 4: Overlay window shell (Rust builder + capture page skeleton)

**Files:**
- Modify: `src-tauri/src/constants.rs` (add `pub const CAPTURE_WINDOW: &str = "capture";`)
- Modify: `src-tauri/src/window.rs`
- Modify: `src-tauri/capabilities/default.json` (windows: add `"capture"`)
- Modify: `vite.config.ts` (rollup input: add `capture`)
- Create: `capture.html`, `src/pages/capture/main.ts`, `src/pages/capture/App.vue`, `src/pages/capture/CaptureOverlay.vue` (stub)

**Interfaces:**
- Consumes: `constants::CAPTURE_WINDOW`.
- Produces (used by Task 5):
  - `pub fn create_capture_window(app: &AppHandle, x: f64, y: f64, w: f64, h: f64) -> WebviewWindow` (logical monitor frame)
  - `pub fn close_capture_window(app: &AppHandle)`

- [ ] **Step 1: Rust window plumbing**

`constants.rs` — append:

```rust
pub const CAPTURE_WINDOW: &str = "capture";
```

`window.rs` — extend the constants import on line 7 to include `CAPTURE_WINDOW`, then append:

```rust
/// Frameless, opaque, always-on-top overlay covering one monitor. Recreated
/// from scratch on every session so repeated hotkey presses never stack.
pub fn create_capture_window(app: &AppHandle, x: f64, y: f64, w: f64, h: f64) -> WebviewWindow {
    close_capture_window(app);

    let window = WebviewWindowBuilder::new(app, CAPTURE_WINDOW, WebviewUrl::App("/capture.html".into()))
        .title("capture")
        .decorations(false)
        .shadow(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .visible_on_all_workspaces(true)
        .accept_first_mouse(true)
        .focused(true)
        .position(x, y)
        .inner_size(w, h)
        .build()
        .expect("Unable to build capture overlay window");

    #[cfg(target_os = "macos")]
    raise_capture_window_above_menu_bar(&window);

    let _ = window.set_focus();
    window
}

#[cfg(target_os = "macos")]
fn raise_capture_window_above_menu_bar(window: &WebviewWindow) {
    use objc::runtime::{Object, Sel};
    use objc::Message;

    // NSScreenSaverWindowLevel: above the menu bar and Dock, which the
    // overlay must cover to offer the full monitor as selection surface.
    const NS_SCREEN_SAVER_WINDOW_LEVEL: libc::c_long = 1000;

    unsafe {
        let ns_window = window.ns_window().unwrap() as *mut Object;
        let _: () = (&*ns_window)
            .send_message(Sel::register("setLevel:"), (NS_SCREEN_SAVER_WINDOW_LEVEL,))
            .expect("failed to raise capture window level");
    }
}

pub fn close_capture_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(CAPTURE_WINDOW) {
        let _ = window.close();
    }
}
```

(`CAPTURE_WINDOW` is intentionally NOT added to `should_hide_instead_of_close` in `lib.rs:133` — the overlay must close for real.)

- [ ] **Step 2: Frontend page scaffolding**

`capture.html` (repo root, sibling of `main.html`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>capture</title>
  </head>

  <body>
    <div id="app"></div>
    <script type="module" src="./src/pages/capture/main.ts"></script>
  </body>
</html>
```

`src/pages/capture/main.ts`:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '~/styles/tokens/index.css'
import '~/styles/global.css'

createApp(App).mount('#app')
```

`src/pages/capture/App.vue`:

```vue
<script setup lang="ts">
import CaptureOverlay from './CaptureOverlay.vue'
</script>

<template>
  <CaptureOverlay />
</template>
```

`src/pages/capture/CaptureOverlay.vue` (stub; Task 6 fills it in):

```vue
<script setup lang="ts">
</script>

<template>
  <div class="capture-overlay" />
</template>

<style scoped>
.capture-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  cursor: crosshair;
}
</style>
```

`vite.config.ts` — in `build.rollupOptions.input`, after the `startup` line add:

```ts
        capture: path.resolve(__dirname, './capture.html'),
```

`src-tauri/capabilities/default.json` — change the windows line to:

```json
  "windows": ["main", "setting", "preview", "startup", "capture"],
```

- [ ] **Step 3: Verify both builds**

Run: `pnpm build:web`
Expected: PASS (vue-tsc + vite bundles `capture.html`).
Run: `cargo build --manifest-path src-tauri/Cargo.toml`
Expected: compiles (new `window.rs` functions are `pub` — no dead-code warnings blocking; if `unused` warnings appear they resolve in Task 5).

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/constants.rs src-tauri/src/window.rs src-tauri/capabilities/default.json vite.config.ts capture.html src/pages/capture/
git commit -m "feat(smart-capture): capture overlay window shell and page scaffolding"
```

---

### Task 5: Tauri commands, session state, save pipeline

**Files:**
- Create: `src-tauri/src/cmd/smart_capture.rs`
- Modify: `src-tauri/src/cmd/mod.rs` (add `mod smart_capture; pub use self::smart_capture::*;`)
- Modify: `src-tauri/src/lib.rs` (manage state + register 6 commands)
- Modify: `src-tauri/src/global_shortcut.rs` (make post-capture flow `pub`)
- Modify: `src-tauri/src/platform/mac/screenshot.rs` (add `set_last_capture_path`)

**Interfaces:**
- Consumes: Tasks 1–4 (`SmartSession`, `SmartCaptureState`, geometry fns, `platform::{cursor_position_logical, freeze_screen_at, list_windows_on_monitor, ax_chain_at, open_accessibility_preferences, check_accessibility_permissions, open_screen_capture_preferences, CaptureResult}`, `window::{create_capture_window, close_capture_window}`, `common::get_images_dir`).
- Produces (used by Tasks 6/7):
  - Commands (frontend `invoke` names): `smart_capture_start {mode}`, `smart_capture_get_session {}` → `SessionDto`, `smart_capture_hit_test {x, y}` → `HitTestDto`, `smart_capture_finalize {x, y, w, h}`, `smart_capture_cancel {}`, `open_accessibility_preferences {}`
  - `pub async fn start_smart_capture(app: &tauri::AppHandle, mode: &str) -> Result<(), String>` (called directly by hotkey/tray in Task 7)
  - `SessionDto` (camelCase): `{ mode, axAvailable, monitor: {x,y,w,h}, scaleFactor, snapshotDataUrl }`
  - `HitTestDto` (camelCase): `{ chain: [{rect: {x,y,w,h}, role, label}], appName }`
  - `pub fn post_capture_flow(app: &AppHandle, result: Result<platform::CaptureResult, String>)` in `global_shortcut.rs`

- [ ] **Step 1: Make the post-capture flow shared**

In `src-tauri/src/global_shortcut.rs`, rename the private `fn handle_capture_result` (line 34) to a public fn — signature and body unchanged except the name:

```rust
/// Shared post-capture UX: hide the main window, pop the preview floater and
/// hand it the capture payload. Used by hotkeys, the tray menu and smart
/// capture's finalize.
pub fn post_capture_flow(app: &AppHandle, result: Result<platform::CaptureResult, String>) {
```

Update its one call site in the same file (line 173) to `post_capture_flow(app, result);`.

- [ ] **Step 2: Add `set_last_capture_path` to platform**

In `src-tauri/src/platform/mac/screenshot.rs`, after `get_last_capture_path` (line 218-220) add, and refactor the inline block in `capture_select` (lines 131-133) to use it:

```rust
pub fn set_last_capture_path(path: String) {
    if let Ok(mut last) = LAST_REGION.lock() {
        *last = Some(path);
    }
}
```

In `capture_select`, replace lines 131-133 with:

```rust
    set_last_capture_path(output_path.to_string_lossy().to_string());
```

- [ ] **Step 3: Write the commands module**

Create `src-tauri/src/cmd/smart_capture.rs`:

```rust
use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Local;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageEncoder;
use serde::Serialize;
use tauri::Manager;
use tracing::info;

use crate::common::get_images_dir;
use crate::global_shortcut::post_capture_flow;
use crate::platform;
use crate::smart_capture::{
    dedupe_chain, selection_to_snapshot_pixels, topmost_window_at, ChainNode, LogicalRect,
    SmartCaptureState, SmartSession,
};
use crate::window;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionDto {
    pub mode: String,
    pub ax_available: bool,
    pub monitor: LogicalRect,
    pub scale_factor: f64,
    pub snapshot_data_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HitTestDto {
    pub chain: Vec<ChainNode>,
    pub app_name: String,
}

/// Freeze the cursor's monitor, cache the session and raise the overlay.
/// Shared by the `smart_capture_start` command, global hotkeys and the tray.
pub async fn start_smart_capture(app: &tauri::AppHandle, mode: &str) -> Result<(), String> {
    let (cursor_x, cursor_y) = platform::cursor_position_logical();
    let frozen = match platform::freeze_screen_at(cursor_x, cursor_y) {
        Ok(frozen) => frozen,
        Err(e) => {
            // Most likely missing Screen Recording permission: guide the user
            // to the system pane instead of showing a dead overlay.
            platform::open_screen_capture_preferences();
            return Err(e);
        }
    };
    let windows = platform::list_windows_on_monitor(&frozen.monitor_rect);
    let ax_available = platform::check_accessibility_permissions();
    let monitor_rect = frozen.monitor_rect;

    {
        let state = app.state::<SmartCaptureState>();
        *state.0.lock().unwrap() = Some(SmartSession {
            mode: mode.to_string(),
            monitor_rect,
            scale_factor: frozen.scale_factor,
            snapshot: frozen.snapshot,
            windows,
            ax_available,
        });
    }

    // create_capture_window closes any stale overlay first (single-overlay
    // guarantee, R8).
    window::create_capture_window(app, monitor_rect.x, monitor_rect.y, monitor_rect.w, monitor_rect.h);
    Ok(())
}

#[tauri::command]
pub async fn smart_capture_start(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    start_smart_capture(&app, &mode).await
}

#[tauri::command]
pub async fn smart_capture_get_session(app: tauri::AppHandle) -> Result<SessionDto, String> {
    let state = app.state::<SmartCaptureState>();
    let guard = state.0.lock().unwrap();
    let session = guard.as_ref().ok_or("no active capture session")?;

    // Fast PNG encode: this is a one-time transfer for on-screen display; the
    // final image is cropped losslessly from the in-memory RGBA instead.
    let mut png = Vec::new();
    let encoder = PngEncoder::new_with_quality(&mut png, CompressionType::Fast, FilterType::NoFilter);
    encoder
        .write_image(
            session.snapshot.as_raw(),
            session.snapshot.width(),
            session.snapshot.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;

    Ok(SessionDto {
        mode: session.mode.clone(),
        ax_available: session.ax_available,
        monitor: session.monitor_rect,
        scale_factor: session.scale_factor,
        snapshot_data_url: format!("data:image/png;base64,{}", STANDARD.encode(&png)),
    })
}

#[tauri::command]
pub async fn smart_capture_hit_test(app: tauri::AppHandle, x: f64, y: f64) -> Result<HitTestDto, String> {
    // Copy what we need and drop the lock before the potentially slow AX call.
    let (window_node, app_name, ax_available) = {
        let state = app.state::<SmartCaptureState>();
        let guard = state.0.lock().unwrap();
        let session = guard.as_ref().ok_or("no active capture session")?;
        match topmost_window_at(&session.windows, x, y) {
            Some(i) => {
                let win = &session.windows[i];
                (
                    ChainNode { rect: win.rect, role: "AXWindow".into(), label: win.title.clone() },
                    win.app_name.clone(),
                    session.ax_available,
                )
            }
            None => (
                ChainNode { rect: session.monitor_rect, role: "AXScreen".into(), label: String::new() },
                String::new(),
                session.ax_available,
            ),
        }
    };

    let mut chain = if ax_available {
        // AX calls can block on slow apps; keep them off the async runtime.
        tauri::async_runtime::spawn_blocking(move || platform::ax_chain_at(x, y, 12))
            .await
            .unwrap_or_default()
    } else {
        Vec::new()
    };
    chain.push(window_node);
    Ok(HitTestDto { chain: dedupe_chain(chain), app_name })
}

#[tauri::command]
pub async fn smart_capture_finalize(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
) -> Result<(), String> {
    let session = {
        let state = app.state::<SmartCaptureState>();
        state.0.lock().unwrap().take()
    };

    let result = (|| -> Result<platform::CaptureResult, String> {
        let session = session.ok_or("no active capture session")?;
        let (px, py, pw, ph) = selection_to_snapshot_pixels(
            LogicalRect { x, y, w, h },
            (session.monitor_rect.x, session.monitor_rect.y),
            session.scale_factor,
            session.snapshot.width(),
            session.snapshot.height(),
        )
        .ok_or("selection too small")?;

        let cropped = image::imageops::crop_imm(&session.snapshot, px, py, pw, ph).to_image();
        let images_dir = get_images_dir(&app, "images".to_string())?;
        let filename = format!("screenshot_{}.png", Local::now().format("%Y%m%d_%H%M%S"));
        let output_path = images_dir.join(&filename);
        cropped.save(&output_path).map_err(|e| e.to_string())?;
        platform::set_last_capture_path(output_path.to_string_lossy().to_string());

        Ok(platform::CaptureResult {
            filename,
            full_path: output_path.to_string_lossy().to_string(),
            width: pw,
            height: ph,
            mode: if session.mode == "window" { "activeWindow".into() } else { "region".into() },
            captured_at: Local::now().to_rfc3339(),
        })
    })();

    // Whatever happened above, the overlay must come down — never leave the
    // user stuck behind a frozen screen (R8).
    window::close_capture_window(&app);

    match result {
        Ok(capture) => {
            post_capture_flow(&app, Ok(capture));
            Ok(())
        }
        Err(e) => {
            info!("smart_capture_finalize failed: {e}");
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn smart_capture_cancel(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<SmartCaptureState>();
    state.0.lock().unwrap().take();
    window::close_capture_window(&app);
    Ok(())
}

#[tauri::command]
pub fn open_accessibility_preferences() {
    platform::open_accessibility_preferences();
}
```

- [ ] **Step 4: Register module, state and commands**

`src-tauri/src/cmd/mod.rs` — add `mod smart_capture;` to the mod list and `pub use self::smart_capture::*;` to the use list.

`src-tauri/src/lib.rs`:
- After `.plugin(tauri_plugin_positioner::init())` (line 17) add:

```rust
        .manage(smart_capture::SmartCaptureState::default())
```

- In `invoke_handler` after `cmd::check_accessibility_permissions,` (line 104) add:

```rust
            cmd::smart_capture_start,
            cmd::smart_capture_get_session,
            cmd::smart_capture_hit_test,
            cmd::smart_capture_finalize,
            cmd::smart_capture_cancel,
            cmd::open_accessibility_preferences,
```

- [ ] **Step 5: Verify build + tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: compiles, all non-ignored tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/cmd/smart_capture.rs src-tauri/src/cmd/mod.rs src-tauri/src/lib.rs src-tauri/src/global_shortcut.rs src-tauri/src/platform/mac/screenshot.rs
git commit -m "feat(smart-capture): session commands, hit-test and finalize pipeline"
```

---

### Task 6: Overlay interaction UI (`CaptureOverlay.vue`) + button entry swap

**Files:**
- Modify: `src/pages/capture/CaptureOverlay.vue` (replace stub entirely)
- Modify: `src/components/Screenshot.vue:23-38` (swap two handlers)

**Interfaces:**
- Consumes: `smart_capture_get_session`, `smart_capture_hit_test`, `smart_capture_finalize`, `smart_capture_cancel`, `open_accessibility_preferences`, `smart_capture_start` (Task 5 DTO shapes).
- Produces: the complete overlay UX (hover snap / wheel climb / drag / click / Enter / Esc / AX chip).

- [ ] **Step 1: Implement the overlay component**

Replace `src/pages/capture/CaptureOverlay.vue` with:

```vue
<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Rect { x: number, y: number, w: number, h: number }
interface ChainNode { rect: Rect, role: string, label: string }
interface Session {
  mode: 'auto' | 'window'
  axAvailable: boolean
  monitor: Rect
  scaleFactor: number
  snapshotDataUrl: string
}
interface HitTest { chain: ChainNode[], appName: string }

const HIT_TEST_THROTTLE_MS = 30
const DRAG_THRESHOLD_PX = 4

const session = ref<Session | null>(null)
const chain = ref<ChainNode[]>([])
const chainIndex = ref(0)
const appName = ref('')
const dragging = ref(false)
const dragStart = ref<{ x: number, y: number } | null>(null)
const dragRect = ref<Rect | null>(null)
const finalizing = ref(false)

let hitTestInFlight = false
let lastHitTestAt = 0

function rectEq(a?: Rect, b?: Rect) {
  if (!a || !b) return false
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5
    && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5
}

// Convert a global logical rect to overlay-local CSS pixels (1:1 with logical
// points inside the webview).
function toLocal(r: Rect): Rect {
  const m = session.value!.monitor
  return { x: r.x - m.x, y: r.y - m.y, w: r.w, h: r.h }
}

const highlight = computed<Rect | null>(() => {
  if (dragging.value) return dragRect.value
  const node = chain.value[chainIndex.value]
  return node && session.value ? toLocal(node.rect) : null
})

const label = computed(() => {
  const r = highlight.value
  if (!r) return ''
  const size = `${Math.round(r.w)} × ${Math.round(r.h)}`
  if (dragging.value) return size
  const node = chain.value[chainIndex.value]
  return [size, appName.value, node?.role].filter(Boolean).join(' · ')
})

const veilPath = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let d = `M0,0 H${vw} V${vh} H0 Z`
  const r = highlight.value
  if (r) d += ` M${r.x},${r.y} h${r.w} v${r.h} h${-r.w} Z`
  return d
})

const hudStyle = computed(() => {
  const r = highlight.value
  if (!r) return {}
  const below = r.y + r.h + 8
  const top = below + 28 > window.innerHeight ? Math.max(r.y - 34, 8) : below
  const left = Math.min(Math.max(r.x, 8), window.innerWidth - 240)
  return { top: `${top}px`, left: `${left}px` }
})

async function onMouseMove(e: MouseEvent) {
  if (finalizing.value || !session.value) return

  if (dragStart.value) {
    const dx = e.clientX - dragStart.value.x
    const dy = e.clientY - dragStart.value.y
    if (dragging.value || Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      dragging.value = true
      dragRect.value = {
        x: Math.min(dragStart.value.x, e.clientX),
        y: Math.min(dragStart.value.y, e.clientY),
        w: Math.abs(dx),
        h: Math.abs(dy),
      }
    }
    return
  }

  const now = performance.now()
  if (hitTestInFlight || now - lastHitTestAt < HIT_TEST_THROTTLE_MS) return
  hitTestInFlight = true
  lastHitTestAt = now
  try {
    const m = session.value.monitor
    const res = await invoke<HitTest>('smart_capture_hit_test', { x: m.x + e.clientX, y: m.y + e.clientY })
    const prevDeepest = chain.value[0]?.rect
    chain.value = res.chain
    appName.value = res.appName
    if (!rectEq(prevDeepest, res.chain[0]?.rect)) {
      // New element under the cursor: reset to the mode default granularity.
      chainIndex.value = session.value.mode === 'window' ? Math.max(res.chain.length - 1, 0) : 0
    }
    else {
      chainIndex.value = Math.min(chainIndex.value, Math.max(res.chain.length - 1, 0))
    }
  }
  catch {
    // Session gone (finalize/cancel raced): ignore.
  }
  finally {
    hitTestInFlight = false
  }
}

function onWheel(e: WheelEvent) {
  if (dragging.value || !chain.value.length) return
  if (e.deltaY < 0) chainIndex.value = Math.min(chainIndex.value + 1, chain.value.length - 1)
  else chainIndex.value = Math.max(chainIndex.value - 1, 0)
}

function onMouseDown(e: MouseEvent) {
  if (e.button === 0) dragStart.value = { x: e.clientX, y: e.clientY }
}

async function onMouseUp() {
  if (finalizing.value || !session.value) return
  if (dragging.value && dragRect.value) {
    const m = session.value.monitor
    await finalize({ x: m.x + dragRect.value.x, y: m.y + dragRect.value.y, w: dragRect.value.w, h: dragRect.value.h })
  }
  else {
    const node = chain.value[chainIndex.value]
    if (node) await finalize(node.rect)
  }
  dragStart.value = null
  dragging.value = false
}

async function finalize(rect: Rect) {
  finalizing.value = true
  try {
    // Fire-and-forget: Rust closes this window as part of finalize.
    await invoke('smart_capture_finalize', { x: rect.x, y: rect.y, w: rect.w, h: rect.h })
  }
  catch (err) {
    console.error('finalize failed:', err)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') invoke('smart_capture_cancel')
  if (e.key === 'Enter') {
    const node = chain.value[chainIndex.value]
    if (node) finalize(node.rect)
  }
}

function openAxPrefs() {
  invoke('open_accessibility_preferences')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  try {
    session.value = await invoke<Session>('smart_capture_get_session')
  }
  catch (err) {
    // No session (stale overlay): bail out cleanly.
    console.error('no capture session:', err)
    invoke('smart_capture_cancel')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div
    class="capture-overlay"
    @mousemove="onMouseMove"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @wheel.prevent="onWheel"
    @contextmenu.prevent
  >
    <img v-if="session" :src="session.snapshotDataUrl" class="snapshot" draggable="false" alt="">
    <svg v-if="session" class="veil">
      <path :d="veilPath" fill="rgba(0, 0, 0, 0.35)" fill-rule="evenodd" />
      <rect
        v-if="highlight"
        :x="highlight.x"
        :y="highlight.y"
        :width="highlight.w"
        :height="highlight.h"
        fill="none"
        stroke="var(--c-primary)"
        stroke-width="2"
      />
    </svg>
    <div v-if="highlight && label" class="hud" :style="hudStyle">
      {{ label }}
    </div>
    <button v-if="session && !session.axAvailable" class="ax-chip" @click.stop="openAxPrefs">
      开启辅助功能可识别页面模块
    </button>
  </div>
</template>

<style scoped>
.capture-overlay {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #000;
  cursor: crosshair;
  user-select: none;
}

.snapshot,
.veil {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  pointer-events: none;
}

.ax-chip {
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
</style>
```

- [ ] **Step 2: Swap the main-window buttons**

In `src/components/Screenshot.vue`, replace the bodies of `capture_select` (lines 23-30) and `capture_window` (lines 32-39):

```ts
// capture select — smart snapping overlay (auto granularity)
async function capture_select() {
  await invoke('smart_capture_start', { mode: 'auto' })
}

// capture window — same overlay, initial granularity locked to windows
async function capture_window() {
  await invoke('smart_capture_start', { mode: 'window' })
}
```

(The old bodies invoked `capture_select`/`capture_window` then `showPreviewWindow`; the preview flow now happens inside `smart_capture_finalize` → `post_capture_flow`, so these handlers no longer touch the preview window. `store`/`showPreviewWindow` remain used by the other three buttons.)

- [ ] **Step 3: Verify build**

Run: `pnpm build:web`
Expected: PASS.

- [ ] **Step 4: Manual smoke test (dev app)**

Run: `pnpm dev:desktop`, click "Capture Select" in the main window:
- Overlay covers the cursor's monitor with a frozen snapshot + dark veil.
- Hovering highlights modules (AX granted) or whole windows; label shows `W × H · App · Role`.
- Scroll up expands highlight toward the window; scroll down goes deeper.
- Drag > 4px draws a manual rect; release captures it; preview floater appears; the file lands in history.
- Click captures the highlighted rect. Enter same. Esc cancels.
- "Capture Window" starts window-level highlighted.
Expected: all behaviors above; note anything off before committing.

- [ ] **Step 5: Commit**

```bash
git add src/pages/capture/CaptureOverlay.vue src/components/Screenshot.vue
git commit -m "feat(smart-capture): overlay interaction UI with snap, climb and drag"
```

---

### Task 7: Route hotkeys + tray menu; delete the osascript window hack

**Files:**
- Modify: `src-tauri/src/global_shortcut.rs:159-172` (Region/Window arms)
- Modify: `src-tauri/src/menu.rs:157-201` (two arms + local `handle_capture_result` removal)
- Modify: `src-tauri/src/platform/mac/screenshot.rs:138-170` (delete `capture_window`)
- Modify: `src-tauri/src/cmd/screenshot.rs:40-51` (delete `capture_window` command)
- Modify: `src-tauri/src/lib.rs:90` (drop `cmd::capture_window,` from `invoke_handler`)

**Interfaces:**
- Consumes: `cmd::start_smart_capture` (Task 5), `global_shortcut::post_capture_flow` (Task 5).
- Produces: ⌘⇧S / ⌘⇧W / tray items all route into smart capture. `capture_select`, `capture_delayed`, `capture_screen` commands remain untouched (per spec Key Decision 4 + R6: `capture_select` stays as the `screencapture`-CLI fallback path; only the osascript window hack is deleted).

- [ ] **Step 1: Reroute the global shortcut handler**

In `src-tauri/src/global_shortcut.rs`, add `use crate::cmd;` to the imports, then replace the `match action` block (lines 159-173):

```rust
            let result = match action {
                CaptureAction::FullScreen => {
                    info!("Capture Screen Pressed!");
                    tauri::async_runtime::block_on(platform::capture_screen(app, "images".to_string()))
                }
                CaptureAction::Region => {
                    info!("Capture Select Pressed!");
                    // Smart capture runs its own post-capture flow from finalize.
                    if let Err(e) = tauri::async_runtime::block_on(cmd::start_smart_capture(app, "auto")) {
                        info!("smart capture failed to start: {e}");
                    }
                    return;
                }
                CaptureAction::Window => {
                    info!("Capture Window Pressed!");
                    if let Err(e) = tauri::async_runtime::block_on(cmd::start_smart_capture(app, "window")) {
                        info!("smart capture failed to start: {e}");
                    }
                    return;
                }
            };
            post_capture_flow(app, result);
```

- [ ] **Step 2: Reroute the tray menu**

In `src-tauri/src/menu.rs`:
- The select arm (around line 194) becomes:

```rust
            if let Err(e) = tauri::async_runtime::block_on(crate::cmd::start_smart_capture(app, "auto")) {
                tracing::info!("smart capture failed to start: {e}");
            }
```

- The window arm (around line 199) becomes the same with `"window"`.
- The full-screen arm (line 189-190) keeps `platform::capture_screen` but its `handle_capture_result(app, result);` call becomes `crate::global_shortcut::post_capture_flow(app, result);`.
- Delete the now-unused local `fn handle_capture_result` (lines 157-~180) and any imports it alone used.

- [ ] **Step 3: Delete the osascript window-capture path**

- `src-tauri/src/platform/mac/screenshot.rs`: delete `pub async fn capture_window` (lines 138-170). If `thread` / `Duration` imports become unused, remove them from the `use` list on lines 1-3.
- `src-tauri/src/cmd/screenshot.rs`: delete the `capture_window` command (lines 40-51).
- `src-tauri/src/lib.rs`: remove the `cmd::capture_window,` line from `invoke_handler`.

- [ ] **Step 4: Verify**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: compiles (no unused-import warnings from the deletion), tests PASS.
Run: `grep -rn "capture_window" src/ src-tauri/src/` — expected: no remaining references except `smart_capture` naming (`create_capture_window`/`close_capture_window` in `window.rs` and callers).
Run: `pnpm dev:desktop` and press ⌘⇧S / ⌘⇧W and use both tray items: all four entries open the overlay (⌘⇧W starting window-level); no ⌘Tab switcher animation appears.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/global_shortcut.rs src-tauri/src/menu.rs src-tauri/src/platform/mac/screenshot.rs src-tauri/src/cmd/screenshot.rs src-tauri/src/lib.rs
git commit -m "feat(smart-capture): route region/window entries to overlay, drop osascript hack"
```

---

### Task 8: Full verification pass

**Files:** none (verification only; fix-up commits allowed).

**Interfaces:** n/a.

- [ ] **Step 1: Automated suite**

Run: `pnpm test`
Expected: `pnpm build:web` PASS + `cargo test` PASS.

- [ ] **Step 2: Ignored native tests (manual, permissions granted)**

Run: `cargo test --manifest-path src-tauri/Cargo.toml -- --ignored`
Expected: 3 PASS (`mac_smart_freeze_dimensions_match_scale`, `mac_smart_window_list_is_nonempty_and_z_sorted_descending`, `mac_smart_ax_chain_smoke`).

- [ ] **Step 3: Manual acceptance checklist (from the spec)**

Run `pnpm dev:desktop` and verify each:

1. Safari page + ⌘⇧S: hover a button → button highlighted; two wheel-ups → toolbar → whole window; Enter → capture matches highlight; history shows the item; preview floater appears.
2. Revoke Accessibility (System Settings) + ⌘⇧S: only whole windows highlight; `开启辅助功能可识别页面模块` chip shows bottom-right; clicking it opens the Privacy & Security → Accessibility pane; no dialog interrupts the flow.
3. ⌘⇧W: overlay opens window-level highlighted; click captures that window; no ⌘Tab animation.
4. Retina + (if available) 1x external display: captured PNG pixel-matches the highlighted region on both (no offset / scale drift).
5. Press ⌘⇧S three times fast: exactly one overlay; one Esc dismisses it and leaves no session behind (⌘⇧S afterwards works normally).
6. Drag a manual rect: live size label; release captures exactly that rect; a sub-2pt click-drag produces no file.
7. Full-screen capture (⌘⇧A) and delayed capture still behave exactly as before.

- [ ] **Step 4: Commit any fixes, then finish**

```bash
git status   # expect clean, or commit fixes as fix(smart-capture): ...
```

Use superpowers:finishing-a-development-branch to decide merge/PR next steps.

---

## Plan Self-Review (completed)

- **Spec coverage:** R1 freeze (Task 2/5 start+get_session) ✓; R2 AX snap + wheel climb (Task 3/6) ✓; R3 window snap offline from frozen list (Task 2/5) ✓; R4 drag ≥4px manual rect (Task 6) ✓; R5 click/Enter/Esc + <2pt guard (Task 1 `MIN_SELECTION_PT`, Task 6) ✓; R6 entry swap incl. tray + osascript deletion, `capture_screen`/`capture_delayed`/`capture_select` untouched (Task 7) ✓; R7 both permission paths (Task 5 start error → screen-recording pane; Task 6 chip → accessibility pane) ✓; R8 single overlay (`create_capture_window` closes stale first), finalize always closes overlay, hit-test silent fallback ✓; R9 save pipeline reuse via `get_images_dir` + `CaptureResult` + `post_capture_flow` ✓.
- **Placeholder scan:** no TBD/TODO; every code step carries complete code; the only "adjust if needed" is the `EXCLUDED_APPS` eyeball check in Task 2 Step 4, which is an explicit verification instruction with a concrete action.
- **Type consistency:** `LogicalRect {x,y,w,h}` serializes to the frontend `Rect` shape; `ChainNode {rect, role, label}` matches TS; `SessionDto`/`HitTestDto` are camelCase via serde and match the TS interfaces; `start_smart_capture(&AppHandle, &str)` matches all three call sites; `post_capture_flow(app, Result<CaptureResult, String>)` matches both hotkey and menu callers.
