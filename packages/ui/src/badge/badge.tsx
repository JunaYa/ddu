import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.ts";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 font-medium text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        "primary-muted": "bg-primary/20 text-primary [a]:hover:bg-primary/15",
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        mutedBackground: "bg-background text-muted-foreground [a]:hover:bg-muted/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "border-white/80 bg-white/50 dark:bg-white/5",
        // Semantic status variants
        success:
          "bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20 dark:focus-visible:ring-success/40 [a]:hover:bg-success/20",
        warning:
          "bg-warning/10 text-warning focus-visible:ring-warning/20 dark:bg-warning/20 dark:focus-visible:ring-warning/40 [a]:hover:bg-warning/20",
        info: "bg-info/10 text-info focus-visible:ring-info/20 dark:bg-info/20 dark:focus-visible:ring-info/40 [a]:hover:bg-info/20",
        // Color variants
        neutral:
          "border-transparent bg-neutral-500/10 text-neutral-600 dark:bg-neutral-500/20 dark:text-neutral-400 [a]:hover:bg-neutral-500/20",
        slate:
          "border-transparent bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 [a]:hover:bg-slate-500/20",
        gray: "border-transparent bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 [a]:hover:bg-gray-500/20",
        zinc: "border-transparent bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 [a]:hover:bg-zinc-500/20",
        stone:
          "border-transparent bg-stone-500/10 text-stone-600 dark:bg-stone-500/20 dark:text-stone-400 [a]:hover:bg-stone-500/20",
        red: "border-transparent bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 [a]:hover:bg-red-500/20",
        orange:
          "border-transparent bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 [a]:hover:bg-orange-500/20",
        amber:
          "border-transparent bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 [a]:hover:bg-amber-500/20",
        yellow:
          "border-transparent bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 [a]:hover:bg-yellow-500/20",
        lime: "border-transparent bg-lime-500/10 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400 [a]:hover:bg-lime-500/20",
        green:
          "border-transparent bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 [a]:hover:bg-green-500/20",
        emerald:
          "border-transparent bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 [a]:hover:bg-emerald-500/20",
        teal: "border-transparent bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 [a]:hover:bg-teal-500/20",
        cyan: "border-transparent bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 [a]:hover:bg-cyan-500/20",
        sky: "border-transparent bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 [a]:hover:bg-sky-500/20",
        blue: "border-transparent bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 [a]:hover:bg-blue-500/20",
        indigo:
          "border-transparent bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 [a]:hover:bg-indigo-500/20",
        violet:
          "border-transparent bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 [a]:hover:bg-violet-500/20",
        purple:
          "border-transparent bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 [a]:hover:bg-purple-500/20",
        fuchsia:
          "border-transparent bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 [a]:hover:bg-fuchsia-500/20",
        pink: "border-transparent bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 [a]:hover:bg-pink-500/20",
        rose: "border-transparent bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 [a]:hover:bg-rose-500/20",
        // Solid color variants (for active/selected states)
        "neutral-solid":
          "border-transparent bg-neutral-500/60 text-neutral-950 dark:text-neutral-100/80 [a]:hover:bg-neutral-500/80",
        "slate-solid":
          "border-transparent bg-slate-500/60 text-slate-950 dark:text-slate-100/80 [a]:hover:bg-slate-500/80",
        "gray-solid":
          "border-transparent bg-gray-500/60 text-gray-950 dark:text-gray-100/80 [a]:hover:bg-gray-500/80",
        "zinc-solid":
          "border-transparent bg-zinc-500/60 text-zinc-950 dark:text-zinc-100/80 [a]:hover:bg-zinc-500/80",
        "stone-solid":
          "border-transparent bg-stone-500/60 text-stone-950 dark:text-stone-100/80 [a]:hover:bg-stone-500/80",
        "red-solid":
          "border-transparent bg-red-500/60 text-red-950 dark:text-red-100/80 [a]:hover:bg-red-500/80",
        "orange-solid":
          "border-transparent bg-orange-500/60 text-orange-950 dark:text-orange-100/80 [a]:hover:bg-orange-500/80",
        "amber-solid":
          "border-transparent bg-amber-500/60 text-amber-950 dark:text-amber-100/80 [a]:hover:bg-amber-500/80",
        "yellow-solid":
          "border-transparent bg-yellow-500/60 text-yellow-950 dark:text-yellow-100/80 [a]:hover:bg-yellow-500/80",
        "lime-solid":
          "border-transparent bg-lime-500/60 text-lime-950 dark:text-lime-100/80 [a]:hover:bg-lime-500/80",
        "green-solid":
          "border-transparent bg-green-500/60 text-green-950 dark:text-green-100/80 [a]:hover:bg-green-500/80",
        "emerald-solid":
          "border-transparent bg-emerald-500/60 text-emerald-950 dark:text-emerald-100/80 [a]:hover:bg-emerald-500/80",
        "teal-solid":
          "border-transparent bg-teal-500/60 text-teal-950 dark:text-teal-100/80 [a]:hover:bg-teal-500/80",
        "cyan-solid":
          "border-transparent bg-cyan-500/60 text-cyan-950 dark:text-cyan-100/80 [a]:hover:bg-cyan-500/80",
        "sky-solid":
          "border-transparent bg-sky-500/60 text-sky-950 dark:text-sky-100/80 [a]:hover:bg-sky-500/80",
        "blue-solid":
          "border-transparent bg-blue-500/60 text-blue-950 dark:text-blue-100/80 [a]:hover:bg-blue-500/80",
        "indigo-solid":
          "border-transparent bg-indigo-500/60 text-indigo-950 dark:text-indigo-100/80 [a]:hover:bg-indigo-500/80",
        "violet-solid":
          "border-transparent bg-violet-500/60 text-violet-950 dark:text-violet-100/80 [a]:hover:bg-violet-500/80",
        "purple-solid":
          "border-transparent bg-purple-500/60 text-purple-950 dark:text-purple-100/80 [a]:hover:bg-purple-500/80",
        "fuchsia-solid":
          "border-transparent bg-fuchsia-500/60 text-fuchsia-950 dark:text-fuchsia-100/80 [a]:hover:bg-fuchsia-500/80",
        "pink-solid":
          "border-transparent bg-pink-500/60 text-pink-950 dark:text-pink-100/80 [a]:hover:bg-pink-500/80",
        "rose-solid":
          "border-transparent bg-rose-500/60 text-rose-950 dark:text-rose-100/80 [a]:hover:bg-rose-500/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

const BADGE_COLORS = [
  "neutral",
  "slate",
  "gray",
  "zinc",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

type BadgeColor = (typeof BADGE_COLORS)[number];

export { Badge, BADGE_COLORS, type BadgeColor, badgeVariants };
