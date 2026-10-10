import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../button/button.tsx";
import { Icons } from "../icons/icons.tsx";
import { cn } from "../lib/utils.ts";

function useIsSingleLineText(ref: React.RefObject<HTMLElement | null>) {
  const [isSingleLine, setIsSingleLine] = useState(true);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      setIsSingleLine(true);
      return;
    }

    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      const lineHeightPx = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 20;
      setIsSingleLine(element.scrollHeight <= lineHeightPx * 1.5);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return isSingleLine;
}

function IconLabelSlot({
  children,
  className,
  multiline,
  slotClassName = "size-4",
}: {
  children: ReactNode;
  className?: string;
  multiline: boolean;
  slotClassName?: string;
}) {
  if (multiline) {
    return (
      <div
        className={cn("flex h-full shrink-0 items-start self-stretch", slotClassName, className)}
      >
        <div className={cn("flex items-center justify-center", slotClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center justify-center", slotClassName, className)}>
      {children}
    </div>
  );
}

export interface IconLabelProps {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  dismissLabel?: string;
  icon: ReactNode;
  onDismiss?: () => void;
}

/**
 * Compact icon + label row with optional trailing action or dismiss button.
 * Shared by agent shimmer indicators, thinking blocks, and waiting tips.
 *
 * Uses a fixed `size-4` icon slot so ASCII loaders and SVG icons occupy
 * the same bounding box. Multiline text pins the icon to the first line
 * via the same slot pattern as AlertBanner.
 */
export function IconLabel({
  action,
  children,
  className,
  dismissLabel,
  icon,
  onDismiss,
}: IconLabelProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const isSingleLine = useIsSingleLineText(textRef);
  const isDismissible = Boolean(onDismiss && dismissLabel);
  const isMultiline = !isSingleLine;

  return (
    <div
      className={cn(
        "flex min-w-0 gap-1.5 text-xs",
        isMultiline ? "items-start" : "items-center",
        className,
      )}
    >
      <IconLabelSlot multiline={isMultiline}>{icon}</IconLabelSlot>
      <span className="flex min-w-0 flex-1 flex-wrap items-center" ref={textRef}>
        {children}
      </span>
      {action ? (
        <IconLabelSlot multiline={isMultiline} slotClassName="w-auto">
          {action}
        </IconLabelSlot>
      ) : null}
      {!action && isDismissible ? (
        <IconLabelSlot multiline={isMultiline}>
          <Button
            aria-label={dismissLabel}
            className="size-4 shrink-0 rounded-sm p-0"
            onClick={onDismiss}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <Icons.close aria-hidden="true" className="size-3" />
          </Button>
        </IconLabelSlot>
      ) : null}
    </div>
  );
}
