/**
 * Social icon catalog.
 *
 * Assets are named by platform (`assets/linkedin.svg`, `assets/product-hunt.svg`).
 * The registry maps camelCase intent → filename slug (usually 1:1; kebab when needed).
 *
 * To add an icon:
 * 1. Drop `assets/<platform>.svg` (brand SVG; Original color is fine)
 * 2. Add `intent: 'platform-slug'` to `socialRegistry`
 * 3. Use `<SocialIcon name="<intent>" />`
 */
import {
  loadNamedSvgAssets,
  type PreparedMonochromeSvg,
  prepareBrandSvg,
} from "../prepare-monochrome-svg.ts";

const rawModules = import.meta.glob("./assets/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/** Platform asset library — keys match filenames without `.svg`. */
export const socialAssets = loadNamedSvgAssets(rawModules);

/**
 * Intent → platform filename slug.
 * Prefer matching the file name; use kebab-case slugs for multi-word platforms.
 */
export const socialRegistry = {
  linkedin: "linkedin",
  x: "x",
  youtube: "youtube",
  reddit: "reddit",
  discord: "discord",
  facebook: "facebook",
  tiktok: "tiktok",
  instagram: "instagram",
  apple: "apple",
  behance: "behance",
  bilibili: "bilibili",
  bluesky: "bluesky",
  dribbble: "dribbble",
  figma: "figma",
  github: "github",
  google: "google",
  medium: "medium",
  messenger: "messenger",
  pinterest: "pinterest",
  productHunt: "product-hunt",
  signal: "signal",
  snapchat: "snapchat",
  spotify: "spotify",
  telegram: "telegram",
  text: "text",
  threads: "threads",
  tumblr: "tumblr",
  twitch: "twitch",
  url: "url",
  vk: "vk",
  whatsapp: "whatsapp",
  xhs: "xhs",
} as const;

export type SocialIconName = keyof typeof socialRegistry;
export type SocialAssetSlug = (typeof socialRegistry)[SocialIconName];

/** Resolved catalog: intent → prepared brand SVG (original colors preserved). */
export const socialCatalog = Object.fromEntries(
  (Object.entries(socialRegistry) as [SocialIconName, SocialAssetSlug][]).map(([intent, slug]) => {
    const raw = socialAssets[slug];
    if (!raw) {
      throw new Error(`[social] Missing assets/${slug}.svg for intent "${intent}"`);
    }
    return [intent, prepareBrandSvg(raw, `social-${intent}`)] as const;
  }),
) as Record<SocialIconName, PreparedMonochromeSvg>;

export function hasSocialIcon(name: string): name is SocialIconName {
  return Object.hasOwn(socialCatalog, name);
}
