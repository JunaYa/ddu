# DDU

**优先本地处理的 macOS 截图工具：截图、标注、提取文字，再从历史中找回。**

[English](README.md) · 简体中文

DDU 常驻菜单栏。你可以截取鼠标所在的显示器、选择窗口或界面元素，也可以手动拖出选区；截图后直接复制、标注或提取文字。截图与可搜索的 OCR 索引保存在本机，无需账号。

本 README 介绍当前源码中的能力，旧版安装包可能尚未包含全部功能。**macOS 是当前受支持的原生开发与发布平台**；仓库中的 Linux、Windows 适配代码不代表这些平台已具备可用的完整桌面构建。

## 功能概览

| 方向     | 当前应用提供的能力                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 截图     | 全屏、智能选区、窗口、截图取字；可配置全局快捷键；跟随鼠标所在显示器截图。                                                |
| 智能选择 | 冻结屏幕、悬停识别目标、滚轮切换元素层级、拖动手选区域、Enter 确认高亮目标、Esc 取消。元素级选择使用 macOS 辅助功能权限。 |
| 截图预览 | 自动复制图片、复制失败后重试、打开编辑器、复制识别文字、关闭；闲置时自动隐藏，关闭窗口后应用仍常驻菜单栏。                |
| 编辑标注 | 箭头、直线、矩形、椭圆、自由绘制、高亮、文字、步骤编号、模糊、像素化、撤销与重做；保存编辑副本，不覆盖原图。              |
| 本地 OCR | 通过 LiteParse 使用 PP-OCRv6，并提供 macOS Vision 回退；支持整图或局部识别、逐行复制、复制全部及合并换行。                |
| 截图历史 | 网格/列表视图、时间排序、图片预览和文件信息、批量移到废纸篓、横向或纵向拼图。                                             |
| 文字搜索 | 按已识别的截图文字搜索；为选中的历史截图批量建立索引；可在设置中关闭并清除本地索引。                                      |
| 设置     | 保存目录、截图偏好、快捷键、可选的登录时启动、历史保留策略、权限状态及本机诊断。                                          |

滚动截图、云同步/上传和 AI 服务尚未作为产品功能提供。后端已有录屏、GIF 转换和工作流相关命令，但尚未形成完整的用户操作与发布流程。设置中的文件命名模板会被保存，但截图后端尚未使用它生成文件名。

## 使用方式

1. 启动 DDU，通过菜单栏图标打开历史、设置或截图操作。
2. 按提示授予**屏幕录制**权限。需要识别单个界面元素时，再授予**辅助功能**权限；没有该权限时可使用窗口级回退和手动选区。
3. 使用快捷键或菜单开始截图。普通截图会保存并复制图片；“截图取字”会提取并复制文字，代替复制图片。
4. 悬停预览浮窗，选择 **Edit / 编辑**、**Copy / 复制**、**Text / 文字** 或 **Close / 关闭**。在编辑器中可保存副本或复制标注后的图片。
5. 在历史中查看截图。要按文字搜索，先识别图片，或选择历史记录后点击**建立文字索引**。

关闭窗口不会退出 DDU；需要退出时，请使用菜单中的 **Quit / 退出**。

### macOS 默认快捷键

| 操作                     | 快捷键  |
| ------------------------ | ------- |
| 截取鼠标所在显示器的全屏 | `⌘ ⇧ A` |
| 智能选区                 | `⌘ ⇧ S` |
| 窗口截图                 | `⌘ ⇧ W` |
| 选择区域并复制文字       | `⌘ ⇧ O` |

快捷键可在设置中修改。智能截图时，滚轮用于切换高亮目标的层级，拖动可手选区域，Esc 可取消截图。

### 数据保存与隐私

- 截图写入所选保存目录下的 `images/` 子目录。初始保存目录使用 Tauri 为 `com.ddu.app` 提供的应用本地数据目录，具体位置可在设置中查看。
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

