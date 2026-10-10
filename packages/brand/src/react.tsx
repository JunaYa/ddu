/**
 * React lockups for the PI placeholder mark. All in-app renders of the
 * logo go through these components; the path data lives in
 * ./logo-data.ts. Marks render with `currentColor`, so they follow the
 * surrounding foreground color (near-black in light themes, near-white
 * in dark themes) unless `colored` applies the `--primary` token.
 */
import type { AriaAttributes } from "react";
import { GAP_SCALE, SYMBOL_SVG, V_GAP_SCALE, WORDMARK_SCALE, WORDMARK_SVG } from "./logo-data.ts";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function LogoSymbol() {
  return (
    <g>
      <path d={SYMBOL_SVG.path} fill="currentColor" />
    </g>
  );
}

function LogoWordmark() {
  return (
    <g>
      <path d={WORDMARK_SVG.path} fill="currentColor" />
    </g>
  );
}

interface AnimatedSymbolProps {
  className?: string;
  colored?: boolean;
  height?: number;
}

export function AnimatedSymbol({ height = 80, colored = false, className }: AnimatedSymbolProps) {
  const symbolColor = colored ? "text-primary" : undefined;

  return (
    <>
      <style>{`
        @keyframes cipher-spin {
          0%   { rotate: 0deg; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { rotate: 120deg }
        }
      `}</style>
      <div className={cn("group/logo inline-flex items-center", className)}>
        <svg
          className={cn(symbolColor, "group-hover/logo:animate-[cipher-spin_0.8s_forwards]")}
          fill="none"
          height={height}
          viewBox={SYMBOL_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Symbol</title>
          <LogoSymbol />
        </svg>
      </div>
    </>
  );
}

interface AnimatedLogoProps {
  className?: string;
  colored?: boolean;
  height?: number;
}

export function AnimatedLogo({ height = 32, colored = false, className }: AnimatedLogoProps) {
  const symbolColor = colored ? "text-primary" : undefined;
  const wordmarkHeight = height * WORDMARK_SCALE;
  const logoGap = height * GAP_SCALE;

  return (
    <>
      <style>{`
        @keyframes cipher-spin {
          0%   { rotate: 0deg; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { rotate: 120deg }
        }
      `}</style>
      <div
        className={cn("group/logo inline-flex items-center", className)}
        style={{ gap: logoGap }}
      >
        <svg
          className={cn(symbolColor, "group-hover/logo:animate-[cipher-spin_0.8s_forwards]")}
          fill="none"
          height={height}
          viewBox={SYMBOL_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Symbol</title>
          <LogoSymbol />
        </svg>
        <svg
          fill="none"
          height={wordmarkHeight}
          viewBox={WORDMARK_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Wordmark</title>
          <LogoWordmark />
        </svg>
      </div>
    </>
  );
}

interface AppLogoProps extends AriaAttributes {
  className?: string;
  /** Apply --primary color to the symbol mark */
  colored?: boolean;
  height?: number;
  variant?: "horizontal" | "vertical" | "symbol" | "wordmark";
}

export function AppLogo({
  variant = "horizontal",
  height = 32,
  colored = false,
  className,
  ...ariaProps
}: AppLogoProps) {
  const symbolColor = colored ? "text-primary" : undefined;
  switch (variant) {
    case "horizontal": {
      const wordmarkHeight = height * WORDMARK_SCALE;
      const gap = height * GAP_SCALE;
      return (
        <div {...ariaProps} className={cn("inline-flex items-center", className)} style={{ gap }}>
          <svg
            className={symbolColor}
            fill="none"
            height={height}
            viewBox={SYMBOL_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol</title>
            <LogoSymbol />
          </svg>
          <svg
            fill="none"
            height={wordmarkHeight}
            viewBox={WORDMARK_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Wordmark</title>
            <LogoWordmark />
          </svg>
        </div>
      );
    }

    case "vertical": {
      const wordmarkHeight = height * WORDMARK_SCALE;
      const gap = height * V_GAP_SCALE;
      return (
        <div
          {...ariaProps}
          className={cn("inline-flex flex-col items-center", className)}
          style={{ gap }}
        >
          <svg
            className={symbolColor}
            fill="none"
            height={height}
            viewBox={SYMBOL_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol</title>
            <LogoSymbol />
          </svg>
          <svg
            fill="none"
            height={wordmarkHeight}
            viewBox={WORDMARK_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Wordmark</title>
            <LogoWordmark />
          </svg>
        </div>
      );
    }

    case "symbol":
      return (
        <svg
          {...ariaProps}
          className={cn(symbolColor, className)}
          fill="none"
          height={height}
          viewBox={SYMBOL_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Symbol</title>
          <LogoSymbol />
        </svg>
      );

    case "wordmark":
      return (
        <svg
          {...ariaProps}
          className={className}
          fill="none"
          height={height}
          viewBox={WORDMARK_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Wordmark</title>
          <LogoWordmark />
        </svg>
      );

    default:
      return null;
  }
}
