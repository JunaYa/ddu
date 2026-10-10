/**
 * Brand identity constants — the single source of truth for the PI
 * brand name and colors. App manifests, meta tags, and the asset
 * generator all read from here; never hardcode these values in an app.
 */

export const BRAND_NAME = "PI";

export const BRAND_COLORS = {
  /**
   * Brand primary (blue). Matches the light-mode `--primary` token,
   * `--color-b1-500` in @ddu/tokens. Used for `theme-color` meta tags
   * and PWA manifest `theme_color`.
   */
  primary: "#366fb6",
} as const;
