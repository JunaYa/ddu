import { Icon } from "@iconify/react";
import { ViteLogo } from "../placeholder/vite-logo.tsx";
import { cn } from "../lib/utils.ts";

export type ToolIconName = "notion" | "obsidian" | "notebooklm" | "vite";

const SIMPLE_ICONS = {
  notion: "simple-icons:notion",
  obsidian: "simple-icons:obsidian",
  notebooklm: "material-symbols:book-2-rounded",
} as const;

interface ToolIconProps {
  className?: string;
  /** Hide from AT (aria-hidden) when a visible tool name sits beside the icon,
   *  so the name isn't announced twice. */
  decorative?: boolean;
  name: ToolIconName;
  /** Pixel size (square). Defaults to 32. */
  size?: number;
  /** Accessible label. Defaults to a capitalized tool name. */
  title?: string;
}

const DEFAULT_TITLES: Record<ToolIconName, string> = {
  vite: "Vite placeholder",
  notion: "Notion",
  obsidian: "Obsidian",
  notebooklm: "NotebookLM",
};

/**
 * Brand mark for compare / ecosystem surfaces.
 * Notion & Obsidian use simple-icons; Vite is the template placeholder.
 */
export function ToolIcon({ name, size = 32, className, title, decorative = false }: ToolIconProps) {
  const label = title ?? DEFAULT_TITLES[name];

  if (name === "vite") {
    return (
      <ViteLogo
        size={size}
        className={className}
        alt={decorative ? "" : label}
        aria-hidden={decorative || undefined}
      />
    );
  }

  return (
    <Icon
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={cn(
        "shrink-0",
        name === "notion" && "text-foreground",
        name === "obsidian" && "text-[#7C3AED]",
        className,
      )}
      height={size}
      icon={SIMPLE_ICONS[name]}
      role={decorative ? undefined : "img"}
      width={size}
    />
  );
}
