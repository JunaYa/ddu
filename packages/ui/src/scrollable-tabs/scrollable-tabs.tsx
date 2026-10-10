import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../button/button.tsx";
import { MotionFeatures } from "../motion/motion-features.tsx";
import { ScrollArea, ScrollBar } from "../scroll-area/scroll-area.tsx";
import { Tabs, TabsList, TabsTrigger } from "../tabs/tabs.tsx";

// Constants for scroll behavior configuration
const SCROLL_CONFIG = {
  EDGE_PADDING_RATIO: 0.2, // 20% of viewport width
  VISIBILITY_THRESHOLD: 0.95, // 95% of tab must be visible
  PAGINATION_SCROLL_RATIO: 0.8, // 80% of viewport width per pagination click
  AUTO_SCROLL_DELAY: 50, // Delay before auto-scrolling to clicked tab
  SCROLL_DEBOUNCE: 16, // ~60fps for scroll position checks
} as const;

// Animation variants for chevron buttons
const chevronVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const, // easeOut cubic-bezier
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1] as const, // easeIn cubic-bezier
    },
  },
} as const;

export interface ScrollableTabItem {
  label: string;
  value: string;
}

interface ScrollableTabsProps {
  allOptionLabel?: string;
  className?: string;
  isLoading?: boolean;
  items: ScrollableTabItem[];
  onValueChange: (value: string) => void;
  showAllOption?: boolean;
  value: string;
}

