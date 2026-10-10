import type * as React from "react";
import { cn } from "../lib/utils.ts";

/**
 * Usage:
 *
 *   <Frame>                          ← outer tray (rounded-2xl bg-muted/72 p-1)
 *     <FrameHeader>                  ← direct child of Frame, NOT nested in a panel
 *       <FrameTitle>...</FrameTitle>
 *       <FrameDescription>...</FrameDescription>
 *     </FrameHeader>
 *     <FramePanel>                   ← one or more body panels (the "cards")
 *       ...content...
 *     </FramePanel>
 *     <FrameFooter>...</FrameFooter> ← direct child of Frame
 *   </Frame>
 *
 * `FrameHeader`, `FramePanel`, and `FrameFooter` are siblings under `Frame`.
 * The 1px auto-gap (`*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1`)
 * spaces consecutive panels. Header sits flush at the top, footer flush at the
 * bottom — they're slots of the tray itself, not contents of a panel.
 */
export function Frame({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl bg-secondary p-1",
        "*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1",
        className,
      )}
      data-slot="frame"
      {...props}
    />
  );
}

export function FramePanel({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border dark:border-border/0 bg-card/90 bg-clip-padding p-5",
        className,
      )}
      data-slot="frame-panel"
      {...props}
    />
  );
}

export function FrameHeader({
  className,
  ...props
}: React.ComponentProps<"header">): React.ReactElement {
  return (
    <header
      className={cn("flex flex-col px-5 py-4 gap-1", className)}
      data-slot="frame-panel-header"
      {...props}
    />
  );
}

export function FrameTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("font-semibold text-sm", className)}
      data-slot="frame-panel-title"
      {...props}
    />
  );
}

export function FrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="frame-panel-description"
      {...props}
    />
  );
}

export function FrameFooter({
  className,
  ...props
}: React.ComponentProps<"footer">): React.ReactElement {
  return (
    <footer className={cn("px-5 py-4", className)} data-slot="frame-panel-footer" {...props} />
  );
}
