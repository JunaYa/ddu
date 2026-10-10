import type * as React from "react";
import { cn } from "../lib/utils.ts";

type Position = "top" | "bottom" | "both";

export interface ProgressiveBlurProps {
  blurLevels?: number[];
  className?: string;
  /**
   * Clips the actual backdrop-filter layers, not just the wrapper. This is
   * important because some browsers composite backdrop-filter outside parent
   * border-radius/overflow clipping.
   */
  clipRadius?: string;
  height?: string;
  position?: Position;
}

const BOTH_GRADIENT =
  "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)";

function buildMask(position: Position, from: number, to: number): string {
  if (position === "both") return BOTH_GRADIENT;
  const dir = position === "bottom" ? "to bottom" : "to top";
  return `linear-gradient(${dir}, rgba(0,0,0,0) ${from}%, rgba(0,0,0,1) ${to}%)`;
}

export function ProgressiveBlur({
  className,
  clipRadius,
  height = "30%",
  position = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
}: ProgressiveBlurProps) {
  const count = blurLevels.length;
  const step = 100 / count;
  const layerClipStyle = getLayerClipStyle(position, clipRadius);

  return (
    <div
      className={cn(
        "gradient-blur pointer-events-none absolute inset-x-0 z-10",
        className,
        position === "top" ? "top-0" : position === "bottom" ? "bottom-0" : "inset-y-0",
      )}
      style={{
        height: position === "both" ? "100%" : height,
      }}
    >
      {blurLevels.map((blur, i) => {
        const from = i * step;
        const to = (i + 1) * step;
        const mask = buildMask(position, from, to);

        return (
          <div
            className="absolute inset-0"
            key={`blur-${blur}`}
            style={{
              ...layerClipStyle,
              zIndex: i + 1,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}

function getLayerClipStyle(
  position: Position,
  clipRadius: string | undefined,
): React.CSSProperties {
  if (!clipRadius) {
    return {};
  }

  const radius =
    position === "top"
      ? `${clipRadius} ${clipRadius} 0 0`
      : position === "bottom"
        ? `0 0 ${clipRadius} ${clipRadius}`
        : clipRadius;

  return {
    borderRadius: radius,
    clipPath:
      position === "top"
        ? `inset(0 round ${clipRadius} ${clipRadius} 0 0)`
        : position === "bottom"
          ? `inset(0 round 0 0 ${clipRadius} ${clipRadius})`
          : `inset(0 round ${clipRadius})`,
    overflow: "hidden",
    WebkitClipPath:
      position === "top"
        ? `inset(0 round ${clipRadius} ${clipRadius} 0 0)`
        : position === "bottom"
          ? `inset(0 round 0 0 ${clipRadius} ${clipRadius})`
          : `inset(0 round ${clipRadius})`,
  };
}