export const ScrollableTabs = ({
  items,
  value,
  onValueChange,
  showAllOption = true,
  allOptionLabel = "All",
  isLoading = false,
  className,
}: ScrollableTabsProps) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);
  const debounceTimeoutRef = useRef<number | undefined>(undefined);

  // Memoized viewport getter - single source of truth
  const getViewport = useCallback(() => {
    return scrollAreaRef.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
  }, []);

  // Check scroll position and update button states
  const checkScrollPosition = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = viewport;

    // Show left button when not at the start
    setCanScrollLeft(scrollLeft > 1);

    // Show right button when not at the end
    // This will show immediately on mount if content overflows (scrollLeft=0, scrollWidth > clientWidth)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, [getViewport]);

  // Debounced scroll check for performance
  const debouncedScrollCheck = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(
      checkScrollPosition,
      SCROLL_CONFIG.SCROLL_DEBOUNCE,
    );
  }, [checkScrollPosition]);

  // Scroll to a specific tab element
  const scrollToTab = useCallback(
    (tabElement: HTMLElement) => {
      const viewport = getViewport();
      if (!viewport) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const tabRect = tabElement.getBoundingClientRect();

      // Calculate how much of the tab is visible
      const visibleLeft = Math.max(tabRect.left, viewportRect.left);
      const visibleRight = Math.min(tabRect.right, viewportRect.right);
      const visibleWidth = visibleRight - visibleLeft;
      const tabWidth = tabRect.width;

      // Define comfortable padding from edges
      const edgePadding = viewportRect.width * SCROLL_CONFIG.EDGE_PADDING_RATIO;

      // Check if tab is comfortably visible
      const isFullyVisible = visibleWidth >= tabWidth * SCROLL_CONFIG.VISIBILITY_THRESHOLD;
      const distanceFromLeftEdge = tabRect.left - viewportRect.left;
      const distanceFromRightEdge = viewportRect.right - tabRect.right;

      // Skip scrolling if tab is already well-positioned
      if (isFullyVisible) {
        const hasGoodLeftPadding = distanceFromLeftEdge > edgePadding;
        const hasGoodRightPadding = distanceFromRightEdge > edgePadding;
        if (hasGoodLeftPadding && hasGoodRightPadding) {
          return;
        }
      }

      // Scroll to center the tab
      const tabOffset = tabElement.offsetLeft;
      const targetScroll = tabOffset - viewportRect.width / 2 + tabWidth / 2;

      viewport.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    },
    [getViewport],
  );

  // Handle tab change with auto-scroll
  const handleTabChange = useCallback(
    (newValue: string) => {
      onValueChange(newValue);

      // Clear any pending scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Schedule scroll to clicked tab
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (activeTabRef.current) {
          scrollToTab(activeTabRef.current);
        }
      }, SCROLL_CONFIG.AUTO_SCROLL_DELAY);
    },
    [onValueChange, scrollToTab],
  );

  // Pagination scroll handler
  const scrollTabs = useCallback(
    (direction: "left" | "right") => {
      const viewport = getViewport();
      if (!viewport) {
        return;
      }

      const scrollAmount = viewport.clientWidth * SCROLL_CONFIG.PAGINATION_SCROLL_RATIO;
      const targetScroll =
        viewport.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount);

      viewport.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    },
    [getViewport],
  );

  // Shared tab trigger className
  const tabTriggerClassName =
    "hover:bg-background-secondary-hover !rounded-b-none !border-transparent !w-auto !flex-none !py-2 px-3 overflow-hidden rounded-b-none  bg-background-subtle-rest data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=active]:!bg-background-primary-hover";

  // Immediate synchronous check on mount/items change (runs before paint)
  useLayoutEffect(() => {
    checkScrollPosition();
  }, [checkScrollPosition, items.length]);

  // Update scroll buttons when items change
  useEffect(() => {
    if (items.length === 0) return;

    // Multiple checks to ensure we catch the overflow state
    // First check happens quickly for fast response
    const immediateCheck = window.setTimeout(() => {
      checkScrollPosition();
    }, 10);

    // Second check after layout is more stable
    const delayedCheck = window.setTimeout(() => {
      checkScrollPosition();
    }, 100);

    // Third check for cases where content loads slowly
    const finalCheck = window.setTimeout(() => {
      checkScrollPosition();
    }, 300);

    return () => {
      clearTimeout(immediateCheck);
      clearTimeout(delayedCheck);
      clearTimeout(finalCheck);
    };
  }, [checkScrollPosition, items.length]);

  // Update scroll buttons on mount, scroll, and resize
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) {
      return;
    }

    // Initial check - run immediately
    checkScrollPosition();

    // Use debounced handler for scroll events
    viewport.addEventListener("scroll", debouncedScrollCheck);
    window.addEventListener("resize", debouncedScrollCheck);

    // Watch for content size changes using ResizeObserver
    // Use immediate (non-debounced) check for first resize to catch clipped content faster
    let isFirstResize = true;
    const resizeObserver = new ResizeObserver(() => {
      if (isFirstResize) {
        isFirstResize = false;
        checkScrollPosition(); // Immediate check on first resize
      } else {
        debouncedScrollCheck(); // Debounced for subsequent resizes
      }
    });

    // Observe the ScrollArea container, viewport, and tabsList for any size changes
    if (scrollAreaRef.current) {
      resizeObserver.observe(scrollAreaRef.current);
    }
    resizeObserver.observe(viewport);
    const tabsList = viewport.querySelector('[role="tablist"]');
    if (tabsList) {
      resizeObserver.observe(tabsList);
    }

    return () => {
      viewport.removeEventListener("scroll", debouncedScrollCheck);
      window.removeEventListener("resize", debouncedScrollCheck);
      resizeObserver.disconnect();

      // Cleanup timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [checkScrollPosition, debouncedScrollCheck, getViewport]);

  return (
    <MotionFeatures>
      <Tabs className={className} onValueChange={handleTabChange} value={value}>
        <div className="relative isolate flex flex-row gap-2">
          <ScrollArea ref={scrollAreaRef}>
            <TabsList className="relative h-auto gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-transparent">
              {showAllOption && (
                <TabsTrigger
                  className={tabTriggerClassName}
                  ref={value === "all" ? activeTabRef : undefined}
                  value="all"
                >
                  {allOptionLabel}
                </TabsTrigger>
              )}
              {items.map((item) => (
                <TabsTrigger
                  className={tabTriggerClassName}
                  key={item.value}
                  ref={value === item.value ? activeTabRef : undefined}
                  value={item.value}
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar className="sr-only" orientation="horizontal" />
          </ScrollArea>

          {/* Left pagination button - hide during loading */}
          <AnimatePresence>
            {canScrollLeft && !isLoading && (
              <m.div
                animate="visible"
                className="pointer-events-none absolute inset-0 left-0 z-10 flex items-stretch"
                exit="exit"
                initial="hidden"
                variants={chevronVariants}
              >
                <Button
                  className="pointer-events-auto h-full w-12 rounded-none bg-gradient-to-l from-transparent via-card to-card px-8 text-muted-foreground hover:bg-transparent! hover:text-foreground"
                  onClick={() => scrollTabs("left")}
                  type="button"
                  variant="ghost"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </m.div>
            )}
          </AnimatePresence>

          {/* Right pagination button - hide during loading */}
          <AnimatePresence>
            {canScrollRight && !isLoading && (
              <m.div
                animate="visible"
                className="pointer-events-none absolute inset-0 right-0 z-10 flex items-stretch justify-end"
                exit="exit"
                initial="hidden"
                variants={chevronVariants}
              >
                <Button
                  className="pointer-events-auto h-full w-12 rounded-none bg-gradient-to-r from-transparent via-card to-card px-8 text-muted-foreground hover:bg-transparent! hover:text-foreground"
                  onClick={() => scrollTabs("right")}
                  type="button"
                  variant="ghost"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </m.div>
            )}
          </AnimatePresence>

          {/* Loading indicator - subtle overlay */}
          <AnimatePresence>
            {isLoading && (
              <m.div
                animate="visible"
                className="pointer-events-none absolute inset-0 right-0 z-20 flex items-center justify-end pr-3"
                exit="exit"
                initial="hidden"
                variants={chevronVariants}
              >
                <div className="pointer-events-none flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-muted-foreground text-xs shadow-sm ring-1 ring-border">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="font-medium">Loading...</span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </MotionFeatures>
  );
};
