import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type * as React from "react";

import { cn } from "../lib/utils.ts";
import { InsetContent, InsetFrame, InsetTrigger } from "./accordion-primitives.tsx";

function GroupedInsetAccordion({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <InsetFrame className={className}>
      {/* Inner container with background */}
      <div className="relative z-10 overflow-hidden rounded border border-foreground/5">
        <AccordionPrimitive.Root
          className="space-y-0"
          data-slot="grouped-inset-accordion"
          {...props}
        >
          {children}
        </AccordionPrimitive.Root>
      </div>
    </InsetFrame>
  );
}

function GroupedInsetAccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("transition-all", className)}
      data-slot="grouped-inset-accordion-item"
      {...props}
    />
  );
}

interface GroupedInsetAccordionTriggerProps extends React.ComponentProps<
  typeof AccordionPrimitive.Trigger
> {
  icon?: "chevron" | "plus-minus";
}

function GroupedInsetAccordionTrigger({
  className,
  children,
  icon = "chevron",
  ...props
}: GroupedInsetAccordionTriggerProps) {
  return (
    <InsetTrigger
      className={className}
      dataSlot="grouped-inset-accordion-trigger"
      icon={icon}
      {...props}
    >
      {children}
    </InsetTrigger>
  );
}

function GroupedInsetAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <InsetContent
      contentClassName={cn("rounded-b-0", className)}
      dataSlot="grouped-inset-accordion-content"
      {...props}
    >
      {children}
    </InsetContent>
  );
}

export {
  GroupedInsetAccordion,
  GroupedInsetAccordionItem,
  GroupedInsetAccordionTrigger,
  GroupedInsetAccordionContent,
};
