export { cancelCapture, captureSession, finalizeCapture, hitTest } from "./capture.ts";
export { call, NativeError } from "./commands/call.ts";
export type { CommandArgs, CommandMap, CommandName, CommandResult } from "./commands/map.ts";
export type {
  CaptureSession,
  ChainNode,
  DiagnosticsBundle,
  HistoryItem,
  HitTest,
  LogicalRect,
  PermissionKind,
  PermissionStatus,
  PlatformCapability,
} from "./commands/types.ts";
export { on, type CapturePrepared, type EventMap } from "./events.ts";
export {
  fileTimes,
  type FileTimes,
  imageDataUrl,
  indexHistoryItems,
  mimeTypeOf,
  openCombinedImage,
  searchHistoryText,
} from "./history.ts";
export {
  appVersion,
  permissionStatus,
  requestPermission,
  restartApp,
  permissionAppPath,
  dragPermissionApp,
  movePermissionWindow,
  openPermissionSettings,
  closePermissionHelper,
} from "./permissions.ts";
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

export {
  hidePreview,
  openImageForOcr,
  takeImportedImage,
  expandPreview,
  dragPreview,
  copyCapture,
  copyText,
  recognizeText,
  saveAnnotatedImage,
  copyImageBytes,
  type OcrRegion,
  type OcrBlock,
  type OcrResult,
} from "./preview.ts";
