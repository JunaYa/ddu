import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "../lib/utils.ts";

export interface LoadMoreTriggerProps {
  className?: string;
  /** Whether there are more pages to load */
  hasNextPage: boolean;
  /** Whether a page is currently being fetched */
  isFetchingNextPage: boolean;
  /** Callback to fetch the next page */
  onLoadMore: () => void;
  /** Root margin for IntersectionObserver (default: 200px to prefetch early) */
  rootMargin?: string;
}

/**
 * Sentinel element that triggers loading the next page when scrolled into view.
 * Uses IntersectionObserver for efficient scroll-based pagination.
 */
export function LoadMoreTrigger({
  className,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  rootMargin = "0px 0px 200px 0px",
}: LoadMoreTriggerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // State machine across observer lifetimes:
  //  - hasMountedRef: false on first-ever mount, true after. On the very first
  //    attach the initial notification is skipped to prevent draining all pages.
  //    On re-creates (after a fetch completes) an already-visible sentinel fires
  //    immediately so the next page loads without requiring a scroll-away+back.
  //  - hasObservedRef: reset per observer lifetime; gates the initial notification.
  //  - wasIntersectingRef: tracks the previous intersection state so only
  //    false→true transitions fire.
  //  - triggeredRef: prevents double-firing within a single observer lifetime.
  const hasMountedRef = useRef(false);
  const hasObservedRef = useRef(false);
  const wasIntersectingRef = useRef(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!(sentinel && hasNextPage) || isFetchingNextPage) return;

    hasObservedRef.current = false;
    wasIntersectingRef.current = false;
    triggeredRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(0);
        if (!entry) return;

        if (!hasObservedRef.current) {
          hasObservedRef.current = true;
          wasIntersectingRef.current = entry.isIntersecting;
          if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
          }
          if (entry.isIntersecting) {
            triggeredRef.current = true;
            observer.disconnect();
            onLoadMore();
          }
          return;
        }

        const isEntering = entry.isIntersecting && !wasIntersectingRef.current;
        wasIntersectingRef.current = entry.isIntersecting;

        if (isEntering && !triggeredRef.current) {
          triggeredRef.current = true;
          observer.disconnect();
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore, rootMargin]);

  if (!(hasNextPage || isFetchingNextPage)) return null;

  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center py-3", className)}
      ref={sentinelRef}
    >
      {isFetchingNextPage && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
