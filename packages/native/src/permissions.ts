import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { call } from "./commands/call.ts";
import type { PermissionKind, PermissionStatus } from "./commands/types.ts";

export const permissionStatus = (): Promise<PermissionStatus> => call("permission_status");

/**
 * Prompt for a permission (or open its System Settings pane when macOS will
 * not prompt again). Resolves to whether it is granted afterwards.
 */
export const requestPermission = (
  kind: PermissionKind,
  origin?: { x: number; y: number },
): Promise<boolean> => call("permission_request", origin ? { kind, origin } : { kind });

/** Relaunch the app; macOS applies a new Screen Recording grant only to a fresh process. */
export const restartApp = (): Promise<void> => call("restart_app");

/** The app version from tauri.conf.json. */
export const appVersion = (): Promise<string> => getVersion();

export const permissionAppPath = (): Promise<string> => call("permission_app_path");
export const dragPermissionApp = (): Promise<void> => call("permission_drag_app");
export const openPermissionSettings = (kind: PermissionKind): Promise<void> =>
  call("permission_open_settings", { kind });
export const closePermissionHelper = (): Promise<void> => getCurrentWindow().close();
