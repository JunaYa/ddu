"use client";

import type * as React from "react";
import { cn } from "../lib/utils.ts";

interface AnimatedBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number;
  children?: React.ReactNode;
  /**
   * Duration of the animation in seconds
   * @default 2
   */
  duration?: number;
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "#000000"
   */
  shineColor?: string | string[];
  /**
   * Variant of the animated border
   * @default "radial"
   */
  variant?: "dash" | "solid";
}

/**
 * Animated Border
 *
 * An animated background border effect component with configurable properties.
 */
export function AnimatedBorder({
  borderWidth = 1,
  duration = 2,
  shineColor = "#000000",
  variant = "dash",
  className,
  style,
  children: _children,
  ...props
}: AnimatedBorderProps) {
  const variantStyles = {
    dash: {
      backgroundImage: `radial-gradient(circle at center, ${
        Array.isArray(shineColor) ? shineColor.join(",") : shineColor
      }, transparent 70%)`,
      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      backgroundSize: "200% 200%",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
    },
    solid: {
      backgroundImage: Array.isArray(shineColor)
        ? `repeating-linear-gradient(90deg, ${[
            ...shineColor,
            shineColor[0], // Add first color at the end for seamless loop
          ]
            .map((color, index, array) => `${color} ${(index * 100) / (array.length - 1)}%`)
            .join(", ")})`
        : `repeating-linear-gradient(90deg, ${shineColor} 0%, ${shineColor} 100%)`,
      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      backgroundSize: "200% 200%",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
    },
  };

  const variantClasses = {
    dash: "motion-safe:animate-radial",
    solid: "motion-safe:animate-repeating-linear",
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 size-full overflow-hidden rounded-[inherit]",
        className,
      )}
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          padding: "var(--border-width)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 size-full rounded-[inherit] will-change-[background-position]",
          variantClasses[variant],
        )}
        style={{
          ...variantStyles[variant],
          padding: "var(--border-width)",
        }}
      />
    </div>
  );
}
