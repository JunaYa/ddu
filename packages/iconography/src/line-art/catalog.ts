/**
 * Line-art icon catalog.
 *
 * Assets are auto-discovered from `assets/*.svg` by **filename stem**
 * (e.g. `line-art-01.svg` → `name="line-art-01"`, `01.svg` → `name="01"`).
 *
 * To add or update an icon: drop or replace the file — no registry edit.
 */
import {
  buildMonochromeCatalog,
  loadNamedSvgAssets,
  type PreparedMonochromeSvg,
} from "../prepare-monochrome-svg.ts";

const rawModules = import.meta.glob("./assets/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/** Raw SVG keyed by filename without `.svg`. */
export const lineArtAssets = loadNamedSvgAssets(rawModules);

/** Prepared inline SVG keyed by filename stem. */
export const lineArtCatalog = buildMonochromeCatalog(lineArtAssets, "line-art");

export type LineArtIconName = keyof typeof lineArtAssets;

export function getLineArtIcon(name: LineArtIconName): PreparedMonochromeSvg {
  const prepared = lineArtCatalog[name];
  if (!prepared) {
    throw new Error(`[line-art] Missing assets/${name}.svg`);
  }
  return prepared;
}
