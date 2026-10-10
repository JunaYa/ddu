import type { KeyboardEvent, PointerEvent, RefObject, UIEvent, WheelEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

declare global {
  interface Window {
    __piScrollAreaRestorationState?: Record<string, number>;
  }
}

const SCROLL_AREA_RESTORATION_STORAGE_KEY = "pi.scroll-area-restoration.v1";
// 120 rAF frames ≈ 2 s at 60 fps — enough for Masonic to render virtualized content and settle heights.
const RESTORE_ATTEMPT_LIMIT = 120;
const STABLE_RESTORE_FRAME_LIMIT = 3;
const USER_SCROLL_INTENT_WINDOW_MS = 700;
const TRANSIENT_RESET_GUARD_WINDOW_MS = 3000;
const SCROLL_POSITION_POLL_INTERVAL_MS = 1000;

let inMemoryScrollRestorationState: Record<string, number> = {};

function getInMemoryScrollRestorationState() {
  if (typeof window === "undefined") return inMemoryScrollRestorationState;

  // Anchor to window so module re-evaluation during HMR doesn't reset live state.
  window.__piScrollAreaRestorationState ??= inMemoryScrollRestorationState;
  inMemoryScrollRestorationState = window.__piScrollAreaRestorationState;
  return inMemoryScrollRestorationState;
}

export function resetScrollAreaRestorationForTesting() {
  inMemoryScrollRestorationState = {};
  if (typeof window !== "undefined") {
    window.__piScrollAreaRestorationState = inMemoryScrollRestorationState;
  }
}

function getSafeSessionStorage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

function readScrollRestorationState(): Record<string, number> {
  const storage = getSafeSessionStorage();
  const memoryState = getInMemoryScrollRestorationState();
  if (!storage) return memoryState;

  try {
    const parsed = JSON.parse(storage.getItem(SCROLL_AREA_RESTORATION_STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return memoryState;
    }

    const storedState = Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isFinite(entry[1]),
      ),
    );
    inMemoryScrollRestorationState = {
      ...storedState,
      ...memoryState,
    };
    if (typeof window !== "undefined") {
      window.__piScrollAreaRestorationState = inMemoryScrollRestorationState;
    }
    return inMemoryScrollRestorationState;
  } catch {
    return memoryState;
  }
}

function getSavedScrollTop(id: string) {
  return readScrollRestorationState()[id] ?? 0;
}

