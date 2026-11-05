# 任务：table-ex 单元格选中与复制（dev-pipeline，用户指定流水线）

## 目标
为 table-ex 增加单元格选中与复制功能（canvas 表格；代码已按 20261105-table-ex-refactor 任务重构为小模块，在其成果上实施）。

## 验收标准（用户需求原文）
1. 不可编辑列，hover 时显示浅灰色内边框（参考可编辑单元格 hover 时的蓝色内边框），点击后显示蓝色内边框，表示选中该单元格
2. 对于选中的单元格，按 Ctrl + C 可以复制其内容
3. 按钮、开关等图形列单元格，不用复制
4. 键盘上下左右键，可以移动到选中单元格的相邻单元格。无选中单元格时，无需处理

设计须自行裁定并在文档中明确（不得留空进实施）：图形列清单（button/check/icon/img/tag/switch 等按实际列类型定）、复制内容格式、可编辑列行为保持现状不被破坏、选中态清除时机、方向键移动边界（首末行列、冻结列）。

## 约束
- 在 HEAD 9d61316（任务 1 重构后）上实施；设计中注明新增代码归属文件，遵循新目录结构
- 遵循项目代码约定与 knowledge 中 table-ex 相关 convention（命中即采用）
- hover/选中内边框绘制须裁剪到表体区（knowledge: table-ex-overlay-clip-body-area）
- 本任务不提交 commit（用户未要求；实施后保持工作区改动待确认）

## 验证命令 / 环境
- demo：http://localhost:3000/data/table-ex/（watch 模式可能已运行；未运行则 `npm run demo:build`）
- 子 agent 无 playwright mcp：headless Edge CDP（knowledge: headless-edge-dom-verification.md）
- hover/选中边框为 canvas 绘制，像素断言注意锚点口径（knowledge: canvas-pixel-assert-anchor-drift.md）
- 剪贴板验证方案（CDP grantPermissions 或 copy 事件捕获）由设计定

## 项目知识（先读 agent-docs/knowledge/INDEX.md；与本任务直接相关）
- project/table-ex-overlay-clip-body-area.md、project/table-ex-demo-interaction-verify.md
- project/table-ex-relayout-no-remeasure.md、project/table-ex-recordsversion-height-contract.md（选中态随数据更新）
- project/table-ex-item-column-align.md（图形列命中区）、project/table-ex-performance-profiling.md（hover 性能）

## 流水线与槽位（用户指定）
primary 设计 → peer 修订 → primary 最终修订 → (fast 实施 → fast 检验) × n（n≤2）
- designer → pipeline-primary；design-amender → pipeline-peer；implementer / verifier → pipeline-fast
- 评审模型：异构；验证：独立实例；未指定开关按 standard（修复轮 R=2）；无确认门
- n 语义：首轮实施+检验；检验 FAIL → 修复轮（修复+再检验）计第 2 轮；耗尽停下问用户

## 预算
- 派发 d ≤ 11（预估 5：设计 3 + 实施 1 + 检验 1；上限含 1 轮修复余量）
- 修复轮「整体」k ≤ 2

## 基线
git 9d61316 (dev)，`git status --short`：仅 agent-docs/plans/ 下任务目录未跟踪，源码 clean（2026-11-05 建目录时快照）
