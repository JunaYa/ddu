"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "../lib/utils.ts";

type TabsVariant = "default" | "underline";
type TabsSize = "xs" | "sm" | "default" | "lg";
type TabsListProps = TabsPrimitive.List.Props & {
  indicatorClassName?: string;
  variant?: TabsVariant;
  size?: TabsSize;
};
type TabsTabProps = TabsPrimitive.Tab.Props & {
  size?: TabsSize;
};

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-2 data-[orientation=vertical]:flex-row", className)}
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList({
  variant = "default",
  size = "default",
  className,
  children,
  indicatorClassName,
  ...props
}: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "relative z-0 flex w-fit items-center justify-center gap-x-0.5 text-muted-foreground",
        "data-[orientation=vertical]:flex-col",
        variant === "default"
          ? cn(
              "bg-muted p-0.5 text-muted-foreground/72",
              size === "xs" ? "rounded-md" : "rounded-lg",
            )
          : "data-[orientation=vertical]:px-1 data-[orientation=horizontal]:py-1 *:data-[slot=tabs-tab]:hover:bg-accent",
        className,
      )}
      data-slot="tabs-list"
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        className={cn(
          "absolute bottom-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-(--active-tab-bottom) transition-[width,translate] duration-200 ease-in-out",
          variant === "underline"
            ? "z-10 bg-primary data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5 data-[orientation=vertical]:-translate-x-px data-[orientation=horizontal]:translate-y-px"
            : cn(
                "-z-1 bg-background shadow-sm/5 dark:bg-input",
                size === "xs" ? "rounded" : "rounded-md",
              ),
          indicatorClassName,
        )}
        data-slot="tab-indicator"
      />
    </TabsPrimitive.List>
  );
}

function TabsTab({ size = "default", className, ...props }: TabsTabProps) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative flex shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-medium outline-none transition-[color,background-color,box-shadow] hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-active:text-foreground data-disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
        size === "xs" && "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        size === "sm" &&
          "h-7 px-[calc(--spacing(2.5)-1px)] text-sm [&_svg:not([class*='size-'])]:size-4",
        size === "default" &&
          "h-9 px-[calc(--spacing(3)-1px)] text-base [&_svg:not([class*='size-'])]:size-4",
        size === "lg" &&
          "h-10 px-[calc(--spacing(3)-1px)] text-lg [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="tabs-tab"
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn("flex-1 outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsPrimitive,
  TabsTab,
  TabsTab as TabsTrigger,
  TabsPanel,
  TabsPanel as TabsContent,
};
export type { TabsListProps, TabsTabProps };
