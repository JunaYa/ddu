import type { ReactNode } from "react";
import { cn } from "../lib/utils.ts";
import { SectionHeader } from "./section-header.tsx";

export type SectionSpacing = "tight" | "default" | "loose" | "xloose";

export interface SectionProps {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  headerClassName?: string;
  id?: string;
  removeTopSpacing?: boolean;
  spacing?: SectionSpacing;
  title?: ReactNode;
}

const spacingClasses: Record<SectionSpacing, string> = {
  tight: "space-y-4 py-8",
  default: "space-y-6 py-16",
  loose: "space-y-8 py-16 md:py-20",
  xloose: "space-y-8 py-24 md:py-32",
};

export function Section({
  actions,
  children,
  className,
  description,
  headerClassName,
  id,
  removeTopSpacing = true,
  spacing = "default",
  title,
}: SectionProps) {
  return (
    <section
      className={cn(spacingClasses[spacing], removeTopSpacing && "pt-0 md:pt-0", className)}
      id={id}
    >
      {title ? (
        <SectionHeader
          actions={actions}
          className={headerClassName}
          description={description}
          title={title}
          variant="secondary"
        />
      ) : null}
      {children}
    </section>
  );
}

export default Section;
