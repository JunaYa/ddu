import { z } from "zod";

/**
 * The single source of truth for every key in `settings.json` (specs/11 § 2.4).
 * Defaults must equal the fallback Rust uses when it reads the key; the
 * `settings-contract` test enforces that against the Rust sources.
 *
 * `workflow_rules` is deliberately absent: it is stored as a bare array and
 * owned by Rust's workflow commands.
 */
export const settingsSchema = {
  /** Seeded by Rust at launch when empty, so readers always see a real path. */
  screenshot_path: { schema: z.string(), default: "" },
  /** Seconds. The pre-migration UI showed 3 when unset while Rust used 0 (D10). */
  capture_delay: { schema: z.number().int().min(0), default: 0 },
  include_cursor: { schema: z.boolean(), default: false },
  /** Stored but not yet read by Rust; kept so users' values survive. */
  naming_template: { schema: z.string(), default: "{date}_{time}_{mode}" },
  // Rust treats an empty hotkey as unset and registers the default, so an
  // empty string is invalid here too (global_shortcut.rs `read_hotkeys`).
  hotkey_fullscreen: { schema: z.string().min(1), default: "CmdOrCtrl+Shift+A" },
  hotkey_region: { schema: z.string().min(1), default: "CmdOrCtrl+Shift+S" },
  hotkey_window: { schema: z.string().min(1), default: "CmdOrCtrl+Shift+W" },
  history_retention_days: { schema: z.number().int(), default: 30 },
  history_cleanup_enabled: { schema: z.boolean(), default: false },
  ocr_index_enabled: { schema: z.boolean(), default: true },
  /** Rust writes `{ value: true }` once the first-run guide was shown and only checks presence. */
  first_run: { schema: z.boolean(), default: false },
} as const satisfies Record<string, { schema: z.ZodType; default: unknown }>;

export type SettingKey = keyof typeof settingsSchema;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingsSchema)[K]["schema"]>;

export const settingKeys = Object.keys(settingsSchema) as SettingKey[];
