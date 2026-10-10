/**
 * Normalize a design-exported monochrome SVG for inline rendering.
 * Rewrites hard-coded black fills/strokes to `currentColor` so icons
 * inherit text color from CSS.
 */
export interface PreparedMonochromeSvg {
  innerHtml: string;
  viewBox: string;
  /** viewBox height (for aspect-preserving scale). */
  viewBoxHeight: number;
  /** viewBox width (for aspect-preserving scale). */
  viewBoxWidth: number;
}

const VIEW_BOX_RE = /viewBox=["']([^"']+)["']/i;
const INNER_RE = /<svg[^>]*>([\s\S]*)<\/svg>/i;
const NUMBERED_ASSET_ID_RE = /\/(\d+)\.svg$/;
const NAMED_ASSET_ID_RE = /\/([^/]+)\.svg$/;
const SVG_ID_ATTR_RE = /\bid="([^"]+)"/g;

const COLOR_REWRITES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bstroke="black"/gi, 'stroke="currentColor"'],
  [/\bfill="black"/gi, 'fill="currentColor"'],
  [/\bstroke="white"/gi, 'stroke="currentColor"'],
  [/\bfill="white"/gi, 'fill="currentColor"'],
  [/\bstroke="#0{3}(?:0{3})?"/gi, 'stroke="currentColor"'],
  [/\bfill="#0{3}(?:0{3})?"/gi, 'fill="currentColor"'],
  [/\bstroke="#[fF]{3}(?:[fF]{3})?"/gi, 'stroke="currentColor"'],
  [/\bfill="#[fF]{3}(?:[fF]{3})?"/gi, 'fill="currentColor"'],
  [/\bstroke='#0{3}(?:0{3})?'/gi, 'stroke="currentColor"'],
  [/\bfill='#0{3}(?:0{3})?'/gi, 'fill="currentColor"'],
  [/\bstroke='#[fF]{3}(?:[fF]{3})?'/gi, 'stroke="currentColor"'],
  [/\bfill='#[fF]{3}(?:[fF]{3})?'/gi, 'fill="currentColor"'],
];

const MASK_BLOCK_RE = /<mask\b[\s\S]*?<\/mask>/gi;

function rewriteVisibleColors(html: string): string {
  const masks: string[] = [];
  let out = html.replace(MASK_BLOCK_RE, (mask) => {
    const index = masks.push(mask) - 1;
    return `__PI_ICONOGRAPHY_MASK_${index}__`;
  });

  for (const [pattern, replacement] of COLOR_REWRITES) {
    out = out.replace(pattern, replacement);
  }

  return out.replace(/__PI_ICONOGRAPHY_MASK_(\d+)__/g, (_, rawIndex: string) => {
    const mask = masks[Number(rawIndex)];
    return mask ?? "";
  });
}

function extractSvgParts(raw: string): {
  viewBox: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  innerHtml: string;
} {
  const viewBox = raw.match(VIEW_BOX_RE)?.[1] ?? "0 0 24 24";
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const viewBoxWidth = parts[2] && Number.isFinite(parts[2]) && parts[2] > 0 ? parts[2] : 24;
  const viewBoxHeight = parts[3] && Number.isFinite(parts[3]) && parts[3] > 0 ? parts[3] : 24;
  const innerHtml = raw.match(INNER_RE)?.[1]?.trim() ?? "";
  return { viewBox, viewBoxWidth, viewBoxHeight, innerHtml };
}

/** Prefix gradient/clipPath ids so multiple icons on one page don't collide. */
export function uniquifySvgIds(html: string, prefix: string): string {
  const ids = new Set<string>();
  for (const match of html.matchAll(SVG_ID_ATTR_RE)) {
    const id = match[1];
    if (id) ids.add(id);
  }

  let out = html;
  for (const id of ids) {
    const safe = `${prefix}-${id}`.replaceAll(/[^a-zA-Z0-9_-]/g, "-");
    out = out.replaceAll(`id="${id}"`, `id="${safe}"`);
    out = out.replaceAll(`url(#${id})`, `url(#${safe})`);
    // Also rewrite fragment refs in href / xlink:href (used by <use> / embedded
    // images in the xhs & productHunt marks). Matching `href="#id"` also covers
    // `xlink:href="#id"` since it ends with the same substring.
    out = out.replaceAll(`href="#${id}"`, `href="#${safe}"`);
  }
  return out;
}

