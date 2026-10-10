"use client";
import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Feature boundary for the `m` components used across `@ddu/ui` and
 * `@ddu/agent-ui`.
 *
 * Shared components render `m.*` rather than `motion.*`: `motion.*` pulls
 * Framer Motion's entire feature set (drag, layout projection, scroll) into
 * whatever bundle touches it, while `m.*` ships only the renderer and takes
 * its features from the nearest `LazyMotion` ancestor. Together with
 * `domAnimation` — animations, variants, exit, and hover/tap/focus gestures,
 * which is everything these components actually use — that is the difference
 * between the extension's side-panel chunk fitting its budget and not
 * (PI-1238).
 *
 * **Each component declares its own boundary rather than relying on a host
 * provider.** Five hosts render these packages (web, website, extension,
 * desktop, Storybook), and `apps/website` mounts them as independent Astro
 * islands, so a root-level provider is not one edit but many — and the failure
 * mode for missing one is silent: `m.*` still renders, it just never animates.
 * `LazyMotion` emits no DOM (it is a context provider) and `loadFeatures` is a
 * module-level registry, so nesting these is free and idempotent.
 *
 * Place it **outside** `AnimatePresence`, never between it and its children —
 * `AnimatePresence` tracks its direct children to run exit animations, and a
 * provider wedged in between hides them.
 */
export function MotionFeatures({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
