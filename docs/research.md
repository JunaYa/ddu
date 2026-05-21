# macOS、Windows、Linux 截图工具调研

调研日期：2026-05-19  
调研目标：识别好评截图工具的功能模式，为跨平台产品设计和开发拆解提供依据。

## 调研方法

本调研优先使用官方产品页、官方帮助文档、开源仓库和系统厂商文档。所谓“好评应用”采用以下信号综合判断：

- 长期维护或系统原生预装。
- 官方功能完整且用户群明确。
- 开源项目有较高 star、活跃发布或发行版收录。
- 专业市场或企业用户有采用信号。
- 在同类产品讨论中反复出现，并能提供清晰的功能借鉴。

## 代表应用总览

| 平台 | 应用 | 好评/采用信号 | 主要借鉴点 |
| --- | --- | --- | --- |
| macOS | CleanShot X | Mac 端高频推荐的付费全能工具，官方列出截图、录屏、云、OCR、历史、浮动截图等完整能力 | 捕获后浮层、滚动截图、Pin 到桌面、本地 OCR、云链接、背景美化 |
| macOS | Shottr | 面向设计师和前端工程师，强调 2.3 MB、Apple Silicon 优化和毫秒级响应 | 极快启动、像素测量、取色、滚动截图、OCR/QR、S3 上传 |
| macOS | Xnip | 专注 Mac 截图、长截图、窗口阴影和置顶图 | 捕获时仍可调整区域、滚动拼接、窗口阴影、多窗口捕获、Pin |
| macOS | Xnapper | 专注“漂亮截图”和内容自动平衡 | 自动居中、背景、圆角、阴影、展示图生成 |
| macOS/Windows | Snagit | 面向专业文档和企业异步沟通，官方强调截图、录屏、AI、可搜索库和分享 | 步骤录制、AI 智能打码、可搜索/可标签库、文档化工作流 |
| macOS/Windows | Monosnap | 截图、录屏、云存储和团队分享工具 | Dropzone、捕获后上传、云文件夹、编辑器拖放 |
| Windows | Snipping Tool | Windows 原生工具，已覆盖截图、视频 snip、OCR、颜色选择、Copilot+ Perfect Screenshot | 系统级快捷入口、轻量编辑、本地 OCR、一键打码 |
| Windows | ShareX | 免费开源，GitHub 约 37.6k stars，官方强调 18 年以上开发、工作流和大量目的地 | 自动动作、上传器、自定义工作流、OCR、QR、录屏/GIF、CLI |
| Windows | Greenshot | 轻量开源工具，面向项目经理、开发者、测试、技术写作 | 简单、低成本、标注、Office/邮件/打印/剪贴板导出 |
| Windows | PicPick | “all-in-one” 图形工具，带取色、标尺、量角器、白板 | 截图工具周边生产力配件 |
| Windows | Screenpresso | Windows 截图/录屏工具，官方强调工作区、143 个分享服务、文档生成 | 工作区、拖放、OCR、二维码、Android 捕获、DOCX/PDF/HTML 生成 |
| Linux | Flameshot | 免费开源、跨平台，Linux 用户常用，强调简单截图和内联标注 | 截图时直接标注、可定制工具栏、Imgur 上传、CLI |
| Linux | ksnip | Qt 跨平台工具，GitHub 约 3.2k stars，支持 X11、Wayland、Windows、macOS | 平台差异处理、插件 OCR、标签页、Pin、用户自定义动作 |
| Linux | Shutter | Linux 功能丰富截图工具，2026 仍有发布 | 菜单/tooltip 捕获、网页捕获、内置编辑、插件效果 |
| Linux | KDE Spectacle | KDE 原生截图工具，随 KDE 生态发布 | 原生快捷键、区域/窗口/全屏、标注、导出、系统集成 |
| Linux | GNOME/Ubuntu Screenshot | GNOME/Ubuntu 原生 screenshot/screencast overlay | 系统级 overlay、截图/录屏一体、键盘导航、默认目录和剪贴板 |

## 功能矩阵

