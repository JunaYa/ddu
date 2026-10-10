import { homeDir } from "@tauri-apps/api/path";
import * as autostartPlugin from "@tauri-apps/plugin-autostart";
import { confirm as confirmDialog, open } from "@tauri-apps/plugin-dialog";

/** Launch-at-login. */
export const autostart = {
  isEnabled: (): Promise<boolean> => autostartPlugin.isEnabled(),
  enable: (): Promise<void> => autostartPlugin.enable(),
  disable: (): Promise<void> => autostartPlugin.disable(),
};

/** Ask the user for a directory. Resolves to `null` when they cancel. */
export async function pickDirectory(options: {
  title: string;
  defaultPath?: string;
}): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: options.title,
    defaultPath: options.defaultPath ?? (await homeDir()),
  });
  return selected;
}

/** Native confirmation dialog (kept native rather than an in-app dialog; specs/13 § 4). */
export function confirm(
  message: string,
  options: { title: string; kind?: "info" | "warning" | "error" },
): Promise<boolean> {
  return confirmDialog(message, options);
}
