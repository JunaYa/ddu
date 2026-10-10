# 研究备忘：迁移到 vp-monorepo React 栈的风险验证

日期：2026-10-10 · 相关规格：[specs/10](../../specs/10-workspace-layout.md)、[specs/12](../../specs/12-desktop-shell.md)、[specs/91](../../specs/91-impl-plan.md)

## 背景

ddu 计划以 `/Users/arjun/Code/web/vp-monorepo`（下称“模板”，提交 `de79000`）为基础重构为 monorepo，前端从 Vue 3 + UnoCSS 迁移到 React 19 + Tailwind v4 + `@pi/ui`。迁移按窗口逐个进行，期间 Vue 与 React 页面必须共存。以下假设在写规格前做了实测（模板克隆到临时目录，在 `apps/desktop` 中加入一个 Vue 页面）。

## 模板现状（事实）

- `apps/desktop` 是 **Tauri 2 空壳**：前端不引用 `@tauri-apps/api`，Rust 侧无命令、无插件、单窗口（label `main`），无路由与状态库。ddu 的多窗口、IPC、权限等模式在模板中没有先例，需自行设计。
- `@pi/sdk` 以 HTTP OpenAPI 契约（`openapi.json` + `typed-openapi` 代码生成）为中心，默认传输是内存桩；ddu 的后端是 Tauri 命令，此层不能照搬。
- `@pi/ui` 约 85 个组件，主要基于 Base UI，Tailwind v4 + cva + `cn()`；按子路径导入（`@pi/ui/button`），`exports` 指向源码。
- 主题：`@pi/tokens` 为纯 CSS 变量（shadcn 语义命名），暗色通过 `.dark` 类切换；模板中**没有**跟随系统主题的代码。
- 工具链：Vite+ `vp` 1.1.0（oxlint 类型感知 + oxfmt + Vitest 5 + tsdown），TypeScript **7.0.2**（原生版），Node 26、pnpm 12.10.1，`.vite-hooks/pre-commit` 运行 `vp staged`。
- 模板 CI 的 desktop 作业在 **ubuntu** 上 `cargo check`。

## 验证结果

| # | 假设 | 结果 | 证据 / 处理 |
|---|------|------|-------------|
| S1 | 全局 `vp` 0.2.1 能驱动模板（要求 ≥ 1.1.0） | ✅ 成立 | 全局 CLI 委托给项目内 `vite-plus` 1.1.0；`vp install` 用模板指定的 pnpm 12.10.1 完成。无需升级全局工具。 |
| S2 | 同一个 Vite+ 多页面构建中 Vue 页面与 React 页面共存 | ✅ 成立 | `plugins: [vue(), UnoCSS(), react({ exclude: /\.vue$/ }), tailwindcss()]` + `build.rollupOptions.input` 两个入口，`vp build` 产出两套独立 JS/CSS（legacy 1.1 kB CSS，React 310 kB CSS）。`@vitejs/plugin-vue` 6.0.9 的 peer 接受 Vite 8。 |
| S3 | Tailwind v4 与 UnoCSS 共存且样式不互相泄漏 | ✅ 成立（需一行配置） | Tailwind v4 默认扫描整个应用目录；在 React 入口 CSS 中加 `@source not "./legacy";` 排除 Vue 目录。UnoCSS 用 `content.pipeline.include` 限定到 legacy 目录。 |
| S4 | 在 TypeScript 7 下对 `.vue` 做类型检查 | ❌ 不成立 → ✅ 有缓解 | `vue-tsc` 3.3.12 在 TS 7.0.2 下崩溃（`ERR_PACKAGE_PATH_NOT_EXPORTED`，TS 7 不再导出 JS API）。在 `apps/desktop` 单独固定 `typescript@5.9.3` 后 `vue-tsc --noEmit` 通过，并能捕获故意注入的类型错误。 |
| S5 | 模板质量门禁在混合应用上可用 | ✅ 成立 | `vp check`（格式 + 类型感知 lint + 类型检查）与 `vp test` 均通过。 |

## 对设计的约束

1. 迁移期间 `apps/desktop` 必须固定 TypeScript 5.9，并用 `vue-tsc` 做类型检查；最后一个 Vue 窗口移除后恢复目录版本（TS 7）。见 [99 D8](../../specs/99-key-decisions.md#d8)。
2. React 入口 CSS 必须排除 legacy 目录；UnoCSS 必须限定扫描范围。见 [12 § 4](../../specs/12-desktop-shell.md#4-迁移期vue-与-react-共存)。
3. ddu 的 Rust 代码只在 macOS 上可编译（`platform::linux` 未实现命令所需函数），CI 的 desktop 作业须改用 macOS runner。见 [10 § 6](../../specs/10-workspace-layout.md#6-ci)。
4. 原生契约（命令、事件、设置、窗口）需要 ddu 自建一层，替代 `@pi/sdk`。见 [11](../../specs/11-native-bridge.md)。

## 未验证（留给后续阶段）

- `tauri-specta` 从 Rust 命令生成 TS 绑定是否适用于本项目（Tauri 2.11、多平台 cfg）。见 [99 D4](../../specs/99-key-decisions.md#d4)。
- Node 26 下 Tauri CLI 2.11 的行为；首次 `vp run desktop#dev` 时验证。
