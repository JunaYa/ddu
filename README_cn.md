# DDU

**优先本地处理的 macOS 截图工具：截图、标注、提取文字，再从历史中找回。**

[English](README.md) · 简体中文

DDU 常驻菜单栏。你可以截取鼠标所在的显示器、选择窗口或界面元素，也可以手动拖出选区；截图后直接复制、标注或提取文字。截图与可搜索的 OCR 索引保存在本机，无需账号。

本 README 介绍当前源码中的能力，旧版安装包可能尚未包含全部功能。**macOS 是当前受支持的原生开发与发布平台**；仓库中的 Linux、Windows 适配代码不代表这些平台已具备可用的完整桌面构建。

## 功能概览

| 方向     | 当前应用提供的能力                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 截图     | 全屏、智能选区、窗口截图；可配置全局快捷键；跟随鼠标所在显示器截图。                                                      |
| 智能选择 | 冻结屏幕、悬停识别目标、滚轮切换元素层级、拖动手选区域、Enter 确认高亮目标、Esc 取消。元素级选择使用 macOS 辅助功能权限。 |
| 截图预览 | 自动复制图片、复制失败后重试、打开编辑器、复制识别文字、关闭；闲置时自动隐藏，关闭窗口后应用仍常驻菜单栏。                |
| 编辑标注 | 箭头、直线、矩形、椭圆、自由绘制、高亮、文字、步骤编号、模糊、像素化、撤销与重做；保存编辑副本，不覆盖原图。              |
| 本地 OCR | 通过 LiteParse 使用 PP-OCRv6，并提供 macOS Vision 回退；支持整图或局部识别、逐行复制、复制全部及合并换行。                |
| 截图历史 | 网格/列表视图、时间排序、图片预览和文件信息、批量移到废纸篓、横向或纵向拼图。                                             |
| 文字搜索 | 按已识别的截图文字搜索；为选中的历史截图批量建立索引；可在设置中关闭并清除本地索引。                                      |
| 设置     | 保存目录、截图偏好、快捷键、可选的登录时启动、历史保留策略、权限状态及本机诊断。                                          |

**录屏：** 设置 →「录屏与滚动截图」可启动全屏或区域录屏，分别开启系统声音与麦克风。从设置或托盘停止，MOV 保存到所配置输出目录的 `recordings` 文件夹。系统声音通过当前 macOS 的 `screencapture -A` 能力录制，诊断会检测系统是否支持；需要屏幕录制权限，开启麦克风时才需要麦克风权限。

**滚动截图：** 从托盘选择「滚动截图」，框选可滚动内容并避开固定标题栏，缓慢向下滚动，每次停稳并保留至少四分之一重叠区域。应用自动采集稳定画面，仅在可靠匹配后追加新内容。托盘标题显示已采集段数，悬停提示和设置页显示拼接状态。通过托盘完成或取消；完成后 PNG 进入现有预览，支持复制、OCR 与编辑。采集最多五分钟，并有图片与内存大小限制；到达限制后可完成保存已有内容。动画、重复内容或固定元素可能导致匹配失败，可向上回滚后重试。云同步/上传和 AI 服务尚未提供；GIF 转换与工作流仍只有后端命令。设置中的文件命名模板会被保存，但截图后端尚未使用它生成文件名。

首次启动或截图时缺少权限，会打开设置并定位到「权限管理」，不再单独弹出 Startup 授权页或重复错误弹框。截图预检查不会自动请求授权；点击「授权」后才发起授权流程。

在设置 → **权限管理**中查看辅助功能、屏幕录制与麦克风状态。点击授权或管理后，会打开系统设置和置顶引导浮窗；辅助功能与屏幕录制支持将正在运行的 DDU.app 拖入系统列表，再手动开启开关。麦克风使用系统授权弹窗，不支持拖拽添加。状态会自动刷新，屏幕录制提供重启入口。拖拽需运行打包后的应用，开发进程会显示手动处理提示。

## 使用方式

