# Spec 01: 截图捕获引擎

## 目标

提供稳定、快速、跨平台的捕获能力，覆盖区域、窗口、全屏、当前屏幕、延时、上次区域、滚动截图和基础录屏入口。捕获引擎应把平台差异封装成 adapter，向产品层暴露统一请求和结果模型。

## 范围

包含：

- 捕获 overlay、选区、窗口高亮、尺寸提示、放大镜、键盘微调。
- 区域、固定区域、上次区域、当前屏幕、全屏、活动窗口、鼠标下窗口。
- 延时捕获、包含/排除光标、冻结屏幕。
- 滚动截图的任务模型和拼接结果。
- 平台权限检查和降级提示。

不包含：

- 完整录屏实现，见 [Spec 06](./06-screen-recording.md)。
- 标注编辑器，见 [Spec 02](./02-editor-annotation.md)。
- 上传与分享，见 [Spec 05](./05-sharing-export-integrations.md)。

## 用户故事

- 作为开发者，我可以按一个快捷键选择任意区域并复制到剪贴板。
- 作为 QA，我可以重复截取上次区域，方便记录同一个页面状态变化。
- 作为设计师，我可以在选择区域时看到尺寸、坐标和放大镜。
- 作为技术写作者，我可以延时捕获菜单、tooltip 或下拉框。
- 作为 Linux 用户，我能知道当前桌面环境是否限制截图能力，而不是看到无声失败。

## 功能需求

### CAP-001 捕获模式

必须支持以下模式：

- `region`：用户拖拽矩形区域。
- `fixedRegion`：用户输入宽高或选择预设比例。
- `lastRegion`：复用最近一次成功区域。
- `fullScreen`：所有显示器组成的虚拟桌面。
- `currentScreen`：鼠标所在显示器。
- `activeWindow`：当前焦点窗口。
- `windowUnderCursor`：鼠标悬停窗口。
- `scrollingRegion`：用户选择一个可滚动区域后开始拼接。

### CAP-002 选区交互

区域选择必须支持：

- 鼠标拖拽创建、移动和调整区域。
- Shift 锁定正方形或等比。
- 方向键以 1 px 移动选区，Shift + 方向键以 10 px 移动。
- Alt/Option + 方向键调整宽高。
- Esc 取消，Enter 捕获，Space 临时移动区域。
- 显示选区尺寸、坐标和当前缩放比例。

### CAP-003 放大镜和像素辅助

选择区域时显示放大镜：

- 放大倍率默认 8x，可在设置中调到 4x、8x、12x。
- 显示十字线、当前像素色值、选区尺寸。
- 在低性能设备上可自动降级为静态预览。

### CAP-004 窗口捕获

窗口模式必须支持：

- 悬停高亮候选窗口。
- 捕获窗口内容，可选择包含或排除阴影/边框。
- 捕获弹窗、菜单或 tooltip 时允许延时。
- 多窗口捕获作为后续增强，不进入 MVP。

### CAP-005 延时和冻结

- 延时支持 3 秒、5 秒、10 秒和自定义秒数。
- 冻结屏幕模式在进入 overlay 时生成静态桌面快照，用于捕获动态内容或会消失的弹窗。
- 冻结模式必须显示醒目状态，避免用户误以为系统卡住。

### CAP-006 滚动截图

滚动截图分为两种实现：

- MVP：手动滚动拼接。用户选择区域后滚动内容，应用持续采样并拼接。
- 增强：自动滚动拼接。平台和应用允许时模拟滚动并自动停止。

必须处理：

- 内容滚动过快时暂停并提示。
- 动态内容、视频、骨架屏、懒加载导致拼接失败时给出失败原因。
- 最大高度限制，默认 50,000 px，可配置。
- 输出合成图并保留拼接日志用于调试。

### CAP-007 权限状态

捕获前必须检查平台权限：

- macOS：屏幕录制权限、辅助功能权限、麦克风权限仅在录屏时需要。
- Windows：Graphics Capture 支持性、管理员权限窗口限制、录屏音频权限。
- Linux：X11、Wayland、portal、PipeWire、桌面环境。

权限不可用时，显示可操作的引导：打开系统设置、重试、降级到 portal、使用系统截图工具。

## 数据模型

```ts
interface CaptureRequest {
  id: string;
  mode:
    | "region"
    | "fixedRegion"
    | "lastRegion"
    | "fullScreen"
    | "currentScreen"
    | "activeWindow"
    | "windowUnderCursor"
    | "scrollingRegion";
  includeCursor: boolean;
  delayMs: number;
  freezeScreen: boolean;
  targetDisplayId?: string;
  region?: CaptureRect;
  fixedSize?: CaptureSize;
  outputColorSpace: "srgb" | "display-p3" | "hdr";
}

interface CaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}

interface CaptureResult {
  id: string;
  requestId: string;
  bitmapPath: string;
  width: number;
  height: number;
  colorSpace: string;
  source: CaptureSource;
  capturedAt: string;
  permissionWarnings: PermissionWarning[];
}

interface CaptureSource {
  platform: "macos" | "windows" | "linux";
  displayId?: string;
  windowId?: string;
  appName?: string;
  windowTitle?: string;
}
```

## 平台适配

### macOS

- 评估 ScreenCaptureKit 作为录屏和高性能捕获基础。
- 对静态截图可评估原生窗口/显示器截图 API，但产品层不应依赖具体 API。
- 首次捕获前引导 Screen Recording 权限。
- 全屏 Space、隐藏窗口、受保护内容可能无法捕获，需明确提示。

### Windows

- 优先评估 Windows.Graphics.Capture。
- 捕获窗口时处理 DPI 缩放、窗口阴影和不可见边框。
- 管理员权限窗口可能需要同权限运行或提示降级。
- HDR 截图需明确输出 SDR 或 HDR。

### Linux

- X11 adapter 支持窗口枚举、区域截图和全局快捷键。
- Wayland adapter 通过 xdg-desktop-portal 请求截图或录屏。
- portal 可能强制系统确认框，产品不得承诺静默捕获。
- GNOME/KDE/Sway/Hyprland 的 portal 能力要在运行时探测。

## 验收标准

- 在每个平台完成区域、全屏、当前屏幕和延时捕获。
- 选区 overlay 在 100%、125%、150%、200% 缩放下坐标准确。
- 多显示器跨屏选择不会错位。
- 权限缺失时没有崩溃或空白图片，用户能看到明确恢复路径。
- 捕获 4K 全屏图片的首帧反馈小于 300 ms，最终结果小于 1.5 秒。
- 滚动截图失败时能保留部分结果或明确失败原因。

## 测试建议

- 单元测试：请求模型、坐标换算、DPI 缩放、文件命名。
- 集成测试：区域、全屏、窗口、延时、上次区域。
- 手动矩阵：macOS Retina + 外接屏、Windows HDR + 多 DPI、Linux X11、GNOME Wayland、KDE Wayland。
- 回归样例：菜单捕获、tooltip、视频画面、虚拟列表、滚动网页、长代码文件。

