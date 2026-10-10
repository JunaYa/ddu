import { FileText, ImageIcon, Upload } from "lucide-react";
import { cn } from "../lib/utils.ts";

interface DropOverlayProps {
  /** Optional data-slot attribute for targeting */
  dataSlot?: string;
  /** Subtitle text displayed below the heading */
  description: string;
  /** Heading text displayed in the overlay */
  title: string;
  /** Whether the overlay is visible */
  visible: boolean;
}

/**
 * Presentational overlay shown when files are dragged over a drop target.
 *
 * Renders a backdrop blur with decorative file icons, a title, and a description.
 * Used by both `FullScreenDropzone` and `NotesPanel` to ensure consistent styling.
 */
export function DropOverlay({ dataSlot, description, title, visible }: DropOverlayProps) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "absolute inset-0 z-[var(--z-layer-smoke)] flex items-center justify-center rounded-xl transition-opacity duration-150",
        visible ? "opacity-100" : "pointer-events-none opacity-0 [&_*]:pointer-events-none",
      )}
      data-slot={dataSlot}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm dark:bg-background/85" />

      {/* Centered drop zone content */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Decorative file icons */}
        <div className="relative flex items-end gap-1">
          <div className="flex size-12 -rotate-6 items-center justify-center rounded-xl bg-primary/10 text-primary/60 shadow-sm">
            <ImageIcon className="size-6" />
          </div>
          <div className="z-10 flex size-14 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-md">
            <Upload className="size-7" />
          </div>
          <div className="flex size-12 rotate-6 items-center justify-center rounded-xl bg-primary/10 text-primary/60 shadow-sm">
            <FileText className="size-6" />
          </div>
        </div>

        {/* Copy */}
        <div className="text-center">
          <h2 className="font-semibold text-foreground text-xl tracking-tight">{title}</h2>
          <p className="mt-1.5 text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}
