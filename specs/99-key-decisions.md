# Key Decisions — React monorepo 迁移

每条决策一经记录不再原地修改；推翻时新增一条并注明取代关系。

## D1

**原地把 ddu 仓库重构为 monorepo，而不是把 ddu 放进 vp-monorepo，也不是保持单包。**

- **背景**：需要采用 vp-monorepo 的 React 栈与设计系统。
- **备选**：
  - (a) 在 vp-monorepo 中新增 `apps/ddu`。共享一套设计系统，但会把产品代码和 Rust 混入模板仓库。
  - (b) ddu 保持单包，只复制需要的组件。改动最小，但失去分包边界和 Vite+ 工具链。
  - (c) 原地重构 ddu。
- **决定**：(c)，用户于 2026-10-10 选定。
- **理由**：ddu 保留自己的 git 历史和发布节奏，同时获得与模板一致的结构和工具链。模板本身就是为“复制后改造成产品”设计的（`docs/project-identity.md`）。
- **约束到**：[10 § 2](./10-workspace-layout.md#2-目录结构)
- **日期**：2026-10-10

## D2

**设计系统包复制并改名为 `@ddu/*`，由 ddu 自行维护，不与模板保持同步。**

- **备选**：git subtree/submodule 引用模板；发布 `@pi/*` 到私有 registry 后依赖。
- **理由**：模板的 `@pi/tokens`、`@pi/styles`、`@pi/brand`、`@pi/iconography` 均为 `private`，没有发布流程（`vp-monorepo/docs/conventions.md` § Storybook）。subtree 同步时品牌层冲突难以处理。复制后保持模板文件不改，只通过品牌层定制，可以让后续手动拣选的 diff 保持干净。
- **约束到**：[13 § 2](./13-design-system.md#2-引入方式复制并改名ddu-自行维护)
- **日期**：2026-10-10

## D3

**不引入模板的 web、extension、cli、mobile 应用，也不引入 `@pi/sdk` 及其 OpenAPI 代码生成。**

- **理由**：ddu 是单一桌面应用，没有 HTTP 后端。sdk 的契约来源是 `openapi.json`，而 ddu 的契约来源是 Rust 命令。保留这些只会带来 CI 成本和误导。`@ddu/native` 取代 sdk 在依赖图中的位置。
- **约束到**：[10 § 2](./10-workspace-layout.md#2-目录结构)、[11 § 1](./11-native-bridge.md#1-目的)
- **日期**：2026-10-10

## D4

**命令契约先手写在 `CommandMap` 中，暂不使用 tauri-specta 代码生成。**

- **备选**：tauri-specta 从 Rust 命令生成 TS 绑定，与模板的 OpenAPI 代码生成思路一致，Rust 改签名时前端会编译失败。
- **理由**：
  - tauri-specta 与本项目的 Tauri 2.11 以及大量 `#[cfg(target_os)]` 命令的组合未经验证；
  - 引入它需要给 52 个命令和所有返回类型加 `specta::Type` 派生，等于改动 Rust 后端，违反“迁移不改后端”的非目标；
  - 手写表只需登记已迁移窗口用到的命令，成本随迁移进度线性增长。

  代价是 Rust 改签名时前端不会自动报错。缓解办法是 `CommandMap` 集中在一个文件里，评审时容易核对。
- **重新评估时机**：M6 之后，或 `CommandMap` 超过 30 个命令时。
- **约束到**：[11 § 2.1](./11-native-bridge.md#21-命令)
- **日期**：2026-10-10

## D5

**设置用 zod schema 定义，读取时校验，不合法时回退默认值；存储格式保持 `{ value }`。**

- **备选**：只用 TS 类型、不做运行时校验；改为扁平存储格式。
- **理由**：
  - `settings.json` 由多个版本的应用写入过，TS 类型无法防住磁盘上的脏数据；
  - 存储格式是 Rust 与前端的共享契约，改格式会牵动 Rust 读取逻辑和老用户数据迁移。

  zod 已在模板 catalog 中，不增加新依赖。
- **约束到**：[11 § 2.4](./11-native-bridge.md#24-设置)
- **日期**：2026-10-10

## D6

**每个 Tauri 窗口保持一个 HTML 入口，不引入前端路由。**

- **备选**：单入口 SPA，按窗口 label 路由。
- **理由**：
  - 各窗口的 webview 生命周期、透明度、置顶策略都不同；
  - 单入口会让每个窗口都加载全部代码，截图遮罩等对启动速度敏感的窗口会变慢；
  - 多入口使得“按窗口迁移”成为可能，HTML 文件名不变，Rust 侧零改动。
- **约束到**：[12 § 2](./12-desktop-shell.md#2-窗口模型一个窗口--一个-html-入口)
- **日期**：2026-10-10

## D7

**按窗口逐个迁移，迁移期 Vue 与 React 在同一构建中共存。**

- **备选**：一次性重写全部窗口。
- **理由**：
  - 一次性重写约 3.7k 行，期间应用不可发布，问题难以定位；
  - 共存方案已实测可行（[研究 S2、S3](../docs/research/2026-10-10-react-monorepo-spikes.md)），代价只是迁移期多两个插件和一个 TS 版本固定。
- **约束到**：[12 § 4–5](./12-desktop-shell.md#4-迁移期vue-与-react-共存)、[90](./90-roadmap.md)
- **日期**：2026-10-10

## D8

**迁移期 `apps/desktop` 固定 TypeScript 5.9.3，其余包使用 catalog 的 TS 7。**

- **理由**：`vue-tsc` 3.3.12 在 TS 7.0.2 下崩溃（TS 7 不再导出 JS API，[研究 S4](../docs/research/2026-10-10-react-monorepo-spikes.md)）。不固定版本就只能放弃对 Vue 代码的类型检查。
- **撤销条件**：最后一个 Vue 窗口删除时（Phase 8.2）。
- **约束到**：[10 § 4](./10-workspace-layout.md#4-工具链)
- **日期**：2026-10-10

## D9

**主题跟随系统（`prefers-color-scheme` → `.dark` 类），不提供手动切换。**

- **理由**：与现状一致；模板 token 的暗色机制是 `.dark` 类，但模板中没有切换代码，需要 ddu 自己实现。手动切换属于新功能，不在迁移范围。
- **约束到**：[12 § 3](./12-desktop-shell.md#3-react-窗口外壳)
- **日期**：2026-10-10

## D10

**`capture_delay` 的默认值统一为 0（Rust 的实际行为），界面在未设置时也显示 0。**

- **背景**：现状是界面在未设置时显示 3 秒，而 Rust 按 0 秒执行（`platform/mac/screenshot.rs:99`），即界面与实际行为不符。
- **备选**：统一为 3，但这会改变从未修改过该设置的用户的截图行为。
- **理由**：迁移不得改变用户可见行为，而实际行为是 0 秒。修正的是界面显示的错误。
- **约束到**：[11 § 2.4](./11-native-bridge.md#24-设置)
- **日期**：2026-10-10

## D11

**CI 的 desktop 作业使用 macOS runner。**

- **理由**：ddu 的 Rust 代码只能在 macOS 上编译：`platform/mod.rs` 引用的 `windows` 模块不存在，Linux 模块缺少命令依赖的函数。模板在 ubuntu 上做 `cargo check` 的做法对 ddu 不可行。
- **约束到**：[10 § 6](./10-workspace-layout.md#6-ci)
- **日期**：2026-10-10

## D12

**原生数据通过 React Query 管理，设置写入采用乐观更新。**

- **理由**：模板的数据层就是 React Query（`@pi/hooks`），沿用它可以统一加载、错误、缓存的写法。设置写入是本地 IPC，几乎不会失败，乐观更新能避免开关切换时的闪烁；写入失败时回滚并显示错误。
- **约束到**：[12 § 3](./12-desktop-shell.md#3-react-窗口外壳)、[91 Phase 2.4](./91-impl-plan.md#5-phase-2--契约与外壳m1-前半)
- **日期**：2026-10-10

## D13

**产品标识保持不变：productName `Ddu`、identifier `com.ddu.app`、crate `ddu`。**

- **理由**：macOS 的屏幕录制、辅助功能授权按 bundle identifier 和签名记录。改 identifier 后，系统会把升级后的应用视为新应用，用户需要重新授权，而且旧授权会以失效状态残留在系统设置里。模板的 `dev.pi.desktop` 不得带入。
- **约束到**：[10 § 5](./10-workspace-layout.md#5-rust-侧随迁移需要调整的路径)、[00 G6](./00-prd-react-migration.md#3-目标)
- **日期**：2026-10-10
