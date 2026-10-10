import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { ICON_SVGS, type IconSvgName, isIconSvgName } from "./icon-svgs.ts";
import { Icons } from "../icons/icons.tsx";

// Iconify-backed names render asynchronously (icon data is fetched at runtime),
// so they can't be compared against a synchronous render. Their glyphs are
// pinned in icon-svgs.ts with the source icon id noted beside each entry.
const ICONIFY_BACKED: readonly IconSvgName[] = ["agentChat", "fileText", "saveNote"];

// Must mirror the normalization documented in icon-svgs.ts: hosts size the
// glyph via CSS and lucide's class names are meaningless outside the web app.
function normalizeLucideMarkup(svg: string): string {
  return svg.replace(/\s(?:width|height)="24"/g, "").replace(/\sclass="[^"]*"/, "");
}

describe("@ddu/ui icon-svgs", () => {
  const lucideBacked = (Object.keys(ICON_SVGS) as IconSvgName[]).filter(
    (name) => !ICONIFY_BACKED.includes(name),
  );

  it.each(lucideBacked)("%s matches the IconRenderer glyph", (name) => {
    const rendered = renderToStaticMarkup(createElement(Icons[name], { "aria-hidden": true }));
    expect(ICON_SVGS[name]).toBe(normalizeLucideMarkup(rendered));
  });

  it("iconify-backed entries carry the pinned glyph shape", () => {
    for (const name of ICONIFY_BACKED) {
      expect(ICON_SVGS[name]).toContain('viewBox="0 0 24 24"');
      expect(ICON_SVGS[name]).toContain('fill="currentColor"');
    }
  });

  it("normalizes lucide dimensions regardless of attribute order", () => {
    expect(
      normalizeLucideMarkup('<svg height="24" class="lucide" width="24" aria-hidden="true"></svg>'),
    ).toBe('<svg aria-hidden="true"></svg>');
  });

  it("every entry is CSS-sizable and hidden from the accessibility tree", () => {
    for (const [name, svg] of Object.entries(ICON_SVGS)) {
      const rootTag = svg.slice(0, svg.indexOf(">") + 1);
      expect(rootTag, name).toContain('aria-hidden="true"');
      expect(rootTag, name).not.toMatch(/\swidth=/);
      expect(rootTag, name).not.toMatch(/\sheight=/);
      expect(rootTag, name).not.toContain("class=");
    }
  });

  it("isIconSvgName guards the registry", () => {
    expect(isIconSvgName("sparkles")).toBe(true);
    expect(isIconSvgName("not-an-icon")).toBe(false);
  });
});
