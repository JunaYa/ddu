import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils.ts";
import { spinners } from "./spinners.ts";

export type AsciiLoaderName = keyof typeof spinners;

export interface AsciiLoaderProps {
  className?: string;
  /** Spinner style — see spinners.json for the full catalogue (90 variants). */
  name?: AsciiLoaderName;
}

/**
 * Renders a CLI-style ASCII spinner (frame-based animation from cli-spinners).
 *
 * Frame timing is driven by requestAnimationFrame with a timestamp gate so
 * the loop self-corrects under tab throttling and doesn't waste paints on
 * intervals shorter than the spinner's `interval`.
 */
export function AsciiLoader({ className, name = "dots" }: AsciiLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const spinner = spinners[name];
  const [frame, setFrame] = useState(0);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    function tick(time: number) {
      if (time - lastTickRef.current >= spinner.interval) {
        lastTickRef.current = time;
        setFrame((f) => (f + 1) % spinner.frames.length);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [prefersReducedMotion, spinner.frames.length, spinner.interval]);

  // Static first frame under reduced motion — preserves the visual presence
  // without any flicker.
  const visibleFrame = prefersReducedMotion ? spinner.frames[0] : spinner.frames[frame];

  // aria-hidden because the frame text changes every interval — wrapping in
  // a live region (<output>) makes screen readers announce every tick. The
  // caller is responsible for providing the actual status text in a sibling
  // live region (see AgentMessageShimmer for the canonical pattern).
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-mono text-xs tabular-nums leading-none",
        className,
      )}
    >
      {visibleFrame}
    </span>
  );
}
