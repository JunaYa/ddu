import { call } from "./commands/call.ts";
import type { DiagnosticsBundle, HistoryItem } from "./commands/types.ts";

/** Re-register global shortcuts from the stored hotkeys; rejects with the offending combo. */
export const applyShortcuts = (): Promise<void> => call("apply_shortcuts");

export const getDiagnosticsBundle = (): Promise<DiagnosticsBundle> =>
  call("get_diagnostics_bundle");

/** Screenshots in the controlled images directory, newest first. */
export const listHistoryItems = (): Promise<HistoryItem[]> =>
  call("list_history_items", { path: "images" });

/** Move screenshots to Trash. On failure rejects with details; some files may have moved. */
export const deleteHistoryItems = (paths: string[]): Promise<number> =>
  call("delete_history_items", { paths });

/** Delete every stored OCR index entry. */
export const clearOcrIndex = (): Promise<void> => call("clear_ocr_index");
