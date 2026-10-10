import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type * as React from "react";

import { cn } from "../lib/utils.ts";
import { InsetContent, InsetFrame, InsetTrigger } from "./accordion-primitives.tsx";

function InsetAccordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      className={cn("space-y-4", className)}
      data-slot="inset-accordion"
      {...props}
    />
  );
}

function InsetAccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <InsetFrame
      className={cn("transition-all duration-300", "data-[state=open]:shadow-xl", className)}
    >
      <div className="overflow-hidden rounded-sm border border-foreground/5 p-0">
        <AccordionPrimitive.Item data-slot="inset-accordion-item" {...props} />
      </div>
    </InsetFrame>
  );
}

interface InsetAccordionTriggerProps extends React.ComponentProps<
  typeof AccordionPrimitive.Trigger
> {
  icon?: "chevron" | "plus-minus";
}

function InsetAccordionTrigger({
  className,
  children,
  icon = "chevron",
  ...props
}: InsetAccordionTriggerProps) {
  return (
    <InsetTrigger className={className} dataSlot="inset-accordion-trigger" icon={icon} {...props}>
      {children}
    </InsetTrigger>
  );
}

function InsetAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <InsetContent contentClassName={className} dataSlot="inset-accordion-content" {...props}>
      {children}
    </InsetContent>
  );
}

export { InsetAccordion, InsetAccordionItem, InsetAccordionTrigger, InsetAccordionContent };