1. 启动 DDU，通过菜单栏图标打开历史、设置或截图操作。
2. 按提示授予**屏幕录制**权限。需要识别单个界面元素时，再授予**辅助功能**权限；没有该权限时可使用窗口级回退和手动选区。
3. 使用快捷键或菜单开始截图。所有截图都会保存并复制图片；需要提取文字时，在截图预览中点击 **Text / 文字** 工具即可。
4. 悬停预览浮窗，选择 **Edit / 编辑**、**Copy / 复制**、**Text / 文字** 或 **Close / 关闭**。在编辑器中可保存副本或复制标注后的图片。
5. 在历史中查看截图。要按文字搜索，先识别图片，或选择历史记录后点击**建立文字索引**。

关闭窗口不会退出 DDU；需要退出时，请使用菜单中的 **Quit / 退出**。

### macOS 默认快捷键

| 操作                     | 快捷键  |
| ------------------------ | ------- |
| 截取鼠标所在显示器的全屏 | `⌘ ⇧ A` |
| 智能选区                 | `⌘ ⇧ S` |
| 窗口截图                 | `⌘ ⇧ W` |

快捷键可在设置中修改。智能截图时，滚轮用于切换高亮目标的层级，拖动可手选区域，Esc 可取消截图。

### 数据保存与隐私

- 截图写入所选保存目录下的 `images/` 子目录。初始保存目录使用 Tauri 为 `com.ddu.app` 提供的应用本地数据目录，具体位置可在设置中查看。
- 保存目录只能通过原生目录选择器修改。各窗口分别限制设置写入和图片操作权限；编辑器图片输入限制为 50 MiB、4000 万像素。
- macOS/Linux 上，OCR 索引目录权限为 `0700`，文件为 `0600`，访问时会修正旧文件权限。索引仍为明文，同一用户权限下的进程仍可读取。
- 设置保存在本机的 `settings.json`。OCR 文字索引单独保存在应用本地数据目录的 `ocr-index/` 中，不会随截图写入用户选择的其他目录。
- 无需登录，不会将截图上传到服务器进行 OCR。OCR 引擎首次使用时可能下载模型文件，因此“本地处理”不意味着首次初始化的所有步骤均可离线完成。原生构建也会获取 PDFium 依赖。
- 文字索引默认开启，但只有执行过 OCR 或建立索引的截图才能按文字搜索。关闭索引时会清除已保存的文字索引。
- 手动删除历史会将图片移到 macOS 废纸篓。**自动清理默认关闭**；开启后，过期的 DDU 截图会被永久删除。初始保留期限为 30 天，也可选择 7 天、90 天或永久保留。
- 诊断包含版本、系统、能力与权限信息，在本机查看，不会自动上传。

## 开发指南

### 环境要求

