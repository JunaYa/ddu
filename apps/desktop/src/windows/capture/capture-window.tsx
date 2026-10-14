import {
  type CaptureSession,
  cancelCapture,
  captureSession,
  type ChainNode,
  finalizeCapture,
  hitTest,
  type LogicalRect,
  requestPermission,
} from "@ddu/native";
import { type MouseEvent, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  dragSelection,
  hudLabel,
  hudPosition,
  nextChainIndex,
  type Point,
  toGlobal,
  toLocal,
  veilPath,
  wheelChainIndex,
} from "./geometry.ts";

/** Minimum gap between hit-test IPC calls while the mouse moves. */
export const HIT_TEST_THROTTLE_MS = 30;

interface Gesture {
  chain: ChainNode[];
  chainIndex: number;
  appName: string;
  dragRect: LogicalRect | null;
}

const IDLE: Gesture = { chain: [], chainIndex: 0, appName: "", dragRect: null };

/**
 * Smart-capture overlay over the frozen screen: hover to pick UI elements,
 * wheel to change the level, drag to select, Enter to capture. Escape is
 * handled by the window shell (escape-to-cancel.ts).
 */
export function CaptureWindow() {
  const [session, setSession] = useState<CaptureSession | null>(null);
  // Gesture state lives in a ref so fast input sequences (move → up) always
  // act on the latest values, not on the last committed render; the state
  // copy only drives rendering.
  const gesture = useRef<Gesture>(IDLE);
  const [view, setView] = useState<Gesture>(IDLE);
  const update = (next: Partial<Gesture>) => {
    gesture.current = { ...gesture.current, ...next };
    setView(gesture.current);
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<Point | null>(null);
  const finalizing = useRef(false);
  const hitTestInFlight = useRef(false);
  const lastHitTestAt = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    let ignore = false;
    captureSession()
      .then((loaded) => {
        if (!ignore) setSession(loaded);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        // No session (stale overlay): bail out cleanly.
        console.error("no capture session:", error);
        void cancelCapture();
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function finalize(rect: LogicalRect) {
    finalizing.current = true;
    try {
      // Rust closes this window as part of finalize.
      await finalizeCapture(rect);
    } catch (error) {
      // Rust closes the overlay on every finalize path; recovering here keeps
      // a failed IPC call from freezing the overlay.
      console.error("finalize failed:", error);
      finalizing.current = false;
    }
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const node = gesture.current.chain[gesture.current.chainIndex];
    if (node) void finalize(node.rect);
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // A native, non-passive listener: React's onWheel cannot preventDefault,
  // and the frozen screenshot must not scroll or rubber-band.
  const onWheel = useEffectEvent((event: globalThis.WheelEvent) => {
    event.preventDefault();
    const { dragRect, chain, chainIndex } = gesture.current;
    if (dragRect || chain.length === 0) return;
    update({ chainIndex: wheelChainIndex(chainIndex, event.deltaY, chain.length) });
  });
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  async function onMouseMove(event: MouseEvent) {
    if (finalizing.current || !session) return;
    const point = { x: event.clientX, y: event.clientY };

    if (dragStart.current) {
      const rect = dragSelection(dragStart.current, point, gesture.current.dragRect !== null);
      if (rect) update({ dragRect: rect });
      return;
    }

    const now = performance.now();
    if (hitTestInFlight.current || now - lastHitTestAt.current < HIT_TEST_THROTTLE_MS) return;
    hitTestInFlight.current = true;
    lastHitTestAt.current = now;
    try {
      const result = await hitTest(session.monitor.x + point.x, session.monitor.y + point.y);
      const current = gesture.current;
      update({
        chainIndex: nextChainIndex(current.chain, result.chain, current.chainIndex, session.mode),
        chain: result.chain,
        appName: result.appName,
      });
    } catch {
      // Session gone (finalize/cancel raced): ignore.
    } finally {
      hitTestInFlight.current = false;
    }
  }

  function onMouseDown(event: MouseEvent) {
    if (event.button === 0) dragStart.current = { x: event.clientX, y: event.clientY };
  }

  async function onMouseUp() {
    if (finalizing.current || !session) return;
    const { dragRect, chain, chainIndex } = gesture.current;
    dragStart.current = null;
    update({ dragRect: null });
    if (dragRect) {
      await finalize(toGlobal(dragRect, session.monitor));
    } else {
      const node = chain[chainIndex];
      if (node) await finalize(node.rect);
    }
  }

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const node = view.chain[view.chainIndex];
  const highlight = view.dragRect ?? (node && session ? toLocal(node.rect, session.monitor) : null);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 cursor-crosshair select-none overflow-hidden bg-black"
      data-testid="capture-overlay"
      onMouseMove={(event) => void onMouseMove(event)}
      onMouseDown={onMouseDown}
      onMouseUp={() => void onMouseUp()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {session && (
        <>
          <img
            src={session.snapshotDataUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full"
          />
          <svg className="absolute inset-0 size-full" aria-hidden>
            <path d={veilPath(viewport, highlight)} fill="rgba(0, 0, 0, 0.35)" fillRule="evenodd" />
            {highlight && (
              <rect
                x={highlight.x}
                y={highlight.y}
                width={highlight.w}
                height={highlight.h}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={2}
              />
            )}
          </svg>
          {highlight && (
            <div
              className="pointer-events-none absolute whitespace-nowrap rounded-md bg-black/72 px-2.5 py-1 text-xs leading-[18px] text-white"
              style={hudPosition(highlight, viewport)}
            >
              {hudLabel(highlight, view.dragRect !== null, view.appName, node?.role)}
            </div>
          )}
          {!session.axAvailable && (
            // A plain button: this window does not load the design system
            // (specs/99 D14). Dark over any screenshot content, as before.
            <button
              type="button"
              className="absolute bottom-4 right-4 cursor-pointer rounded-full border border-white/35 bg-black/60 px-3 py-1.5 text-xs text-white"
              onMouseDown={(event) => event.stopPropagation()}
              onMouseUp={(event) => event.stopPropagation()}
              // Shows the one-time system prompt, or opens the Accessibility pane when already denied.
              onClick={() => void requestPermission("accessibility")}
            >
              开启辅助功能可识别页面模块
            </button>
          )}
        </>
      )}
    </div>
  );
}
