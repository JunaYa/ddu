# 12-desktop-shell：多窗口应用外壳与迁移期共存

Status: draft · Owner: ddu · Depends on: [10](./10-workspace-layout.md)、[11](./11-native-bridge.md)

## 1. 目的

规定 `apps/desktop` 前端如何组织：每个 Tauri 窗口如何成为一个入口、React 窗口共用的外壳（Provider、主题、错误边界）、迁移期 Vue 页面与 React 页面如何共存，以及“迁移一个窗口”的标准步骤。样式与组件选型见 [13](./13-design-system.md)。

## 2. 窗口模型：一个窗口 = 一个 HTML 入口

ddu 的 5 个窗口各自是独立的 webview，生命周期、尺寸、置顶策略都不同（预览浮窗 140×140 透明置顶，截图遮罩全屏无边框）。因此**不**引入前端路由，继续沿用“每个窗口一个 HTML 入口”的多页面构建，窗口之间通过 Rust 命令与事件通信。理由见 [99 D6](./99-key-decisions.md#d6)。

| 窗口 label | HTML 入口      | 迁移后的 React 目录    | 现状（迁移前）                   |
| ---------- | -------------- | ---------------------- | -------------------------------- |
| `main`     | `main.html`    | `src/windows/main/`    | 历史库（SnapVault）              |
| `setting`  | `setting.html` | `src/windows/setting/` | 设置                             |
| `preview`  | `preview.html` | `src/windows/preview/` | 截图后浮窗 + 编辑器（fabric.js） |
| `startup`  | `startup.html` | `src/windows/startup/` | 首次启动权限引导                 |
| `capture`  | `capture.html` | `src/windows/capture/` | 智能截图遮罩                     |

label、HTML 文件名、目录名三者一致（[00 § 7](./00-prd-react-migration.md#7-命名约定绑定)）。Rust 侧 `WebviewUrl::App("/<label>.html")` 不需要因迁移而改动：**迁移一个窗口时 HTML 文件名不变，只改它加载的脚本**。

## 3. React 窗口外壳

每个 React 窗口的入口都是同一个形状：

```tsx
// apps/desktop/src/windows/setting/main.tsx
import "../../styles.css";
import { mountWindow } from "../../shared/mount-window.tsx";
import { SettingWindow } from "./setting-window.tsx";

mountWindow(<SettingWindow />);
```

`mountWindow` 是共享外壳，统一提供：

| 关注点   | 做法                                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 数据层   | `QueryClientProvider`，客户端来自 `@ddu/hooks` 的 `createQueryClient()`。桌面端关闭 `refetchOnWindowFocus`：窗口频繁显示/隐藏，聚焦时重新拉取没有意义                        |
| 主题     | 跟随系统：监听 `prefers-color-scheme`，切换 `<html>` 上的 `.dark` 类（模板 token 的暗色机制）。不提供手动切换，与现状一致                                                    |
| 错误边界 | 顶层 `ErrorBoundary`：渲染错误时显示“窗口出错，可关闭后重开”的兜底界面并 `console.error`，不让整个 webview 白屏                                                              |
| 加载     | `Suspense` 边界（fallback 为空）：`useSetting` 在读到存储值之前挂起，组件拿到的永远是真实值而不是占位默认值，避免开关先显示默认值再跳变；本地 IPC 只需几毫秒，不显示加载动画 |
| 严格模式 | `StrictMode` 开启。窗口里的原生订阅（`on`、`onSettingChange`）必须在 effect 清理函数中取消，否则 StrictMode 双调用会暴露泄漏                                                 |

透明窗口（`preview`、`capture`）在迁移时再决定是否需要外壳的变体（例如不设置 `body` 背景），不在本轮设计。

## 4. 迁移期：Vue 与 React 共存

已经验证（[研究 S2–S5](../docs/research/2026-10-10-react-monorepo-spikes.md)）的配置：

```ts
// apps/desktop/vite.config.ts（迁移期）
plugins: [vue(), UnoCSS(), react({ exclude: /\.vue$/ }), tailwindcss()],
build: { rollupOptions: { input: { main, setting, preview, startup, capture } } },
```

- **Vue 代码集中在 `src/legacy/`**，即原 `src/` 整体移入（`src/legacy/pages/<label>/`、`src/legacy/components/` 等），`~` 别名指向 `src/legacy`，现有导入不用改。
- **样式隔离**：React 入口 CSS（`src/styles.css`）中写 `@source not "./legacy";`，Tailwind 不扫描 Vue 代码；`uno.config.ts` 的 `content.pipeline.include` 只包含 `src/legacy/**`。
- **类型检查**：迁移期 `apps/desktop` 固定 `typescript@5.9.3`；`check:legacy` 任务运行 `vue-tsc --noEmit`，React 代码由 `vp check` 检查。
- **只出不进**：`src/legacy/` 不接受新功能。迁移中途发现的缺陷，修在即将迁移的 React 版本里；确需修 Vue 版本的，PR 说明理由。

## 5. 迁移一个窗口的标准步骤

一个窗口一个 PR，PR 结束时该窗口完全是 React，`vp run ready` 全绿。

1. **列出该窗口用到的原生入口**（命令、事件、设置键、插件），在 `@ddu/native` 中补齐登记与测试（[11](./11-native-bridge.md)）。
2. **列出用到的组件**，在 `@ddu/ui` 中找对应组件（[13 § 4](./13-design-system.md#4-组件对照)）；确实缺失的，加到 `@ddu/ui` 并补 Storybook story，不在应用里手写。
3. 在 `src/windows/<label>/` 写 React 实现；数据经 `@ddu/hooks`，不直接调用 `@ddu/native` 的 `call`。
4. 把 `<label>.html` 的脚本从 `/src/legacy/pages/<label>/main.ts` 改为 `/src/windows/<label>/main.tsx`。
5. 删除 `src/legacy/pages/<label>/` 以及只被它使用的 legacy 组件。
6. **测试**：组件测试（Testing Library + `mockIPC`）覆盖该窗口的关键交互；按 § 6 的人工核对清单在真实应用中走一遍。
7. 最后一个窗口迁移完后：删除 `src/legacy/`、Vue 与 UnoCSS 依赖、`check:legacy` 任务，TypeScript 改回 `catalog:`。

## 6. 人工核对清单（每个窗口）

自动测试覆盖不到原生行为，每个窗口迁移 PR 必须在打包后的 `.app` 中逐项确认：

- 窗口从所有入口都能打开（托盘、快捷键、其他窗口）。在多显示器上，打开在光标所在的屏幕。
- 窗口用到的每个设置：修改后重启应用，值仍保留；`settings.json` 中的格式仍是 `{ "value": … }`。
- 亮色和暗色两种系统外观下都检查一遍。
- 关闭再打开窗口，状态正确，没有重复订阅（例如事件回调触发两次）。

## 7. 不变量

| #   | 不变量                                                    | 验证                                                                                                                        |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| S1  | 窗口 label 与 HTML 入口一一对应                           | `apps/desktop` 中的测试：`@ddu/native` 的 `WINDOW` 每个值都有对应的 `<label>.html`，且出现在 `build.rollupOptions.input` 中 |
| S2  | 每个 HTML 入口只加载一种框架                              | 同一个测试：入口脚本路径要么在 `src/legacy/` 下，要么在 `src/windows/` 下                                                   |
| S3  | React 窗口的样式不包含 UnoCSS，legacy 样式不包含 Tailwind | `@source not` 与 UnoCSS 限定配置；构建产物中 legacy CSS 不含 `--tw-` 前缀变量（测试检查）                                   |

## 8. 交叉引用

- ← 依赖：[10](./10-workspace-layout.md)、[11](./11-native-bridge.md)
- → 被引用：[13](./13-design-system.md)、[91](./91-impl-plan.md)
- ↔ 研究：[2026-10-10 风险验证](../docs/research/2026-10-10-react-monorepo-spikes.md)
