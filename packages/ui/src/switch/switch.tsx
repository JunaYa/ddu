"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { Loader2 } from "lucide-react";

import { cn } from "../lib/utils.ts";

type SwitchProps = SwitchPrimitive.Root.Props & {
  /** Show a spinner inside the thumb and block interaction while pending. */
  loading?: boolean;
};

function Switch({ className, loading, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inset-shadow-[0_1px_--theme(--color-black/6%)] inline-flex h-[calc(var(--thumb-size)+2px)] w-[calc(var(--thumb-size)*2-2px)] shrink-0 items-center rounded-full p-px outline-none transition-[background-color,box-shadow] duration-200 [--thumb-size:--spacing(5)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-checked:bg-primary data-unchecked:bg-input data-disabled:opacity-64 sm:[--thumb-size:--spacing(4)]",
        className,
      )}
      data-slot="switch"
      {...props}
      disabled={loading || props.disabled}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none inline-flex aspect-square h-full origin-left in-[[role=switch]:active,[data-slot=label]:active]:not-data-disabled:scale-x-110 items-center justify-center in-[[role=switch]:active,[data-slot=label]:active]:rounded-[var(--thumb-size)/calc(var(--thumb-size)*1.1)] rounded-(--thumb-size) bg-background shadow-sm/5 will-change-transform [transition:translate_.15s,border-radius_.15s,scale_.1s_.1s,transform-origin_.15s] data-checked:origin-[var(--thumb-size)_50%] data-checked:translate-x-[calc(var(--thumb-size)-4px)]",
        )}
        data-slot="switch-thumb"
      >
        {loading && (
          <Loader2 aria-label="Saving" className="size-2.5 animate-spin text-muted-foreground" />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
