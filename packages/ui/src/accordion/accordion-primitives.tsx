import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils.ts";

/**
 * Shared InsetFrame component - creates the gradient border wrapper with hover effect
 * Used by all inset accordion variants
 */
interface InsetFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function InsetFrame({ className, children, ...props }: InsetFrameProps) {
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded p-1",
        "bg-gradient-to-br from-border/40 to-border/60",
        "border border-card shadow-lg",
        className,
      )}
      {...props}
    >
      {/* Hover gradient overlay */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded",
          "bg-gradient-to-br from-border/40 to-border/80",
          "opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
        )}
      />
      {children}
    </div>
  );
}

/**
 * Shared InsetTrigger component - styled trigger with gradient background
 * Used by all inset accordion variants
 */
interface InsetTriggerProps extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
  dataSlot?: string;
  icon?: "chevron" | "plus-minus";
}

export function InsetTrigger({
  className,
  children,
  dataSlot = "inset-accordion-trigger",
  icon = "chevron",
  ...props
}: InsetTriggerProps) {
  const IconComponent =
    icon === "plus-minus" ? (
      <>
        <PlusIcon className="pointer-events-none size-4 shrink-0 text-foreground-muted-rest transition-all duration-200 group-data-[state=open]:rotate-90 group-data-[state=open]:scale-0 group-data-[state=open]:opacity-0" />
        <MinusIcon className="pointer-events-none absolute size-4 shrink-0 scale-0 text-foreground-muted-rest opacity-0 transition-all duration-200 group-data-[state=open]:rotate-0 group-data-[state=open]:scale-100 group-data-[state=open]:opacity-100" />
      </>
    ) : (
      <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-foreground-muted-rest transition-transform duration-200" />
    );

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group relative z-10 flex flex-1 items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-base outline-none transition-all",
          "text-foreground/60 hover:text-foreground",
          "data-[state=open]:text-foreground",
          "bg-gradient-to-br from-background to-card",
          "hover:from-background/90 hover:to-card/90",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          icon === "chevron" && "[&[data-state=open]>span>svg]:rotate-180",
          "border border-border/50 border-b [&[data-state=closed]]:border-b-0",
          "shadow-inner-sm",
          className,
        )}
        data-slot={dataSlot}
        {...props}
      >
        {children}
        <span className="relative flex size-4 items-center justify-center">{IconComponent}</span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * Shared InsetContent component - styled content with gradient background
 * Used by all inset accordion variants
 */
interface InsetContentProps extends React.ComponentProps<typeof AccordionPrimitive.Content> {
  contentClassName?: string;
  dataSlot?: string;
}

export function InsetContent({
  className,
  children,
  dataSlot = "inset-accordion-content",
  contentClassName,
  ...props
}: InsetContentProps) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "relative z-10 overflow-hidden text-base data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className,
      )}
      data-slot={dataSlot}
      {...props}
    >
      <div
        className={cn(
          "border border-border/50 border-t-0 bg-gradient-to-b from-background/20 to-card px-6 py-4",
          "shadow-inner-sm",
          contentClassName,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}
