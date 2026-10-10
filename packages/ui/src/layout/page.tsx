import type { ReactNode } from "react";
import { cn } from "../lib/utils.ts";

export type PagePadding = "default" | "none";

export interface PageProps {
  children: ReactNode;
  className?: string;
  id?: string;
  padding?: PagePadding;
}

export function Page({ children, className, id = "page", padding = "default" }: PageProps) {
  return (
    <div className={cn("min-h-full", padding === "default" && "pt-8 pb-20", className)} id={id}>
      {children}
    </div>
  );
}

export default Page;
