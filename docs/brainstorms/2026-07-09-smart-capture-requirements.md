---
date: 2026-07-09
topic: smart-capture
---

# 智能吸附截图:区域截图自动捕获窗口与页面内容模块

## Summary

把区域截图从「shell 出去调 `screencapture -i`、一切交给系统」升级为自建冻结快照 overlay:触发后先冻结鼠标所在屏,用户悬停时自动高亮鼠标下的**页面内容模块**(macOS Accessibility 元素),滚轮沿 AX 父链向上扩大到工具栏、面板,顶层即**整个窗口**;点击/Enter 即截取高亮矩形,拖拽仍可手动框选。⌘⇧S(区域)与 ⌘⇧W(窗口)两个入口合并到同一 overlay,只差初始粒度。无辅助功能权限时静默降级为窗口级吸附。落地 specs/01-capture-engine.md 中 CAP-004(窗口悬停高亮)与 CAP-002 的基础交互,并为 CAP-005 冻结模式打下地基。

---

## Problem Frame

当前 `capture_select`(src-tauri/src/platform/mac/screenshot.rs)只是调用 `screencapture -i`,框选交互、窗口识别全部由系统接管,App 只拿到最终 PNG:

- 无法实现 spec 已定义的 CAP-002(选区交互)、CAP-003(放大镜)、CAP-004(窗口悬停高亮)——系统交互没有任何钩子。
- 「自动识别页面内容模块」(如 Snipaste 自动框选按钮/卡片/区块)在 macOS 上只能靠 Accessibility API(`AXUIElementCopyElementAtPosition` + `AXFrame`),`screencapture` 这条路完全给不了。
- 现有窗口截图(⌘⇧W)靠 osascript 模拟 ⌘Tab 再 `screencapture -iw`,是脆弱的 hack。

代码基础已经存在:`xcap 0.9`(窗口/显示器枚举与像素捕获)、`core-foundation` + `objc`(AX 权限检查 `check_accessibility_permissions` 已实现)、动态建窗套路(src-tauri/src/window.rs)。

## Key Decisions

逐项与用户确认过:

1. **范围:智能吸附核心。** 自建 overlay + 基础拖拽框选 + 悬停自动高亮(窗口 + AX 模块)+ 点击/Enter 捕获 + Esc 取消。放大镜(CAP-003)、键盘 1px 微调、Shift 等比(CAP-002 完整集)**明确留到下一轮**。
2. **粒度交互:默认最深模块,滚轮向上扩。** Snipaste 手感——鼠标下自动高亮最深 AX 元素;滚轮沿父链扩大(按钮→工具栏→整窗),链顶=窗口。一套交互统一两种粒度。
3. **权限策略:静默降级 + 轻提示。** 无辅助功能权限或目标 App 不暴露 AX 时自动退到窗口级吸附;overlay 角落给可点的提示 chip 跳系统设置。截图流程永不被权限弹窗打断。
4. **入口整合:替换区域 + 窗口两入口。** ⌘⇧S → overlay(auto 模式);⌘⇧W → 同一 overlay(window 模式,初始锁窗口级)。删除 osascript 模拟按键 hack。
5. **多屏:仅鼠标所在屏。** overlay 只覆盖触发时鼠标所在显示器,跨屏留到下一轮。
6. **架构:冻结快照(方案 A)。** 进 overlay 先截全屏当不透明背景,确认后从内存快照裁剪出图。零闪烁、overlay 永不污染成品、暗化遮罩随便画、天然是 CAP-005 冻结模式的地基。业界(Snipaste/CleanShot/Xnip)同构。否决:B 透明实时 overlay + 事后补截(时序 hack、有闪烁与残影风险、无法做暗化遮罩);C ScreenCaptureKit 排除自身窗口(需新写 SCK 绑定,原生代码量与风险超出本次范围)。

## Architecture

### 数据流

```
⌘⇧S / ⌘⇧W / 托盘按钮
        │
        ▼
[Rust] smart_capture_start(mode)
  1. 定位鼠标所在显示器
  2. xcap 截该屏全图 → 存内存 Snapshot 状态(冻结)
  3. CGWindowList 枚举该屏窗口(z 序),缓存;排除本 App 窗口
  4. 检查 AX 权限 → axAvailable
  5. 建 overlay WebviewWindow(无边框、置顶、盖满该屏),背景显示快照
        │
        ▼
[前端 overlay] 悬停/滚轮/拖拽
  mousemove(节流~30ms)→ invoke hit_test(x,y)
       → 返回 AX 父链矩形数组 + 窗口矩形
  滚轮 → 前端在父链内上下移动,不重发 IPC
        │
        ▼ 点击 / Enter / 拖拽松手
[Rust] smart_capture_finalize(rect)
  内存快照裁剪 → 复用现有保存管线(目录/文件名/历史事件)
  → 关 overlay → 清状态
  (Esc → smart_capture_cancel,同样清干净)
```

