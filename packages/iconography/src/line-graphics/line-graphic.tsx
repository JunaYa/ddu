import type { CSSProperties } from "react";
import { cn } from "../lib/utils.ts";
import { MonochromeSvgIcon } from "../monochrome-svg-icon.tsx";
import { getLineGraphic, type LineGraphicName } from "./catalog.ts";

export type { LineGraphicName } from "./catalog.ts";

interface LineGraphicProps {
  className?: string;
  /**
   * Scale by height only — width follows viewBox aspect ratio.
   * @example height={400}  // or height="100%"
   */
  height?: number | string;
  name: LineGraphicName;
  /** Square fallback when neither axis is set. Defaults to 400. */
  size?: number;
  style?: CSSProperties;
  /** Accessible label. Omit for decorative graphics. */
  title?: string;
  /**
   * Scale by width only — height follows viewBox aspect ratio.
   * @example width={200}  // or width="100%"
   */
  width?: number | string;
}

/**
 * Renders a catalogued line graphic (larger illustration) inline with `currentColor`.
 * Strokes use `vector-effect="non-scaling-stroke"` so scaling keeps a ~1px screen stroke.
 *
 * Pass **only** `width` or **only** `height` to scale on one axis while keeping aspect ratio.
 * Pass both only when you intentionally want a fixed box (letterboxed via preserveAspectRatio).
 *
 * @example
 * <LineGraphic name="graphics-08" width={200} className="text-border" />
 * <LineGraphic name="graphics-08" height="100%" className="text-border" />
 */
export function LineGraphic({
  name,
  size = 400,
  width,
  height,
  className,
  title,
  style,
}: LineGraphicProps) {
  return (
    <MonochromeSvgIcon
      className={cn("text-foreground", className)}
      height={height}
      prepared={getLineGraphic(name)}
      size={size}
      style={style}
      title={title}
      width={width}
    />
  );
}
