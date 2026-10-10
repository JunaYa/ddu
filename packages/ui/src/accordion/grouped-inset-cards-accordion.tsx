import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type * as React from "react";

import { cn } from "../lib/utils.ts";
import { InsetContent, InsetFrame, InsetTrigger } from "./accordion-primitives.tsx";

function GroupedInsetCardsAccordion({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <InsetFrame className={className}>
      {/* Inner container with background and padding for cards */}
      <div className="relative z-10 overflow-hidden p-0">
        <AccordionPrimitive.Root
          className="space-y-1"
          data-slot="grouped-inset-cards-accordion"
          {...props}
        >
          {children}
        </AccordionPrimitive.Root>
      </div>
    </InsetFrame>
  );
}

function GroupedInsetCardsAccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "overflow-hidden rounded border border-border transition-all",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "data-[state=closed]:border-border/50",
        "data-[state=open]:shadow-[0_2px_4px_rgba(0,0,0,0.06)]",
        className,
      )}
      data-slot="grouped-inset-cards-accordion-item"
      {...props}
    />
  );
}

interface GroupedInsetCardsAccordionTriggerProps extends React.ComponentProps<
  typeof AccordionPrimitive.Trigger
> {
  icon?: "chevron" | "plus-minus";
}

function GroupedInsetCardsAccordionTrigger({
  className,
  children,
  icon = "chevron",
  ...props
}: GroupedInsetCardsAccordionTriggerProps) {
  return (
    <InsetTrigger
      className={cn(
        "[&[data-state=open]]:rounded-t-md [&[data-state=open]]:rounded-b-none",
        "[&[data-state=closed]]:rounded-sm",
        className,
      )}
      dataSlot="grouped-inset-cards-accordion-trigger"
      icon={icon}
      {...props}
    >
      {children}
    </InsetTrigger>
  );
}

function GroupedInsetCardsAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <InsetContent
      contentClassName={cn("rounded-b-lg", className)}
      dataSlot="grouped-inset-cards-accordion-content"
      {...props}
    >
      {children}
    </InsetContent>
  );
}

export {
  GroupedInsetCardsAccordion,
  GroupedInsetCardsAccordionItem,
  GroupedInsetCardsAccordionTrigger,
  GroupedInsetCardsAccordionContent,
};