窗口列表在冻结时缓存一次:画面已冻结,窗口后续移动本就不该反映,故窗口级吸附完全离线、零延迟。AX 查询是活的——冻结后目标窗口若被移动,模块框可能与画面错位,**记为已知边界**(截图期间移动窗口是极端行为)。

### Rust 端(新模块 `smart_capture`,mac 实现放 platform/mac/,沿现有结构)

| 命令 | 入参 | 返回 | 说明 |
|---|---|---|---|
| `smart_capture_start` | `mode: "auto"\|"window"` | `{ monitor, scaleFactor, axAvailable, snapshotUrl }` | 冻结 + 建 overlay |
| `smart_capture_hit_test` | `x, y`(全局逻辑坐标) | `{ chain: [{rect, role, label}], appName }` | 一次返回整条链 |
| `smart_capture_finalize` | `x, y, w, h` | `CaptureResult{ path, … }` | 内存裁剪 + 现有保存管线 |
| `smart_capture_cancel` | — | — | 关 overlay、丢快照 |

**hit_test 父链算法**:

1. `AXUIElementCopyElementAtPosition(systemWide, x, y)` 取最深元素;
2. 沿 `kAXParent` 向上爬,每层读 `AXFrame`;矩形与上一层相同则跳过(去重);深度上限 12;
3. 链尾强制追加缓存的 CGWindowList 窗口矩形(窗口级永远可用、永远是链顶);
4. AX 不可用/查询失败 → 链内只有窗口矩形(即静默降级);
5. AX 调用放 `spawn_blocking`;前端 in-flight 守卫(上一发未回不发新的),防慢 App 卡交互。

**坐标系约定(唯一规则)**:所有 IPC 一律用全局逻辑坐标(point,主屏左上原点)——CGWindowBounds、AXFrame、鼠标位置天然同空间,零转换。仅在 finalize 裁剪时做一次 `(rect − monitor.origin) × scaleFactor` 转快照像素坐标,并 clamp 到快照边界。此换算为纯函数,单测覆盖 1x/2x 与屏原点偏移。

### 前端(新页面 `src/pages/capture/`,vite 多入口 +1)

`CaptureOverlay.vue` 状态机:

```
hovering(默认)── mousedown+移动>4px ──▶ dragging ── mouseup ──▶ finalize(手动框)
   │ ▲                                   (拖拽期间吸附关闭,显示手动矩形+尺寸)
   │ └ mousemove(节流)→ hit_test,默认高亮链头(最深模块)
   │   滚轮上 → 链 index+1(扩大);滚轮下 → index−1;移到新元素 → 重置到最深
   ├── click / Enter ──▶ finalize(当前高亮矩形)
   └── Esc ──▶ cancel
```

渲染:快照 `<img>` 打底 → 全屏半透明暗化遮罩以 SVG mask 在高亮矩形处开洞 → 高亮描边 + 底部标签(尺寸 · App 名 · 元素 role)。`mode:"window"` 初始锁链尾(窗口级),滚轮向下可进模块;两入口共享全部代码,只差初始 index。

## Requirements

- **R1 冻结快照**:触发后立即截取鼠标所在屏为内存快照,overlay 以其为不透明背景;成品图必须且只能由该快照裁剪产生。
- **R2 模块级吸附**:有辅助功能权限时,悬停自动高亮鼠标下最深 AX 元素;滚轮沿父链切换粒度;链顶为窗口。
- **R3 窗口级吸附**:基于冻结时缓存的 CGWindowList(z 序命中、排除本 App 窗口),无 AX 时仍完整可用。
- **R4 手动框选**:mousedown 拖拽 > 4px 进入手动模式(吸附关闭),松手即截;实时显示尺寸。
- **R5 捕获与取消**:click/Enter 截当前高亮;Esc 取消;宽或高 < 2px 的矩形忽略不出图。
- **R6 入口**:⌘⇧S=auto 模式、⌘⇧W=window 模式,共用 overlay;删除 osascript hack;`capture_screen`(全屏)与 `capture_delayed`(延时,底层仍走 `screencapture`)不受影响。
- **R7 降级与权限**:录屏权限缺失 → 不进 overlay,走现有 `open_screen_capture_preferences` 引导;AX 缺失 → 窗口级吸附 + 角落提示 chip 跳辅助功能设置。
- **R8 生命周期健壮**:`start` 时若已有存活 overlay 先 cancel 再建(快捷键连按不出双 overlay);一切 Rust 错误路径必须关 overlay + 清快照,不允许用户被冻结画面卡住;hit_test 失败静默回退窗口矩形。
- **R9 保存管线复用**:输出走现有目录/文件名/`CaptureResult`/历史事件路径,历史页与预览浮窗行为与现有截图一致。

