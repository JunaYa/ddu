# 10-workspace-layout：仓库结构、包边界与工具链

Status: draft · Owner: ddu · Depends on: [00](./00-prd-react-migration.md)

## 1. 目的

规定 ddu monorepo 的目录结构、每个包负责什么、包之间允许的依赖方向，以及构建、检查、CI 如何运行。本文是“某段代码应该放在哪里”的唯一权威。原生调用的契约见 [11](./11-native-bridge.md)，窗口与运行时见 [12](./12-desktop-shell.md)，样式与组件见 [13](./13-design-system.md)。

## 2. 目录结构

以 vp-monorepo（提交 `de79000`）为模板，**原地**重构 ddu 仓库（`git mv`，保留历史）：

```
ddu/
├── apps/
│   └── desktop/                 应用（裸名 desktop）
│       ├── index.html …         每个 Tauri 窗口一个 HTML 入口，见 12 § 2
│       ├── src/
│       │   ├── windows/<label>/ 已迁移到 React 的窗口
│       │   ├── legacy/          迁移期的 Vue 代码（只出不进）
│       │   └── shared/          仅本应用使用、跨窗口的 React 代码
│       ├── src-tauri/           原 ddu/src-tauri，内容不变
│       ├── scripts/             原 ddu/scripts（pdfium 暂存、签名检查）
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   ├── native/      @ddu/native      Tauri 契约层：命令、事件、设置 schema、窗口表
│   ├── hooks/       @ddu/hooks       React 数据层：React Query + 设置/事件 hooks
│   ├── ui/          @ddu/ui          展示组件（源自 @pi/ui）
│   ├── tokens/      @ddu/tokens      设计 token（源自 @pi/tokens，品牌层替换）
│   ├── styles/      @ddu/styles      Tailwind 基础样式（源自 @pi/styles）
│   ├── iconography/ @ddu/iconography 图标（源自 @pi/iconography）
│   ├── brand/       @ddu/brand       品牌常量与 Logo
│   └── utils/       @ddu/utils       与框架无关的工具函数
├── tools/
│   └── license-gate/                 许可证门禁（源自模板）
├── specs/  docs/                     不动
├── vite.config.ts                    根配置：lint / fmt / staged / 任务缓存
├── pnpm-workspace.yaml               catalog 与 overrides
└── package.json
```

