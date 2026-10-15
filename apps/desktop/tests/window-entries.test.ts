import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WINDOW } from "@ddu/native";
import { describe, expect, test } from "vite-plus/test";

/** S1/S2 (specs/12 § 7): one HTML entry per window, each on exactly one framework. */
const appDir = resolve(fileURLToPath(import.meta.url), "../..");
const read = (file: string) => readFileSync(resolve(appDir, file), "utf8");
const labels = Object.values(WINDOW);

describe("window entries", () => {
  test("every window label is a build input", () => {
    const declared = /const windows = \[([^\]]*)\]/.exec(read("vite.config.ts"))?.[1] ?? "";
    expect([...declared.matchAll(/"([a-z]+)"/g)].map((m) => m[1]).sort()).toEqual(
      [...labels].sort(),
    );
  });

  test.each(labels)("%s.html loads a single React entry", (label) => {
    const scripts = [...read(`${label}.html`).matchAll(/<script[^>]*src="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toMatch(new RegExp(`^/src/windows/${label}/main\\.tsx$`));
  });
});
