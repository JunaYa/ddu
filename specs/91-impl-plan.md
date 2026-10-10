# Implementation Plan — 依赖顺序

面向：实现者。按**依赖顺序**组织，与 [90-roadmap](./90-roadmap.md) 的里程碑一一对应：Phase 1 交付 M0，Phase 2 + Phase 3 交付 M1，Phase 4 起每个窗口一个阶段。

## 0. 就绪评估

- **已就绪**：设计规格 [10](./10-workspace-layout.md)–[13](./13-design-system.md)。四项关键假设已实测（[研究备忘](../docs/research/2026-10-10-react-monorepo-spikes.md)）：Vue/React 同构建共存、样式隔离、TS 5.9 下 `vue-tsc`、全局 `vp` 委托。
- **未实测、在执行中验证**：
  - Node 26 下 `tauri dev` 的行为（Phase 1.6 首次运行时确认）；
  - plugin-store 的 `onKeyChange` 跨窗口广播：已在 Phase 2 从插件源码确认（[11 § 4](./11-native-bridge.md#4-行为)），Phase 3 人工核对。
- **阻塞项**：无。

## 1. 为什么依赖顺序不同于功能顺序

- **“设置窗口”是 M1 的可见成果，但它不能第一个写。** 它依赖 `@ddu/native` 的设置 schema、`@ddu/hooks` 的 `useSetting`、`mountWindow` 外壳，以及 `@ddu/ui` 已经能在 `apps/desktop` 中渲染。先写页面会让这些契约变成“临时写法”，每个后续窗口都要回头改。
- **仓库重构必须在任何 React 代码之前完成，且必须保持应用可用。** 把 `src-tauri` 挪进 `apps/desktop` 会同时影响 Tauri 配置、PDFium 暂存脚本、打包脚本和 CI；把这些和 React 迁移混在一个阶段，出问题时无法区分是“搬家”坏了还是“重写”坏了。
- **设置键契约测试（N3）要先于设置窗口。** `capture_delay` 前后端默认值不一致（3 秒 vs 0 秒）就是在写这个契约时发现的；契约测试在先，同类问题才会在迁移时暴露，而不是迁移后。

## 2. 总工作量

约 18 个工作日（1 名开发者 + AI 助手），见 [90 § 3](./90-roadmap.md#3-日历形态)。Phase 4–7（各窗口）互不依赖，可与功能开发交错进行。

## 3. Phase 0 — 风险消除（已完成）

| #   | 交付物                                              | 位置                                                                                                      | 状态 |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 0.1 | Vue/React 共存、样式隔离、TS 版本、`vp` 委托的实测  | [docs/research/2026-10-10-react-monorepo-spikes.md](../docs/research/2026-10-10-react-monorepo-spikes.md) | ✅   |
| 0.2 | 模板现状调查（desktop 为空壳、sdk 为 OpenAPI 导向） | 同上 § 模板现状                                                                                           | ✅   |

**退出门槛**：已满足。

## 4. Phase 1 — 仓库重构（交付 M0）

严格按顺序，每一行都阻塞其下各行。全程不改任何 Vue 页面和 Rust 逻辑。

| #   | 任务                                                                                                                                                                                                                                                                                                                                                 | 规格                                                                                                                    | 估算  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----- |
| 1.1 | 从模板 `de79000` 引入根配置：`package.json`（`vite-plus`、engines、packageManager）、`pnpm-workspace.yaml`（catalog、overrides）、根 `vite.config.ts`（lint/fmt/staged/run）、`tsconfig.json`、`.vite-hooks/`、`tools/license-gate`                                                                                                                  | [10 § 2、§ 4](./10-workspace-layout.md#2-目录结构)                                                                      | 2 h   |
| 1.2 | 复制 `packages/{ui,tokens,styles,iconography,brand,utils,hooks}` 并改名为 `@ddu/*`（包名、导入路径、`@source` 路径）；去掉 `hooks` 中对 `@pi/sdk` 的 greeting 示例。**偏差（已接受）**：为给 `@ddu/utils` 一个真实测试，把 legacy 的 `diagnosticStatusLabel` 移入其中，`DiagnosticsSettings.vue` 的导入随之修改，违反了“全程不改 Vue 页面”，行为不变 | [10 § 3](./10-workspace-layout.md#3-包职责与依赖方向)、[13 § 2](./13-design-system.md#2-引入方式复制并改名ddu-自行维护) | 2 h   |
| 1.3 | `git mv`：`src-tauri` → `apps/desktop/src-tauri`，`src` → `apps/desktop/src/legacy`，`*.html`、`public/`、`uno.config.ts`、`scripts/` → `apps/desktop/`；HTML 中的脚本路径改为 `/src/legacy/pages/<label>/main.ts`                                                                                                                                   | [10 § 2](./10-workspace-layout.md#2-目录结构)、[12 § 4](./12-desktop-shell.md#4-迁移期vue-与-react-共存)                | 1.5 h |
| 1.4 | `apps/desktop/package.json` 与 `vite.config.ts`：Vue + UnoCSS + React + Tailwind 插件、五个入口、`~` → `src/legacy`、端口 1420；固定 `typescript@5.9.3`；任务 `dev`、`dev:frontend`、`build:native`（含 PDFium 暂存与 `--config src-tauri/tauri.bundle.conf.json`）、`check:legacy`                                                                  | [10 § 4](./10-workspace-layout.md#4-工具链)、[12 § 4](./12-desktop-shell.md#4-迁移期vue-与-react-共存)                  | 2 h   |
| 1.5 | 调整 `tauri.conf.json` 的 `beforeDevCommand`/`beforeBuildCommand`、`stage-pdfium.sh` 的路径基准；加 identifier 断言测试（W4）                                                                                                                                                                                                                        | [10 § 5](./10-workspace-layout.md#5-rust-侧随迁移需要调整的路径)                                                        | 1 h   |
| 1.6 | lint 合并：现有 `.oxlintrc.json` 规则并入根 `vite.config.ts`；`apps/desktop/src/legacy/**` 不参与 lint 与格式化（`vp check` 只能使用根配置，无法对子目录单独关闭类型感知；legacy 已冻结，类型由 `check:legacy` 覆盖）；规则集沿用模板默认（correctness），不启用 suspicious，以免对复制来的模板包报警；删除 `.oxlintrc.json` 与旧的 `frontend.yml`   | [10 § 4](./10-workspace-layout.md#4-工具链)                                                                             | 1 h   |
| 1.7 | CI：引入模板 `ci.yml`，desktop 作业改为 macOS，去掉 codegen 同步与 mobile 守卫                                                                                                                                                                                                                                                                       | [10 § 6](./10-workspace-layout.md#6-ci)                                                                                 | 1 h   |
| 1.8 | 验证：`vp run ready`；`vp run desktop#dev` 启动并截图；`vp run desktop#build:native` 打包并安装，确认授权与数据保留                                                                                                                                                                                                                                  | [90 M0](./90-roadmap.md#m0--仓库变为-vite-monorepo应用全部仍是-vue)                                                     | 2 h   |

**退出标准**：[M0 退出标准](./90-roadmap.md#m0--仓库变为-vite-monorepo应用全部仍是-vue)全部满足。

## 5. Phase 2 — 契约与外壳（M1 前半）

| #   | 任务                                                                                                                                                                                   | 规格                                                                                                            | 估算  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----- |
| 2.1 | 新建 `packages/native`：`call` + `CommandMap` + `NativeError`；`on` + `EventMap`；`WINDOW` 表；`mockIPC` 测试工具                                                                      | [11 § 2.1–2.3、2.5](./11-native-bridge.md#2-接口)                                                               | 3 h   |
| 2.2 | 设置 schema（12 个键）+ `getSetting`/`setSetting`/`onSettingChange`；测试 N2、N4；**N3 契约测试**（扫描 Rust 读取处并比对默认值）                                                      | [11 § 2.4、§ 3](./11-native-bridge.md#24-设置)                                                                  | 3 h   |
| 2.3 | 设置窗口用到的命令登记：`apply_shortcuts`、`get_diagnostics_bundle`、`clear_ocr_index`、`list_history_items`、`delete_history_items`；插件包装 `autostart`、`pickDirectory`、`confirm` | [11 § 2.6](./11-native-bridge.md#26-插件包装)、[13 § 5](./13-design-system.md#5-设置窗口的界面结构本轮参考实现) | 2 h   |
| 2.4 | `@ddu/hooks`：桌面版 `createQueryClient`（关闭 focus 重新拉取）、`useSetting`（读、写、跨窗口订阅，乐观更新）、`useNativeEvent`                                                        | [12 § 3](./12-desktop-shell.md#3-react-窗口外壳)                                                                | 3 h   |
| 2.5 | 品牌层 `packages/tokens/src/brand.css`，`@ddu/brand` 常量                                                                                                                              | [13 § 3](./13-design-system.md#3-品牌层)                                                                        | 1 h   |
| 2.6 | `apps/desktop/src/shared/mount-window.tsx`：Provider、系统主题、错误边界；`src/styles.css`（含 `@source not "./legacy"`）；把入口加入 `base.test.ts` 的 `HOST_ENTRIES`                 | [12 § 3](./12-desktop-shell.md#3-react-窗口外壳)、[13 U4](./13-design-system.md#6-不变量)                       | 2 h   |
| 2.7 | lint 规则：应用 React 代码禁止直接导入 Tauri API（W2/N5）；窗口 label ↔ HTML 入口测试（S1/S2）                                                                                         | [10 § 3](./10-workspace-layout.md#3-包职责与依赖方向)、[12 § 7](./12-desktop-shell.md#7-不变量)                 | 1.5 h |

**退出标准**：`vp run ready` 全绿；`@ddu/native` 与 `@ddu/hooks` 的测试覆盖 [11 § 3](./11-native-bridge.md#3-不变量) 的全部不变量；N3 测试在故意改错一个 Rust 默认值时失败。

## 6. Phase 3 — 设置窗口迁移（M1 后半）

按 [12 § 5](./12-desktop-shell.md#5-迁移一个窗口的标准步骤) 的步骤执行。

| #   | 任务                                                                                                                                | 规格                                                             | 估算  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----- |
| 3.1 | `src/windows/setting/`：窗口骨架 + 通用、存储两个分区                                                                               | [13 § 5](./13-design-system.md#5-设置窗口的界面结构本轮参考实现) | 2 h   |
| 3.2 | 截图分区（延时 `toggle-group`、指针 `switch`、命名模板 `input` 失焦保存）                                                           | 同上                                                             | 1.5 h |
| 3.3 | 快捷键分区（录制、保存、`apply_shortcuts` 失败时行内报错并保留输入、恢复默认）                                                      | 同上                                                             | 3 h   |
| 3.4 | 历史分区（保留期限、自动清理、OCR 索引开关：关闭时确认并清除，取消则开关回到原状态；清空历史）                                      | 同上                                                             | 2 h   |
| 3.5 | 诊断分区（运行检查、状态标签）                                                                                                      | 同上                                                             | 1 h   |
| 3.6 | 组件测试（Testing Library + `mockIPC`）：每个分区至少一个“改值 → 写入 store / 调用命令”的测试；快捷键失败路径；OCR 索引开关取消路径 | [12 § 5](./12-desktop-shell.md#5-迁移一个窗口的标准步骤)         | 2.5 h |
| 3.7 | 切换 `setting.html` 入口，删除 `src/legacy/pages/setting/` 及仅被其使用的 legacy 组件（`WindowState.vue`、`AutoStart.vue` 等）      | [12 § 5](./12-desktop-shell.md#5-迁移一个窗口的标准步骤)         | 0.5 h |
| 3.8 | 打包后按人工核对清单走查（含跨窗口设置同步）                                                                                        | [12 § 6](./12-desktop-shell.md#6-人工核对清单每个窗口)           | 1.5 h |

**退出标准**：[M1 退出标准](./90-roadmap.md#m1--设置窗口使用-react-与设计系统本轮)全部满足。

## 7. Phase 4–7 — 其余窗口（M2–M5）

每个阶段同 Phase 3 的形状：登记原生入口 → 补缺失组件 → 实现 → 测试 → 切换入口 → 删除 legacy → 人工核对。各窗口的特有任务：

| 阶段          | 窗口      | 特有任务                                                                                                                                          |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 4（M2） | `startup` | 登记权限相关命令 `permission_status`/`permission_request`/`restart_app`（窗口未用到 `permission_open_settings`，不登记）                          |
| Phase 5（M3） | `main`    | `virtual-masonry` 替换 CSS 多列；搜索去抖与乱序响应保护保留；单张删除改走后端 `delete_history_items`（现为前端直接删除文件，会绕过 OCR 索引清理） |
| Phase 6（M4） | `capture` | 透明全屏窗口的外壳变体；命中测试节流与拖拽阈值保留；遮罩出现耗时对比                                                                              |
| Phase 7（M5） | `preview` | 开始前单独设计 fabric.js 在 React 中的集成（命令式画布、生命周期、撤销栈）；导出结果逐像素对比测试                                                |

## 8. Phase 8 — 移除 Vue（M6）

| #   | 任务                                                                                           | 估算 |
| --- | ---------------------------------------------------------------------------------------------- | ---- |
| 8.1 | 删除 `src/legacy/`、`uno.config.ts`、Vue/UnoCSS 插件与依赖、`check:legacy` 任务、`@source not` | 1 h  |
| 8.2 | `apps/desktop` 的 TypeScript 改回 `catalog:`（7），修复由此产生的类型错误                      | 2 h  |

**退出标准**：[M6 退出标准](./90-roadmap.md#m6--移除-vue)。

## 9. 这个顺序为什么正确

1. **搬家与重写分开。** Phase 1 只移动、不改写，出问题时只有一个原因。
2. **契约先于消费者。** 设置 schema、命令表、窗口外壳在第一个 React 窗口之前定型，后续窗口只做登记，不回头改基础设施。
3. **从最简单、依赖最少的窗口开始，最难的放最后。** 设置窗口没有透明窗口、画布、事件这些难点，适合作为参考实现；预览编辑器风险最高，放在模式稳定之后，届时外壳和契约都已经过四个窗口的检验。
