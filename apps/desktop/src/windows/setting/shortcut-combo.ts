const MODIFIERS = new Set(["Meta", "Control", "Shift", "Alt"]);

/**
 * The Tauri accelerator for a key press, e.g. `CmdOrCtrl+Shift+S`, or `null`
 * while only modifiers are held. Same format the shortcut settings always
 * stored, so existing values keep working.
 */
export function comboFromKeyEvent(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">,
): string | null {
  if (MODIFIERS.has(event.key)) return null;
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("CmdOrCtrl");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  parts.push(event.key.toUpperCase());
  return parts.join("+");
}
