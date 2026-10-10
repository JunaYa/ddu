// Return shapes of Rust commands, copied field-for-field from their serde
// output (no case conversion at this layer; specs/11 § 2.1).

/** `PlatformCapability` in src-tauri/src/cmd/diagnostics.rs. */
export interface PlatformCapability {
  key: string;
  status: string;
  reason: string | null;
}

/** `DiagnosticsBundle` in src-tauri/src/cmd/diagnostics.rs. */
export interface DiagnosticsBundle {
  app_version: string;
  os: string;
  os_version: string;
  arch: string;
  capabilities: PlatformCapability[];
  permissions: PlatformCapability[];
}

/** Permission names accepted by `permission_request` (`PermissionKind::parse`). */
export type PermissionKind = "screenRecording" | "accessibility" | "microphone";

/**
 * `PermissionStatusDto` in src-tauri/src/cmd/permissions.rs. Screen Recording
 * and Accessibility are `"granted" | "denied"`; the microphone can also report
 * other AVFoundation states, so all three are kept as strings.
 */
export interface PermissionStatus {
  screenRecording: string;
  accessibility: string;
  microphone: string;
}

/** `HistoryItem` in src-tauri/src/cmd/history.rs. */
export interface HistoryItem {
  id: string;
  filename: string;
  full_path: string;
  width: number;
  height: number;
  file_size: number;
  mode: string;
  captured_at: string;
  favorite: boolean;
  tags: string[];
}
