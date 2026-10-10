import { listen } from "@tauri-apps/api/event";

/** `capture_payload` in src-tauri/src/global_shortcut.rs. */
export interface CapturePrepared {
  filename: string;
  fullPath: string;
  width: number;
  height: number;
  mode: string;
  capturedAt: string;
  copyError: string | null;
  extractText: boolean;
}

/** Events Rust pushes to windows, by name. */
export interface EventMap {
  /** A capture finished and is ready for the preview window. */
  "image-prepared": CapturePrepared;
}

/**
 * Subscribe to a Rust event. Resolves to the unsubscribe function, which
 * callers must invoke when they unmount.
 */
export async function on<K extends keyof EventMap>(
  name: K,
  handler: (payload: EventMap[K]) => void,
): Promise<() => void> {
  return listen<EventMap[K]>(name, (event) => handler(event.payload));
}
