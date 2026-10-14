import type { PermissionKind } from "@ddu/native";

export const permissions: { kind: PermissionKind; title: string; description: string }[] = [
  { kind: "accessibility", title: "辅助功能", description: "用于智能选区识别窗口内的界面元素。" },
  { kind: "screenRecording", title: "屏幕录制", description: "用于截取屏幕内容和录屏。" },
  { kind: "microphone", title: "麦克风", description: "可选，仅在录屏包含麦克风声音时需要。" },
];

export const permissionStateLabel = (state?: string) => {
  switch (state) {
    case "granted":
      return "已授权";
    case "denied":
      return "未授权";
    case "undetermined":
      return "尚未请求";
    case "restricted":
      return "系统限制";
    default:
      return "状态未知";
  }
};
