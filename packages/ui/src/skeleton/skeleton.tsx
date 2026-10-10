import { cn } from "../lib/utils.ts";

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "rainbow";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(variant === "rainbow" ? "skeleton-rainbow" : "skeleton bg-accent", className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
