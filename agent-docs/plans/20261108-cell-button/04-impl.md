# 实施记录

基线：branch dev @ e6354ee。模式：直修（设计输入 = 探索报告定位事实 + 派发追加约束）。行为验收对应 00-task A1–A4。

## A3 门控实现（派发指定"实现方式自定"）

双层门控，覆盖派发指出的时序风险（编辑格 pointerdown 先 commit 再走 click 决策链）：

- 绘制门控：`paintCellButton` 首行 `isSamePoint(state.editingCell, hover)` → 被编辑格不绘制（`paintState.editingCell` 为既有事实，use-paint-state.js:92 每次绘制同步）。
- 命中门控：`isCellButtonHit` 前置两道 `isEditingCell` 谓词（复用 hit-test.js:159-163，本轮导出）：
  - `editingCell`（壳 editingCellRef 快照）——编辑中格不命中（覆盖 pointermove 光标路径与 click 时 watcher 尚未 flush 的情形）；
  - `committedEditCell`——本手势 pointerdown commit 的被编辑格快照，覆盖 watcher 已在 pointerdown 与 click 之间的微任务中清空 editingCellRef 的情形。
- 快照链：`resolvePointerdown`（hit-test.js）扩展入参 `editingCell`，返回 `committedEditCell`（commit 前求值）；`usePointer.onPointerDown` 存入闭包，经新 host 键 `getCommittedEditCell` 暴露，`tryCellButtonClick` 消费。每次 pointerdown 重置（无编辑手势 = null），无跨手势残留。
- 两条路径（watcher 已清 / 未清 editingCellRef）下被编辑格按钮均不可触发；其他格不受影响（committedEditCell ≠ 命中格）；退出编辑后下一手势即恢复。合并区域：hover/click 命中均经 resolveSpanCell 归一为锚格坐标，与 editingCell（锚格）同口径比较。

## 改动文件

（步骤号 = 派发实施要求条目；A1 = 需求① 改名全集，A3 = 需求③ 编辑态隐藏）

src：
- `src/components/table/ex/interaction/cell-button.js` — mv 自 edit-button.js（步骤2/A1）；`isCellButtonHit` + `cellButton.icon` 键 + A3 命中门控（步骤3/A3）
- `src/components/table/ex/interaction/hit-test.js` — A3：导出 `isEditingCell`；`resolvePointerdown` 增 `editingCell` 入参与 `committedEditCell` 返回
- `src/components/table/ex/composables/use-pointer.js` — A1：import/`applyItemCursor` 改名；A3：`editingCell` 光标门控、`committedEditCell` 闭包快照 + host 键 `getCommittedEditCell`；`@host-writes/@host-calls` 注解同步（host 审计口径）
- `src/components/table/ex/composables/use-cell-click.js` — A1：`tryCellButtonClick`、emit `'cell-button-click'`；A3：门控接线（editingCell + committedEditCell）；`@host-calls` 注解同步
- `src/components/table/ex/table-ex.vue` — A1：emits `'edit-button-click'` → `'cell-button-click'`
- `src/components/table/ex/table-paint/paint-overlay.js` — A1：`paintCellButton`/`cellButtonRectOf`/`CELL_BUTTON_*`；A3：绘制门控（isSamePoint）
- `src/components/table/ex/editing/editor-geometry.js` — A1：`editButtonRectOf` → `cellButtonRectOf`、`CELL_BUTTON_AREA`
- `src/components/table/ex/shared/constants.js` — A1：`EDIT_BUTTON_AREA/EDIT_BUTTON_ICON_SIZE` → `CELL_BUTTON_AREA/CELL_BUTTON_ICON_SIZE`
- `src/components/table/ex/editing/editor.js` — A1：头注释符号名
- `src/components/table/column-types/icon.js` — A1：注释 `paintCellButton / isCellButtonHit`
- `src/components/table/ex/cell-paint/icon-image.js` — A1：注释 `paintCellButton`

demo：
- `demo/src/data/table-ex/main-view.vue` — A1：`@cell-button-click`/`onCellButtonClick`/日志标签/列配置键 `cellButton`（L471,476）/注释
- `demo/src/data/table-ex/self-checks/painter.js` — 步骤2/A1：import `cellButtonRectOf`、绘制用例名/断言/夹具（`cellButton` 键、`cellBtnProbe` 探针名）同步
- `demo/src/data/table-ex/self-checks/editor.js` — 步骤2/A1：import、`cellButtonRectOf` 几何 4 例、`cellButton` 门控用例（`cellGateProbe`/`noRegCell` 探针名）
- `demo/src/data/table-ex/self-checks/cell-painters.js` — 步骤2/A1：注释与 `resolveIconEntry` 用例名

需求②（图标仅已安装）：无代码改动（探索证实现状满足 + 派发步骤1）。

中文注释中描述本特性的"编辑按钮"措辞随改名同步为"格按钮"（仅限已改文件内，保持代码自文档一致性）。

## 偏离

无。

## 自检

- `grep -rniE "edit[-_]?button" src demo/src` → 零命中（exit 1）。口径宽于验收（含 `EDIT_BUTTON`/`edit_button` 变体）→ A1 达成。
- `eslint src demo/src`（全局 8.57.0）→ 9 errors / 28 warnings。9 errors 定位：table-ex-benchmark/main-view.vue:506-510（本次未改文件）、table-ex/main-view.vue:347,349 与 painter.js:1259,1269（`git diff @@` hunk 分别为 46-53/465-480/1190-1200 与 12-19/24-31/1131-1168/1172-1179/1181-1188，报错行均不在 hunk 内）→ 全为存量，本次 0 新增 → A4 eslint 部分达成。
- `node scripts/table-ex-structure-check.mjs` → OK（46 文件零纯转发 re-export）。
- `node scripts/table-ex-host-audit.mjs` → OK（10 composables host 键声明零缺失；本轮改动的 use-pointer/use-cell-click 注解通过）。
- `npm run build` → exit 0（ex-development + ex-production 两次 vite build 均成功）→ A4 build 部分达成。
- self-checks 漂移核查：格按钮绘制用例夹具无 `editingCell`（undefined 经 `== null` 归一为 null，门控放行）；veil 用例（painter.js:999-1046）列集无 cellButton，与门控无交集 → 既有断言不受 A3 影响。

## 遗留

- 浏览器运行时验证（A2 页内 self-checks 回归 + A3 行为验证 + demo 无运行时报错）归验证槽位（00-task 流水线：free 验证）；demo 服务可能未运行，届时按 00-task 标 UNVERIFIED 环境阻塞。
- 文档三处仍用旧名（本次禁改，decisions 已确认接受暂不一致）：`docs/quick-reference_components.md`、`docs-site/components/table-ex.md`、`skills/mussel-ui/references/components/data.md`。
- 知识库 `agent-docs/knowledge/project/table-ex-structure-map.md` 引用旧名（§2 `INTER -.->|edit-button|`、§4.2 click 链 `isEditButtonHit → emit edit-button-click`、§6.3 `interaction/edit-button.js`），按该文件自身规则需同步更新——归任务收尾知识沉淀环节。