| 应用 | 区域/窗口/全屏 | 滚动截图 | 标注编辑 | OCR/QR | 录屏/GIF | 历史/库 | 上传/分享 | 自动化/CLI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CleanShot X | 是 | 是 | 强 | OCR | MP4/GIF | 最近历史 | CleanShot Cloud | 中 |
| Shottr | 是 | 是 | 强 | OCR/QR | 弱 | 轻量 | S3 | URL Scheme |
| Xnip | 是 | 是 | 中 | 未见官方重点 | 否 | 轻量 | 基础 | 弱 |
| Xnapper | 是 | 弱 | 偏美化 | 邮箱打码等 | 否 | 弱 | 基础 | 弱 |
| Snagit | 是 | 是 | 强 | OCR/AI | MP4/GIF | 可搜索库 | Screencast/第三方 | 中 |
| Monosnap | 是 | 未见核心 | 中 | Windows OCR/AI | 是/GIF | 云文件 | 云/集成 | 中 |
| Snipping Tool | 是 | 否 | 基础 | OCR/本地打码 | 视频 snip | 系统相册/文件 | Windows Share | 弱 |
| ShareX | 是 | 是 | 强 | OCR/QR | MP4/GIF | 历史 | 大量目的地 | 强 |
| Greenshot | 是 | IE 网页滚动 | 中 | 否 | 否 | 弱 | 文件/邮件/Office/图片站 | 中 |
| PicPick | 是 | 是 | 中 | 否 | 有录屏 | 弱 | 云/Office/FTP | 中 |
| Screenpresso | 是 | 是 | 强 | OCR/QR | MP4 | 工作区 | 143 服务 | 中 |
| Flameshot | 是 | 否 | 强 | 否 | 否 | 弱 | Imgur | CLI |
| ksnip | 是 | 否 | 强 | 插件 OCR | 否 | 标签页 | Imgur/FTP/脚本 | CLI/动作 |
| Shutter | 是 | 网站捕获 | 中 | 否 | 否 | 标签页 | 图床 | 插件 |
| Spectacle | 是 | 否 | 中 | 否 | 部分 KDE 版本录屏 | 弱 | KDE 导出 | CLI |
| GNOME/Ubuntu | 是 | 否 | 弱 | 否 | 是 | 系统文件夹 | 剪贴板/文件 | 弱 |

## 关键洞察

### 1. 顶级工具都把“截图后动作”做成核心体验

CleanShot X 的 Quick Access Overlay、ShareX 的 after capture tasks、Screenpresso 的 Workspace、macOS 的浮动缩略图，本质上都在减少“截完图之后我该去哪里”的摩擦。我们的产品应把捕获后浮层作为核心对象，而不是可有可无的小提示。

### 2. 用户不只需要标注，还需要解释结构

Snagit、Screenpresso、Shutter 和 ShareX 都有步骤编号或类似能力。对于 bug 复现、教程和客服说明，步骤编号比单纯箭头更重要。编辑器 MVP 应包含步骤编号、文本气泡、模糊/像素化和高亮。

### 3. 高级用户需要工作流，不只是更多按钮

ShareX 的核心优势是动作链和上传器，而不是某个单点工具。开发者产品应提供“捕获后自动复制/保存/上传/运行脚本/打开外部应用”的可组合规则，但要先提供少量稳定的内置动作。

### 4. Linux 不是一个平台，而是多套能力边界

X11 可以做较多原生能力，Wayland 为安全会限制静默截图、全局快捷键和窗口访问。ksnip 文档明确指出 GNOME Wayland 新版本只能走 xdg-desktop-portal 的截图方式，并且可能需要额外确认。开发时必须把 Linux capture adapter 拆成 X11、KDE Wayland、GNOME Wayland、portal fallback。

### 5. 隐私能力正在变成基础能力

Snipping Tool 已支持 OCR 和本地文本打码，Snagit 强调 AI Smart Redact，Shottr 支持 text-only 隐藏。新产品如果缺少本地 OCR 与敏感信息打码，会显得落后。注意：AI 可以增强，但不能替代本地隐私默认值。

### 6. 录屏应是截图工具的延伸，而不是完整视频编辑器

Snagit、CleanShot X、Screenpresso、Monosnap 和系统工具都支持短录屏，但常见边界是轻量裁剪、摄像头、音频、GIF、点击/按键展示。第一版不需要多轨时间线。

