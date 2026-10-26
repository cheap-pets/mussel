# Handoff

## Goal

检查当前 canvas-table 实现，从性能与代码实现复杂度两方面提出优化方案（分析类任务，产出评估文档，不改代码）。已完成。

## Current State

- 全量走查 `src/components/canvas-table/` 11 个文件（~6,600 行），方案已落盘：
  `agent-docs/plans/canvas-table-optimization/canvas-table-optimization.md`（P0×2 / P1×2 / P2×2 + C1–C5 + 四阶段实施顺序）。
- 未改任何源码；demo / 自检 / 构建均未触碰（分析任务无验证需求）。
- 后续按方案实施属于新任务，未启动。

## Key Context

- **P0 两项是实施缺口而非设计取舍**：设计（`.pipeline/20261023-canvas-table/02-design.md` A4）采纳的「文本测量缓存」P0 只在 painter.js 表头路径落地，cell-painters.js 的 `ellipsize`（L350）等表体路径直连 `ctx.measureText` 且线性回退——这是最热路径（滚动/hover 帧）最大消耗点，修复无设计争议。
- **P1-1 滚动自拷贝平移**：该方案在 20261023 设计「被拒绝的备选 #5」中已明确列为 profile 后备选，勿当新方案重新论证；启用前置条件 = P0 落地后 `lastPaint.elapsed` 仍持续超 8ms。
- **P0-2 固定列放大**：`paintFixedArea` 在行带/列带/单格/调宽四个脏区入口内对全部可视行重跑 drawCell（clip 省像素不省计算），修复 = 加行区间参数；`bandToX` 不传、遮挡由分区顺序承担的语义须保持。
- **死代码清理陷阱**：`interactions.resolveResizeDirty` / `resolveHoverDirtyRects` / `tree.buildFlatRows` 的 `parentKeys` 输出生产无消费方，但被 `demo/src/data/canvas-table/self-checks/` 断言消费——删除须连同自检断言一起，或标注 self-check only。
- **C1 壳拆分**：canvas-table.vue 1488 行中变高行状态机不变量散在 5 个函数（L267-286 / L456-471 / L583-630 / L677-741 / L1294-1320），拆分迁移须逐块 + 自检面板全程 PASS。
- 用户偏好沿用前序 handoff：溢出字符一律 `'...'`、17 色板、maxLines/maxItems 上限 10。
- 验证设施现成：demo `/data/canvas-table/` 自检面板 9 组 144 断言、100k 行档位、`getLayoutInfo().lastPaint.elapsed` 调试面板；帧感复核必须前台页（后台 rAF 停发，知识库已录）。
- 前序任务（canvas-table-editable-20261026 handoff）遗留的 Next Steps（文档三处同步待用户确认、选型终审、提交推送是否已完成未核实）与本次任务无关，未处理。

## Changed Files

- 新增：`agent-docs/plans/canvas-table-optimization/canvas-table-optimization.md`（本会话唯一产出）
- 新增：本交接文档

## Next Steps

1. 用户确认方案后，按文档「实施顺序」阶段 1 开工：P0-1 ellipsize 二分+缓存、P0-2 固定列带内收敛（低风险，自检面板回归 + lastPaint 前后对比）。
2. 阶段 2 profile 前台执行（demo 100k 档位滚动），据此裁决 P1-1/P1-2。
3. 阶段 3 重构（C1–C4）在阶段 1 行为基线稳定后进行。

## References

- 方案全文：`agent-docs/plans/canvas-table-optimization/canvas-table-optimization.md`
- 行为权威设计：`.pipeline/20261025-editable-table/02-design.md`；性能备选依据：`.pipeline/20261023-canvas-table/02-design.md`（A4 性能措施 + 被拒绝备选 #5）
- 前序交接：`agent-docs/handoff/handoff-canvas-table-editable-20261026.md`

## Suggested Skills

- project-knowledge（实施完成后若有新可复用知识，按 AGENTS.md 时机沉淀）
- dev-pipeline（若阶段 1 起的实施走流水线；pipeline-* 角色限流兜底法见前序 handoff）
