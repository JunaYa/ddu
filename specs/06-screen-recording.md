# Spec 06: 录屏与 GIF

## 目标

在截图工具中提供轻量录屏能力，用于异步沟通、bug 复现、短教程和快速演示。录屏模块应专注短视频，不做完整视频剪辑器。

## 范围

包含：

- 区域、窗口、全屏录制。
- 麦克风、系统音频、摄像头画中画。
- 鼠标光标、点击动画、按键展示。
- 暂停/继续、停止、基础裁剪、导出 MP4/GIF。
- 录制时隐私提示和上传前检查。

不包含：

- 多轨时间线。
- 复杂转场、字幕排版、专业降噪。
- 长时间直播或推流。

## 用户故事

- 作为开发者，我可以录 30 秒 bug 复现并复制链接给同事。
- 作为产品经理，我可以录制一个带麦克风说明的短演示。
- 作为技术写作者，我可以导出 GIF 展示操作步骤。
- 作为讲解者，我可以显示鼠标点击和快捷键。
- 作为隐私敏感用户，我可以在录制前确认麦克风、摄像头和系统音频状态。

## 功能需求

### REC-001 录制模式

必须支持：

- 区域录制。
- 当前屏幕录制。
- 全屏录制。
- 窗口录制，平台不支持时降级为区域录制。

录制选择复用 [Spec 01](./01-capture-engine.md) 的 overlay 能力。

### REC-002 音频

支持：

- 麦克风。
- 系统音频，按平台能力启用。
- 静音录制。
- 录制后静音。

首次使用音频时必须显示权限引导。系统音频不可用时，不应阻塞无声录制。

### REC-003 摄像头画中画

- 可选择摄像头。
- 支持圆形、圆角矩形。
- 支持四角位置和自定义大小。
- 录制中可隐藏或移动。
- 摄像头权限缺失时明确提示。

### REC-004 鼠标和按键展示

- 可显示或隐藏鼠标。
- 可高亮鼠标点击。
- 可显示快捷键。
- 可隐藏普通字符输入，只显示修饰键和功能键。
- 按键展示默认关闭，避免泄露输入内容。

### REC-005 录制控制

录制中提供：

- 倒计时开始。
- 暂停/继续。
- 停止。
- 丢弃。
- 显示录制时长和文件大小估算。
- 可选“请勿打扰”提示或系统通知屏蔽建议。

### REC-006 录制后处理

录制完成后：

- 生成捕获后浮层。
- 可预览播放。
- 支持裁剪头尾。
- 支持静音或调整音量。
- 支持压缩质量。
- 支持导出 MP4。
- 支持短片段导出 GIF。

### REC-007 GIF 导出

- 默认限制最大时长 15 秒，可配置。
- 支持 FPS、宽度、颜色数、循环次数。
- 提供文件大小估算。
- 超过阈值时建议导出 MP4。

### REC-008 录制时标注

增强能力：

- 录制时画笔、箭头、高亮。
- 标注作为视频层实时烘焙。
- 结束后不可作为编辑器图层重新调整，除非后续引入视频项目格式。

## 平台适配

### macOS

- 评估 ScreenCaptureKit 捕获显示器、窗口和音频。
- 需要 Screen Recording、Microphone、Camera 权限。
- 系统音频策略需要单独验证，不应承诺所有 macOS 版本一致。

### Windows

- 评估 Windows.Graphics.Capture。
- 支持窗口和显示器选择。
- 系统音频可通过 WASAPI loopback 或框架能力评估。

### Linux

- Wayland 录屏优先通过 portal 和 PipeWire。
- X11 可评估原生捕获。
- 不同 compositor 对窗口录制支持不一致，需要运行时能力探测。

## 数据模型

```ts
interface RecordingRequest {
  id: string;
  mode: "region" | "window" | "currentScreen" | "fullScreen";
  region?: CaptureRect;
  includeCursor: boolean;
  showClicks: boolean;
  showKeystrokes: boolean;
  microphoneDeviceId?: string;
  includeSystemAudio: boolean;
  cameraDeviceId?: string;
  fps: 30 | 60;
  quality: "low" | "medium" | "high";
}

interface RecordingResult {
  id: string;
  requestId: string;
  filePath: string;
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  createdAt: string;
}
```

## 验收标准

- 用户能完成区域录制并导出 MP4。
- 录制中暂停、继续和停止稳定可用。
- 麦克风权限缺失不会导致无声录制失败。
- 录制后可裁剪头尾并保存新文件。
- GIF 导出有文件大小提示。
- 录制 1080p 30fps 5 分钟不应导致应用内存持续无界增长。

## 测试建议

- 平台矩阵：macOS、Windows、GNOME Wayland、KDE Wayland、X11。
- 音频矩阵：无声、麦克风、系统音频、麦克风 + 系统音频。
- 性能测试：1080p/4K、30fps/60fps、长录制、暂停恢复。
- 隐私测试：按键展示、摄像头权限、上传前敏感信息提示。