function saveScrollTop(id: string, scrollTop: number) {
  getInMemoryScrollRestorationState()[id] = scrollTop;

  const storage = getSafeSessionStorage();
  if (!storage) return;

  const state = readScrollRestorationState();
  state[id] = scrollTop;
  try {
    storage.setItem(SCROLL_AREA_RESTORATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota/private-mode failures; TanStack restoration still has a chance.
  }
}

export function saveScrollAreaRestorationPosition(id: string, scrollTop: number) {
  saveScrollTop(id, scrollTop);
}

export function clearScrollAreaRestorationPosition(id: string) {
  delete getInMemoryScrollRestorationState()[id];

  const storage = getSafeSessionStorage();
  if (!storage) return;

  const state = readScrollRestorationState();
  delete state[id];
  try {
    storage.setItem(SCROLL_AREA_RESTORATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota/private-mode failures; in-memory state was already cleared.
  }
}

export function useScrollAreaRestoration(
  id: string | undefined,
  viewportRef: RefObject<HTMLElement | null>,
) {
  const desiredScrollTopRef = useRef(0);
  const lastWheelIntentRef = useRef({ at: 0, deltaY: 0 });
  const lastUserScrollIntentAtRef = useRef(0);
  const lastPositiveScrollRef = useRef({ at: 0, scrollTop: 0 });
  const restoreAttemptsRef = useRef(0);
  const restoreFrameIdRef = useRef<number | null>(null);
  const restoreStableFrameCountRef = useRef(0);
  const isRestoringRef = useRef(false);
  const latestScrollTopRef = useRef(0);

  const cancelRestore = useCallback(() => {
    if (restoreFrameIdRef.current != null) {
      cancelAnimationFrame(restoreFrameIdRef.current);
      restoreFrameIdRef.current = null;
    }

    isRestoringRef.current = false;
    restoreAttemptsRef.current = 0;
    restoreStableFrameCountRef.current = 0;
    desiredScrollTopRef.current = 0;
  }, []);

  const recordUserScrollIntent = useCallback(() => {
    lastUserScrollIntentAtRef.current = Date.now();
    cancelRestore();
  }, [cancelRestore]);

  const startRestore = useCallback(
    (scrollTop: number) => {
      desiredScrollTopRef.current = scrollTop;
      restoreAttemptsRef.current = 0;
      restoreStableFrameCountRef.current = 0;
      isRestoringRef.current = scrollTop > 0;

      if (scrollTop <= 0) {
        cancelRestore();
        return;
      }

      if (restoreFrameIdRef.current != null) return;

      const restore = () => {
        restoreFrameIdRef.current = null;

        const viewport = viewportRef.current;
        const desiredScrollTop = desiredScrollTopRef.current;
        if (!(viewport && viewport.isConnected) || desiredScrollTop <= 0) return;

        const hasRecentUserIntent =
          Date.now() - lastUserScrollIntentAtRef.current < USER_SCROLL_INTENT_WINDOW_MS;
        if (hasRecentUserIntent) {
          cancelRestore();
          return;
        }

        const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        const nextScrollTop = Math.min(desiredScrollTop, maxScrollTop);

        if (nextScrollTop > 0 && Math.abs(viewport.scrollTop - nextScrollTop) > 1) {
          viewport.scrollTop = nextScrollTop;
          latestScrollTopRef.current = nextScrollTop;
          lastPositiveScrollRef.current = { at: Date.now(), scrollTop: nextScrollTop };
          restoreStableFrameCountRef.current = 0;
        } else if (
          nextScrollTop > 0 &&
          Math.abs(nextScrollTop - desiredScrollTop) <= 1 &&
          Math.abs(viewport.scrollTop - nextScrollTop) <= 1
        ) {
          restoreStableFrameCountRef.current += 1;
        } else {
          restoreStableFrameCountRef.current = 0;
        }

        if (restoreStableFrameCountRef.current >= STABLE_RESTORE_FRAME_LIMIT) {
          cancelRestore();
          return;
        }

        restoreAttemptsRef.current += 1;
        if (restoreAttemptsRef.current < RESTORE_ATTEMPT_LIMIT) {
          restoreFrameIdRef.current = requestAnimationFrame(restore);
          return;
        }

        if (nextScrollTop < desiredScrollTop - 1) {
          isRestoringRef.current = false;
          restoreAttemptsRef.current = 0;
          restoreStableFrameCountRef.current = 0;
          return;
        }

        cancelRestore();
      };

      restoreFrameIdRef.current = requestAnimationFrame(restore);
    },
    [cancelRestore, viewportRef],
  );

  const recordScrollTop = useCallback(
    (nextScrollTop: number) => {
      if (!id) return;

      if (nextScrollTop > 0) {
        lastPositiveScrollRef.current = { at: Date.now(), scrollTop: nextScrollTop };
      }

      const lastWheelIntent = lastWheelIntentRef.current;
      const lastPositiveScroll = lastPositiveScrollRef.current;
      const hasRecentUpwardIntent =
        lastWheelIntent.deltaY < 0 &&
        Date.now() - lastWheelIntent.at < USER_SCROLL_INTENT_WINDOW_MS;
      const hasRecentUserIntent =
        Date.now() - lastUserScrollIntentAtRef.current < USER_SCROLL_INTENT_WINDOW_MS;
      const hasRecentPositiveScroll =
        lastPositiveScroll.scrollTop > 0 &&
        Date.now() - lastPositiveScroll.at < TRANSIENT_RESET_GUARD_WINDOW_MS;
      const isTransientLayoutReset =
        nextScrollTop === 0 &&
        (isRestoringRef.current || desiredScrollTopRef.current > 0 || hasRecentPositiveScroll) &&
        !hasRecentUserIntent &&
        !hasRecentUpwardIntent;
      const scrollTopToSave = isTransientLayoutReset
        ? Math.max(desiredScrollTopRef.current, lastPositiveScroll.scrollTop)
        : nextScrollTop;

      latestScrollTopRef.current = scrollTopToSave;
      saveScrollTop(id, scrollTopToSave);
      if (isTransientLayoutReset) {
        startRestore(scrollTopToSave);
      } else if (nextScrollTop <= 0) {
        cancelRestore();
      }
    },
    [cancelRestore, id, startRestore],
  );

  useLayoutEffect(() => {
    if (!id) return;

    const savedScrollTop = getSavedScrollTop(id);
    if (savedScrollTop <= 0) return;

    startRestore(savedScrollTop);
    return cancelRestore;
  }, [cancelRestore, id, startRestore]);

  useEffect(() => {
    if (!id || typeof ResizeObserver !== "function") return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const maybeRestore = () => {
      const desiredScrollTop = desiredScrollTopRef.current || getSavedScrollTop(id);
      if (desiredScrollTop <= 0) return;

      const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const nextScrollTop = Math.min(desiredScrollTop, maxScrollTop);
      if (nextScrollTop > 0 && Math.abs(viewport.scrollTop - nextScrollTop) > 1) {
        startRestore(desiredScrollTop);
      }
    };

    const resizeObserver = new ResizeObserver(maybeRestore);
    const observedElements = new Set<Element>();
    const observeElement = (element: Element | null) => {
      if (!element || observedElements.has(element)) return;
      observedElements.add(element);
      resizeObserver.observe(element);
    };
    const observeViewportContent = () => {
      observeElement(viewport);
      for (const child of Array.from(viewport.children)) {
        observeElement(child);
      }
    };
    const mutationObserver =
      typeof MutationObserver === "function"
        ? new MutationObserver(observeViewportContent)
        : undefined;

    observeViewportContent();
    mutationObserver?.observe(viewport, { childList: true });

    return () => {
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
    };
  }, [id, startRestore, viewportRef]);

  useEffect(() => {
    if (!id) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    latestScrollTopRef.current = viewport.scrollTop;
    const intervalId = window.setInterval(() => {
      const currentViewport = viewportRef.current;
      if (!currentViewport) return;

      if (Math.abs(currentViewport.scrollTop - latestScrollTopRef.current) > 1) {
        recordScrollTop(currentViewport.scrollTop);
      }
    }, SCROLL_POSITION_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      const currentScrollTop =
        viewportRef.current?.scrollTop ?? viewport.scrollTop ?? latestScrollTopRef.current;
      const savedScrollTop = getSavedScrollTop(id);
      const scrollTopToSave =
        currentScrollTop <= 1 && savedScrollTop > 0 ? savedScrollTop : currentScrollTop;
      saveScrollTop(id, scrollTopToSave);
      cancelRestore();
    };
  }, [cancelRestore, id, recordScrollTop, viewportRef]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLElement>) => {
      if (!id) return;

      recordScrollTop(event.currentTarget.scrollTop);
    },
    [id, recordScrollTop],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      lastWheelIntentRef.current = { at: Date.now(), deltaY: event.deltaY };
      recordUserScrollIntent();
    },
    [recordUserScrollIntent],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.currentTarget === event.target) {
        recordUserScrollIntent();
      }
    },
    [recordUserScrollIntent],
  );

  const handleTouchMove = useCallback(() => {
    recordUserScrollIntent();
  }, [recordUserScrollIntent]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === "PageUp" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        recordUserScrollIntent();
      }
    },
    [recordUserScrollIntent],
  );

  return { handleKeyDown, handlePointerDown, handleScroll, handleTouchMove, handleWheel };
}
