export { call, NativeError } from "./commands/call.ts";
export type { CommandArgs, CommandMap, CommandName, CommandResult } from "./commands/map.ts";
export type { DiagnosticsBundle, HistoryItem, PlatformCapability } from "./commands/types.ts";
export { on, type CapturePrepared, type EventMap } from "./events.ts";
export { autostart, confirm, pickDirectory } from "./plugins.ts";
export {
  applyShortcuts,
  clearOcrIndex,
  deleteHistoryItems,
  getDiagnosticsBundle,
  listHistoryItems,
} from "./settings-commands.ts";
export {
  settingKeys,
  settingsSchema,
  type SettingKey,
  type SettingValue,
} from "./settings/schema.ts";
export { getSetting, onSettingChange, setSetting } from "./settings/store.ts";
export { currentWindowLabel, isWindowLabel, WINDOW, type WindowLabel } from "./windows.ts";
