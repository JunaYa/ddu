import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const appDir = resolve(fileURLToPath(import.meta.url), "../..");
test("desktop uses the shared Tailwind styles without legacy Vue tooling", () => {
  expect(readFileSync(resolve(appDir, "src/styles.css"), "utf8")).toContain(
    '@import "@ddu/styles/base.css"',
  );
  expect(existsSync(resolve(appDir, "src/legacy"))).toBe(false);
  expect(existsSync(resolve(appDir, "uno.config.ts"))).toBe(false);
  expect(
    readdirSync(resolve(appDir, "src"), { recursive: true }).some((file) =>
      String(file).endsWith(".vue"),
    ),
  ).toBe(false);
  const manifest = JSON.parse(readFileSync(resolve(appDir, "package.json"), "utf8"));
  for (const dependency of [
    "vue",
    "@vueuse/core",
    "@vitejs/plugin-vue",
    "vue-tsc",
    "unocss",
    "@unocss/preset-mini",
  ]) {
    expect({ ...manifest.dependencies, ...manifest.devDependencies }).not.toHaveProperty(
      dependency,
    );
  }
});
