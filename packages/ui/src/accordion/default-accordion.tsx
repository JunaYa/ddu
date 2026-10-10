import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils.ts";

type AccordionProps = React.ComponentProps<typeof AccordionPrimitive.Root>;
type AccordionSingleProps = AccordionProps;
type AccordionMultipleProps = AccordionProps;

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b last:border-b-0", className)}
      data-slot="accordion-item"
      {...props}
    />
  );
}

interface AccordionTriggerProps extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
  icon?: "chevron" | "plus" | "plus-minus";
}

function AccordionTrigger({
  className,
  children,
  icon = "chevron",
  ...props
}: AccordionTriggerProps) {
  const IconComponent =
    icon === "plus" ? (
      <PlusIcon
        className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-foreground-muted-rest transition-transform duration-300 ease-in-out"
        data-slot="accordion-indicator"
      />
    ) : icon === "plus-minus" ? (
      <>
        <PlusIcon
          className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-foreground-muted-rest transition-all duration-200"
          data-slot="accordion-plus-icon"
        />
        <MinusIcon
          className="pointer-events-none absolute size-4 shrink-0 translate-y-0.5 scale-0 text-foreground-muted-rest opacity-0 transition-all duration-200"
          data-slot="accordion-minus-icon"
        />
      </>
    ) : (
      <ChevronDownIcon
        className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-foreground-muted-rest transition-transform duration-200"
        data-slot="accordion-indicator"
      />
    );

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group relative flex flex-1 items-start justify-between gap-4 rounded py-4 text-left font-medium text-base outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          icon === "chevron" && "data-panel-open:*:data-[slot=accordion-indicator]:rotate-180",
          icon === "plus" && "data-panel-open:*:data-[slot=accordion-indicator]:rotate-45",
          icon === "plus-minus" &&
            "data-panel-open:**:data-[slot=accordion-plus-icon]:rotate-90 data-panel-open:**:data-[slot=accordion-plus-icon]:scale-0 data-panel-open:**:data-[slot=accordion-plus-icon]:opacity-0 data-panel-open:**:data-[slot=accordion-minus-icon]:scale-100 data-panel-open:**:data-[slot=accordion-minus-icon]:opacity-100",
          className,
        )}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
        <span className="relative flex size-4 translate-y-0.5 items-center justify-center">
          {IconComponent}
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      className="h-(--accordion-panel-height) overflow-hidden text-base transition-[height] duration-200 ease-in-out data-ending-style:h-0 data-starting-style:h-0"
      data-slot="accordion-content"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, AccordionPrimitive };
export type { AccordionMultipleProps, AccordionProps, AccordionSingleProps };
