import type { DiagnosticsBundle, HistoryItem, PermissionKind, PermissionStatus } from "./types.ts";

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
  permission_status: { args: NoArgs; result: PermissionStatus };
  /** Resolves to whether the permission is granted afterwards. */
  permission_request: { args: { kind: PermissionKind }; result: boolean };
  restart_app: { args: NoArgs; result: void };
  /** File names (history item ids) whose indexed OCR text contains `query`. */
  search_history_text: { args: { query: string }; result: string[] };
  /** OCR and index screenshots; resolves to how many were indexed. */
  ocr_index_items: { args: { paths: string[] }; result: number };
  /** The image file's bytes, base64-encoded (path must be in the images directory). */
  get_image_base64: { args: { path: string }; result: string };
  /** Save a composed PNG (base64) as a new capture and open it in the preview. */
  open_combined_image: { args: { base64: string }; result: void };
}

export type CommandName = keyof CommandMap;
export type CommandArgs<K extends CommandName> = CommandMap[K]["args"];
export type CommandResult<K extends CommandName> = CommandMap[K]["result"];
