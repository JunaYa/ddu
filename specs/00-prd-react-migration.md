# PRD — ddu 前端架构迁移（React monorepo）

Status: draft v1 · Owner: ddu · Last updated: 2026-10-10

> 本 PRD 描述的是**工程架构**的产品需求，读者是开发者。ddu 面向终端用户的功能需求仍以 [01](./01-capture-engine.md)–[07](./07-settings-platform-packaging.md) 为准，本次迁移不改变任何用户可见行为。

## 1. 问题

- **没有设计系统。** 前端 3.7k 行 Vue/TS，按钮、开关、复选框、目录选择器都是手写组件（`src/components/*.vue`）。样式靠 UnoCSS 原子类和 `global.css` 里的 `liquid-glass-*` 类拼出来，每加一个窗口就重造一遍控件。
- **原生调用没有契约。** 52 个 Tauri 命令通过 `invoke('name', {...})` 字符串直接调用，返回值多处用 `any`（例如 `listen<any>('image-prepared')`）。设置存储的 12 个键以 `{ value }` 形式散落在 6 个文件里，每个文件各自 `new LazyStore('settings.json')`；前端共有 39 处直接 `invoke`。改一个命令名或字段，编译器不会报错。
- **工具链落后于团队标准。** 团队的 React 项目（vp-monorepo）已统一使用 Vite+（`vp`）、类型感知 lint、oxfmt、Storybook 和 CI 门禁；ddu 是单包 Vue 项目，无法复用这些组件和规范。
- **后续功能会放大这些问题。** spec 04 的二维码、敏感信息打码，spec 05 的分享导出，spec 06 的录屏都要新增窗口和大量原生调用。

## 2. 愿景

ddu 成为一个 Vite+ monorepo：Rust 后端不变，前端使用与 vp-monorepo 一致的 React 技术栈和 UI 设计系统；每个原生能力都有一个类型化入口，每个窗口都由同一套组件拼成。

写一个新设置项的样子（钉住人机工程契约）：

```tsx
// apps/desktop/src/windows/setting/capture-section.tsx
import { Switch } from "@ddu/ui/switch";
import { useSetting } from "@ddu/hooks/settings";

export function IncludeCursor() {
  const [includeCursor, setIncludeCursor] = useSetting("include_cursor");
  return <Switch checked={includeCursor} onCheckedChange={setIncludeCursor} />;
}
```

`"include_cursor"` 拼错、值类型不对、默认值缺失，都在 `vp check` 时报错，而不是运行时静默失败。

## 3. 目标

| #  | 目标 | 度量 |
| -- | ---- | ---- |
| G1 | 与 vp-monorepo 同构的 monorepo 与工具链 | 仓库根执行 `vp run ready`（fmt + lint + test + build）全绿；`vp run desktop#dev` 能打开应用 |
| G2 | 原生调用有唯一类型化入口 | `apps/` 下 `invoke(`、`listen(`、`new LazyStore(` 的直接调用数为 0（lint 规则强制），全部经由 `@ddu/native` |
| G3 | 设置项有单一事实来源 | 每个设置键在 `@ddu/native` 的 schema 中定义恰好一次（键、类型、默认值）；Rust 读取的键名与之一致，由测试校验 |
| G4 | 窗口逐个迁移，每一步都可发布 | 每个迁移步骤结束时：`vp run ready` 全绿，`.app` 可打包，已迁移窗口功能与迁移前等价（人工核对清单通过） |
| G5 | UI 使用统一设计系统 | 已迁移窗口中不出现手写的按钮/开关/输入框组件，全部来自 `@ddu/ui`；亮/暗色跟随系统 |
| G6 | 迁移不影响用户已有授权和数据 | 迁移后升级安装：屏幕录制/辅助功能授权仍有效（bundle identifier 不变）；`settings.json`、截图目录、OCR 索引原样可读 |

## 4. 非目标

- **不改 Rust 后端的行为。** 只移动目录（`src-tauri` → `apps/desktop/src-tauri`）和调整构建脚本路径；命令签名不变。命令契约的代码生成（tauri-specta）推迟评估，见 [99 D4](./99-key-decisions.md#d4)。
- **本轮不迁移全部窗口。** 本轮只迁移设置窗口作为参考实现；其余窗口按 [90-roadmap](./90-roadmap.md) 逐个进行。
- **不保留模板中与 ddu 无关的端。** `apps/web`、`apps/extension`、`apps/cli`、`apps/mobile` 以及 `@pi/sdk` 的 OpenAPI 代码生成不带入 ddu。
- **不做视觉重设计。** 先用设计系统的默认风格还原现有布局；品牌色沿用 ddu 的琥珀色 `#cc7d24`。liquid glass 质感用模板的 `glass` 工具类近似，不追求像素级一致。
- **不改变用户可见文案和功能。** 文案原样搬迁（中英混排保持现状），国际化不在本次范围。
- **不支持 Windows/Linux 构建。** 现状如此（`platform::windows` 模块不存在），迁移不改变。

## 5. 用户

- **主要：ddu 的开发者**（目前 1 人 + AI 助手）。场景：新增窗口或设置项、调用新的原生命令、修改样式。
- **次要：从 vp-monorepo 来的 React 开发者。** 应能直接复用组件和规范，不需要学 Vue/UnoCSS。
- **反用户：终端用户。** 他们不应感知到迁移，任何可见变化都算缺陷（视觉风格趋同于设计系统除外）。

## 6. 成功指标

- 迁移完成后（全部窗口）：`apps/desktop` 中 `.vue` 文件数为 0，`vue`、`unocss`、`vue-tsc` 依赖移除，TypeScript 回到目录版本 7。
- 新增一个设置项需要改动的文件数 ≤ 3（schema、Rust 读取处、UI），当前为 4–5 个且无类型保护。
- 每个迁移步骤的 PR 都能独立回滚（窗口粒度），不出现“半个窗口是 Vue、半个是 React”的状态。

## 7. 命名约定（绑定）

| 对象 | 规则 | 示例 |
| ---- | ---- | ---- |
| 共享包 | `@ddu/<name>`，位于 `packages/*`，`private: true` | `@ddu/ui`、`@ddu/native` |
| 应用 | 裸名，位于 `apps/*` | `desktop` |
| 任务引用 | 包用全名、应用用裸名 | `vp run @ddu/ui#storybook`、`vp run desktop#dev` |
| 窗口 | Tauri label = HTML 入口名 = `apps/desktop/src/windows/<label>/` 目录名 | `setting` → `setting.html` → `src/windows/setting/` |
| 原生命令 | Rust 端 `snake_case` 不变；TS 端 `@ddu/native` 导出同名 `camelCase` 函数 | `perform_ocr` → `performOcr()` |
| 设置键 | `snake_case`，与 `settings.json` 中现有键完全一致，不得重命名 | `include_cursor` |
| 迁移期旧代码 | `apps/desktop/src/legacy/`，只出不进 | `src/legacy/pages/preview/` |
| 产品标识 | 保持不变：productName `Ddu`、identifier `com.ddu.app`、crate `ddu` | — |
