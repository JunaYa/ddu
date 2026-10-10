import type { CSSProperties } from "react";
import { cn } from "../lib/utils.ts";
import { MonochromeSvgIcon } from "../monochrome-svg-icon.tsx";
import { getLineArtIcon, type LineArtIconName } from "./catalog.ts";

export type { LineArtIconName } from "./catalog.ts";

interface LineArtIconProps {
  className?: string;
  name: LineArtIconName;
  /** Pixel size (square). Defaults to 120. */
  size?: number;
  style?: CSSProperties;
  /** Accessible label. Omit for decorative icons. */
  title?: string;
}

/**
 * Renders a catalogued line-art SVG inline with `currentColor`.
 *
 * @example
 * <LineArtIcon name="line-art-01" size={120} className="text-foreground" />
 */
export function LineArtIcon({ name, size = 120, className, title, style }: LineArtIconProps) {
  return (
    <MonochromeSvgIcon
      className={cn("text-foreground", className)}
      prepared={getLineArtIcon(name)}
      size={size}
      style={style}
      title={title}
    />
  );
}
