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
import { Button } from "@ddu/ui/button";
import {
  type MouseEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type WheelEvent,
} from "react";
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
const HIT_TEST_THROTTLE_MS = 30;

/** Smart-capture overlay over the frozen screen: hover to pick UI elements, drag to select. */
export function CaptureWindow() {
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [chain, setChain] = useState<ChainNode[]>([]);
  const [chainIndex, setChainIndex] = useState(0);
  const [appName, setAppName] = useState("");
  const [dragRect, setDragRect] = useState<LogicalRect | null>(null);

  const dragStart = useRef<Point | null>(null);
  const finalizing = useRef(false);
  const hitTestInFlight = useRef(false);
  const lastHitTestAt = useRef(0);

  useEffect(() => {
    captureSession()
      .then(setSession)
      .catch((error: unknown) => {
        // No session (stale overlay): bail out cleanly.
        console.error("no capture session:", error);
        void cancelCapture();
      });
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
    if (event.key === "Escape") {
      event.preventDefault();
      void cancelCapture();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const node = chain[chainIndex];
      if (node) void finalize(node.rect);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function onMouseMove(event: MouseEvent) {
    if (finalizing.current || !session) return;
    const point = { x: event.clientX, y: event.clientY };

    if (dragStart.current) {
      const rect = dragSelection(dragStart.current, point, dragRect !== null);
      if (rect) setDragRect(rect);
      return;
    }

    const now = performance.now();
    if (hitTestInFlight.current || now - lastHitTestAt.current < HIT_TEST_THROTTLE_MS) return;
    hitTestInFlight.current = true;
    lastHitTestAt.current = now;
    try {
      const result = await hitTest(session.monitor.x + point.x, session.monitor.y + point.y);
      setChainIndex((index) => nextChainIndex(chain, result.chain, index, session.mode));
      setChain(result.chain);
      setAppName(result.appName);
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
    const rect = dragRect;
    dragStart.current = null;
    setDragRect(null);
    if (rect) {
      await finalize(toGlobal(rect, session.monitor));
    } else {
      const node = chain[chainIndex];
      if (node) await finalize(node.rect);
    }
  }

  function onWheel(event: WheelEvent) {
    if (dragRect || chain.length === 0) return;
    setChainIndex((index) => wheelChainIndex(index, event.deltaY, chain.length));
  }

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const node = chain[chainIndex];
  const highlight = dragRect ?? (node && session ? toLocal(node.rect, session.monitor) : null);

  return (
    <div
      className="fixed inset-0 cursor-crosshair select-none overflow-hidden bg-black"
      data-testid="capture-overlay"
      onMouseMove={(event) => void onMouseMove(event)}
      onMouseDown={onMouseDown}
      onMouseUp={() => void onMouseUp()}
      onWheel={onWheel}
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
              {hudLabel(highlight, dragRect !== null, appName, node?.role)}
            </div>
          )}
          {session.mode === "text" && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/72 px-3.5 py-1.5 text-[13px] text-white">
              框选区域以复制文字 Select an area to copy its text
            </div>
          )}
          {!session.axAvailable && (
            <Button
              variant="overlay"
              size="sm"
              className="absolute bottom-4 right-4 rounded-full"
              onMouseDown={(event) => event.stopPropagation()}
              onMouseUp={(event) => event.stopPropagation()}
              // Shows the one-time system prompt, or opens the Accessibility pane when already denied.
              onClick={() => void requestPermission("accessibility")}
            >
              开启辅助功能可识别页面模块
            </Button>
          )}
        </>
      )}
    </div>
  );
}
