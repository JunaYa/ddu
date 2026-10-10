import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

/** U2 (specs/13 § 6): migrated windows build controls from @ddu/ui, never raw form elements. */
const windowsDir = resolve(fileURLToPath(import.meta.url), "../../src/windows");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("no raw <button>, <input>, <select> or <textarea> in React windows", () => {
  const offenders = sources(windowsDir).flatMap((path) =>
    [...readFileSync(path, "utf8").matchAll(/<(button|input|select|textarea)[\s>/]/g)].map(
      (m) => `${relative(windowsDir, path)}: <${m[1]}>`,
    ),
  );
  expect(offenders).toEqual([]);
});
