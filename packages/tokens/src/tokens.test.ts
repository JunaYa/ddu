import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

/**
 * Characterization tests for the @ddu/tokens CSS surface.
 *
 * These guard the token-layer extraction: web and extension styles (and the
 * migrated @ddu/ui primitives) depend on these CSS variable names, so a botched
 * move or an accidental layer deletion must fail loudly rather than silently drop
 * design tokens from the build.
 */
// Resolve sibling CSS via fileURLToPath rather than `new URL(..., import.meta.url)`,
// which vite rewrites as an asset reference under the test transform.
const layerDir = dirname(fileURLToPath(import.meta.url));

function read(file: string): string {
  return readFileSync(join(layerDir, file), "utf8");
}

const LAYERS = [
  "primitives",
  "aliases",
  "semantics",
  "effects",
  "typography-fluid",
  "radius",
  "home-widgets",
] as const;

describe("@ddu/tokens CSS surface", () => {
  it("entry re-exports every token layer in dependency order", () => {
    const index = read("index.css");
    for (const layer of LAYERS) {
      expect(index, `index.css should import ${layer}.css`).toContain(`./${layer}.css`);
    }
  });

  it("semantic layer defines the shadcn variables shared components consume", () => {
    const semantics = read("semantics.css");
    // The migrated @ddu/ui Button styles against exactly these tokens.
    const tokens = [
      "--background",
      "--foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--border",
      "--input",
      "--ring",
    ];
    for (const token of tokens) {
      expect(semantics, `semantics.css should define ${token}`).toContain(`${token}:`);
    }
  });

  it("radius layer defines the --radius scale used for rounded utilities", () => {
    const radius = read("radius.css");
    expect(radius).toContain("--radius:");
    for (const step of ["--radius-sm", "--radius-md", "--radius-lg"]) {
      expect(radius, `radius.css should define ${step}`).toContain(`${step}:`);
    }
  });

  it("primitives layer still carries the bulk of base tokens", () => {
    const primitives = read("primitives.css");
    const declarations = primitives.match(/^\s*--[a-z]/gm) ?? [];
    expect(declarations.length).toBeGreaterThan(100);
  });

  it("home widget layer defines the Daily Digest semantic slots", () => {
    const homeWidgets = read("home-widgets.css");
    for (const token of [
      "--home-widget-daily-digest-title-font-size",
      "--home-widget-daily-digest-meta-compact-font-size",
      "--home-widget-daily-digest-control-size",
      "--home-widget-daily-digest-artwork-large-max-height",
    ]) {
      expect(homeWidgets, `home-widgets.css should define ${token}`).toContain(`${token}:`);
    }
  });

  it("maps compact Daily Digest metadata to the mobile typography profile below mobile breakpoints", () => {
    const homeWidgets = read("home-widgets.css");

    expect(homeWidgets).toContain(
      "--home-widget-daily-digest-meta-compact-font-size: var(--typography-mobile-xs-font-size);",
    );
    expect(homeWidgets).toContain(
      "--home-widget-daily-digest-meta-compact-line-height: var(--typography-mobile-xs-line-height);",
    );
  });
});