interface PrepareMonochromeSvgOptions {
  /** Keep stroke at ~1 device px when the SVG is scaled or transformed. */
  nonScalingStroke?: boolean;
  /** Device-pixel stroke width when `nonScalingStroke` is on. Defaults to 1. */
  strokeWidth?: number;
}

const STROKED_SHAPE_RE = /<(path|circle|rect|ellipse|line|polyline|polygon)(\s[^>]*?)(\/?)>/gi;

/** Pin stroked shapes to a constant screen stroke via vector-effect. */
export function applyNonScalingStroke(html: string, strokeWidth = 1): string {
  return html.replace(STROKED_SHAPE_RE, (match, tag: string, attrs: string, closing: string) => {
    if (!/\bstroke\s*=/.test(attrs)) return match;

    let next = attrs;
    if (!/\bvector-effect\s*=/.test(next)) {
      next += ' vector-effect="non-scaling-stroke"';
    }
    if (/\bstroke-width\s*=/.test(next)) {
      next = next.replace(/\bstroke-width\s*=\s*["'][^"']*["']/, `stroke-width="${strokeWidth}"`);
    } else {
      next += ` stroke-width="${strokeWidth}"`;
    }
    return `<${tag}${next}${closing}>`;
  });
}

export function prepareMonochromeSvg(
  raw: string,
  idPrefix = "mono",
  options: PrepareMonochromeSvgOptions = {},
): PreparedMonochromeSvg {
  const { viewBox, viewBoxWidth, viewBoxHeight, innerHtml: extracted } = extractSvgParts(raw);
  let innerHtml = rewriteVisibleColors(extracted);

  if (options.nonScalingStroke) {
    innerHtml = applyNonScalingStroke(innerHtml, options.strokeWidth ?? 1);
  }

  return {
    viewBox,
    viewBoxWidth,
    viewBoxHeight,
    innerHtml: uniquifySvgIds(innerHtml, idPrefix),
  };
}

/** Keep brand fills/gradients; only uniquify ids for safe multi-icon pages. */
export function prepareBrandSvg(raw: string, idPrefix: string): PreparedMonochromeSvg {
  const { viewBox, viewBoxWidth, viewBoxHeight, innerHtml } = extractSvgParts(raw);
  return {
    viewBox,
    viewBoxWidth,
    viewBoxHeight,
    innerHtml: uniquifySvgIds(innerHtml, idPrefix),
  };
}

/** Build a prepared catalog keyed by asset filename (without `.svg`). */
export function buildMonochromeCatalog(
  assets: Record<string, string>,
  label: string,
  options: PrepareMonochromeSvgOptions = {},
): Record<string, PreparedMonochromeSvg> {
  return Object.fromEntries(
    Object.entries(assets).map(([id, raw]) => [
      id,
      prepareMonochromeSvg(raw, `${label}-${id}`, options),
    ]),
  );
}

/** Load `assets/$nn.svg?raw` modules into `{ "01": raw, ... }`. */
export function loadNumberedSvgAssets(modules: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).flatMap(([path, raw]) => {
      const id = path.match(NUMBERED_ASSET_ID_RE)?.[1];
      return id ? ([[id, raw]] as const) : [];
    }),
  );
}

/** Load `assets/<name>.svg?raw` modules into `{ "linkedin": raw, ... }`. */
export function loadNamedSvgAssets(modules: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).flatMap(([path, raw]) => {
      const id = path.match(NAMED_ASSET_ID_RE)?.[1];
      return id ? ([[id, raw]] as const) : [];
    }),
  );
}

/** Resolve intent → prepared SVG from a numbered asset map + registry. */
export function resolveIconCatalog<TIntent extends string>(
  assets: Record<string, string>,
  registry: Record<TIntent, string>,
  label: string,
): Record<TIntent, PreparedMonochromeSvg> {
  return Object.fromEntries(
    (Object.entries(registry) as [TIntent, string][]).map(([intent, id]) => {
      const raw = assets[id];
      if (!raw) {
        throw new Error(
          `[${label}] Missing assets/${id}.svg for intent "${intent}". Drop the file or fix the registry.`,
        );
      }
      return [intent, prepareMonochromeSvg(raw, `${label}-${intent}`)];
    }),
  ) as Record<TIntent, PreparedMonochromeSvg>;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
