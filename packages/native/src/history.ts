import { stat } from "@tauri-apps/plugin-fs";
import { call } from "./commands/call.ts";

/** File names (history item ids) whose indexed OCR text contains `query`. */
export const searchHistoryText = (query: string): Promise<string[]> =>
  call("search_history_text", { query });

/** OCR and index screenshots so they become searchable; resolves to how many were indexed. */
export const indexHistoryItems = (paths: string[]): Promise<number> =>
  call("ocr_index_items", { paths });

/** A screenshot as a `data:` URL, read through the path-guarded backend. */
export async function imageDataUrl(path: string): Promise<string> {
  const base64 = await call("get_image_base64", { path });
  return `data:${mimeTypeOf(path)};base64,${base64}`;
}

/** Save a composed PNG (base64, no data-URL prefix) as a new capture and open it. */
export const openCombinedImage = (base64: string): Promise<void> =>
  call("open_combined_image", { base64 });

export interface FileTimes {
  modified: Date | null;
  accessed: Date | null;
  created: Date | null;
}

/**
 * File timestamps via the fs plugin. Its scope only covers the app data
 * directory, so screenshots saved elsewhere resolve to all-null (specs/93 F7).
 */
export async function fileTimes(path: string): Promise<FileTimes> {
  try {
    const info = await stat(path);
    return { modified: info.mtime, accessed: info.atime, created: info.birthtime };
  } catch {
    return { modified: null, accessed: null, created: null };
  }
}

export function mimeTypeOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}
