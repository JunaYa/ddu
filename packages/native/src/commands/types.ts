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
