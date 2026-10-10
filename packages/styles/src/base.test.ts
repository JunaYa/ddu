import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

/**
 * Parity guard for the shared host CSS baseline (PI-1042).
 *
 * The host-agnostic Tailwind core lives in baseline.css; base.css composes it
 * and adds the @ddu/ui-host layers (@source, tw-shimmer, tokens, fonts, glass).
 * Every host that renders shared product UI consumes base.css; the
 * marketing website (apps/website) consumes baseline.css directly and layers its
 * own divergent tokens/fonts on top. These assertions fail loudly on re-drift.
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

/** CSS entries that layer on the shared baseline via base.css.
 *  ddu 修改: ddu has no web/extension apps; the desktop React entry
 *  (apps/desktop/src/styles.css) joins with the first React window (specs/91 2.6). */
const HOST_ENTRIES = ["packages/ui/.storybook/preview.css"] as const;

/** Layers that must live ONLY in base.css / baseline.css.
 *  Matched as BARE substrings (not `"marker"`), on purpose: this set mixes
 *  `@import "…"` targets with `@source "../../ui/src"` path fragments, so
 *  `/ui/src` etc. must match inside the quoted @source path. The trade-off is
 *  that a marker appearing in a host entry's *comment* would false-positive —
 *  keep these strings specific enough to not collide with prose (e.g.
 *  `@ddu/tokens/css`, not `@ddu/tokens`). The website check below uses the
 *  quoted `"marker"` form instead, since its markers are all @import targets. */
const SHARED_ONLY_MARKERS = [
  "tailwindcss",
  "tw-animate-css",
  "tw-shimmer",
  "./vendor/shadcn.css",
  "@ddu/tokens/css",
  "/ui/src",
  "/brand/src",
  "/iconography/src",
] as const;

/** The host-agnostic plugin core, shared by every host including the website. */
const BASELINE_MARKERS = ["tailwindcss", "tw-animate-css", "./vendor/shadcn.css"] as const;

describe("@ddu/styles shared baseline", () => {
  it("baseline.css carries the host-agnostic plugins", () => {
    const baseline = read("packages/styles/src/baseline.css");
    for (const marker of BASELINE_MARKERS) {
      expect(baseline, `baseline.css should @import ${marker}`).toContain(marker);
    }
  });

  it("baseline.css stays token-free and host-agnostic", () => {
    const baseline = read("packages/styles/src/baseline.css");
    for (const marker of ["@ddu/tokens/css", "tw-shimmer", "@source"]) {
      expect(
        baseline.includes(marker),
        `baseline.css must NOT contain "${marker}" (it belongs in base.css)`,
      ).toBe(false);
    }
  });

  it("base.css composes baseline.css and carries the host-only layers", () => {
    const base = read("packages/styles/src/base.css");
    expect(base, "base.css should @import ./baseline.css").toContain("./baseline.css");
    for (const marker of ["tw-shimmer", "@ddu/tokens/css", "./fonts.css"]) {
      expect(base, `base.css should @import ${marker}`).toContain(marker);
    }
  });

  it("scans every shared UI package, including UI and iconography", () => {
    const base = read("packages/styles/src/base.css");
    for (const source of ["/ui/src", "/iconography/src", "/brand/src"]) {
      expect(base, `base.css should @source ${source}`).toContain(source);
    }
  });

  it("every host entry consumes the shared baseline", () => {
    for (const entry of HOST_ENTRIES) {
      expect(read(entry), `${entry} should import @ddu/styles/base.css`).toContain(
        "@ddu/styles/base.css",
      );
    }
  });

  it("no host entry re-declares a shared-only layer", () => {
    for (const entry of HOST_ENTRIES) {
      const css = read(entry);
      for (const marker of SHARED_ONLY_MARKERS) {
        expect(
          css.includes(marker),
          `${entry} must not re-declare "${marker}" (it belongs in @ddu/styles)`,
        ).toBe(false);
      }
    }
  });

  it("every @source target in base.css exists on disk", () => {
    const base = read("packages/styles/src/base.css");
    const baseDir = resolve(repoRoot, "packages/styles/src");
    const sources = [...base.matchAll(/@source\s+"([^"]+)"/g)].map((match) => match[1]);
    expect(
      sources.length,
      "base.css should register at least the ui + iconography sources",
    ).toBeGreaterThanOrEqual(2);
    for (const source of sources) {
      const target = join(baseDir, source);
      expect(existsSync(target), `@source "${source}" resolves to a missing path: ${target}`).toBe(
        true,
      );
    }
  });
});
