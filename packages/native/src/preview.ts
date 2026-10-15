import { getCurrentWindow } from "@tauri-apps/api/window";
import { call } from "./commands/call.ts";

export interface OcrRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface OcrBlock extends OcrRegion {
  text: string;
  confidence: number;
}
export interface OcrResult {
  text: string;
  language: string;
  engine: string;
  blocks: OcrBlock[];
}

export const hidePreview = () => call("hide_preview_window");
export const expandPreview = () => call("update_preview_window");
export const dragPreview = () => getCurrentWindow().startDragging();
export const copyCapture = (path: string) => call("copy_image_to_clipboard", { path });
export const copyText = (text: string) => call("copy_text", { text });
export const recognizeText = (path: string, region: OcrRegion | null = null) =>
  call("perform_ocr", { path, region });
export const saveAnnotatedImage = (base64: string, sourcePath: string) =>
  call("save_annotated_image", { base64, sourcePath });
export const copyImageBytes = (base64: string) => call("copy_image_bytes", { base64 });
