# 11-native-bridge：@ddu/native — 前端与 Tauri 之间的契约

Status: draft · Owner: ddu · Depends on: [10](./10-workspace-layout.md)

## 1. 目的

`@ddu/native` 是前端接触 Tauri 的**唯一**入口，负责四类契约：

1. **命令**：Rust `#[tauri::command]` 的类型化调用。
2. **事件**：Rust 向窗口推送的事件。
3. **设置**：`settings.json` 中每个键的类型、默认值和读写。
4. **窗口**：窗口 label 表与窗口操作。

它占据模板中 `@pi/sdk` 的位置：与框架无关（不依赖 React），被 `@ddu/hooks` 和应用消费。它**不**负责缓存、重试、加载状态（那是 `@ddu/hooks` 的事），也不负责任何 UI。

先落地契约、再写消费者：设置窗口迁移之前，本包必须先提供设置、自启动、目录选择、诊断、快捷键这些设置窗口用到的入口（[91 Phase 2](./91-impl-plan.md#5-phase-2--契约与外壳m1-前半)）。

## 2. 接口

### 2.1 命令

一张类型表登记每个命令的参数和返回值，一个泛型函数负责调用；按领域导出 camelCase 包装函数。

```ts
// packages/native/src/commands/map.ts
export interface CommandMap {
  perform_ocr: { args: { path: string; region?: OcrRegion }; result: OcrResult };
  copy_text: { args: { text: string }; result: void };
  get_platform_capabilities: { args: Record<string, never>; result: PlatformCapability[] };
  // …每个已迁移窗口用到的命令都在这里登记一次
}

// packages/native/src/commands/call.ts
export async function call<K extends keyof CommandMap>(
  name: K,
  args: CommandMap[K]["args"],
): Promise<CommandMap[K]["result"]>;

// packages/native/src/ocr.ts
export const performOcr = (path: string, region?: OcrRegion) =>
  call("perform_ocr", { path, region });
```

- 参数对象的键使用 Tauri 默认的 camelCase 转换后的名字（例如 Rust 的 `delay_secs` 对应 TS 的 `delaySecs`），与当前 `invoke` 调用一致。
- **按需登记**：只登记已迁移窗口用到的命令。迁移一个窗口时，把它用到的命令补进 `CommandMap`。未迁移的 Vue 代码继续直接 `invoke`，直到被删除。
- 返回类型从 Rust 结构手工抄写，Rust 字段名（`snake_case` 或 `#[serde(rename_all)]` 后的名字）原样保留，**不**在本层做大小写转换，避免契约出现两份命名。
- 不引入代码生成（tauri-specta），推迟评估，见 [99 D4](./99-key-decisions.md#d4)。

### 2.2 错误

ddu 的命令一律返回 `Result<T, String>`，前端收到的拒绝值是字符串。`call` 统一包装为：

```ts
export class NativeError extends Error {
  readonly command: string; // 例如 "perform_ocr"
  // message 为 Rust 返回的原始字符串
}
```

上层只需 `catch (e) { if (e instanceof NativeError) … }`。本层不做重试，也不吞错。

### 2.3 事件

```ts
export interface EventMap {
  "image-prepared": CapturePrepared; // 截图完成后发给 preview 窗口
}

export function on<K extends keyof EventMap>(
  name: K,
  handler: (payload: EventMap[K]) => void,
): Promise<() => void>; // 返回取消订阅函数
```

`CapturePrepared` 按 `global_shortcut.rs` 中的 `capture_payload` 抄写：`filename`、`fullPath`、`width`、`height`、`mode`、`capturedAt`、`copyError`、`extractText`。

### 2.4 设置

设置 schema 是**设置键的唯一事实来源**：

```ts
// packages/native/src/settings/schema.ts
export const settingsSchema = {
  screenshot_path: { schema: z.string(), default: "" },
  capture_delay: { schema: z.number().int().min(0), default: 0 },
  include_cursor: { schema: z.boolean(), default: false },
  naming_template: { schema: z.string(), default: "{date}_{time}_{mode}" },
  hotkey_fullscreen: { schema: z.string(), default: "CmdOrCtrl+Shift+A" },
  hotkey_region: { schema: z.string(), default: "CmdOrCtrl+Shift+S" },
  hotkey_window: { schema: z.string(), default: "CmdOrCtrl+Shift+W" },
  hotkey_text: { schema: z.string(), default: "CmdOrCtrl+Shift+O" },
  history_retention_days: { schema: z.number().int(), default: 30 },
  history_cleanup_enabled: { schema: z.boolean(), default: false },
  ocr_index_enabled: { schema: z.boolean(), default: true },
  first_run: { schema: z.boolean(), default: false },
} as const;

export type SettingKey = keyof typeof settingsSchema;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingsSchema)[K]["schema"]>;

export function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>>;
export function setSetting<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<void>; // set + save
export function onSettingChange<K extends SettingKey>(
  key: K,
  handler: (value: SettingValue<K>) => void,
): Promise<() => void>;
```

- **存储格式不变**：`settings.json` 中每个键的值仍是 `{ "value": … }`，Rust 侧按此格式读取。
- **读取时校验**：存储里的值不符合 schema（缺失、类型错、旧版本写入的脏数据）时返回默认值，并记一条 `console.warn`。默认值必须与 Rust 侧的回退值一致（见不变量 N3）。
- **`capture_delay` 的默认值取 0**。现状是设置界面在未设置时显示 3 秒，而 Rust 实际按 0 秒执行（`platform/mac/screenshot.rs:99`），界面显示与实际行为不符。迁移以实际行为为准，界面会改为显示 0。见 [99 D10](./99-key-decisions.md#d10)。
- **`naming_template`** 当前只被写入，Rust 从不读取（设置项不生效）。schema 保留它以免丢失用户已存的值；它是否生效是独立问题，不在本次迁移范围。
- **`workflow_rules` 不在 schema 中**：它以数组形式存储（不是 `{ value }`），由 Rust 的 `list_workflow_rules` / `save_workflow_rule` 命令独占管理，前端只通过命令访问。

### 2.5 窗口

```ts
export const WINDOW = {
  main: "main",
  setting: "setting",
  preview: "preview",
  startup: "startup",
  capture: "capture",
} as const;
export type WindowLabel = (typeof WINDOW)[keyof typeof WINDOW];

export function currentWindowLabel(): WindowLabel;
```

窗口的显示和隐藏仍由 Rust 命令完成（`show_setting_window` 等，会处理多显示器定位），本包只做类型化包装，不直接调用 `WebviewWindow.show()`。

### 2.6 插件包装

设置窗口用到的 Tauri 插件也由本包包装，应用不直接导入插件：

| 导出                                                       | 底层                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `autostart.isEnabled / enable / disable`                   | `@tauri-apps/plugin-autostart`                                                   |
| `pickDirectory({ defaultPath? }): Promise<string \| null>` | `@tauri-apps/plugin-dialog` 的 `open({ directory: true })`，默认路径为用户主目录 |
| `confirm(message, options)`                                | `@tauri-apps/plugin-dialog`                                                      |

## 3. 不变量

| #   | 不变量                                                                              | 验证                                                                                                                                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | `@ddu/native` 不导入 React                                                          | `packages/native` 的 lint 规则                                                                                                                                                                                                                                                                                                                |
| N2  | 每个设置键在 `settingsSchema` 中出现且只出现一次，键名与 `settings.json` 现有键一致 | TS 的对象字面量保证唯一；测试断言键集合等于上面列出的 12 个                                                                                                                                                                                                                                                                                   |
| N3  | Rust 读取的每个设置键都在 `settingsSchema` 中，且默认值相同                         | Vitest 测试扫描 `apps/desktop/src-tauri/src/**/*.rs` 中读取 `settings.json` 的调用，抽取键与回退值，与 schema 比对。新增 Rust 读取而未登记 schema 时测试失败。例外：`screenshot_path` 没有静态默认值，Rust 在启动时（`lib.rs` 的 `setup`）若为空就写入应用数据目录，因此前端读到的永远是已写入的值，schema 默认值 `""` 只在启动前的竞态中出现 |
| N4  | 存储格式保持 `{ value }`                                                            | 测试：`setSetting` 写入 mock store 后，原始值为 `{ value: … }`                                                                                                                                                                                                                                                                                |
| N5  | 应用的 React 代码不绕过本包                                                         | [10 § 3](./10-workspace-layout.md#3-包职责与依赖方向) 的 lint 规则                                                                                                                                                                                                                                                                            |

## 4. 行为

- **测试方式**：用 `@tauri-apps/api/mocks` 的 `mockIPC` 拦截命令和插件调用，不需要真实的 Tauri 运行时。本包的单元测试覆盖：参数透传、`NativeError` 包装、设置的校验与默认值回退、`{ value }` 存储格式。
- **跨窗口的设置同步**：`onSettingChange` 基于 plugin-store 的 `onKeyChange`。已从插件源码确认可跨窗口工作：同一路径的 store 在全应用只有一个资源 ID（`tauri-plugin-store` 2.4.3 `store.rs` 的 `build_inner` 按路径复用），变更事件 `store://change` 通过 `app.emit` 广播到所有窗口，Rust 侧的写入同样会触发。Phase 3 的人工核对仍包含“在设置窗口改快捷键后，其他窗口读到新值”。
- **并发写入**：plugin-store 在 Rust 侧串行处理写入；同一键的并发 `setSetting` 以后写者为准，不做合并。
- **线程与取消**：不适用，所有调用都是单次异步 IPC；`on`/`onSettingChange` 返回的取消函数必须在组件卸载时调用（由 `@ddu/hooks` 负责）。

## 5. 交叉引用

- ← 依赖：[10 § 3](./10-workspace-layout.md#3-包职责与依赖方向)
- → 被引用：[12](./12-desktop-shell.md)（窗口入口读取 `WINDOW`、订阅事件）、[91 Phase 1](./91-impl-plan.md)
- ↔ 现有功能规格：[04](./04-ocr-privacy-ai.md)（OCR 命令）、[07](./07-settings-platform-packaging.md)（设置项）
- ↔ 研究：[2026-10-10 风险验证](../docs/research/2026-10-10-react-monorepo-spikes.md)
