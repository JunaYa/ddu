import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type React from "react";
import { cn } from "../lib/utils.ts";

const separatorDefaultClassName =
  "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch";

function separatorGradientClassName(orientation: "horizontal" | "vertical"): string {
  if (orientation === "vertical") {
    return "w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-border/60 to-transparent";
  }
  return "h-px w-full shrink-0 bg-gradient-to-r from-transparent via-border/60 to-transparent";
}

export type SeparatorProps = SeparatorPrimitive.Props & {
  variant?: "default" | "gradient";
};

export function Separator({
  className,
  orientation = "horizontal",
  variant = "default",
  ...props
}: SeparatorProps): React.ReactElement {
  return (
    <SeparatorPrimitive
      className={cn(
        variant === "gradient"
          ? separatorGradientClassName(orientation)
          : separatorDefaultClassName,
        className,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  );
}

export { SeparatorPrimitive };
