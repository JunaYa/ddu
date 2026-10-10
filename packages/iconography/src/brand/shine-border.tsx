import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/utils.ts";

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  children?: ReactNode;
  className?: string;
  color?: string | string[];
  duration?: number;
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  children,
  className,
  color = "#fff",
  duration = 14,
}: ShineBorderProps) {
  const colors = Array.isArray(color) ? color.join(",") : color;

  return (
    <div
      className={cn("relative min-h-[60px] w-fit overflow-hidden rounded-lg", className)}
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--mask-linear-gradient":
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          "--shine-pulse-duration": "3s",
          "--shine-degree": "0deg",
          borderRadius: `${borderRadius}px`,
          padding: `${borderWidth}px`,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 size-[300%] animate-[shine-spin_var(--duration)_linear_infinite] will-change-transform"
        style={
          {
            background: `conic-gradient(from var(--shine-degree), transparent 0%, ${colors} 12.5%, transparent 25%)`,
            left: "-100%",
            top: "-100%",
          } as CSSProperties
        }
      />
      <div
        className="relative z-[1] size-full"
        style={{
          borderRadius: `calc(${borderRadius}px - ${borderWidth}px)`,
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes shine-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
