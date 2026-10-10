# ddu 规格索引

规格分两组：

- **产品功能规格（01–07）**：用户可见的功能需求，例如截图、编辑、OCR、录屏。
- **工程架构规格（00、10–13、90–99）**：前端迁移到 React monorepo 的设计与计划。

两组编号互不冲突。架构规格的编号就是建议的阅读和构建顺序。

## 产品功能规格

| 规格                                                                  | 内容                                 |
| --------------------------------------------------------------------- | ------------------------------------ |
| [01-capture-engine](./01-capture-engine.md)                           | 截图引擎：全屏、区域、窗口、智能截图 |
| [02-editor-annotation](./02-editor-annotation.md)                     | 编辑器与标注                         |
| [03-history-workflow](./03-history-workflow.md)                       | 历史库与工作流                       |
| [04-ocr-privacy-ai](./04-ocr-privacy-ai.md)                           | OCR、隐私打码与 AI                   |
| [05-sharing-export-integrations](./05-sharing-export-integrations.md) | 分享、导出与集成                     |
| [06-screen-recording](./06-screen-recording.md)                       | 录屏                                 |
| [07-settings-platform-packaging](./07-settings-platform-packaging.md) | 设置、平台适配与交付                 |

## 工程架构规格：React monorepo 迁移

| 规格                                                  | 类型                   | 回答的问题                                                  |
| ----------------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| [00-prd-react-migration](./00-prd-react-migration.md) | PRD                    | 为什么迁移、做到什么程度算成功、哪些明确不做                |
| [10-workspace-layout](./10-workspace-layout.md)       | 设计                   | 代码放在哪个包、包之间如何依赖、怎么构建和检查              |
| [11-native-bridge](./11-native-bridge.md)             | 设计（契约）           | 前端如何调用 Tauri 命令、订阅事件、读写设置                 |
| [12-desktop-shell](./12-desktop-shell.md)             | 设计                   | 窗口如何组织、迁移期 Vue/React 如何共存、迁移一个窗口的步骤 |
| [13-design-system](./13-design-system.md)             | 设计                   | 用哪些 UI 组件、ddu 品牌如何覆盖、设置窗口长什么样          |
| [90-roadmap](./90-roadmap.md)                         | 路线图（面向负责人）   | 每个里程碑交付什么、何时完成                                |
| [91-impl-plan](./91-impl-plan.md)                     | 实施计划（面向实现者） | 下一步写什么、为什么是这个顺序                              |
| [93-deferred-findings](./93-deferred-findings.md)     | 待办记录               | 实施中发现、延后到后续阶段处理的问题                        |
| [99-key-decisions](./99-key-decisions.md)             | 决策记录               | 每个关键选择的备选方案与理由（D1–D13）                      |

支撑材料：[docs/research/2026-10-10-react-monorepo-spikes.md](../docs/research/2026-10-10-react-monorepo-spikes.md)，即迁移前对关键假设的实测。

### 阅读顺序

1. 新加入的开发者：00 → 10 → 11 → 12 → 13，然后看 91 的当前阶段。
2. 只想知道进度：90。
3. 质疑某个选择：99。

### 构建顺序

```text
00-prd
  └─ 10-workspace-layout ............ Phase 1 / M0  仓库重构
       └─ 11-native-bridge ........... Phase 2       契约
            └─ 12-desktop-shell ...... Phase 2       窗口外壳
                 └─ 13-design-system . Phase 2–3     品牌层 + 设置窗口（M1）
                      └─ 各窗口 ...... Phase 4–7 / M2–M5
                           └─ 移除 Vue  Phase 8 / M6
```

### 当前状态

| 阶段                                 | 状态                                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Phase 0 风险消除                     | ✅ 完成                                                                                              |
| Phase 1 仓库重构（M0）               | ✅ 完成（待人工核对：升级安装后授权保留、GitHub CI）                                                 |
| Phase 2–3 契约、外壳、设置窗口（M1） | ✅ 完成（待人工核对：打包后设置窗口清单，见 [12 § 6](./12-desktop-shell.md#6-人工核对清单每个窗口)） |
| Phase 4–8                            | 待开始                                                                                               |
