import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { BRAND_COLORS, BRAND_NAME } from "../src/constants.ts";

const brandCss = readFileSync(
  fileURLToPath(new URL("../../tokens/src/brand.css", import.meta.url)),
  "utf8",
);

test("the brand colour constant matches the --primary token in brand.css", () => {
  const primary = /:root\s*\{[^}]*--primary:\s*(#[0-9a-f]{6})/i.exec(brandCss)?.[1];
  expect(primary?.toLowerCase()).toBe(BRAND_COLORS.primary);
});

test("the brand name matches the product name in tauri.conf.json", () => {
  const conf = JSON.parse(
    readFileSync(
      fileURLToPath(new URL("../../../apps/desktop/src-tauri/tauri.conf.json", import.meta.url)),
      "utf8",
    ),
  ) as { productName: string };
  expect(BRAND_NAME).toBe(conf.productName);
});
