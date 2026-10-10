/**
 * Line-graphic catalog — larger monochrome illustrations.
 *
 * Assets are auto-discovered from `assets/*.svg` by **filename stem**
 * (e.g. `graphics-08.svg` → `name="graphics-08"`).
 *
 * To add or update a graphic: drop or replace the file — no registry edit.
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
export const lineGraphicAssets = loadNamedSvgAssets(rawModules);

/** Prepared inline SVG keyed by filename stem. */
export const lineGraphicCatalog = buildMonochromeCatalog(lineGraphicAssets, "line-graphics", {
  nonScalingStroke: true,
}) as Record<string, PreparedMonochromeSvg>;

export type LineGraphicName = keyof typeof lineGraphicAssets;

export function getLineGraphic(name: LineGraphicName): PreparedMonochromeSvg {
  const prepared = lineGraphicCatalog[name];
  if (!prepared) {
    throw new Error(`[line-graphics] Missing assets/${name}.svg`);
  }
  return prepared;
}
