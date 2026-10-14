import type { ChainNode, LogicalRect } from "@ddu/native";

/** Mouse movement (CSS px) before a press becomes a drag selection. */
export const DRAG_THRESHOLD_PX = 4;

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export function rectEq(a?: LogicalRect, b?: LogicalRect): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.w - b.w) < 0.5 &&
    Math.abs(a.h - b.h) < 0.5
  );
}

/** Global logical rect → overlay-local CSS pixels (1:1 with logical points in the webview). */
export function toLocal(rect: LogicalRect, monitor: LogicalRect): LogicalRect {
  return { x: rect.x - monitor.x, y: rect.y - monitor.y, w: rect.w, h: rect.h };
}

/** Overlay-local rect → global logical points, for Rust. */
export function toGlobal(rect: LogicalRect, monitor: LogicalRect): LogicalRect {
  return { x: monitor.x + rect.x, y: monitor.y + rect.y, w: rect.w, h: rect.h };
}

/** The drag selection, or `null` while the pointer is still within the threshold. */
export function dragSelection(
  start: Point,
  current: Point,
  alreadyDragging: boolean,
): LogicalRect | null {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  if (!alreadyDragging && Math.hypot(dx, dy) <= DRAG_THRESHOLD_PX) return null;
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    w: Math.abs(dx),
    h: Math.abs(dy),
  };
}

/** The dimming veil with a hole over the highlighted rect (even-odd fill). */
export function veilPath(viewport: Viewport, highlight: LogicalRect | null): string {
  let d = `M0,0 H${viewport.width} V${viewport.height} H0 Z`;
  if (highlight)
    d += ` M${highlight.x},${highlight.y} h${highlight.w} v${highlight.h} h${-highlight.w} Z`;
  return d;
}

/** Size/app/role badge position: below the highlight, or above it near the bottom edge. */
export function hudPosition(
  highlight: LogicalRect,
  viewport: Viewport,
): { top: number; left: number } {
  const below = highlight.y + highlight.h + 8;
  const top = below + 28 > viewport.height ? Math.max(highlight.y - 34, 8) : below;
  const left = Math.min(Math.max(highlight.x, 8), viewport.width - 240);
  return { top, left };
}

export function hudLabel(
  highlight: LogicalRect,
  dragging: boolean,
  appName: string,
  role?: string,
): string {
  const size = `${Math.round(highlight.w)} × ${Math.round(highlight.h)}`;
  if (dragging) return size;
  return [size, appName, role].filter(Boolean).join(" · ");
}

/**
 * Which element of a fresh hit-test chain to highlight. A new element under
 * the cursor resets to the mode's default granularity (outermost window in
 * window mode, deepest element otherwise); the same element keeps the user's
 * wheel-chosen level, clamped to the new chain.
 */
export function nextChainIndex(
  previous: ChainNode[],
  next: ChainNode[],
  currentIndex: number,
  mode: "auto" | "window",
): number {
  const last = Math.max(next.length - 1, 0);
  if (!rectEq(previous[0]?.rect, next[0]?.rect)) return mode === "window" ? last : 0;
  return Math.min(currentIndex, last);
}

/** Wheel up widens to the parent element, wheel down narrows. */
export function wheelChainIndex(index: number, deltaY: number, length: number): number {
  return deltaY < 0 ? Math.min(index + 1, length - 1) : Math.max(index - 1, 0);
}
