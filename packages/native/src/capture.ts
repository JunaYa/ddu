import { call } from "./commands/call.ts";
import type { CaptureSession, HitTest, LogicalRect } from "./commands/types.ts";

export const captureSession = (): Promise<CaptureSession> => call("smart_capture_get_session");

/** UI elements under a global logical point, deepest first. */
export const hitTest = (x: number, y: number): Promise<HitTest> =>
  call("smart_capture_hit_test", { x, y });

/** Capture `rect` (global logical points). Rust closes the overlay on every path. */
export const finalizeCapture = (rect: LogicalRect): Promise<void> =>
  call("smart_capture_finalize", { x: rect.x, y: rect.y, w: rect.w, h: rect.h });

export const cancelCapture = (): Promise<void> => call("smart_capture_cancel");
