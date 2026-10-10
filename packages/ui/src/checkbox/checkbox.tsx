"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "../lib/utils.ts";

const checkboxVariants = cva(
  "peer relative flex shrink-0 items-center justify-center border border-input outline-none transition-colors after:absolute hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-disabled:pointer-events-none data-checked:border-primary data-indeterminate:border-primary data-checked:bg-primary data-indeterminate:bg-primary data-checked:text-primary-foreground data-indeterminate:text-primary-foreground data-disabled:opacity-50 dark:bg-input/30 dark:data-checked:bg-primary dark:data-indeterminate:bg-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "size-3.5 rounded-[3px] after:-inset-x-3 after:-inset-y-2 [&_svg]:size-3",
        default: "size-4 rounded-[4px] after:-inset-x-3 after:-inset-y-2 [&_svg]:size-3.5",
        lg: "size-5 rounded-[5px] after:-inset-x-2.5 after:-inset-y-1.5 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Checkbox({
  className,
  size,
  ...props
}: CheckboxPrimitive.Root.Props & VariantProps<typeof checkboxVariants>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(checkboxVariants({ size }), className)}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="grid place-content-center text-current transition-none"
        data-slot="checkbox-indicator"
      >
        {props.indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
