import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type React from "react";

import { cn } from "../lib/utils.ts";

// Shared by the `size: 'tile'` option and the `variant: 'tile'` + default-size
// compound variant so the tile geometry has a single source of truth.
const TILE_SIZING =
  "h-24 w-24 min-w-0 flex-col gap-2 whitespace-normal rounded-xl px-3 py-3 text-center text-xs leading-tight [&_svg:not([class*='size-'])]:size-5";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent bg-clip-padding font-medium outline-none transition-[background-color,color,border-color,box-shadow,opacity,translate] pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-[''] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90 aria-expanded:bg-foreground/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 aria-expanded:bg-destructive/90 dark:bg-destructive/80 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/80",
        "destructive-muted":
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 aria-expanded:bg-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground",
        "ghost-destructive":
          "text-destructive hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive dark:hover:bg-destructive/15",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 aria-expanded:bg-primary/90",
        "primary-rich":
          "not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary/40 bg-linear-to-b from-primary/10 to-primary/20 text-primary shadow-primary/24 shadow-xs/50 hover:border-primary/50 hover:bg-primary/25 hover:text-primary data-pressed:bg-primary/90 *:data-[slot=button-loading-indicator]:text-primary-foreground [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        "primary-muted":
          "bg-primary/20 text-primary hover:bg-primary/15 aria-expanded:bg-primary/15",
        link: "text-primary underline-offset-4 hover:underline",
        overlay:
          "border-border/50 bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-background/90 aria-expanded:bg-background/90 dark:border-border/40 dark:bg-background/60 dark:hover:bg-background/70",
        tile: "border-border bg-card text-card-foreground shadow-xs hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground",
      },
      size: {
        default: "h-10 min-w-16 px-3 py-1 text-base has-[>svg]:px-3",
        xs: "h-7 min-w-12 rounded-md px-2 py-1 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 min-w-16 px-2 py-1 text-sm has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 text-lg has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-7 text-xl has-[>svg]:px-5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
        "icon-xl": "size-12 [&_svg:not([class*='size-'])]:size-5",
        tile: TILE_SIZING,
      },
    },
    compoundVariants: [
      {
        variant: "tile",
        size: "default",
        className: TILE_SIZING,
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  disabled,
  loading = false,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  }) {
  const { "aria-busy": ariaBusy, ...buttonProps } = props;

  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      aria-busy={loading ? true : ariaBusy}
      aria-disabled={loading || undefined}
      data-slot="button"
      data-loading={loading ? "" : undefined}
      disabled={Boolean(loading || disabled)}
      {...buttonProps}
    >
      {loading ? (
        <>
          <Loader2Icon
            aria-hidden="true"
            className="pointer-events-none size-4 animate-spin"
            data-slot="button-loading-indicator"
          />
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
export type ButtonProps = React.ComponentProps<typeof Button>;
