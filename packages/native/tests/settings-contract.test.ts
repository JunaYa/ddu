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

/** The serde_json accessor Rust uses for each schema value type. */
const ACCESSOR_FOR_TYPE: Record<string, ReadonlyArray<string>> = {
  string: ["as_str"],
  boolean: ["as_bool"],
  number: ["as_i64", "as_u64"],
};

function schemaType(key: SettingKey): string {
  return (settingsSchema[key].schema as unknown as { def: { type: string } }).def.type;
}

/** Accessor each local read helper (`read`/`num`/`flag`) applies to the stored value. */
function helperAccessors(): Map<string, string> {
  const helpers = new Map<string, string>();
  for (const [, name, accessor] of allRust.matchAll(
    /let (read|num|flag) = \|[\s\S]{0,500}?\.get\("value"\)[\s\S]{0,80}?\.(as_(?:str|bool|i64|u64|f64))\(\)/g,
  )) {
    if (name && accessor) helpers.set(name, accessor);
  }
  return helpers;
}

/** The accessor applied to `key`'s value (inside the `{ value }` envelope) at each Rust read site. */
function accessorsFor(key: string, helpers: Map<string, string>): string[] {
  const found: string[] = [];
  for (const [, helper] of allRust.matchAll(new RegExp(`\\b(read|num|flag)\\(\\s*"${key}"`, "g"))) {
    const accessor = helper && helpers.get(helper);
    if (accessor) found.push(accessor);
  }
  // Direct reads, by literal or by a `*_KEY` constant naming the key.
  const consts = [...allRust.matchAll(new RegExp(`const ([A-Z_]+_KEY): &str = "${key}"`, "g"))].map(
    (m) => m[1],
  );
  for (const target of [`"${key}"`, ...consts]) {
    const site = new RegExp(
      `\\.get\\(\\s*${target}\\s*\\)[\\s\\S]{0,300}?\\.get\\("value"\\)[\\s\\S]{0,80}?\\.(as_(?:str|bool|i64|u64|f64))\\(\\)`,
      "g",
    );
    for (const [, accessor] of allRust.matchAll(site)) if (accessor) found.push(accessor);
  }
  return found;
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

  test("store reads keyed by a constant use a known key constant", () => {
    const keyConsts = new Set(
      [...allRust.matchAll(/const ([A-Z_]+_KEY): &str = "[a-z_]+"/g)].map((m) => m[1]),
    );
    const unresolved = [...allRust.matchAll(/\.get\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g)]
      .map((m) => m[1])
      .filter((name) => !keyConsts.has(name));
    expect(unresolved, "name settings key constants `*_KEY` so this test can resolve them").toEqual(
      [],
    );
  });

  test("Rust reads each key with the accessor matching its schema type", () => {
    const helpers = helperAccessors();
    expect([...helpers.keys()].sort()).toEqual(["flag", "num", "read"]);
    const checked: string[] = [];
    for (const key of settingKeys) {
      const allowed = ACCESSOR_FOR_TYPE[schemaType(key)] ?? [];
      for (const accessor of accessorsFor(key, helpers)) {
        expect(allowed, `${key} is read with ${accessor}`).toContain(accessor);
        checked.push(key);
      }
    }
    // Every key Rust reads by value must have been type-checked (first_run is presence-only).
    const expected = [...keysReadByRust()].filter((key) => key !== "first_run");
    expect([...new Set(checked)].sort()).toEqual(expected.sort());
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

  test("first_run: absent means the guide has not run, and Rust only ever writes true", () => {
    expect(allRust).toMatch(
      /fn is_first_run\(stored: Option<serde_json::Value>\) -> bool \{\s*match stored \{\s*None => true,/,
    );
    expect(allRust).toMatch(
      /store\.set\("first_run"\.to_string\(\), json!\(\{ "value": true \}\)\)/,
    );
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
