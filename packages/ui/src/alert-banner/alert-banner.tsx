import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../button/button.tsx";
import { Icons } from "../icons/icons.tsx";
import { cn } from "../lib/utils.ts";

export type AlertBannerVariant = "error" | "info" | "success" | "warning";

const variantConfig = {
  error: {
    container: "border-destructive/32 bg-destructive/4",
    description: "text-foreground/60",
    icon: Icons.alertCircle,
    iconClassName: "size-3.5 text-destructive",
    message: "whitespace-pre-wrap text-foreground/85",
  },
  info: {
    container: "border-info/32 bg-info/4",
    description: "text-foreground/60",
    icon: Icons.info,
    iconClassName: "size-3 text-info",
    message: "text-info",
  },
  success: {
    container: "border-success/32 bg-success/4",
    description: "text-foreground/60",
    icon: Icons.checkCircle,
    iconClassName: "size-3.5 text-success",
    message: "text-foreground/85",
  },
  warning: {
    container: "border-warning/32 bg-warning/4",
    description: "text-foreground/60",
    icon: Icons.alertTriangle,
    iconClassName: "size-3.5 text-warning",
    message: "text-foreground/85",
  },
} as const;

function useIsSingleLineText(text: string) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isSingleLine, setIsSingleLine] = useState(true);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!(element && text)) {
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
  }, [text]);

  return { isSingleLine, textRef };
}

/** Centers side icons in the text line box; outer stretch keeps first-line alignment on wrap. */
function BannerLineSlot({
  children,
  className,
  multiline,
  slotClassName = "w-4",
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
        <div className={cn("flex h-lh items-center justify-center", slotClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-lh shrink-0 items-center justify-center", slotClassName, className)}>
      {children}
    </div>
  );
}

export interface AlertBannerProps {
  actions?: ReactNode;
  className?: string;
  description?: string;
  dismissDisabled?: boolean;
  dismissLabel?: string;
  message: string;
  onDismiss?: () => void;
  variant: AlertBannerVariant;
}

export function AlertBanner({
  actions,
  className,
  description,
  dismissDisabled,
  dismissLabel,
  message,
  onDismiss,
  variant,
}: AlertBannerProps) {
  const { isSingleLine, textRef } = useIsSingleLineText(message);
  const config = variantConfig[variant];
  const Icon = config.icon;
  const isDismissible = Boolean(onDismiss && dismissLabel);
  const hasActions = Boolean(actions);
  const isMultiline = Boolean(description) || !isSingleLine;
  const isStatusOutput = variant === "info" || variant === "success";
  const BannerTag = variant === "error" || variant === "warning" ? "div" : "output";

  return (
    <BannerTag
      aria-atomic={isStatusOutput ? "true" : undefined}
      aria-live={isStatusOutput ? "polite" : undefined}
      className={cn(
        "flex w-full min-w-0 gap-x-1 overflow-hidden rounded-xl border px-3.5 py-2 text-card-foreground text-xs",
        config.container,
        isMultiline ? "items-start" : "items-center",
        className,
      )}
      role={variant === "error" || variant === "warning" ? "alert" : undefined}
    >
      <BannerLineSlot multiline={isMultiline}>
        <Icon aria-hidden="true" className={config.iconClassName} />
      </BannerLineSlot>
      <div className="m-0 flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "wrap-anywhere m-0 min-w-0 text-xs",
            config.message,
            description && "font-medium text-foreground/90",
            !isMultiline && "flex min-h-lh items-center",
          )}
          ref={textRef}
          title={message}
        >
          {message}
        </p>
        {description ? (
          <p
            className={cn(
              "m-0 truncate text-[calc(var(--text-xs)-1px)] leading-4",
              config.description,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {hasActions ? (
        <BannerLineSlot multiline={isMultiline} slotClassName="w-auto">
          {actions}
        </BannerLineSlot>
      ) : null}
      {!hasActions && isDismissible ? (
        <BannerLineSlot multiline={isMultiline}>
          <Button
            aria-label={dismissLabel}
            className="size-4 shrink-0 rounded-sm p-0"
            disabled={dismissDisabled}
            onClick={onDismiss}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <Icons.close aria-hidden="true" className="size-3.5" />
          </Button>
        </BannerLineSlot>
      ) : null}
    </BannerTag>
  );
}
