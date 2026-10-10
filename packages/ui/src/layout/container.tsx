import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../lib/utils.ts";

export type ContainerMaxWidth =
  | "fluid"
  | "widest"
  | "wider"
  | "wide"
  | "default"
  | "narrow"
  | "narrower"
  | "narrowest";

export type ContainerPadding = "all" | "x" | "none";
export type ContainerGap = "none" | "sm" | "md" | "lg";

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
  maxWidth?: ContainerMaxWidth;
  padding?: ContainerPadding;
  gap?: ContainerGap;
}

const maxWidthStyles: Record<ContainerMaxWidth, string> = {
  fluid: "max-w-full",
  widest: "max-w-8xl",
  wider: "max-w-8xl",
  wide: "max-w-5xl",
  default: "max-w-7xl",
  narrow: "max-w-4xl",
  narrower: "max-w-2xl",
  narrowest: "max-w-xl",
};

const paddingStyles: Record<ContainerPadding, string> = {
  all: "p-6",
  x: "px-6",
  none: "p-0",
};

const gapStyles: Record<ContainerGap, string> = {
  none: "gap-0",
  sm: "gap-4",
  md: "gap-8",
  lg: "gap-12",
};

export function Container({
  children,
  className,
  maxWidth = "default",
  padding = "all",
  gap = "md",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto flex w-full min-w-0 flex-col",
        maxWidthStyles[maxWidth],
        paddingStyles[padding],
        gapStyles[gap],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Container;
