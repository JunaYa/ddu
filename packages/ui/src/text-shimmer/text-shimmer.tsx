"use client";
import { animate, m, type MotionStyle, useMotionValue, useReducedMotion } from "motion/react";
import React, { useEffect, useMemo } from "react";
import { cn } from "../lib/utils.ts";
import { MotionFeatures } from "../motion/motion-features.tsx";

export interface TextShimmerProps {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
}

function TextShimmerComponent({ children, className, duration = 2, spread = 2 }: TextShimmerProps) {
  const prefersReducedMotion = useReducedMotion();
  const dynamicSpread = useMemo(() => children.length * spread, [children, spread]);

  // Imperative animation: set up ONCE in useEffect, run independently of React's
  // render cycle. The previous declarative `animate` prop kept being interrupted
  // when the parent re-rendered, even with full memoization. A motion value
  // doesn't re-evaluate on render — only the controls do, and we only create
  // them once per (duration, prefersReducedMotion) change.
  const backgroundPosition = useMotionValue("100% center");

  useEffect(() => {
    if (prefersReducedMotion) {
      backgroundPosition.set("100% center");
      return;
    }
    const controls = animate(backgroundPosition, "0% center", {
      duration,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
    });
    return () => {
      controls.stop();
    };
  }, [backgroundPosition, duration, prefersReducedMotion]);

  return (
    <MotionFeatures>
      <m.span
        className={cn(
          "relative inline-block bg-size-[250%_100%,auto] bg-clip-text text-transparent",
          // Semantic tokens drive both layers; both flip on `.dark` automatically.
          "[--base-color:var(--muted-foreground)] [--base-gradient-color:var(--foreground)]",
          "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
          className,
        )}
        style={
          {
            "--spread": `${dynamicSpread}px`,
            backgroundPosition,
            // Under reduced motion, drop the gradient overlay entirely so the
            // text reads as flat muted color.
            backgroundImage: prefersReducedMotion
              ? "linear-gradient(var(--base-color), var(--base-color))"
              : "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
          } as MotionStyle
        }
      >
        {children}
      </m.span>
    </MotionFeatures>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
