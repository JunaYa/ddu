import { describe, expect, it } from "vite-plus/test";
import { iconNames, isIconName } from "./icons/index.ts";
import { lineArtAssets, lineArtCatalog } from "./line-art/index.ts";
import { lineGraphicAssets, lineGraphicCatalog } from "./line-graphics/index.ts";
import { hasSocialIcon, socialAssets, socialCatalog, socialRegistry } from "./social/index.ts";

describe("@ddu/iconography catalogs", () => {
  it("keeps product icon names and guard in sync", () => {
    expect(iconNames.length).toBeGreaterThan(100);
    for (const name of iconNames) {
      expect(isIconName(name)).toBe(true);
    }
    expect(isIconName("__missing__")).toBe(false);
    expect(isIconName("constructor")).toBe(false);
  });

  it("registers the mail icon for auth verification screens", () => {
    expect(isIconName("mail")).toBe(true);
    expect(iconNames).toContain("mail");
  });

  it("prepares every line-art asset by filename stem", () => {
    expect(Object.keys(lineArtAssets).length).toBeGreaterThan(0);
    expect(Object.keys(lineArtCatalog).sort()).toEqual(Object.keys(lineArtAssets).sort());
  });

  it("keeps line-art masks stable while visible paths inherit currentColor", () => {
    const maskedIcon = lineArtCatalog["line-art-10"];

    expect(maskedIcon?.innerHtml).toContain("<mask");
    expect(maskedIcon?.innerHtml).toContain('fill="white"');
    expect(maskedIcon?.innerHtml).toContain('fill="currentColor"');
  });

  it("prepares every line-graphic asset by filename stem", () => {
    expect(Object.keys(lineGraphicAssets).length).toBeGreaterThan(0);
    expect(Object.keys(lineGraphicCatalog).sort()).toEqual(Object.keys(lineGraphicAssets).sort());
  });

  it("resolves every social registry entry to a prepared asset", () => {
    for (const [name, slug] of Object.entries(socialRegistry)) {
      expect(socialAssets[slug], `${name} should map to assets/${slug}.svg`).toBeTruthy();
      expect(socialCatalog[name as keyof typeof socialRegistry]).toBeTruthy();
      expect(hasSocialIcon(name)).toBe(true);
    }

    expect(hasSocialIcon("__missing__")).toBe(false);
    expect(hasSocialIcon("constructor")).toBe(false);
  });
});
