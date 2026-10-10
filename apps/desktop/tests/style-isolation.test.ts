import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import unoConfig from "../uno.config.ts";

/** S3 (specs/12 § 7): Tailwind never scans legacy Vue code, UnoCSS never scans React windows. */
const appDir = resolve(fileURLToPath(import.meta.url), "../..");

test("the React stylesheet excludes the legacy folder from Tailwind", () => {
  expect(readFileSync(resolve(appDir, "src/styles.css"), "utf8")).toContain(
    '@source not "./legacy";',
  );
});

test("UnoCSS only scans legacy Vue code", () => {
  const include = unoConfig.content?.pipeline && unoConfig.content.pipeline.include;
  const patterns = (Array.isArray(include) ? include : [include]).filter(
    (p): p is RegExp => p instanceof RegExp,
  );
  const scanned = (id: string) => patterns.some((pattern) => pattern.test(id));

  expect(scanned(`${appDir}/src/legacy/pages/main/App.vue`)).toBe(true);
  expect(scanned(`${appDir}/src/windows/setting/setting-window.tsx`)).toBe(false);
  expect(scanned(`${appDir}/../../packages/ui/src/button/button.tsx`)).toBe(false);
});
