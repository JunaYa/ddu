import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, type HTMLMotionProps, m, useReducedMotion } from "motion/react";
import * as React from "react";

import { cn } from "../lib/utils.ts";
import { MotionFeatures } from "../motion/motion-features.tsx";
import { Button } from "../button/button.tsx";

interface ConnectedPanelContextValue {
  align: ConnectedPanelAlign;
  contentId: string;
  contentWidth: number | string;
  duration: number;
  open: boolean;
  reducedMotion: boolean;
  setOpen: (open: boolean) => void;
}

const ConnectedPanelContext = React.createContext<ConnectedPanelContextValue | null>(null);

function useConnectedPanelContext(component: string) {
  const context = React.useContext(ConnectedPanelContext);

  if (!context) {
    throw new Error(`${component} must be used within ConnectedPanel`);
  }

  return context;
}

type ConnectedPanelAlign = "start" | "center" | "end";

interface ConnectedPanelProps extends Omit<HTMLMotionProps<"div">, "children"> {
  align?: ConnectedPanelAlign;
  children: React.ReactNode;
  collapsedWidth?: number | string;
  contentWidth?: number | string;
  defaultOpen?: boolean;
  duration?: number;
  expandedWidth?: number | string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  wrapperClassName?: string;
}

const DEFAULT_CONNECTED_PANEL_DURATION = 0.32;
const PANEL_SIZE_EASE = [0.2, 0, 0, 1] as const;
const PANEL_OPACITY_EASE = "easeOut";
const LABEL_SPRING = { type: "spring", stiffness: 500, damping: 34 } as const;
const ALIGN_JUSTIFY_CLASS: Record<ConnectedPanelAlign, string> = {
  center: "justify-center",
  end: "justify-end",
  start: "justify-start",
};

function toCssLength(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

function ConnectedPanel({
  align = "start",
  children,
  className,
  collapsedWidth = 192,
  contentWidth,
  defaultOpen = false,
  duration = DEFAULT_CONNECTED_PANEL_DURATION,
  expandedWidth = 320,
  onOpenChange,
  open: controlledOpen,
  transition,
  wrapperClassName,
  ...props
}: ConnectedPanelProps): React.ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  const reducedMotion = Boolean(useReducedMotion());
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  const value = React.useMemo(
    () => ({
      align,
      contentId,
      contentWidth: contentWidth ?? `calc(${toCssLength(expandedWidth)} - 2px)`,
      duration,
      open,
      reducedMotion,
      setOpen,
    }),
    [align, contentId, contentWidth, duration, expandedWidth, open, reducedMotion, setOpen],
  );

  const surface = (
    <m.div
      animate={{ width: open ? expandedWidth : collapsedWidth }}
      className={cn(
        "relative inline-flex min-w-0 max-w-full flex-col overflow-hidden rounded-md border border-border bg-background/85 text-foreground shadow-md backdrop-blur-md",
        className,
      )}
      data-open={open ? "" : undefined}
      data-slot="connected-panel"
      initial={false}
      transition={
        reducedMotion ? { duration: 0 } : (transition ?? { duration, ease: PANEL_SIZE_EASE })
      }
      {...props}
    >
      {children}
    </m.div>
  );

  return (
    <MotionFeatures>
      <ConnectedPanelContext.Provider value={value}>
        {align === "start" ? (
          surface
        ) : (
          <div
            className={cn("inline-flex max-w-full", ALIGN_JUSTIFY_CLASS[align], wrapperClassName)}
            data-slot="connected-panel-anchor"
            style={{ width: toCssLength(expandedWidth) }}
          >
            {surface}
          </div>
        )}
      </ConnectedPanelContext.Provider>
    </MotionFeatures>
  );
}

interface ConnectedPanelTriggerProps extends Omit<React.ComponentProps<typeof Button>, "children"> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  showChevron?: boolean;
  summary?: React.ReactNode;
}

interface ConnectedPanelContentProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
}

