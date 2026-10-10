"use client";

// Uses Base UI primitives directly (not ./toggle-group) because
// the local Toggle is a bordered button with fixed h-7/8/9, hover bg, and
// data-pressed bg — all of which would fight the segment-control's shared
// track + sliding-indicator design.
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ddu/ui/tooltip";
import { cn } from "../lib/utils.ts";

export interface SegmentControlItem {
  ariaLabel?: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: string;
}

interface SegmentControlProps {
  className?: string;
  items: SegmentControlItem[];
  onValueChange: (value: string) => void;
  size?: "xs" | "sm" | "default" | "lg";
  value: string;
  /**
   * "icon"  — icon-only buttons with label in tooltip (default)
   * "text"  — visible text labels; icon rendered before label when provided
   */
  variant?: "icon" | "text";
}

const SIZE_STYLES = {
  xs: {
    container: "h-7 gap-0.5 rounded-md p-[2px]",
    shape: "gap-0.5 rounded-md p-[2px]",
    indicatorLeft: "2px",
    item: "size-5.5 rounded",
    radius: "rounded",
    iconSize: "[&_svg]:size-3",
    textItem: "gap-1 px-1.5 py-1 text-[calc(var(--text-xs)-1px)]",
  },
  sm: {
    container: "h-8 gap-0.5 rounded-lg p-[3px]",
    shape: "gap-0.5 rounded-lg p-[3px]",
    indicatorLeft: "3px",
    item: "size-6 rounded-md",
    radius: "rounded-md",
    iconSize: "[&_svg]:size-3.5",
    textItem: "gap-1.5 px-2 py-1.5 text-xs",
  },
  default: {
    container: "h-10 gap-0.5 rounded-lg p-1",
    shape: "gap-0.5 rounded-lg p-1",
    indicatorLeft: "4px",
    item: "size-8 rounded-md",
    radius: "rounded-md",
    iconSize: "[&_svg]:size-4",
    textItem: "gap-1.5 px-2.5 py-2 text-sm",
  },
  lg: {
    container: "h-11 gap-0.5 rounded-lg p-1",
    shape: "gap-0.5 rounded-lg p-1",
    indicatorLeft: "4px",
    item: "size-9 rounded-md",
    radius: "rounded-md",
    iconSize: "[&_svg]:size-4",
    textItem: "gap-1.5 px-3 py-2 text-base",
  },
} as const;

const GAP_PX = 2;

export function SegmentControl({
  className,
  items,
  onValueChange,
  size = "default",
  value,
  variant = "icon",
}: SegmentControlProps) {
  const currentValue = value || items[0]?.value || "";
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.value === currentValue),
  );
  const styles = SIZE_STYLES[size];
  const isText = variant === "text";

  const indicatorOffset = Number.parseInt(styles.indicatorLeft);
  const textIndicatorWidth = `calc((100% - ${2 * indicatorOffset}px - ${(items.length - 1) * GAP_PX}px) / ${items.length})`;
  const textIndicatorHeight = `calc(100% - ${2 * indicatorOffset}px)`;
  const accessibleLabelFor = (item: SegmentControlItem) =>
    item.ariaLabel ?? (typeof item.label === "string" ? item.label : item.value);

  return (
    <ToggleGroupPrimitive
      className={cn(
        "relative border border-border bg-muted",
        isText
          ? cn("grid auto-cols-fr grid-flow-col", styles.shape)
          : cn("inline-flex items-center justify-center", styles.container),
        className,
      )}
      onValueChange={(next) => {
        const v = Array.isArray(next) ? next[0] : next;
        if (v && v !== value) {
          onValueChange(v);
        }
      }}
      value={[currentValue]}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 bg-card shadow-xs transition-transform duration-200 ease-out dark:bg-input",
          isText ? styles.radius : styles.item,
        )}
        style={{
          left: styles.indicatorLeft,
          ...(isText ? { width: textIndicatorWidth, height: textIndicatorHeight } : {}),
          transform: `translate(calc(${activeIndex} * (100% + ${GAP_PX}px)), -50%)`,
        }}
      />
      {items.map((item) =>
        isText ? (
          <TogglePrimitive
            aria-label={accessibleLabelFor(item)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              styles.radius,
              styles.textItem,
              styles.iconSize,
              currentValue === item.value
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            key={item.value}
            value={item.value}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </TogglePrimitive>
        ) : (
          <Tooltip key={item.value}>
            <TooltipTrigger
              render={
                <TogglePrimitive
                  aria-label={accessibleLabelFor(item)}
                  className={cn(
                    "relative z-10 inline-flex items-center justify-center transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    styles.item,
                    styles.iconSize,
                    currentValue === item.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                  value={item.value}
                >
                  {item.icon}
                  <span className="sr-only">{accessibleLabelFor(item)}</span>
                </TogglePrimitive>
              }
            />
            <TooltipContent>{accessibleLabelFor(item)}</TooltipContent>
          </Tooltip>
        ),
      )}
    </ToggleGroupPrimitive>
  );
}
