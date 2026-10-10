import { m, type PanInfo, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import * as React from "react";

import { cn } from "./lib/utils.ts";
import { MotionDragFeatures } from "./motion/motion-drag-features.tsx";

export type StackMode = "finite" | "cycle";

export interface StackRenderState {
  active: boolean;
  depth: number;
}

interface StackAnimationConfig {
  damping: number;
  stiffness: number;
}

interface StackBaseProps {
  animationConfig?: StackAnimationConfig;
  autoplay?: boolean;
  autoplayDelay?: number;
  cardClassName?: string;
  className?: string;
  defaultIndex?: number;
  empty?: React.ReactNode;
  index?: number;
  mobileBreakpoint?: number;
  mobileClickOnly?: boolean;
  mode?: StackMode;
  onIndexChange?: (index: number) => void;
  pauseOnHover?: boolean;
  randomRotation?: boolean;
  sendToBackOnClick?: boolean;
  sensitivity?: number;
  visibleCount?: number;
}

interface StackDataProps<T> extends StackBaseProps {
  cards?: never;
  getKey: (item: T) => React.Key;
  items: T[];
  onAdvance?: (item: T) => void;
  renderCard: (item: T, state: StackRenderState) => React.ReactNode;
}

interface StackCardsProps extends StackBaseProps {
  cards: React.ReactNode[];
  getKey?: never;
  items?: never;
  onAdvance?: (card: React.ReactNode) => void;
  renderCard?: never;
}

export type StackProps<T = React.ReactNode> = StackDataProps<T> | StackCardsProps;

interface NormalizedStackItem {
  key: React.Key;
  value: unknown;
}

interface CardRotateProps {
  children: React.ReactNode;
  className?: string;
  disableDrag?: boolean;
  onSendToBack: () => void;
  sensitivity: number;
}

const DEFAULT_AUTOPLAY_DELAY = 3000;
const DEFAULT_MOBILE_BREAKPOINT = 768;
const DEFAULT_SENSITIVITY = 200;
const DEFAULT_ANIMATION_CONFIG: StackAnimationConfig = { stiffness: 260, damping: 20 };

function stableRotationForKey(key: React.Key): number {
  const value = String(key);
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 100 - 5;
}

function CardRotate({
  children,
  className,
  disableDrag = false,
  onSendToBack,
  sensitivity,
}: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
      return;
    }

    x.set(0);
    y.set(0);
  };

  if (disableDrag) {
    return (
      <m.div
        className={cn("absolute inset-0 cursor-pointer", className)}
        data-slot="stack-card-drag-layer"
        style={{ x: 0, y: 0 }}
      >
        {children}
      </m.div>
    );
  }

  return (
    <m.div
      className={cn("absolute inset-0 cursor-grab", className)}
      data-slot="stack-card-drag-layer"
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotateX, rotateY }}
      whileTap={{ cursor: "grabbing" }}
    >
      {children}
    </m.div>
  );
}

function useIsMobile(breakpoint: number) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}

function orderedStack(items: NormalizedStackItem[], activeIndex: number, visibleCount?: number) {
  const total = items.length;
  if (total === 0) return [];

  const count = Math.min(visibleCount ?? total, total);
  return Array.from({ length: count }, (_, offset) => {
    const index = (activeIndex - count + 1 + offset + total) % total;
    return items[index] as NormalizedStackItem;
  });
}

