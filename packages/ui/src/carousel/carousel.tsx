"use client";

import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";
import { Button } from "../button/button.tsx";
import { cn } from "../lib/utils.ts";
import { MotionFeatures } from "../motion/motion-features.tsx";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  cursorIndicator?: boolean;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  cursorIndicator = false,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cursorActive, setCursorActive] = React.useState(false);
  const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 });
  const [cursorSide, setCursorSide] = React.useState<"prev" | "next">("next");

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!(cursorIndicator && containerRef.current)) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setCursorPos({ x, y });
      setCursorSide(x < rect.width / 2 ? "prev" : "next");
      setCursorActive(true);
    },
    [cursorIndicator],
  );

  const handlePointerLeave = React.useCallback(() => {
    if (cursorIndicator) setCursorActive(false);
  }, [cursorIndicator]);

  const handleCursorClick = React.useCallback(() => {
    if (!cursorIndicator) return;

    if (cursorSide === "prev" && canScrollPrev) {
      scrollPrev();
    } else if (cursorSide === "next" && canScrollNext) {
      scrollNext();
    }
  }, [canScrollNext, canScrollPrev, cursorIndicator, cursorSide, scrollNext, scrollPrev]);

  const canNavigate = cursorSide === "prev" ? canScrollPrev : canScrollNext;

  React.useEffect(() => {
    if (!(api && setApi)) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        aria-roledescription="carousel"
        className={cn(
          "relative",
          cursorIndicator && "carousel-cursor-indicator",
          cursorIndicator && cursorActive && "cursor-none",
          className,
        )}
        data-slot="carousel"
        onClick={cursorIndicator ? handleCursorClick : undefined}
        onKeyDownCapture={handleKeyDown}
        onPointerLeave={cursorIndicator ? handlePointerLeave : undefined}
        onPointerMove={cursorIndicator ? handlePointerMove : undefined}
        ref={containerRef}
        role="region"
        {...props}
      >
        {children}
        <MotionFeatures>
          <AnimatePresence>
            {cursorIndicator && cursorActive && (
              <m.div
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "pointer-events-none absolute z-50 flex size-10 items-center justify-center rounded-full mix-blend-difference",
                  canNavigate ? "bg-white text-black" : "bg-white/30 text-black/50",
                )}
                exit={{ scale: 0, opacity: 0 }}
                initial={{ scale: 0, opacity: 0 }}
                style={{
                  left: cursorPos.x - 20,
                  top: cursorPos.y - 20,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {cursorSide === "prev" ? (
                  <ArrowLeft className="size-5" />
                ) : (
                  <ArrowRight className="size-5" />
                )}
              </m.div>
            )}
          </AnimatePresence>
        </MotionFeatures>
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div className="overflow-hidden" data-slot="carousel-content" ref={carouselRef}>
      <div
        className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      data-slot="carousel-item"
      role="group"
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      data-slot="carousel-previous"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      size={size}
      variant={variant}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      data-slot="carousel-next"
      disabled={!canScrollNext}
      onClick={scrollNext}
      size={size}
      variant={variant}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};