### 7. 美化截图是独立高价值模块

Xnapper、CleanShot X 和 Shottr 都说明“漂亮地分享截图”有真实需求。背景、圆角、阴影、自动平衡、窗口框和水印可以作为编辑器的独立模式，但不应阻塞基础标注。

## 平台基线

### macOS

系统 Screenshot 提供全屏、窗口、区域、录屏、延时、指针/点击、保存位置和浮动缩略图。第三方产品若要替代系统工具，至少要明显强于它：滚动截图、标注、历史、OCR、Pin、云分享、可配置快捷键。

技术注意点：

- 需要清晰引导 Screen Recording 权限。
- 录屏推荐评估 ScreenCaptureKit。
- 系统音频采集比麦克风更敏感，Electron 方案有额外限制。
- Retina、HDR、多个 Space、全屏应用会影响窗口选择体验。

### Windows

Snipping Tool 已经覆盖矩形、自由形状、窗口、全屏、视频 snip、OCR、打码、颜色选择和 Copilot+ 的 Perfect Screenshot。第三方工具的差异化应来自：更强编辑器、历史、自动化、上传器、滚动截图、GIF、工作流和企业策略。

技术注意点：

- Windows.Graphics.Capture 是推荐候选 API。
- 需要处理多 DPI、HDR、窗口边框、管理员权限窗口、UWP/Win32 差异。
- Print Screen 接管要尊重系统设置并允许用户关闭。

### Linux

GNOME/Ubuntu 和 KDE Spectacle 已提供系统级截图/录屏基线。第三方工具的优势主要是标注、配置、上传和跨桌面一致性。Wayland 的安全模型会让体验无法完全复制 X11。

技术注意点：

- X11 可使用原生截图和全局快捷键。
- Wayland 下应优先走 xdg-desktop-portal / PipeWire。
- portal 可能弹出确认，无法保证静默捕获。
- 不同桌面环境的窗口选择能力不一致，应在 UI 中明确降级。

## 建议产品差异化

### 必须做强

- 快捷键和捕获 overlay 的速度与稳定性。
- 捕获后浮层和历史库。
- 常用标注和隐私打码。
- 本地 OCR 与搜索。
- 工作流规则和自定义上传器。
- 平台权限状态的透明提示。

### 可以后做

- AI 摘要、翻译、表格识别。
- 团队云空间和评论。
- 复杂视频剪辑。
- 超大量第三方目的地。
- 浏览器扩展和移动端联动。

## 主要资料来源

- CleanShot X All Features: https://cleanshot.com/features
- Shottr: https://shottr.cc/
- Xnip: https://xnipapp.com/
- Xnapper: https://xnapper.com/
- TechSmith Snagit: https://www.techsmith.com/snagit/
- Monosnap Help Center: https://support.monosnap.com/hc/en-us/categories/360002850380--Using-Monosnap
- Microsoft Snipping Tool: https://support.microsoft.com/en-gb/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b
- ShareX: https://getsharex.com/ and https://github.com/ShareX/ShareX
- Greenshot: https://getgreenshot.org/
- PicPick Features: https://picpick.app/en/features/
- Screenpresso Features: https://www.screenpresso.com/features/
- Flameshot: https://flameshot.org/
- ksnip: https://github.com/ksnip/ksnip
- Shutter: https://shutter-project.org/
- KDE Spectacle: https://apps.kde.org/en-gb/spectacle/
- KDE MegaRelease 6 Spectacle recording notes: https://kde.org/announcements/megarelease/6/
- GNOME/Ubuntu screenshots and screencasts: https://help.ubuntu.com/stable/ubuntu-help/screen-shot-record.html.en
- Apple Screenshot user guide: https://support.apple.com/guide/mac-help/take-a-screenshot-mh26782/mac
- Apple ScreenCaptureKit: https://developer.apple.com/documentation/screencapturekit
- Microsoft Windows.Graphics.Capture: https://learn.microsoft.com/en-us/windows/uwp/audio-video-camera/screen-capture
- XDG Desktop Portal ScreenCast: https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.ScreenCast.html
- Electron desktopCapturer: https://www.electronjs.org/docs/api/desktop-capturer/