function ConnectedPanelTrigger({
  children,
  className,
  icon,
  label,
  onClick,
  showChevron = true,
  summary,
  ...props
}: ConnectedPanelTriggerProps): React.ReactElement {
  const { contentId, open, reducedMotion, setOpen } =
    useConnectedPanelContext("ConnectedPanelTrigger");

  return (
    <Button
      aria-controls={contentId}
      aria-expanded={open}
      className={cn(
        "relative h-9 w-full justify-start rounded-none border-0 bg-transparent px-3 shadow-none hover:bg-accent/70",
        className,
      )}
      data-slot="connected-panel-trigger"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(!open);
        }
      }}
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? (
        <>
          {icon ?? (
            <SlidersHorizontal aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="relative min-w-0 flex-1 overflow-hidden text-left text-sm">
            <AnimatePresence initial={false} mode="popLayout">
              <m.span
                animate={{ opacity: 1, y: 0 }}
                className="block truncate"
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                key={[label, summary]
                  .map((value) =>
                    typeof value === "string" || typeof value === "number" ? value : "",
                  )
                  .join("-")}
                transition={reducedMotion ? { duration: 0.12 } : LABEL_SPRING}
              >
                {label ? <span className="text-muted-foreground">{label}</span> : null}
                {label && summary ? (
                  <span className="px-1.5 text-muted-foreground/60">/</span>
                ) : null}
                {summary ? <span>{summary}</span> : null}
              </m.span>
            </AnimatePresence>
          </span>
          {showChevron ? (
            <m.span
              animate={{ rotate: open ? 180 : 0 }}
              aria-hidden="true"
              className="flex shrink-0 text-muted-foreground"
              transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <ChevronDown className="size-4" />
            </m.span>
          ) : null}
        </>
      )}
    </Button>
  );
}

function ConnectedPanelContent({
  children,
  className,
  ...props
}: ConnectedPanelContentProps): React.ReactElement {
  const { align, contentId, contentWidth, duration, open, reducedMotion } =
    useConnectedPanelContext("ConnectedPanelContent");
  const contentWidthValue = toCssLength(contentWidth);
  const contentWidthStyle =
    align === "center"
      ? { marginInlineStart: `calc((100% - ${contentWidthValue}) / 2)`, width: contentWidthValue }
      : {
          marginInlineStart: align === "end" ? `calc(100% - ${contentWidthValue})` : undefined,
          width: contentWidthValue,
        };

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          animate={{ height: "auto" }}
          className={cn("overflow-hidden border-border border-t", className)}
          data-slot="connected-panel-content"
          exit={{ height: 0 }}
          id={contentId}
          initial={{ height: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration, ease: PANEL_SIZE_EASE }}
          {...props}
        >
          <div className="box-border" style={contentWidthStyle}>
            <m.div
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)" }}
              className="box-border"
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(2px)" }}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(2px)" }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      filter: { duration, ease: PANEL_OPACITY_EASE },
                      opacity: { duration, ease: PANEL_OPACITY_EASE },
                    }
              }
            >
              {children}
            </m.div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConnectedPanelHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("flex flex-col gap-1 border-border/70 border-b px-4 py-3", className)}
      data-slot="connected-panel-header"
      {...props}
    />
  );
}

function ConnectedPanelTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("font-medium text-sm", className)}
      data-slot="connected-panel-title"
      {...props}
    />
  );
}

function ConnectedPanelDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="connected-panel-description"
      {...props}
    />
  );
}

function ConnectedPanelBody({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div className={cn("min-w-0 p-3", className)} data-slot="connected-panel-body" {...props} />
  );
}

function ConnectedPanelFooter({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-border/70 border-t px-3 py-2",
        className,
      )}
      data-slot="connected-panel-footer"
      {...props}
    />
  );
}

export {
  ConnectedPanel,
  ConnectedPanelBody,
  ConnectedPanelContent,
  ConnectedPanelDescription,
  ConnectedPanelFooter,
  ConnectedPanelHeader,
  ConnectedPanelTitle,
  ConnectedPanelTrigger,
};

export type { ConnectedPanelProps, ConnectedPanelTriggerProps };
