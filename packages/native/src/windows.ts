import { getCurrentWindow } from "@tauri-apps/api/window";

/** Tauri window labels; each is also its HTML entry name (specs/12 § 2). */
export const WINDOW = {
  main: "main",
  setting: "setting",
  preview: "preview",
  startup: "startup",
  capture: "capture",
} as const;

export type WindowLabel = (typeof WINDOW)[keyof typeof WINDOW];

const labels: ReadonlySet<string> = new Set(Object.values(WINDOW));

export function isWindowLabel(label: string): label is WindowLabel {
  return labels.has(label);
}

/** The label of the window this code runs in. */
export function currentWindowLabel(): WindowLabel {
  const { label } = getCurrentWindow();
  if (!isWindowLabel(label)) throw new Error(`Unknown window label: ${label}`);
  return label;
}
