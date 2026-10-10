import { ViteLogo } from "../placeholder/vite-logo.tsx";
import { cn } from "../lib/utils.ts";

interface BrandGlyphProps {
  /** Continuous orbit of the lined frame. Defaults to true. */
  animate?: boolean;
  className?: string;
  /** Outer box size in px. Defaults to 128 (section emblem). */
  size?: number;
}

/** Bump this to try denser frames — rotation & opacity steps are derived. */
const RECT_COUNT = 16;
const RECT_STEP_DEG = 360 / RECT_COUNT;

/** Opacity ramp across rects (first → last). */
const OPACITY_MAX = 0.1;
const OPACITY_MIN = 0.05;

function steppedOpacity(index: number, count: number): number {
  if (count <= 1) {
    return OPACITY_MAX;
  }
  const t = index / (count - 1);
  return OPACITY_MAX - (OPACITY_MAX - OPACITY_MIN) * t;
}

/** Landscape rounded rect centered at the viewBox origin — rotate via parent `<g>`. */
function CenteredRoundedRect() {
  const w = 100;
  const h = 40;
  return (
    <rect
      height={h}
      rx={h / 2}
      stroke="currentColor"
      strokeWidth="0.5"
      width={w}
      x={-w / 2}
      y={-h / 2}
    />
  );
}

/**
 * Decorative brand emblem — outer ring + rotated rounded rects + Vite placeholder.
 * The lined frame orbits slowly; the symbol stays fixed
 * (paused under reduced motion).
 */
export function BrandGlyph({ className, size = 128, animate = true }: BrandGlyphProps) {
  // Keep the mark clear of the overlapping rect edges.
  const symbolSize = Math.round(size * 0.2);

  return (
    <div
      aria-hidden="true"
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className={cn(
          "pointer-events-none absolute inset-0 size-full text-foreground",
          animate && "motion-safe:animate-glyph-orbit-mid",
        )}
        fill="none"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Decorative frame</title>
        <circle
          cx="60"
          cy="60"
          opacity={OPACITY_MAX}
          r="58.5"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle
          cx="60"
          cy="60"
          opacity={OPACITY_MIN}
          r="52"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <g transform="translate(60 60)">
          {Array.from({ length: RECT_COUNT }, (_, i) => (
            <g
              key={i}
              opacity={steppedOpacity(i, RECT_COUNT)}
              transform={i === 0 ? undefined : `rotate(${i * RECT_STEP_DEG})`}
            >
              <CenteredRoundedRect />
            </g>
          ))}
        </g>
      </svg>

      <div className="relative z-10 text-foreground">
        <ViteLogo size={symbolSize} />
      </div>
    </div>
  );
}