export function Stack<T>(props: StackProps<T>) {
  const {
    animationConfig = DEFAULT_ANIMATION_CONFIG,
    autoplay = false,
    autoplayDelay = DEFAULT_AUTOPLAY_DELAY,
    cardClassName,
    className,
    defaultIndex,
    empty = null,
    index,
    mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
    mobileClickOnly = false,
    mode = "cycle",
    onIndexChange,
    pauseOnHover = false,
    randomRotation = false,
    sendToBackOnClick = false,
    sensitivity = DEFAULT_SENSITIVITY,
    visibleCount,
  } = props;
  const reduced = Boolean(useReducedMotion());
  const isMobile = useIsMobile(mobileBreakpoint);
  const [isPaused, setIsPaused] = React.useState(false);
  const items = React.useMemo<NormalizedStackItem[]>(() => {
    if ("cards" in props) {
      return (props.cards ?? []).map((card, itemIndex) => ({ key: itemIndex, value: card }));
    }

    return props.items.map((item) => ({ key: props.getKey(item), value: item }));
  }, [props]);
  const itemKeys = React.useMemo(
    () => items.map((item) => String(item.key)).join("\u0001"),
    [items],
  );
  const total = items.length;
  const isCycle = mode === "cycle";
  const initialIndex = defaultIndex ?? ("cards" in props && isCycle ? Math.max(total - 1, 0) : 0);
  const isControlled = index !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState(initialIndex);
  const currentIndex = index ?? uncontrolledIndex;
  const activeIndex = total > 0 ? ((currentIndex % total) + total) % total : 0;
  React.useEffect(() => {
    if (!isControlled) setUncontrolledIndex(initialIndex);
  }, [initialIndex, isControlled, itemKeys, mode]);

  const setCurrentIndex = React.useCallback(
    (next: number) => {
      if (!isControlled) setUncontrolledIndex(next);
      onIndexChange?.(next);
    },
    [isControlled, onIndexChange],
  );

  const renderItem = React.useCallback(
    (item: NormalizedStackItem, state: StackRenderState) =>
      "cards" in props ? (item.value as React.ReactNode) : props.renderCard(item.value as T, state),
    [props],
  );
  const handleAdvance = React.useCallback(
    (item: NormalizedStackItem) => {
      if ("cards" in props) {
        const onCardsAdvance = props.onAdvance as StackCardsProps["onAdvance"];
        onCardsAdvance?.(item.value as React.ReactNode);
        return;
      }

      const onDataAdvance = props.onAdvance as StackDataProps<T>["onAdvance"];
      onDataAdvance?.(item.value as T);
    },
    [props],
  );

  const isEmpty = total === 0 || (!isCycle && currentIndex >= total);
  const stack = isEmpty ? [] : orderedStack(items, activeIndex, visibleCount);
  const top = stack.at(-1);
  const shouldDisableDrag = reduced || (mobileClickOnly && isMobile);
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;
  const rotationByKey = React.useMemo(
    () => new Map(items.map((item) => [item.key, stableRotationForKey(item.key)])),
    [items],
  );

  const sendToBack = React.useCallback(
    (item: NormalizedStackItem) => {
      handleAdvance(item);
      setCurrentIndex(isCycle ? activeIndex - 1 : currentIndex + 1);
    },
    [activeIndex, currentIndex, handleAdvance, isCycle, setCurrentIndex],
  );

  const handleKeyboardSendToBack = React.useCallback(
    (event: React.KeyboardEvent, item: NormalizedStackItem) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      sendToBack(item);
    },
    [sendToBack],
  );

  React.useEffect(() => {
    if (reduced || !autoplay || !top || stack.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => sendToBack(top), autoplayDelay);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayDelay, isPaused, reduced, sendToBack, stack.length, top]);

  if (isEmpty || !top) return <>{empty}</>;

  return (
    <MotionDragFeatures>
      <div
        className={cn("relative h-full w-full", className)}
        data-slot="stack"
        onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
        onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
        style={{ perspective: 600 }}
      >
        {stack.map((item, stackIndex) => {
          const depth = stack.length - stackIndex - 1;
          const active = depth === 0;
          const randomRotate = randomRotation ? (rotationByKey.get(item.key) ?? 0) : 0;

          return (
            <CardRotate
              className={active ? undefined : "pointer-events-none"}
              disableDrag={!active || shouldDisableDrag}
              key={item.key}
              onSendToBack={() => sendToBack(item)}
              sensitivity={sensitivity}
            >
              <m.div
                animate={{
                  rotateZ: depth * 4 + randomRotate,
                  scale: 1 + stackIndex * 0.06 - stack.length * 0.06,
                  transformOrigin: "90% 90%",
                }}
                aria-hidden={active ? undefined : "true"}
                className={cn(
                  "h-full w-full overflow-hidden rounded-2xl",
                  cardClassName,
                  active && shouldEnableClick && "cursor-pointer",
                )}
                data-active={active ? "true" : "false"}
                data-slot="stack-card"
                inert={active ? undefined : true}
                initial={false}
                onKeyDown={active ? (event) => handleKeyboardSendToBack(event, item) : undefined}
                onClick={active && shouldEnableClick ? () => sendToBack(item) : undefined}
                role={active ? "button" : undefined}
                tabIndex={active ? 0 : undefined}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: animationConfig.stiffness,
                        damping: animationConfig.damping,
                      }
                }
              >
                {renderItem(item, { active, depth })}
              </m.div>
            </CardRotate>
          );
        })}
      </div>
    </MotionDragFeatures>
  );
}

export default Stack;