模板中不带入的部分：`apps/web`、`apps/extension`、`apps/cli`、`apps/mobile`、`packages/sdk`（及其 OpenAPI 代码生成）。理由见 [99 D3](./99-key-decisions.md#d3)。

## 3. 包职责与依赖方向

```
@ddu/utils ─→ @ddu/native ─→ @ddu/hooks ─→ desktop
                                             ↑
@ddu/tokens ─→ @ddu/styles ──────────────────┤
@ddu/brand, @ddu/iconography ─→ @ddu/ui ─────┘
```

| 包            | 负责                                                                                                         | 不得依赖                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `@ddu/utils`  | 纯函数（格式化文件大小、OCR 文本合并等，从 `src/lib`、`src/utils` 迁入）                                     | 任何 `@tauri-apps/*`、React                  |
| `@ddu/native` | 对 Tauri 的**唯一**入口：类型化命令、事件、设置 schema 与读写、窗口 label 表。见 [11](./11-native-bridge.md) | React、`@ddu/ui`、`@ddu/hooks`               |
| `@ddu/hooks`  | 把 `@ddu/native` 包装成 React hooks（React Query 缓存、设置订阅、事件订阅）                                  | `@ddu/ui`                                    |
| `@ddu/ui`     | 纯展示组件，数据通过 props 传入                                                                              | `@ddu/native`、`@ddu/hooks`、`@tauri-apps/*` |
| `desktop`     | 组合：窗口入口、页面、窗口间流程                                                                             | 包的内部路径（`@ddu/*/src/**`）              |

与模板约定（`vp-monorepo/docs/conventions.md`）的对应关系：`@ddu/native` 占据模板中 `@pi/sdk` 的位置（框架无关的契约 + 客户端），其余规则原样继承。

**对模板“应用要薄”规则的偏离**：模板要求应用不含共享逻辑；ddu 只有一个应用，**窗口专属**的页面和流程（例如设置窗口的各个分区）放在 `apps/desktop/src/windows/<label>/`，不为了“薄”而强行抽进包里。判断标准：被两个及以上窗口使用、或与 React 无关的逻辑，才进包。

### 强制手段

| 规则                                                                                                                   | 机制                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 禁止深层导入 `@ddu/*/src/**`                                                                                           | 根 `vite.config.ts` 的 oxlint `no-restricted-imports`（沿用模板）                                                                                                 |
| 应用的 React 代码（`src/windows/**`、`src/shared/**`）禁止导入任何 `@tauri-apps/*` 包；插件也一律经 `@ddu/native` 包装 | 根 `vite.config.ts` 中 `lint.overrides` 的 `no-restricted-imports`（覆盖配置须重复深层导入禁令，因为 override 会替换整条规则的选项）；`src/legacy/**` 不参与 lint |
| `@ddu/ui` 不得导入数据层                                                                                               | `packages/ui` 的 `no-restricted-imports` 覆盖配置                                                                                                                 |

## 4. 工具链

- **Vite+（`vp`）1.1.0**，版本由根 `devDependencies` 的 `vite-plus` 固定；全局 `vp` 0.2.1 会委托给项目内版本（[研究 S1](../docs/research/2026-10-10-react-monorepo-spikes.md)）。
- **Node 26、pnpm 12.10.1**：由 `engines.node` 与 `packageManager` 指定，`vp` 自动管理。
- **TypeScript**：目录（catalog）版本为 7；**`apps/desktop` 在迁移期固定 5.9.3**，因为 `vue-tsc` 不能在 TS 7 下运行（研究 S4，[99 D8](./99-key-decisions.md#d8)）。最后一个 Vue 窗口删除时改回 `catalog:`。
- **Lint / 格式化**：oxlint + oxfmt，配置在根 `vite.config.ts`（`lint.options.typeAware: true`）。根目录现有的 `.oxlintrc.json` 规则并入根配置后删除。
- **测试**：Vitest（`vp test`），jsdom 环境；每个包至少一个真实测试（模板约定）。
- **Rust**：不变。`cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`。
- **Git 钩子**：`.vite-hooks/pre-commit` 运行 `vp staged`（`vp check --fix`），`vp install` 时激活。

### 常用命令

| 命令                                | 作用                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `vp install`                        | 安装依赖并激活 git 钩子                                                                |
| `vp run ready`                      | fmt + lint + 全部测试 + 全部构建（合并前必须全绿）                                     |
| `vp run desktop#dev`                | 启动 Tauri 开发模式（`beforeDevCommand` 调 `vp run desktop#dev:frontend`）             |
| `vp run desktop#build:native`       | 签名打包 `.app`，未设置 `APPLE_SIGNING_IDENTITY` 时拒绝构建（原 `pnpm build:desktop`） |
| `vp run desktop#build:native:adhoc` | 不签名打包 `.app`，屏幕录制授权不会保留（原 `pnpm build:desktop:adhoc`）               |
| `vp run desktop#build:dmg`          | 打包 DMG（原 `pnpm build:dmg`），发布前先运行 `vp run desktop#release:check-macos`     |
| `vp run desktop#check:legacy`       | 迁移期：`vue-tsc --noEmit` 检查 Vue 代码                                               |
| `vp run @ddu/ui#storybook`          | 组件 Storybook（端口 6006）                                                            |

## 5. Rust 侧随迁移需要调整的路径

`src-tauri` 内部代码不改，以下引用路径的地方需要更新：

| 位置                                                        | 现状                          | 迁移后                                                                                                |
| ----------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tauri.conf.json` `build.frontendDist`                      | `../dist`                     | `../dist`（相对 `apps/desktop/src-tauri`，仍指向 `apps/desktop/dist`，不变）                          |
| `tauri.conf.json` `beforeDevCommand` / `beforeBuildCommand` | `pnpm dev` / `pnpm build`     | `vp run desktop#dev:frontend` / `""`（构建顺序由 vp 任务 `dependsOn` 表达，沿用模板）                 |
| `scripts/stage-pdfium.sh`                                   | 以仓库根为基准找 `src-tauri/` | 以 `apps/desktop` 为基准                                                                              |
| `src-tauri/tauri.bundle.conf.json` 的调用方                 | 根 `package.json` 脚本        | `apps/desktop/vite.config.ts` 的 `build:native*`、`build:dmg` 任务，以及 `scripts/build-macos-dev.sh` |
| `.github/workflows/frontend.yml`                            | 根目录 `pnpm run lint`        | 被新 CI 取代（§ 6）                                                                                   |

`productName`、`identifier`（`com.ddu.app`）、crate 名 `ddu` **保持不变**，否则 macOS 会把升级后的应用当作新应用，用户的屏幕录制授权失效（[99 D13](./99-key-decisions.md#d13)）。

## 6. CI

沿用模板 `.github/workflows/ci.yml` 的结构，两处修改：

1. **desktop 作业改用 `macos-latest`**：ddu 的 Rust 代码只在 macOS 上可编译（`src/platform/mod.rs` 中 Windows 模块不存在，Linux 模块缺少命令依赖的函数）。作业内容：`vp run desktop#build` → `cargo clippy --all-targets -- -D warnings`（比 `cargo check` 更严，代码目前已通过）→ `cargo test --lib`。Rust 工具链需显式安装 `clippy` 组件。
2. **去掉** OpenAPI 代码生成同步检查（无 `@pi/sdk`）和 mobile 守卫。

保留：`vp run -r check`、`vp run -r test`、`vp run -r build`、license gate、`vp pm audit`。

## 7. 不变量

| #   | 不变量                                                                   | 如何保证                                                                                                                                    |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | 依赖方向只能沿 § 3 的箭头                                                | lint 规则；违反即 `vp check` 失败                                                                                                           |
| W2  | 应用中的 React 代码不直接接触 Tauri API                                  | lint 规则（§ 3 强制手段）                                                                                                                   |
| W3  | ddu 自写或改写的包（native、hooks、utils、brand、desktop）至少有一个测试 | 这些包的 `test` 脚本不带 `--passWithNoTests`，没有测试即失败；原样复制的模板包（tokens、iconography、styles）沿用模板的 `--passWithNoTests` |
| W4  | 产品标识不变                                                             | `apps/desktop/src-tauri` 中的一个 Rust 测试断言 `tauri.conf.json` 的 `identifier == "com.ddu.app"`                                          |

## 8. 交叉引用

- ← 依赖：[00-prd](./00-prd-react-migration.md)
- → 被引用：[11](./11-native-bridge.md)、[12](./12-desktop-shell.md)、[13](./13-design-system.md)、[91](./91-impl-plan.md)
- ↔ 研究：[2026-10-10 风险验证](../docs/research/2026-10-10-react-monorepo-spikes.md)；模板约定 `vp-monorepo/docs/conventions.md`
