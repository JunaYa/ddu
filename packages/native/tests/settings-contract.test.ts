import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { type SettingKey, settingKeys, settingsSchema } from "../src/index.ts";

/**
 * N3 (specs/11 § 3): every settings key Rust reads is in the schema, with the
 * same default. Rust is scanned as text, so a new read that is not registered
 * in the schema fails here instead of drifting silently.
 */

const rustRoot = resolve(fileURLToPath(import.meta.url), "../../../../apps/desktop/src-tauri/src");

function rustFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return rustFiles(path);
    return entry.name.endsWith(".rs") ? [path] : [];
  });
}

/** Only files that open the settings store can read settings keys. */
const settingsReaders = rustFiles(rustRoot)
  .map((path) => ({ path: relative(rustRoot, path), source: readFileSync(path, "utf8") }))
  .filter(({ source }) => source.includes('"settings.json"'));

const allRust = settingsReaders.map(({ source }) => source).join("\n");

/** Keys stored in settings.json that are not `{ value }` settings (specs/11 § 2.4). */
const NOT_SETTINGS = new Set(["value", "workflow_rules"]);

function keysReadByRust(): Set<string> {
  const keys = new Set<string>();
  const patterns = [
    /\.(?:get|set)\(\s*"([a-z_]+)"/g, // store.get("key") / store.set("key".to_string() …)
    /\b(?:read|num|flag)\(\s*"([a-z_]+)"/g, // local read helpers
    /const [A-Z_]+_KEY: &str = "([a-z_]+)"/g, // key constants
  ];
  for (const pattern of patterns) {
    for (const [, key] of allRust.matchAll(pattern)) {
      if (key && !NOT_SETTINGS.has(key)) keys.add(key);
    }
  }
  return keys;
}

function defaultOf(key: SettingKey): unknown {
  return settingsSchema[key].default;
}

function constValue(name: string): string | undefined {
  return new RegExp(`const ${name}: &str = "([^"]*)"`).exec(allRust)?.[1];
}

describe("Rust ↔ schema settings contract", () => {
  test("the scan finds the settings readers", () => {
    expect(settingsReaders.length).toBeGreaterThan(3);
  });

  test("every key Rust reads is defined in the schema", () => {
    const missing = [...keysReadByRust()].filter((key) => !(key in settingsSchema));
    expect(missing, "register these keys in packages/native/src/settings/schema.ts").toEqual([]);
  });

  test("helper reads use the schema default (num / flag / read)", () => {
    const checked: string[] = [];
    for (const [, helper, key, raw] of allRust.matchAll(
      /\b(num|flag|read)\(\s*"([a-z_]+)",\s*([A-Za-z0-9_]+)\s*\)/g,
    )) {
      if (!key || !raw || !(key in settingsSchema)) continue;
      const rustDefault =
        helper === "num" ? Number(raw) : helper === "flag" ? raw === "true" : constValue(raw);
      expect(rustDefault, `${key} (${helper})`).toEqual(defaultOf(key as SettingKey));
      checked.push(key);
    }
    expect(checked.sort()).toEqual(
      [
        "capture_delay",
        "hotkey_fullscreen",
        "hotkey_region",
        "hotkey_text",
        "hotkey_window",
        "include_cursor",
      ].sort(),
    );
  });

  // Keys read without a helper: each default lives in a specific Rust spot.
  test("ocr_index_enabled falls back to the schema default", () => {
    expect(allRust).toMatch(/s\.get\(ENABLED_KEY\)\)[\s\S]{0,120}\.unwrap_or\(true\)/);
    expect(defaultOf("ocr_index_enabled")).toBe(true);
  });

  test("history defaults match the values seeded at launch", () => {
    expect(allRust).toMatch(/configured_cleanup_enabled\.unwrap_or\(false\)/);
    expect(defaultOf("history_cleanup_enabled")).toBe(false);
    const days = /DEFAULT_HISTORY_RETENTION_DAYS: i64 = (\d+);/.exec(allRust)?.[1];
    expect(Number(days)).toBe(defaultOf("history_retention_days"));
  });

  test("first_run is treated as not-yet-run when missing", () => {
    expect(allRust).toMatch(/fn is_first_run/);
    expect(defaultOf("first_run")).toBe(false);
  });

  test("every schema key is accounted for by Rust or marked frontend-only", () => {
    // naming_template is stored by the settings UI but not yet read by Rust (specs/11 § 2.4).
    const frontendOnly = new Set<string>(["naming_template"]);
    const rust = keysReadByRust();
    const unread = settingKeys.filter((key) => !rust.has(key) && !frontendOnly.has(key));
    expect(unread).toEqual([]);
  });
});
