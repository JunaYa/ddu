import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { Icons } from "../icons/icons.tsx";
import { cn } from "../lib/utils.ts";

const statusVariants = cva("inline-flex shrink-0 items-center", {
  variants: {
    status: {
      processing: "text-muted-foreground",
      success: "text-success",
      danger: "text-destructive",
      warning: "text-warning",
    },
    display: {
      icon: "",
      label: "",
      "icon-label": "gap-1.5",
    },
    size: {
      sm: "[&_svg]:size-3",
      md: "[&_svg]:size-3.5",
      lg: "[&_svg]:size-4",
    },
  },
  defaultVariants: {
    status: "processing",
    display: "icon",
    size: "md",
  },
});

const STATUS_ICONS = {
  processing: Icons.spinner,
  success: Icons.statusSuccess,
  danger: Icons.statusDanger,
  warning: Icons.statusWarning,
} as const;

type StatusVariantProps = VariantProps<typeof statusVariants>;

interface StatusIndicatorProps
  extends Omit<React.ComponentProps<"span">, "children">, StatusVariantProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label?: string;
}

export function StatusIndicator({
  className,
  status = "processing",
  display = "icon",
  size = "md",
  label,
  icon,
  ...props
}: StatusIndicatorProps) {
  const IconComponent = icon ?? STATUS_ICONS[status ?? "processing"];
  const showIcon = display === "icon" || display === "icon-label";
  const showLabel = display === "label" || display === "icon-label";

  return (
    <span
      className={cn(statusVariants({ status, display, size }), className)}
      data-slot="status-indicator"
      data-status={status}
      {...props}
    >
      {showIcon && (
        <IconComponent
          aria-hidden="true"
          className={cn(status === "processing" && "animate-spin")}
        />
      )}
      {showLabel && label && <span className="font-medium text-xs">{label}</span>}
    </span>
  );
}
