import { ViteLogo } from "../placeholder/vite-logo.tsx";
import { ShineBorder } from "./shine-border.tsx";

interface AppIconProps {
  className?: string;
  size?: number;
}

export function AppIcon({ size = 96, className }: AppIconProps) {
  const symbolSize = Math.round(size * 0.625);
  const borderRadius = Math.round(size * 0.333);

  return (
    <ShineBorder
      borderRadius={borderRadius}
      borderWidth={2}
      className={className}
      color={["var(--color-b1-400)", "var(--color-b2-500)", "var(--color-b2-200)"]}
    >
      <div
        className="inline-flex items-center justify-center bg-gradient-to-br from-foreground to-foreground/80 text-background"
        style={{
          width: size,
          height: size,
          borderRadius: `calc(${borderRadius}px - 2px)`,
          boxShadow:
            "inset 0 1px 1px var(--color-b1-50), 0 25px 50px -12px color-mix(in srgb, var(--color-b1-500) 50%, transparent)",
        }}
      >
        <ViteLogo size={symbolSize} />
      </div>
    </ShineBorder>
  );
}
