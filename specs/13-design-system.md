# 13-design-system：设计系统的引入与 ddu 品牌层

Status: draft · Owner: ddu · Depends on: [10](./10-workspace-layout.md)、[12](./12-desktop-shell.md)

## 1. 目的

规定 ddu 如何使用 vp-monorepo 的设计系统：哪些包原样引入、ddu 的品牌（琥珀色、毛玻璃质感、系统字体）通过哪一层覆盖，以及现有 Vue 组件分别对应哪个 `@ddu/ui` 组件。目标是迁移后的窗口**不手写基础控件**，品牌差异只存在于一个文件里。

## 2. 引入方式：复制并改名，ddu 自行维护

`@pi/ui`、`@pi/tokens`、`@pi/styles`、`@pi/iconography`、`@pi/brand` 以模板提交 `de79000` 为基线复制进 `packages/`，包名从 `@pi/*` 改为 `@ddu/*`，其余代码不改。之后 ddu 独立维护，不自动跟随模板更新；需要模板的新组件时手动拣选。理由见 [99 D2](./99-key-decisions.md#d2)。

**保持模板代码原样**是为了将来拣选时 diff 干净：ddu 的定制只能放在 § 3 的品牌层和新增文件中，不修改复制来的文件。必须修改时，在文件顶部注释注明“ddu 修改：原因”。

这一规则只约束 `ui`、`tokens`、`styles`、`iconography` 四个设计系统包（`brand` 只改常量）。`utils` 与 `hooks` 复制时只取模板的骨架，此后就是 ddu 自己的包，按需重写，不加注释标记。

## 3. 品牌层

模板的 token 是三层 CSS 变量：primitives（原始色板）→ semantics（`--primary`、`--background` 等 shadcn 语义名，含 `.dark` 覆盖）→ Tailwind `@theme`。ddu 只在 semantics 之上加**一个**覆盖文件：

```css
/* packages/tokens/src/brand.css — 由 @ddu/styles/base.css 最后导入 */
:root {
  --primary: #cc7d24; /* ddu 琥珀色，原 --rgb-primary: 204, 125, 36 */
  --primary-foreground: #ffffff;
  --ring: color-mix(in srgb, #cc7d24 45%, transparent);
  --font-stack-product-sans:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
}
.dark {
  --primary: #cc7d24; /* 现状：亮暗色同一主色 */
  --ring: color-mix(in srgb, #cc7d24 55%, transparent);
}
```

- **导入位置**：`brand.css` 不放进 token 入口 `index.css`，而是由 `@ddu/styles/base.css` 最后导入。原因是模板的 `fonts.css` 在 token 之后才定义字体栈，放进 `index.css` 会被它覆盖；同时 `@ddu/styles` 的一致性测试禁止各宿主自行导入 `@ddu/tokens/css`。这样应用和 Storybook 都能显示 ddu 品牌。
- **字体**：模板只声明了 Manrope、Lora 等字体栈，并未附带字体文件。ddu 是 macOS 原生工具，改用系统字体栈，与现状一致。
- **窗口背景**：ddu 的窗口都以透明方式创建，由 Rust 开启 macOS 原生毛玻璃（`window.rs` 的 `macos_glass_effect`）。`apps/desktop/src/styles.css` 把 `html`、`body` 设为透明，覆盖 `@ddu/styles` 的不透明页面背景，每个窗口自己画半透明底色（设置窗口为 `bg-background/60`），与迁移前 legacy 页面的做法一致。
- **毛玻璃质感**：现有的 `.liquid-glass*` 类不迁移。面板改用模板的 `surface-glass` 工具类（`@ddu/styles/utils/glass.css`），它基于语义 token，自动适配暗色，并在不支持 `backdrop-filter` 时回退为实色。视觉上是近似，不追求与现状像素一致（[00 § 4](./00-prd-react-migration.md#4-非目标)）。
- **圆角**：沿用模板的 `--corner-radius: 10px`，现有 8px 面板会略圆。
- 品牌常量（`@ddu/brand` 的 `BRAND_NAME`、`BRAND_COLORS.primary`）同步改为 `Ddu`、`#cc7d24`。

## 4. 组件对照

迁移窗口时按此表选组件。`@ddu/ui` 按子路径导入（例如 `@ddu/ui/switch`），不从根入口导入。

| 现有 Vue 组件 / 写法                            | `@ddu/ui` 对应                                                              | 说明                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `components/Button.vue`（`btn-solid` 等）       | `button`                                                                    | `variant="primary"` 对应 `btn-solid`；`anim` 点击动画不迁移（设计系统按钮自带按压态）           |
| `components/Toggle.vue`                         | `switch`                                                                    | 受控：`checked` + `onCheckedChange`，同时修复 Toggle 自带内部状态导致取消确认后显示不同步的问题 |
| `components/Checkbox.vue`                       | `checkbox`                                                                  | 支持半选状态，对应历史库的“全选”                                                                |
| `<select class="select-settings">`              | `select`                                                                    | —                                                                                               |
| 一排互斥按钮（截图延时 `delay-btn`）            | `toggle-group`（单选）                                                      | —                                                                                               |
| `<input class="input-base">`                    | `input`；带按钮时用 `input-group`                                           | —                                                                                               |
| `components/DirectorySelector.vue`              | 应用内组合：`input-group` + `button`，调用 `@ddu/native` 的 `pickDirectory` | 含数据调用，不进 `@ddu/ui`                                                                      |
| `.liquid-glass.liquid-glass-panel` 面板         | `card` + `surface-glass`                                                    | —                                                                                               |
| `<div class="h-.5px bg-border">` 分隔线         | `separator`                                                                 | —                                                                                               |
| 设置行（标签 + 说明 + 控件）                    | `field`（`Field`、`FieldLabel`、`FieldDescription`、`FieldContent`）        | 设置窗口的主要布局单元                                                                          |
| 页面分区                                        | `layout/section`、`layout/section-header`                                   | —                                                                                               |
| 快捷键显示                                      | `kbd`                                                                       | 录制交互由应用实现                                                                              |
| 错误提示（`text-red-500`）                      | `field` 的 `FieldError`；窗口级用 `alert`                                   | —                                                                                               |
| 原生 `confirm()`（`@tauri-apps/plugin-dialog`） | **保持原生对话框**                                                          | 与现状一致；不改用 `alert-dialog`                                                               |
| 图标（内联 SVG）                                | `lucide-react` / `@ddu/iconography`                                         | —                                                                                               |

`@ddu/ui` 中找不到对应、且会被两个及以上窗口复用的展示组件，加到 `@ddu/ui` 并补 Storybook story；只在一个窗口里用的组合，留在该窗口目录。

## 5. 设置窗口的界面结构（本轮参考实现）

设置窗口按现有六个分区还原，每个分区一张卡片，分区内每个设置项一行 `Field`：

| 分区   | 设置项                                                       | 数据来源（`@ddu/native`）                                                                                                                 |
| ------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 通用   | 开机自动启动                                                 | `autostart.*`                                                                                                                             |
| 存储   | 截图保存路径                                                 | 设置键 `screenshot_path`、`pickDirectory`                                                                                                 |
| 截图   | 默认延时（分段按钮）、包含鼠标指针、文件命名模板（失焦保存） | `capture_delay`、`include_cursor`、`naming_template`                                                                                      |
| 快捷键 | 全屏、区域、窗口、截图识字                                   | `hotkey_*`；保存后调用 `apply_shortcuts`，失败时在该行显示错误并保留输入                                                                  |
| 历史   | 保留期限、自动清理、OCR 文字索引、清空历史                   | `history_retention_days`、`history_cleanup_enabled`、`ocr_index_enabled`；`clear_ocr_index`、`list_history_items`、`delete_history_items` |
| 诊断   | 点击“运行检查”后列出权限与平台能力                           | `get_diagnostics_bundle`（返回值已包含 capabilities 与 permissions）                                                                      |

所有文案与现有界面完全一致。现有 `WindowState.vue`（保存/恢复窗口尺寸按钮）没有被设置窗口引用，属于死代码，不迁移。

## 6. 不变量

| #   | 不变量                                       | 验证                                                                                                                                                                                                   |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U1  | 品牌差异只在 `brand.css` 与 `@ddu/brand` 中  | 代码评审；复制来的模板文件若有修改，文件头必须有“ddu 修改”注释                                                                                                                                         |
| U2  | 已迁移窗口不手写基础控件                     | `apps/desktop/src/windows/**` 中不得出现原生 `<button>`、`<input>`、`<select>` 元素：lint 规则（`no-restricted-syntax` 对 JSX 元素名）或测试扫描；截图遮罩例外，见 [99 D14](./99-key-decisions.md#d14) |
| U3  | 亮色、暗色都可用                             | `@ddu/ui` 的 Storybook 主题切换；窗口人工核对清单（[12 § 6](./12-desktop-shell.md#6-人工核对清单每个窗口)）                                                                                            |
| U4  | 每个 React 入口都导入 `@ddu/styles/base.css` | 沿用模板的 `packages/styles/src/base.test.ts`，把 ddu 的入口加入 `HOST_ENTRIES`；截图遮罩例外，见 [99 D14](./99-key-decisions.md#d14)                                                                  |

## 7. 交叉引用

- ← 依赖：[10](./10-workspace-layout.md)、[12](./12-desktop-shell.md)
- → 被引用：[91](./91-impl-plan.md)
- ↔ 现有功能规格：[07](./07-settings-platform-packaging.md)（设置分类 SET-001）
- ↔ 模板：`vp-monorepo/packages/ui/README.md`、`vp-monorepo/packages/tokens/src/semantics.css`
