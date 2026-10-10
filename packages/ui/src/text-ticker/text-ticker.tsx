import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/utils.ts";
import "./text-ticker.css";

interface TextTickerProps {
  animationType?: "marquee";
  children: ReactNode;
  className?: string;
  marqueeDelay?: number;
  marqueeSpeed?: number;
}

export function TextTicker({
  children,
  className,
  animationType,
  marqueeDelay = 0,
  marqueeSpeed = 24,
}: TextTickerProps) {
  if (animationType !== "marquee") {
    return (
      <span className={cn("block truncate", className)} data-testid="text-ticker">
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "pi-text-ticker-mask-x group/text-ticker relative flex min-w-0 max-w-full overflow-hidden whitespace-nowrap",
        className,
      )}
      data-testid="text-ticker"
      style={
        {
          "--gap": "1.5rem",
          "--marquee-delay": `${marqueeDelay}ms`,
          "--marquee-duration": `${marqueeSpeed}s`,
        } as CSSProperties
      }
    >
      <span className="pi-text-ticker-marquee flex min-w-full w-max shrink-0 items-center [--duration:var(--marquee-duration)] [animation-delay:var(--marquee-delay)] motion-reduce:animate-none group-hover/text-ticker:[animation-play-state:paused]">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pi-text-ticker-marquee ml-[var(--gap)] flex min-w-full w-max shrink-0 items-center [--duration:var(--marquee-duration)] [animation-delay:var(--marquee-delay)] motion-reduce:animate-none group-hover/text-ticker:[animation-play-state:paused]"
      >
        {children}
      </span>
    </span>
  );
}
