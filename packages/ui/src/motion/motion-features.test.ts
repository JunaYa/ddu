/// <reference types="vite-plus/client" />
import { describe, expect, it } from "vite-plus/test";

/**
 * Guard for the `m` / `LazyMotion` split (PI-1238).
 *
 * `m.*` renders perfectly well without a `LazyMotion` ancestor — it just never
 * animates. There is no type error, no console warning, and no failing render
 * test, so a component that loses its boundary degrades silently and only
 * shows up as "the panel stopped sliding" in manual QA. Since each component
 * carries its own boundary rather than relying on a host provider, the
 * invariant is checkable statically: importing `m` obliges you to import
 * `MotionFeatures`.
 *
 * The reverse pairing matters just as much. Reintroducing `motion.*` anywhere
 * in this package silently re-bundles Framer Motion's whole feature set —
 * roughly 13 kB gzipped — into every host that renders it, which is what
 * pushed the extension's side-panel chunk to 467 bytes under its ceiling.
 *
 * `MotionDragFeatures` counts as a boundary too: `domAnimation` has no drag,
 * so a dragging component needs the `domMax` boundary instead. It is a
 * separate module precisely so only that component's chunk pays for it.
 *
 * Sources are read through `import.meta.glob` rather than `node:fs` because
 * this package typechecks against the DOM lib only and has no `@types/node`.
 */
const modules = import.meta.glob("../**/*.{ts,tsx}", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const sources = Object.entries(modules).filter(([path]) => !/\.(test|stories)\.tsx?$/.test(path));

describe("motion feature boundaries", () => {
  it("finds source files to scan", () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it("pairs every `m` import with a MotionFeatures boundary", () => {
    const offenders = sources
      .filter(([, text]) => /^import \{[^}]*\bm\b[^}]*\} from ["']motion\/react["']/m.test(text))
      .filter(([, text]) => !/\bMotion(Drag)?Features\b/.test(text))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it("never reintroduces the full `motion` component", () => {
    const offenders = sources
      .filter(([path]) => !path.endsWith("motion/motion-features.tsx"))
      .filter(([, text]) => text.includes("<motion."))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});