原生应用开发需要 macOS、Xcode Command Line Tools 和稳定版 Rust/Cargo。安装 [Vite+ CLI（`vp`）](https://www.viteplus.dev/guide)，并使用工作区声明的 Node.js 26、pnpm 12.10.1。前端工具链版本以依赖 catalog 和锁文件为准。

前端包和模拟原生接口的测试可在其他系统上运行；真实截图、权限、AppKit 集成及原生冒烟测试需要 macOS 桌面会话。

### 启动项目

以下命令均在仓库根目录执行：

```sh
vp install                    # 安装依赖及项目配置的 Git hooks
vp run desktop#dev            # 启动 Tauri 应用和前端开发服务器
```

根目录的 `vp run dev` 是同一桌面任务的别名。Tauri 会启动 `http://localhost:1420` 上的前端服务，并监听 Rust 代码变更。

只开发前端或组件时可使用：

```sh
vp run desktop#dev:frontend
vp run @ddu/ui#storybook       # 组件浏览器，端口 6006
```

应用有 `main.html`、`setting.html`、`startup.html`、`capture.html`、`permission.html`、`preview.html` 六个窗口入口。直接在普通浏览器中打开页面不会获得 Tauri IPC 和真实桌面能力；完整交互应在原生应用中验证，组件测试则使用原生桥接层提供的 mock。

### 检查、测试与构建

以下命令均在仓库根目录执行，也可将 `pnpm run` 换为 `vp run`。脚本定义集中在根目录及 `apps/desktop/package.json`。

| 命令                                             | 用途                                                     |
| ------------------------------------------------ | -------------------------------------------------------- |
| `pnpm run dev` / `pnpm run dev:frontend`         | 启动完整 Tauri 应用 / 仅启动前端开发服务。               |
| `pnpm run build`                                 | 构建所有工作区前端和共享包，不生成原生安装包。           |
| `pnpm run build:frontend`                        | 仅构建桌面前端到 `apps/desktop/dist`。                   |
| `pnpm run preview`                               | 预览已构建的前端；不提供原生 IPC。                       |
| `pnpm run check:all`                             | 检查所有包、根配置及 TypeScript 类型。                   |
| `pnpm run fmt` / `pnpm run fmt:check`            | 格式化文件 / 只检查格式。                                |
| `pnpm run lint`                                  | 执行前端 lint 与类型检查。                               |
| `pnpm run test` / `pnpm run test:desktop`        | 运行全部工作区 / 仅桌面前端测试。                        |
| `pnpm --filter desktop run test:watch`           | 持续运行桌面前端测试。                                   |
| `pnpm run check:native` / `pnpm run lint:native` | 构建前端后执行 Cargo check / 严格 Clippy 检查。          |
| `pnpm run test:native`                           | 构建前端后运行 Rust 单元测试。                           |
| `pnpm run test:smoke`                            | 原生窗口生命周期冒烟测试，需要 macOS 桌面会话。          |
| `pnpm run ready`                                 | 检查、测试并构建全部前端和共享包，不自动修改源文件格式。 |
| `pnpm run ready:native`                          | 在 ready 基础上增加 Clippy 和 Rust 测试，需要 macOS。    |
| `pnpm run license:gate`                          | 检查 JS 依赖许可证并生成第三方声明。                     |

`ready` 不运行 Cargo，也不打包应用；`ready:native` 同样不生成安装包。原生脚本自动先构建前端，因为 Tauri 在编译时需要前端资源。纯检查、测试和前端构建使用任务缓存；开发服务、原生打包与发布预检默认不缓存。

部分原生/OCR 集成测试默认忽略，需要桌面权限或模型环境。单元测试通过不能替代真实的截图、剪贴板、多显示器位置和权限恢复验证。

### 构建 macOS 应用

```sh
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm run build:native:arm64  # Apple Silicon，证书签名的 .app
pnpm run build:native:x64    # Intel，证书签名的 .app
pnpm run build:native        # 默认使用 Rust 工具链的宿主架构
pnpm run build:native:adhoc:arm64 # 明确选择临时签名；也支持 :x64
```

证书签名任务从环境变量或根目录 `.env.local` 读取 `APPLE_SIGNING_IDENTITY`，缺失时拒绝构建。稳定的证书身份有助于在重新构建后保留 macOS 权限授权；临时签名构建更新后可能需要重新授予屏幕录制权限。

这些任务会先构建前端、准备对应架构的 `libpdfium.dylib` 并校验架构，再使用独立的 bundle 配置调用 Tauri。产物分别位于 `apps/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/` 和 `apps/desktop/src-tauri/target/x86_64-apple-darwin/release/bundle/`，可用 `CARGO_TARGET_DIR` 更改构建根目录。两种架构的 OCR 库分开暂存，避免相互覆盖。交叉编译仍需对应架构的原生依赖；CI 分别使用 Apple Silicon 和 Intel runner 构建、测试。

对外分发应使用 Developer ID 身份，并遵循 [macOS 发布清单](docs/release-macos.md)：

```sh
pnpm run release:check-macos
pnpm run build:dmg:arm64
pnpm run build:dmg:x64
```

`build:dmg` 默认构建宿主架构，各 DMG 任务在原生构建前执行预检，要求 Developer ID Application 身份及 `APPLE_ID`、`APPLE_TEAM_ID`、`APPLE_APP_PASSWORD`。脚本将密码映射为 Tauri 公证所需的 `APPLE_PASSWORD`。预检不代表签名或公证成功；发布前仍需验证应用签名、完成 DMG 公证与装订，并在两种芯片的全新账户上测试。签名凭据不得提交到版本库。

## 技术架构与目录

DDU 使用 Tauri 2 和 Rust 实现原生能力，所有桌面窗口统一使用 React 19、TypeScript、Tailwind CSS 4 和共享设计系统 `@ddu/ui`。React 图片编辑器使用 Fabric.js 实现画布标注。

```text
apps/desktop/
  src/windows/       React 窗口：main、setting、startup、capture、permission
  src/shared/        窗口挂载、主题与错误边界
  src-tauri/         Rust 命令、捕获引擎、平台适配和应用生命周期
  tests/             前端行为与架构契约测试
  scripts/           签名预检、原生构建、PDFium 准备脚本
packages/
  native/            类型化 Tauri 桥接、设置、事件及测试 mock
  hooks/             基于原生桥接的 React 状态与数据 hooks
  ui/                展示组件与 Storybook
  tokens/ styles/    设计 token 与共享样式
  iconography/       图标
  brand/ utils/      品牌资源与共享工具
tools/              依赖许可证检查
specs/              产品规格、迁移设计与实施计划
docs/               调研、计划与发布流程
```

React 窗口通过 `@ddu/native` 或 `@ddu/hooks` 调用原生能力，不直接导入 Tauri API。`@ddu/native` 不依赖 React；`@ddu/ui` 通过 props 接收数据，不依赖原生桥接。跨包使用声明的 exports，不直接导入其他包的 `src/` 内部路径。这些边界由根目录 lint 配置约束。

预览和编辑器位于 `src/windows/preview`。Fabric 控制器独立于 UI 框架，原生调用统一经过 `@ddu/native`，控件统一使用 `@ddu/ui`。桌面构建仅保留 React/Tailwind 流程，并使用工作区统一的 TypeScript 版本。

## 常见问题

| 现象                             | 排查方式                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| 其他应用内容为空白，或截图被拒绝 | 检查实际启动的 DDU 是否具有屏幕录制权限，然后重启。重新构建的临时签名应用可能需要重新授权。  |
| 无法选中单个界面元素             | 检查辅助功能权限；手动选区和窗口级回退不需要读取元素信息。                                   |
| 启动后没有主窗口                 | DDU 常驻菜单栏，通过图标或截图快捷键使用；关闭窗口后仍会继续运行。                           |
| 历史文字搜索没有结果             | 先对图片执行 OCR，或选择记录后建立索引，并确认文字索引已开启。搜索不会自动识别全部图片。     |
| 首次 OCR 较慢或失败              | 检查模型初始化所需网络、原生日志及 PDFium 是否可用；主要 OCR 引擎失败时会尝试 macOS Vision。 |
| Rust 编译找不到前端资源          | 先执行 `vp run desktop#build`，再运行 Cargo 命令。                                           |
| 开发服务提示 1420 端口被占用     | 停止冲突服务；Tauri 使用固定端口。                                                           |

## 参与开发与文档导航

保持每次修改范围清晰；行为变更应附复现步骤或测试。原生修复除前端 mock 测试外，还应验证 macOS 实际路径。依赖变更前运行许可证检查，并核对生成的[第三方声明](THIRD_PARTY_NOTICES.txt)。

CI 分为前端/工作区检查和受影响原生代码的 macOS 检查两条流程。前端流程还检查依赖许可证及生产依赖的高危、严重漏洞。应用打包和全新环境发布验收需要单独完成。

- [规格索引](specs/index.md)：产品和架构文档；其中包含未来规划，不应将所有条目视为已交付功能。
- [工作区结构](specs/10-workspace-layout.md)、[原生桥接](specs/11-native-bridge.md)、[桌面窗口](specs/12-desktop-shell.md)。
- [设计系统](specs/13-design-system.md)、[实施计划](specs/91-impl-plan.md)、[关键决策](specs/99-key-decisions.md)。
- [产品大纲](docs/outline.md)与[竞品调研](docs/research.md)。
- [macOS 发布清单](docs/release-macos.md)。
