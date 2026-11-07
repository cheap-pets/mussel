# 任务：table-ex 结构优化重构（自由控制流水线）

## 目标

按 `02-design.md`（原 design.md 副本）实施 table-ex 代码结构优化（O1–O8，批次 1–3），
提升 agent 检索与分析效率。本流水线为**自由控制模式**：无预设档位，调度者按用户逐批
追加的步骤派发，每步返回后停下等用户决策。

## 基线（2026-11-06 git status --short 快照）

```
 M agent-docs/knowledge/INDEX.md
 M agent-docs/knowledge/project/table-ex-overlay-clip-body-area.md
 M demo/src/data/table-ex/self-checks/painter.js
 M src/components/table/ex/composables/use-pointer.js
 M src/components/table/ex/table-paint/paint-overlay.js
?? agent-docs/knowledge/project/table-ex-hover-span-region.md
?? agent-docs/plans/20261106-ex-fixed-select-hover-span/
?? agent-docs/plans/20261106-table-ex-structure-design/
```

注：use-pointer.js / paint-overlay.js / demo painter.js 的未提交改动属前一任务
（20261106-ex-fixed-select-hover-span），本任务实施时避开或经用户裁决。

## 验收标准

1. 每批次实施后 `npm run build` 通过、demo self-checks 全量像素断言通过。
2. 行为冻结：重构前后探针基线逐字比对（知识库 table-ex-refactor-frozen-probe 流程）。
3. demo self-checks 12 文件 import 与源码移动/改名同批同步。
4. 不改变组件对外 API（props/emits/defineExpose/事件时序）。

## 验证命令

- `npm run build`
- demo 自检页 `http://localhost:3000/data/table-ex-self-checks/`（watch 模式已运行则直接访问）

## 预设与开关

- 流水线：自由控制（临时组合，逐步追加；不套用 lite/standard/strict）
- 实施粒度 / 修订上限等：随用户逐批指令设定，记入 decisions.md
- 槽位映射：primary=pipeline-primary；peer=pipeline-peer；fast=pipeline-fast（均可用）

## 预算

- 用户已确认步骤（本轮追加，预授权整段）：primary 修订 → peer 最终修订 → (fast 实施 → fast 检验)×2（n≤2，第 2 轮视第 1 轮验证结果定为批次 2 或修复）
- 当前预估派发数：7（1 已用 + 1 设计修订 + 1 最终审改 + 4 实施/验证；上限 = ceil(7×1.5) = 11）
- 设计修订 k/N：1/∞（自由控制，按用户指令）
- 回设计/回方案 j：0；修复轮：无
- 派发 d：9/11（终态）
- 修复轮 批次2A：1/2（复验 PASS，闭环）

## 输入文件

- 设计：`02-design.md`（待修订）；结构底图：`structure-map.md`（数据支撑，只读）