## Acceptance Examples

- 在 Safari 页面上按 ⌘⇧S:鼠标移到一个按钮上,按钮被精确高亮;滚两下滚轮,高亮先扩到工具栏再扩到整个 Safari 窗口;按 Enter,得到高亮区域的截图,历史里出现该条目。
- 关闭辅助功能权限后按 ⌘⇧S:悬停只高亮整窗,角落出现「开启辅助功能可识别页面模块」chip;点击 chip 打开系统设置对应页;截图流程全程无弹窗打断。
- 按 ⌘⇧W:进入即高亮鼠标下整窗,点击即得窗口截图(不再出现 ⌘Tab 切换动画)。
- 在 Retina 屏与 100% 外接屏各截同一窗口:成品图与高亮框所示区域逐像素一致,无偏移、无缩放错位。
- 快速连按 ⌘⇧S 三次:屏幕上始终只有一个 overlay,Esc 一次即可退出。

## Success Criteria

- 悬停高亮跟手(节流 30ms 下无可感知卡顿;慢 AX App 下窗口级高亮先行,不阻塞)。
- AX 可用时,常见 App(Safari/Chrome/Finder/系统设置)的按钮、工具栏、侧栏可被逐级选中。
- 成品图在 1x/2x 屏上与所选区域完全一致(clamp/换算单测 + 手动验收)。
- ⌘⇧S/⌘⇧W 原有用户流程(截图→历史→预览浮窗)不回归。

## Scope Boundaries

**明确不做(本轮)**:

- 放大镜与像素辅助(CAP-003)、键盘 1px 微调、Shift 等比锁定、选区二次调整(创建后移动/改尺寸)——下一轮 CAP-002 完整化。
- 跨屏/多显示器 overlay(仅鼠标所在屏)。
- 滚动截图、多窗口批量捕获(spec 已注明非 MVP)。
- Windows/Linux 平台(mac only,沿 platform/ 结构留接口)。
- 冻结模式的 UI 状态提示(CAP-005 完整实现时再做)。

**已知边界**:冻结后移动目标窗口,AX 模块框与冻结画面可能错位;受保护窗口(如 DRM 视频)快照区域为黑属系统行为。

## Dependencies / Assumptions

- 依赖零新增:`xcap 0.9`(冻结截屏)、`core-foundation`/`objc`(AX FFI,权限检查已有)、现有动态建窗与保存管线。
- AXUIElement 相关函数(`AXUIElementCreateSystemWide` 等)需手写 extern "C" 声明,与现有 `check_accessibility_permissions` 的 dlsym 风格一致或改为直接 link ApplicationServices。
- 浏览器网页模块依赖浏览器自身的 AX 暴露(Safari/Chrome 开启辅助功能后暴露网页元素),不做浏览器专门适配。

## Testing

- **cargo 单测(CI)**:逻辑↔像素换算(1x/2x、屏原点偏移)、裁剪 clamp、父链去重。
- **cargo 集成测(`#[ignore]`,本机手动)**:真实 AX hit_test 对 Finder 返回非空链;CGWindowList 枚举排除自身窗口。
- **手动验收清单**:Retina/非 Retina 无偏移;关 AX 权限走降级;拖拽手动框;滚轮粒度切换;Esc/Enter;⌘⇧W 初始窗口级;连按快捷键单 overlay;截图后历史/预览浮窗正常。

## Outstanding Questions

- AX role → 用户可读标签的映射(底部标签显示"按钮/工具栏"还是原始 role 字符串)——实现时定,不阻塞设计。
- overlay 的 NSWindow level 取值(须盖住 Dock/菜单栏但低于系统关键 UI)——实现时按 CGShieldingWindowLevel 附近调。

## Sources / Research

- 勘探结论(本会话两次代码勘探):capture 链路 src-tauri/src/platform/mac/screenshot.rs:108(`screencapture -i`)、xcap 窗口枚举 src-tauri/src/cmd/xcreenshot.rs:36、AX 权限检查 screenshot.rs:228、动态建窗 src-tauri/src/window.rs。
- specs/01-capture-engine.md:CAP-002(46-55)、CAP-003(57-63)、CAP-004(65-72)、CAP-005(74-78)、缩放精度要求(182)。
- 同类产品行为参照:Snipaste(粒度爬升)、CleanShot X / Xnip(冻结快照架构)。
