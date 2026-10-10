/**
 * Brand identity constants — the single source of truth for the ddu
 * brand name and colors. App manifests, meta tags, and the asset
 * generator all read from here; never hardcode these values in an app.
 */

export const BRAND_NAME = "Ddu";

export const BRAND_COLORS = {
  /** Brand primary (amber). Matches `--primary` in @ddu/tokens/css/brand.css. */
  primary: "#cc7d24",
} as const;
