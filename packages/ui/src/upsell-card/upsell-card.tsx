import type * as React from "react";
import { cn } from "../lib/utils.ts";

type RadiusToken = "xs" | "sm" | "md" | "default" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

interface UpsellCardProps {
  className?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  radius?: RadiusToken;
  title: React.ReactNode;
}

export function UpsellCard({
  className,
  description,
  icon,
  onClick,
  radius = "lg",
  title,
}: UpsellCardProps) {
  const Comp = onClick ? "button" : "div";
  const r = `var(--rounded-${radius})`;
  return (
    <Comp
      className={cn(
        "group/upsell transform-gpu text-left",
        onClick &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995]",
        className,
      )}
      onClick={onClick}
      style={{ borderRadius: r }}
      type={onClick ? "button" : undefined}
    >
      <div
        className="bg-gradient-to-b from-b1-300/50 to-transparent p-px dark:from-b1-400/50"
        style={{ borderRadius: r }}
      >
        <div
          className="relative w-full overflow-hidden bg-gradient-to-b from-b1-400 to-b1-600 p-px [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:from-b1-500 dark:to-b1-700 dark:[box-shadow:0_0_0_1px_rgba(255,255,255,.06),0_-20px_80px_-20px_#ffffff1f_inset]"
          style={{ borderRadius: `calc(${r} - 1px)` }}
        >
          <div
            className="relative z-10 flex flex-col gap-1 bg-gradient-to-b from-b1-400/80 to-b1-500 px-2.5 py-2 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.15),inset_0_-1px_2px_0_rgba(0,0,0,0.12)] dark:from-b1-500/80 dark:to-b1-600 dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),inset_0_-1px_2px_0_rgba(0,0,0,0.2)]"
            style={{ borderRadius: `calc(${r} - 2px)` }}
          >
            <div className="relative z-10 flex items-center gap-2">
              <span className="font-semibold text-white text-xs">{title}</span>
              {icon && <span className="ml-auto shrink-0 text-white [&_svg]:size-4">{icon}</span>}
            </div>
            {description && (
              <p className="relative z-10 text-[calc(var(--text-xs)-1px)] text-b1-100 leading-snug dark:text-b1-200">
                {description}
              </p>
            )}
            {/* Fine grain texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-soft-light dark:opacity-[0.14]"
              style={{
                backgroundImage: NOISE_SVG,
                backgroundRepeat: "repeat",
                backgroundSize: "256px 256px",
                borderRadius: `calc(${r} - 2px)`,
              }}
            />
          </div>
          {/* Shine sweep */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-0 flex h-[calc(100%+40px)] w-full -translate-y-1/2 justify-center blur-[12px] motion-safe:animate-shine-sweep"
          >
            <div className="relative h-full w-8 bg-white/20" />
          </div>
        </div>
      </div>
    </Comp>
  );
}
