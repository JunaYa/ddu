"use client";
import { LazyMotion, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * Drag-capable sibling of `MotionFeatures`.
 *
 * `MotionFeatures` loads `domAnimation` — animations, variants, exit, and
 * hover/tap/focus gestures — which is everything the shared components need
 * except one thing: **drag**. A component that renders `m.div` with `drag`
 * under `domAnimation` still mounts and still animates; the drag props are
 * simply inert, so the failure mode is a card that refuses to be picked up
 * with no type error and no warning.
 *
 * `domMax` is the feature set that adds drag (and layout projection), and it
 * is the larger of the two. It lives in its **own module** rather than behind
 * a prop on `MotionFeatures` so that importing it is opt-in per component:
 * `motion-features.tsx` is pulled into every host that renders a shared
 * component, and a static `domMax` import there would push the drag bundle
 * into all of them — which is the regression the `m` / `LazyMotion` split
 * exists to prevent (PI-1238; the extension's side-panel chunk cleared its
 * ceiling by 467 bytes).
 *
 * Reach for this only when a component actually drags. Everything else takes
 * `MotionFeatures`. The same placement rule applies: put it **outside**
 * `AnimatePresence`, never between it and its children.
 */
export function MotionDragFeatures({ children }: { children: ReactNode }) {
  return <LazyMotion features={domMax}>{children}</LazyMotion>;
}
