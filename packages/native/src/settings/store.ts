import { listen } from "@tauri-apps/api/event";
import { call } from "../commands/call.ts";
import { z } from "zod";
import { type SettingKey, type SettingValue, settingsSchema } from "./schema.ts";

/** Rust owns the same file; values are stored as `{ "value": … }` (N4). */

/**
 * Decode a raw stored entry. Missing or invalid values (e.g. written by an
 * older build) fall back to the default rather than throwing.
 */
function decode<K extends SettingKey>(key: K, raw: unknown): SettingValue<K> {
  const entry = settingsSchema[key];
  if (raw === undefined || raw === null) return entry.default as SettingValue<K>;
  const parsed = z.object({ value: entry.schema }).safeParse(raw);
  if (parsed.success) return parsed.data.value as SettingValue<K>;
  console.warn(`settings.json: invalid value for "${key}", using default`, raw);
  return entry.default as SettingValue<K>;
}

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  return decode(key, await call("read_setting", { key }));
}

/** Validate, write and persist one setting. Invalid values throw a `ZodError`. */
export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
): Promise<void> {
  const valid = settingsSchema[key].schema.parse(value);
  await call("write_setting", { key, value: valid });
}

/**
 * Observe a setting, including changes made by other windows or by Rust
 * (the store is shared app-wide). Resolves to the unsubscribe function.
 */
export async function onSettingChange<K extends SettingKey>(
  key: K,
  handler: (value: SettingValue<K>) => void,
): Promise<() => void> {
  return listen<{ key: string; value: unknown }>("store://change", ({ payload }) => {
    if (payload.key === key) handler(decode(key, payload.value));
  });
}
