import type { Positioner, RenderComponentProps } from "masonic";
import { createPositioner, useMasonry, usePositioner, useResizeObserver } from "masonic";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const RESIZE_WIDTH_COMMIT_DELAY_MS = 120;

// ---------------------------------------------------------------------------
// Custom scroll tracker for non-window scroll containers (e.g. ScrollArea)
// ---------------------------------------------------------------------------

function useElementScroller(scrollRef: RefObject<HTMLElement | null>) {
  const [state, setState] = useState({ scrollTop: 0, isScrolling: false, height: 0 });
  const rafId = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    setState({ scrollTop: el.scrollTop, isScrolling: false, height: el.clientHeight });

    const onScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = 0;
        setState({ scrollTop: el.scrollTop, isScrolling: true, height: el.clientHeight });
        clearTimeout(scrollTimer.current);
        scrollTimer.current = setTimeout(
          () => setState((prev) => ({ ...prev, isScrolling: false })),
          150,
        );
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      setState((prev) => {
        const h = el.clientHeight;
        return h === prev.height ? prev : { ...prev, height: h };
      });
    });
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
      clearTimeout(scrollTimer.current);
      ro.disconnect();
    };
  }, [scrollRef]);

  return state;
}

// ---------------------------------------------------------------------------
// VirtualMasonry
// ---------------------------------------------------------------------------

interface VirtualMasonryProps<T> {
  className?: string;
  columnWidth?: number | ResponsiveColumnWidth;
  gap?: number;
  getItemKey: (item: T, index: number) => string | number;
  itemHeightEstimate?: number;
  items: T[];
  overscanBy?: number;
  renderItem: React.ComponentType<RenderComponentProps<T>>;
  role?: "grid" | "list";
  scrollRef: RefObject<HTMLElement | null>;
}

interface ResponsiveColumnWidth {
  base: number;
  lg?: number;
  md?: number;
  sm?: number;
  xl?: number;
}

function resolveColumnWidth(columnWidth: number | ResponsiveColumnWidth, width: number): number {
  if (typeof columnWidth === "number") return columnWidth;

  if (width >= 1280 && columnWidth.xl !== undefined) return columnWidth.xl;
  if (width >= 1024 && columnWidth.lg !== undefined) return columnWidth.lg;
  if (width >= 768 && columnWidth.md !== undefined) return columnWidth.md;
  if (width >= 640 && columnWidth.sm !== undefined) return columnWidth.sm;
  return columnWidth.base;
}

function VirtualMasonryInner<T>({
  items,
  getItemKey,
  renderItem,
  scrollRef,
  width,
  columnWidth = 200,
  gap = 12,
  itemHeightEstimate = 240,
  overscanBy = 2,
  className,
  role = "list",
}: VirtualMasonryProps<T> & { width: number }) {
  // Masonic uses items as WeakMap keys internally — undefined/null entries
  // cause "Invalid value used as weak map key". Defensive filter here.
  const safeItems = items.filter((item): item is T => item != null);

  const resolvedColumnWidth = resolveColumnWidth(columnWidth, width);

  // Track a layout version that increments when item identity/order changes
  // (filter, delete, reorder) but stays stable on append-only pagination.
  // Refs are only committed in the effect phase so aborted concurrent
  // renders cannot corrupt the baseline.
  const layoutVersionRef = useRef(0);
  const prevKeysRef = useRef<(string | number)[]>([]);

  const currentKeys = safeItems.map((item, i) => getItemKey(item, i));
  const prev = prevKeysRef.current;

  let layoutVersion = layoutVersionRef.current;
  if (prev.length > 0) {
    let isAppendOnly = currentKeys.length >= prev.length;
    if (isAppendOnly) {
      for (let i = 0; i < prev.length; i++) {
        if (currentKeys[i] !== prev[i]) {
          isAppendOnly = false;
          break;
        }
      }
    }
    if (!isAppendOnly) {
      layoutVersion = layoutVersionRef.current + 1;
    }
  }

  useEffect(() => {
    prevKeysRef.current = currentKeys;
    layoutVersionRef.current = layoutVersion;
  });

  // Let masonic resolve responsive column geometry, while keeping its index-
  // based cache separate from our identity-based measurement restoration.
  const geometry = usePositioner(
    { width, columnWidth: resolvedColumnWidth, columnGutter: gap, rowGutter: gap },
    [width, resolvedColumnWidth, gap, layoutVersion],
  );
  const positioner = useMemo(
    () => createPositioner(geometry.columnCount, geometry.columnWidth, gap, gap),
    [geometry, gap],
  );
  const committedLayout = useRef<{ keys: (string | number)[]; positioner: Positioner } | null>(
    null,
  );
  const previous = committedLayout.current;
  if (previous && previous.positioner !== positioner && positioner.size() === 0) {
    const heights = new Map<string | number, number>();
    previous.keys.slice(0, previous.positioner.size()).forEach((key, index) => {
      const measurement = previous.positioner.get(index);
      if (measurement) heights.set(key, measurement.height);
    });
    // Seed through the last retained measured card. Masonic requires contiguous
    // indices, so new cards between retained ones get an estimate until observed.
    let lastMeasured = -1;
    currentKeys.forEach((key, index) => {
      if (heights.has(key)) lastMeasured = index;
    });
    for (let index = 0; index <= lastMeasured; index++) {
      positioner.set(index, heights.get(currentKeys[index]!) ?? itemHeightEstimate);
    }
  }
  useLayoutEffect(() => {
    committedLayout.current = { keys: currentKeys, positioner };
  });
  const resizeObserver = useResizeObserver(positioner);
  const { scrollTop, isScrolling, height } = useElementScroller(scrollRef);

  const safeItemKey = useCallback(
    (data: T | undefined, index: number): string | number =>
      data != null ? getItemKey(data as T, index) : `__stale_${String(index)}`,
    [getItemKey],
  );

  return useMasonry({
    items: safeItems,
    positioner,
    resizeObserver,
    scrollTop,
    isScrolling,
    height,
    render: renderItem,
    itemKey: safeItemKey as (data: T, index: number) => string | number,
    itemHeightEstimate,
    overscanBy,
    className,
    role,
  });
}

function VirtualMasonry<T>(props: VirtualMasonryProps<T>) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // widthRef mirrors `width` state inside the ResizeObserver closure.
  // Safe because the effect runs once ([] deps) so the closure never goes stale.
  const widthRef = useRef(0);
  const pendingWidthRef = useRef(0);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries.at(0);
      if (!entry) return;

      const nextWidth = Math.floor(entry.contentRect.width);
      if (nextWidth <= 0 || nextWidth === widthRef.current) return;

      if (widthRef.current === 0) {
        widthRef.current = nextWidth;
        setWidth(nextWidth);
        return;
      }

      pendingWidthRef.current = nextWidth;
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (pendingWidthRef.current === widthRef.current) return;
        widthRef.current = pendingWidthRef.current;
        setWidth(pendingWidthRef.current);
      }, RESIZE_WIDTH_COMMIT_DELAY_MS);
    });
    ro.observe(el);
    return () => {
      clearTimeout(resizeTimerRef.current);
      ro.disconnect();
    };
  }, []);

  if (width === 0) {
    return <div className={props.className} ref={measureRef} />;
  }

  return (
    <div ref={measureRef}>
      <VirtualMasonryInner {...props} width={width} />
    </div>
  );
}

export { VirtualMasonry };
export type { VirtualMasonryProps, RenderComponentProps };
