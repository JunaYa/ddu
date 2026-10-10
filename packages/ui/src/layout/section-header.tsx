import type { ReactNode } from "react";
import { cn } from "../lib/utils.ts";

export type SectionHeaderAlign = "left" | "center" | "right";
export type SectionHeaderPadding = "none" | "tight" | "default" | "loose";
export type SectionHeaderVariant = "display" | "primary" | "secondary" | "muted" | "subtle";

export interface SectionHeaderProps {
  actions?: ReactNode;
  align?: SectionHeaderAlign;
  className?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  padding?: SectionHeaderPadding;
  title: ReactNode;
  titleClassName?: string;
  variant?: SectionHeaderVariant;
}

const paddingClasses: Record<SectionHeaderPadding, string> = {
  none: "",
  tight: "py-4 sm:py-6 md:py-8",
  default: "py-8 sm:py-16 md:py-20",
  loose: "py-12 sm:py-20 md:py-28",
};

const alignClasses: Record<SectionHeaderAlign, string> = {
  center: "mx-auto text-center",
  right: "ml-auto text-right",
  left: "",
};

const variantConfig = {
  display: {
    TitleTag: "h1",
    DescTag: "h5",
    titleClass: "max-w-2xl text-balance font-bold text-6xl",
    descClass: "mt-4 max-w-xl text-balance text-3xl text-muted-foreground",
    withPadding: true,
  },
  primary: {
    TitleTag: "h1",
    DescTag: "h5",
    titleClass: "font-bold",
    descClass: "mt-2 max-w-2xl text-balance text-muted-foreground",
    withPadding: false,
  },
  secondary: {
    TitleTag: "h2",
    DescTag: "h5",
    titleClass: "font-semibold text-foreground",
    descClass: "mt-2 max-w-2xl text-balance text-muted-foreground",
    withPadding: false,
  },
  muted: {
    TitleTag: "h5",
    DescTag: "p",
    titleClass: "font-medium text-foreground",
    descClass: "mt-1 max-w-lg text-balance text-muted-foreground/80",
    withPadding: false,
  },
  subtle: {
    TitleTag: "h6",
    DescTag: "p",
    titleClass: "font-normal text-muted-foreground",
    descClass: "mt-1 max-w-md text-balance text-muted-foreground/70",
    withPadding: false,
  },
} as const;

export function SectionHeader({
  actions,
  align = "left",
  className,
  description,
  descriptionClassName,
  padding = "default",
  title,
  titleClassName,
  variant = "primary",
}: SectionHeaderProps) {
  const config = variantConfig[variant];
  const { TitleTag, DescTag, titleClass, descClass, withPadding } = config;

  const content = (
    <>
      <div className="min-w-0">
        <TitleTag className={cn(titleClass, alignClasses[align], titleClassName)}>{title}</TitleTag>
        {description ? (
          <DescTag className={cn(descClass, alignClasses[align], descriptionClassName)}>
            {description}
          </DescTag>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </>
  );

  const paddedContent = withPadding ? (
    <div className={cn(paddingClasses[padding])}>{content}</div>
  ) : (
    content
  );

  return (
    <div
      className={cn(
        actions
          ? "flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3"
          : "",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {paddedContent}
    </div>
  );
}
