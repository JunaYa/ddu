"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import type * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../button/button.tsx";
import { cn } from "../lib/utils.ts";
import { MotionFeatures } from "../motion/motion-features.tsx";

// Tracks the visual viewport height, which shrinks when the soft keyboard appears.
// Regular vh / dvh do not reliably account for the keyboard on iOS Safari.
function useVisualViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 600,
  );
  useLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return height;
}

interface ExpandableTextareaProps extends React.ComponentProps<"textarea"> {
  expandButtonPortalContainer?: Element | null;
  expandedTitle?: string;
  onExpandChange?: (expanded: boolean) => void;
  renderExpandButton?: (props: { disabled?: boolean; onClick: () => void }) => React.ReactNode;
  rows?: number;
  showExpandButton?: boolean;
}

function ExpandableTextarea({
  className,
  rows = 3,
  value: valueProp,
  defaultValue,
  onChange,
  expandedTitle,
  onExpandChange,
  expandButtonPortalContainer,
  showExpandButton = true,
  renderExpandButton,
  placeholder,
  disabled,
  ...props
}: ExpandableTextareaProps) {
  const expandedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (defaultValue === undefined || defaultValue === null) return "";
    if (Array.isArray(defaultValue)) return defaultValue.join(",");
    return String(defaultValue);
  });
  const currentValue = isControlled ? String(valueProp ?? "") : internalValue;

  const [isExpanded, setIsExpanded] = useState(false);
  const vpHeight = useVisualViewportHeight();
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    },
    [isControlled, onChange],
  );

  const expand = useCallback(() => {
    if (isExpanded) return;
    setIsExpanded(true);
    onExpandChange?.(true);
  }, [isExpanded, onExpandChange]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    onExpandChange?.(false);
  }, [onExpandChange]);

  // Intercept Escape in capture phase before any parent dialog sees it
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        collapse();
      }
    };
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [isExpanded, collapse]);

  useEffect(() => {
    if (!isExpanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isExpanded]);

  // Focus the expanded textarea after the morph animation settles
  useEffect(() => {
    if (!isExpanded) return;
    const t = setTimeout(() => {
      expandedTextareaRef.current?.focus();
    }, 320);
    return () => clearTimeout(t);
  }, [isExpanded]);

  const collapsedControlClassName = cn(
    "relative inline-flex w-full",
    "rounded-lg border border-input bg-background not-dark:bg-clip-padding",
    "text-base text-foreground shadow-xs/5 ring-ring/24",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)]",
    "has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16",
    "has-aria-invalid:border-destructive/36 has-focus-visible:border-ring",
    "has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px]",
    "not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)]",
    "pointer-fine:text-sm dark:bg-input/32 dark:has-aria-invalid:ring-destructive/24",
    "dark:not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]",
    "transform-gpu transition-shadow will-change-transform",
    className,
  );

  const collapsedTextareaContent = (
    <>
      <textarea
        className={cn(
          "w-full resize-none overflow-y-auto break-all rounded-[inherit] px-[calc(--spacing(3)-1px)] pt-[calc(--spacing(1.5)-1px)] text-sm outline-none",
          showExpandButton && !expandButtonPortalContainer
            ? "pb-7"
            : "pb-[calc(--spacing(1.5)-1px)]",
        )}
        data-slot="expandable-textarea"
        disabled={disabled}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        style={props.style}
        value={currentValue}
        {...props}
      />
      {showExpandButton &&
        renderExpandButton &&
        expandButtonPortalContainer &&
        createPortal(
          renderExpandButton({ disabled, onClick: expand }),
          expandButtonPortalContainer,
        )}
      {showExpandButton &&
        renderExpandButton &&
        !expandButtonPortalContainer &&
        renderExpandButton({ disabled, onClick: expand })}
      {showExpandButton && !renderExpandButton && (
        <Button
          aria-label="Expand editor"
          className="absolute right-0 bottom-0 h-7 w-7 text-muted-foreground"
          disabled={disabled}
          onClick={expand}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Maximize2 className="size-3.5" />
        </Button>
      )}
    </>
  );

  return (
    <MotionFeatures>
      {/* ── Collapsed state (in-tree) ───────────────────────────────────────── */}
      <div
        className={cn(collapsedControlClassName, isExpanded && "invisible")}
        data-slot="expandable-textarea-control"
        inert={isExpanded || undefined}
      >
        <div className="relative w-full">{collapsedTextareaContent}</div>
      </div>

      {mounted &&
        createPortal(
          <>
            <AnimatePresence>
              {isExpanded && (
                <m.div
                  animate={{ opacity: 1 }}
                  aria-hidden="true"
                  className="fixed inset-0 z-[var(--z-layer-smoke)] bg-black/20 backdrop-blur-sm"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  onClick={collapse}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <div className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-layer-modal) p-4 sm:inset-0 sm:flex sm:items-center sm:justify-center">
                  <m.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="pointer-events-auto relative flex w-full transform-gpu flex-col overflow-hidden rounded-xl border border-input bg-card shadow-xl/10 will-change-transform sm:max-w-2xl"
                    data-slot="expandable-textarea-control"
                    exit={{ opacity: 0, scale: 0.97 }}
                    initial={{ opacity: 0, scale: 0.97 }}
                    style={{ height: vpHeight - 32, maxHeight: 640 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
                  >
                    <m.div
                      animate={{ opacity: 1 }}
                      className="relative z-20 flex h-full flex-col overflow-hidden"
                      initial={{ opacity: 0 }}
                      transition={{ delay: 0.1, duration: 0.15 }}
                    >
                      <div className="flex shrink-0 items-center justify-between border-b bg-popover px-3 py-2">
                        <span className="font-medium text-foreground text-sm">
                          {expandedTitle ?? "Edit"}
                        </span>
                        <Button
                          aria-label="Collapse editor"
                          onClick={collapse}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Minimize2 />
                        </Button>
                      </div>
                      <textarea
                        className="w-full flex-1 resize-none overflow-y-auto break-all p-3 text-sm outline-none placeholder:text-muted-foreground"
                        data-slot="expandable-textarea"
                        disabled={disabled}
                        onChange={handleChange}
                        placeholder={placeholder}
                        ref={expandedTextareaRef}
                        value={currentValue}
                        {...props}
                      />
                    </m.div>
                  </m.div>
                </div>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </MotionFeatures>
  );
}

export { ExpandableTextarea, type ExpandableTextareaProps };
