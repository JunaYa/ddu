# Spec 07: 设置、平台适配与交付

## 目标

提供稳定可维护的设置体系、平台权限引导、快捷键管理、打包更新和企业策略。该模块确保截图工具能在真实桌面环境中长期可靠运行。

## 范围

包含：

- 设置页和配置存储。
- 全局快捷键。
- 权限检查和 onboarding。
- 平台能力探测。
- 打包、自动更新、日志和诊断。
- 可访问性、国际化和企业策略。

## 用户故事

- 作为新用户，我能在首次启动时完成必要权限设置。
- 作为高级用户，我能自定义快捷键、保存路径和工作流。
- 作为 Linux 用户，我能看到当前桌面环境支持哪些能力。
- 作为企业管理员，我能禁用公共上传、AI 或自定义脚本。
- 作为开发者，我能通过诊断包定位截图失败原因。

## 功能需求

### SET-001 设置分类

设置页包含：

- General：开机启动、主题、语言、更新。
- Capture：默认模式、指针、延时、冻结屏幕、滚动截图。
- Shortcuts：全局快捷键和编辑器快捷键。
- Editor：默认工具、颜色、字体、背景预设。
- History：保留时间、容量、索引、清空历史。
- Workflows：捕获后动作和规则。
- Uploads：上传目标、密钥、链接策略。
- Privacy：OCR、敏感信息扫描、AI、遥测。
- Platform：权限状态、桌面环境、能力诊断。

### SET-002 配置存储

- 设置以本地文件保存。
- 密钥和 token 使用系统安全存储。
- 配置导入导出不包含密钥明文。
- 配置 schema 必须版本化并支持迁移。
- 配置损坏时应恢复默认配置，并保留损坏文件用于诊断。

### SET-003 全局快捷键

默认快捷键：

- 新区域截图。
- 全屏截图。
- 窗口截图。
- 上次区域截图。
- OCR 选区。
- 开始录屏。
- 打开历史库。

要求：

- 支持冲突检测。
- 支持按平台显示符号。
- Wayland 不支持全局快捷键时显示替代方案。
- 用户可恢复默认。

### SET-004 权限 onboarding

首次启动检查：

- macOS：Screen Recording、Accessibility、Microphone、Camera。
- Windows：捕获 API 支持、麦克风、摄像头、通知。
- Linux：X11/Wayland、portal、PipeWire、全局快捷键支持。

每项权限显示：

- 当前状态。
- 用途说明。
- 打开系统设置或帮助文档入口。
- 重试按钮。
- 跳过按钮。

### SET-005 平台能力探测

应用启动和设置页都应能显示能力矩阵：

- 区域截图。
- 窗口截图。
- 静默截图。
- 滚动截图。
- 录屏。
- 系统音频。
- 全局快捷键。
- OCR 引擎。
- 安全存储。

能力状态使用：`available`、`limited`、`unavailable`、`unknown`。

### SET-006 日志和诊断

诊断包包含：

- 应用版本。
- 操作系统版本。
- 桌面环境。
- 权限状态。
- 最近错误日志。
- capture adapter 能力。
- 配置摘要，不包含密钥。

用户必须能在提交前预览诊断内容。

### SET-007 自动更新和发布渠道

发布渠道：

- Stable。
- Beta。
- Nightly，内部或高级用户。

更新要求：

- macOS 支持签名和 notarization。
- Windows 支持签名安装包。
- Linux 支持 AppImage、deb/rpm、Flatpak 或 Snap 中至少两种。
- 更新检查可关闭。
- 企业策略可锁定版本或关闭自动更新。

### SET-008 可访问性和国际化

- 所有交互控件有可访问名称。
- overlay 和编辑器主要操作可键盘完成。
- 支持高对比度和减少动画。
- 支持简体中文和英文，后续扩展。
- 快捷键说明按平台本地化。

### SET-009 企业策略

可配置策略：

- 禁用公共图床。
- 禁用自定义脚本。
- 禁用 AI。
- 禁用遥测。
- 强制历史保留上限。
- 强制默认保存目录。
- 限制上传域名。
- 禁用自动更新或指定更新源。

策略来源：

- 本地策略文件。
- Windows registry 或管理模板。
- macOS configuration profile。
- Linux 系统级配置目录。

## 数据模型

```ts
interface AppSettings {
  version: number;
  general: GeneralSettings;
  capture: CaptureSettings;
  shortcuts: ShortcutSettings;
  editor: EditorSettings;
  history: HistorySettings;
  workflows: WorkflowSettings;
  uploads: UploadSettings;
  privacy: PrivacySettings;
  platform: PlatformSettings;
}

interface PlatformCapability {
  key: string;
  status: "available" | "limited" | "unavailable" | "unknown";
  reason?: string;
  remediation?: string;
}
```

## 验收标准

- 首次启动能引导用户完成截图所需权限。
- 快捷键冲突能被检测并阻止保存。
- Linux Wayland 下能力限制清晰可见。
- 配置迁移不会丢失用户设置。
- 诊断包不包含密钥、token 或截图内容。
- 企业策略生效后，受限入口不可点击并显示原因。

## 测试建议

- 配置测试：默认值、迁移、损坏恢复、导入导出。
- 权限测试：首次授权、拒绝、撤销、重试。
- 快捷键测试：冲突、恢复默认、Wayland 降级。
- 打包测试：macOS 签名、Windows 安装卸载、Linux 多发行版安装。
- 安全测试：密钥存储、诊断包脱敏、企业策略覆盖用户设置。

