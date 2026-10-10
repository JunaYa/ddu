import type { CSSProperties } from "react";
import { cn } from "./lib/utils.ts";
import { escapeXml, type PreparedMonochromeSvg } from "./prepare-monochrome-svg.ts";

interface MonochromeSvgIconProps {
  className?: string;
  /**
   * Scale by height. If `width` is omitted, width follows the viewBox
   * aspect ratio (numeric heights) or CSS `aspect-ratio` (string heights).
   */
  height?: number | string;
  prepared: PreparedMonochromeSvg;
  /**
   * Square fallback when neither `width` nor `height` is set.
   * Ignored when either axis is provided.
   */
  size?: number;
  style?: CSSProperties;
  title?: string;
  /**
   * Scale by width. If `height` is omitted, height follows the viewBox
   * aspect ratio (numeric widths) or CSS `aspect-ratio` (string widths).
   */
  width?: number | string;
}

function resolveAxes(
  prepared: PreparedMonochromeSvg,
  size: number,
  width: number | string | undefined,
  height: number | string | undefined,
): { width?: number | string; height?: number | string; style?: CSSProperties } {
  const ratio = prepared.viewBoxWidth / prepared.viewBoxHeight;

  if (width !== undefined && height !== undefined) {
    return { width, height };
  }

  if (width !== undefined) {
    if (typeof width === "number") {
      return { width, height: width / ratio };
    }
    // SVG attrs reject "auto" — keep aspect via CSS only.
    return {
      width,
      style: {
        height: "auto",
        aspectRatio: `${prepared.viewBoxWidth} / ${prepared.viewBoxHeight}`,
      },
    };
  }

  if (height !== undefined) {
    if (typeof height === "number") {
      return { width: height * ratio, height };
    }
    // SVG attrs reject "auto" — keep aspect via CSS only.
    return {
      height,
      style: {
        width: "auto",
        aspectRatio: `${prepared.viewBoxWidth} / ${prepared.viewBoxHeight}`,
      },
    };
  }

  return { width: size, height: size };
}

/** Shared inline SVG renderer for numbered asset catalogs. */
export function MonochromeSvgIcon({
  prepared,
  size = 24,
  width,
  height,
  className,
  title,
  style,
}: MonochromeSvgIconProps) {
  const html = title
    ? `<title>${escapeXml(title)}</title>${prepared.innerHtml}`
    : prepared.innerHtml;

  const axes = resolveAxes(prepared, size, width, height);

  return (
    // prepared from static ?raw SVG assets
    <svg
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: html }}
      fill="none"
      height={axes.height}
      preserveAspectRatio="xMidYMid meet"
      role={title ? "img" : undefined}
      style={{ ...axes.style, ...style }}
      viewBox={prepared.viewBox}
      width={axes.width}
      xmlns="http://www.w3.org/2000/svg"
    />
  );
}