应用有 `main.html`、`setting.html`、`startup.html`、`capture.html`、`preview.html` 五个窗口入口。直接在普通浏览器中打开页面不会获得 Tauri IPC 和真实桌面能力；完整交互应在原生应用中验证，组件测试则使用原生桥接层提供的 mock。

### 检查、测试与构建

| 命令                             | 用途                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| `vp run ready`                   | 格式化、lint/类型检查、工作区 JS 测试及前端/包构建；格式化可能修改文件。 |
| `vp run -r check`                | 执行各包检查，与 CI 对齐。                                               |
| `vp run -w check`                | 检查根工作区配置。                                                       |
| `vp run -r test`                 | 执行工作区 JavaScript/TypeScript 测试。                                  |
| `vp run desktop#test`            | 执行桌面前端测试。                                                       |
| `vp run desktop#check:legacy`    | 对保留的 Vue 代码执行类型检查。                                          |
| `vp run desktop#build`           | 构建前端资源，输出到 `apps/desktop/dist`。                               |
| `vp run @ddu/ui#build-storybook` | 构建组件文档。                                                           |
| `vp run license:gate`            | 检查生产 JS 依赖许可证并重新生成第三方声明。                             |

`ready` **不包含 Cargo 测试，也不会生成原生应用包**。修改 Rust 后，先构建前端，再执行原生检查，因为 Tauri 在 Rust 编译阶段会解析前端资源目录。

```sh
vp run desktop#build
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --lib

# 需要桌面会话：验证截图窗口销毁、反复关闭预览以及主动退出
cargo run --manifest-path apps/desktop/src-tauri/Cargo.toml --example window_lifecycle_smoke
```

部分原生/OCR 集成测试默认忽略，需要桌面权限或模型环境。单元测试通过不能替代真实的截图、剪贴板、多显示器位置和权限恢复验证。

### 构建 macOS 应用

```sh
vp run desktop#build:native         # 使用证书签名的 .app
vp run desktop#build:native:adhoc   # 本机临时签名的 .app
```

证书签名任务从环境变量或根目录 `.env.local` 读取 `APPLE_SIGNING_IDENTITY`，缺失时拒绝构建。稳定的证书身份有助于在重新构建后保留 macOS 权限授权；临时签名构建更新后可能需要重新授予屏幕录制权限。

这些任务会先构建前端、准备 `libpdfium.dylib`，再使用 bundle 配置调用 Tauri。原生产物通常位于 `apps/desktop/src-tauri/target/release/bundle/`。调试 OCR 时，可用 `PDFIUM_LIB_PATH` 覆盖 PDFium 动态库查找位置。

对外分发应使用 Developer ID 身份，并遵循 [macOS 发布清单](docs/release-macos.md)：

```sh
vp run desktop#release:check-macos
vp run desktop#build:dmg
```

预检会确认 `APPLE_SIGNING_IDENTITY`、`APPLE_ID`、`APPLE_TEAM_ID`、`APPLE_APP_PASSWORD` 是否存在，但不代表签名或公证已经成功。发布前仍需验证应用签名、完成 DMG 公证与装订，并在全新账户上测试。签名凭据不得提交到版本库。

## 技术架构与目录

DDU 使用 Tauri 2 和 Rust 实现原生能力，前端正在迁移到 React 19、Tailwind CSS 4 和共享设计系统。目前历史、设置、首次启动、截图窗口已使用 React；预览与编辑器仍使用 Vue 3、UnoCSS 和 Fabric.js。迁移期间桌面构建同时支持两套前端。

```text
apps/desktop/
  src/windows/       React 窗口：main、setting、startup、capture
  src/shared/        窗口挂载、主题与错误边界
  src/legacy/        Vue 预览/编辑器及隔离样式
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

剩余 Vue 窗口隔离在 `src/legacy` 中。维护时保持其样式与 React 窗口隔离，在最后一个窗口完成迁移前，保留 Vue/UnoCSS 依赖和桌面包的 TypeScript 兼容版本。

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
