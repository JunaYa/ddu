import type { DiagnosticsBundle, HistoryItem } from "./types.ts";

/** Marker for commands that take no arguments. */
export type NoArgs = Record<string, never>;

/**
 * Every Rust command the React windows call, with its arguments and result.
 * Argument keys use Tauri's default camelCase conversion of the Rust
 * parameter names. Register a command here when a window starts using it
 * (specs/11 § 2.1); this table is the contract reviewers check against Rust.
 */
export interface CommandMap {
  apply_shortcuts: { args: NoArgs; result: void };
  get_diagnostics_bundle: { args: NoArgs; result: DiagnosticsBundle };
  list_history_items: { args: { path: string }; result: HistoryItem[] };
  delete_history_items: { args: { paths: string[] }; result: number };
  clear_ocr_index: { args: NoArgs; result: void };
}

export type CommandName = keyof CommandMap;
export type CommandArgs<K extends CommandName> = CommandMap[K]["args"];
export type CommandResult<K extends CommandName> = CommandMap[K]["result"];
