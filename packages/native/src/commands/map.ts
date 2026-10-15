import type { OcrRegion, OcrResult } from "../preview.ts";
import type {
  CaptureSession,
  DiagnosticsBundle,
  HistoryItem,
  HitTest,
  PermissionKind,
  PermissionStatus,
} from "./types.ts";

/** Marker for commands that take no arguments. */
export type NoArgs = Record<string, never>;

/**
 * Every Rust command the React windows call, with its arguments and result.
 * Argument keys use Tauri's default camelCase conversion of the Rust
 * parameter names. Register a command here when a window starts using it
 * (specs/11 § 2.1); this table is the contract reviewers check against Rust.
 */
export interface CommandMap {
  hide_preview_window: { args: NoArgs; result: void };
  update_preview_window: { args: NoArgs; result: void };
  copy_image_to_clipboard: { args: { path: string }; result: void };
  copy_text: { args: { text: string }; result: void };
  perform_ocr: { args: { path: string; region: OcrRegion | null }; result: OcrResult };
  save_annotated_image: { args: { base64: string; sourcePath: string }; result: string };
  copy_image_bytes: { args: { base64: string }; result: void };
  take_permission_navigation: { args: NoArgs; result: boolean };
  smart_capture_start: { args: { mode: "auto" | "window" | "scroll" }; result: void };
  scroll_status: {
    args: NoArgs;
    result: { active: boolean; frames: number; height: number; message: string };
  };
  scroll_cancel: { args: NoArgs; result: void };
  scroll_finish: { args: NoArgs; result: void };
  is_recording: { args: NoArgs; result: boolean };
  start_recording: {
    args: {
      path: string;
      config: {
        mode: "fullscreen" | "region";
        include_cursor: boolean;
        include_audio: boolean;
        system_audio: boolean;
      };
    };
    result: string;
  };
  stop_recording: {
    args: NoArgs;
    result: { file_path: string; filename: string; duration_estimate_ms: number };
  };

  apply_shortcuts: { args: NoArgs; result: void };
  get_diagnostics_bundle: { args: NoArgs; result: DiagnosticsBundle };
  list_history_items: { args: { path: string }; result: HistoryItem[] };
  delete_history_items: { args: { paths: string[] }; result: number };
  clear_ocr_index: { args: NoArgs; result: void };
  permission_app_path: { args: NoArgs; result: string };
  permission_move_window: { args: NoArgs; result: void };
  permission_drag_app: { args: NoArgs; result: void };
  permission_open_settings: { args: { kind: PermissionKind }; result: void };
  permission_status: { args: NoArgs; result: PermissionStatus };
  /** Resolves to whether the permission is granted afterwards. */
  permission_request: {
    args: { kind: PermissionKind; origin?: { x: number; y: number } };
    result: boolean;
  };
  restart_app: { args: NoArgs; result: void };
  /** File names (history item ids) whose indexed OCR text contains `query`. */
  search_history_text: { args: { query: string }; result: string[] };
  /** OCR and index screenshots; resolves to how many were indexed. */
  ocr_index_items: { args: { paths: string[] }; result: number };
  /** The image file's bytes, base64-encoded (path must be in the images directory). */
  get_image_base64: { args: { path: string }; result: string };
  /** The frozen screen and mode for the capture overlay; rejects when no session is active. */
  smart_capture_get_session: { args: NoArgs; result: CaptureSession };
  /** UI elements under a global logical point. */
  smart_capture_hit_test: { args: { x: number; y: number }; result: HitTest };
  /** Capture a global logical rect; Rust closes the overlay whatever happens. */
  smart_capture_finalize: { args: { x: number; y: number; w: number; h: number }; result: void };
  smart_capture_cancel: { args: NoArgs; result: void };
  /** Save a composed PNG (base64) as a new capture and open it in the preview. */
  open_combined_image: { args: { base64: string }; result: void };
}

export type CommandName = keyof CommandMap;
export type CommandArgs<K extends CommandName> = CommandMap[K]["args"];
export type CommandResult<K extends CommandName> = CommandMap[K]["result"];
