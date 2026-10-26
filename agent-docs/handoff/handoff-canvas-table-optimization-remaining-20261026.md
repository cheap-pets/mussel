# Handoff

## Goal

依据 `agent-docs/plans/canvas-table-optimization/canvas-table-optimization.md`（优化方案）与 `canvas-table-optimization-review.md`（复核，优先级以其修正版为准）实施 canvas-table 性能与复杂度优化。本会话完成阶段 0 + 阶段 1 + 验证设施；本文档重点交接**未实施项**及其门控条件、本次实测裁决依据。

## Current State

已完成并验证（工作区未提交，`git diff` 可见全部改动）：

- **阶段 0**：① 估高扫描输入签名拆分（三类维度：行集合引用 / 列计数语义签名 / 高度度量签名，均未变则跳过全量扫描）；② placeholder 剥离出 `preparedColumns`（绘制期第三级兜底）；③ hover 脏区去重（N1）。
- **阶段 1**：P0-1 共享 `text-wrap.ellipsize`（二分 + 缓存 + 返回宽度，覆盖全部 8 个测量点，表头同源）；P0-2 `paintFixedArea` 行区间收敛。
- **验证设施**：`getLayoutInfo().lastRelayout = { elapsed, scanCount, rebuild }` + demo 调试面板显示。

实测（10 万行、Playwright 前台）：fixedLeftColumns 变更 114–262ms → **0.4ms**；refreshTheme 115–120ms → **0.6ms**；长 CJK 滚动帧 measureText 13140 → 22(冷)/0(热)、lastPaint 9.1ms → 0.8ms；hover 同行换列重绘 2 → 1 次；fixed=8 时 hover 移动 measureText 389 → 0。回归：自检面板 144/144 ×2 轮、树 toggle 对称、编辑链路全通、placeholder 三级兜底像素验证、`npm run build` 通过。

## Key Context

新 agent 读代码/两份方案文档无法获知的信息：

1. **复核文档一处判断已修正**：复核称估高「与列宽、字号、行高全部无关」——错误。估高**行数**与列宽/字号无关，但行高公式 `max(rowHeight, padding×2 + lines×lineHeight)` 依赖 rowHeight/cellPadding/cellLineHeight，故高度度量变化必须重扫（否则 `--row-height` 48px 覆盖夹具拿到全旧高度）。已按修正版实现（`metricsSig` 进扫描签名），后续做 C1 拆分时不得回退此维度。
2. **阶段 2 profile 裁决已完成：P1-1 / P1-2 均不启用**。本次实测滚动帧 lastPaint 0.4–1.4ms，距 8ms 绘制阈值 5× 以上（与复核判断一致）。除非未来场景变化重新 profile，不要实施。
3. 本次在 `canvas-table.vue` 新增的函数是 C1 拆分时必须整体迁入 controller 的：`estimateColumnSignature` / `upgradeRowGeometryMode` / `syncMeasuredHeightCache` / `mergeMeasuredHeights` + `lastScan*` 四个状态变量 + relayoutAndRedraw 内扫描块。C0 要求的 `scanSignature / measureSignature / mode` 三字段显式化即以这些为素材。
4. C2 的「ellipsize 双实现合一」**已完成**（`text-wrap.ellipsize` 单一实现，painter 表头经 `headerMeasureOf` 优先 `state.measure` 同缓存）。text-wrap 内 `DOTS` 已更名 `ELLIPSIS`；cell-painters 仍有独立 `DOTS`（数组/link 超限条目字面），属 C2 剩余项。
5. 复核建议的两条机器断言（hover 单次移动 setTransform ≤ 1、100k variable fixedLeft 同步耗时 < 20ms）**未加入自检**，原因：计时断言跨机器 flaky；两项已由本次 Playwright 验证覆盖。若要补，hover 计数断言需在自检 harness 同步执行约束下做原型劫持。
6. `demo/src/common/style.css` 的修改是本任务开始前已存在的工作区改动，与本任务无关，勿动、勿一并提交。
7. demo watch（3000 端口）由本会话后台启动，会话结束后可能终止；重启命令 `npm run demo:build`。
8. 性能验证方法论已沉淀：`agent-docs/knowledge/patterns/canvas-table-performance-profiling.md`（原型劫持计数 + props 直替 + lastRelayout 归因 + 三陷阱）。

## Changed Files

- `src/components/canvas-table/canvas-table.vue` — 阶段 0 全部 + lastRelayout
- `src/components/canvas-table/cell-painters.js` — P0-1 调用点 + placeholder 兜底
- `src/components/canvas-table/painter.js` — 表头 ellipsize 同源、paintFixedArea 行区间、placeholder 透传
- `src/components/canvas-table/text-wrap.js` — 共享 `ellipsize` 导出
- `demo/src/data/canvas-table/main-view.vue` — 调试面板 lastRelayout 行
- `.gitignore`（+.playwright-mcp/）、`agent-docs/knowledge/INDEX.md` + 新 pattern 文件

## Next Steps（未实施项详单）

按方案阶段 3 → 4 推进；每项标注依据章节（方案=优化方案、复核=review 文档）与本会话新增信息。

### 阶段 3：复杂度清理（前置：本轮基线已稳定，当前即满足）

**C1 壳拆分**（方案 C1，~480 行迁出，`canvas-table.vue` 现 ~1560 行）
- `createRowGeometryController`（row-geometry.js 或新文件）：吸收 Key Context #3 列出的全部新增函数 + 既有 5 块（measuredRowHeights/估高混入/模式升级/rebuild/remeasureVisibleRows/remeasureRow/锚定补偿）。
- `useColumnResize` composable（~90 行）：startResize/applyOverrideGeometry/widthOverrides/clickGuard 接线。
- `useTreeRows` composable（~140 行）：childrenIndex/flatRows/treeExpanded/toggle/expandAll/collapseAll/树 watch。
- 风险：接线面广，逐块迁移 + 自检面板全程 144/144 护航。

**C2 镜像常量收拢**（方案 C2 六项中剩五项 + 复核 C2 扩充三项）
- `isExpandedKey` ×2（painter.js / cell-painters.js）→ 提公共小函数（tree.js 或 utils）。
- `TREE_INDENT` ×3（row-geometry 导出 / interactions / cell-painters）→ 统一 import row-geometry。
- 树箭头三角坐标 ×2（cell-painters.drawTreeAffordance / painter.paintTreeArrowAccent）→ 短期抽 `drawTreeArrow(ctx, x, centerY, expanded, color)`；中期评估 hover 取色下沉分区 1 删 overlay 镜像。
- `cellFontOf` ×3（cell-painters / row-geometry / painter.headerFontOf）→ 共享（接受 theme 快照入参）。
- check 方框绘制 ×2（painter.drawHeaderCheck / cell-painters.drawCheck）→ 保留并注释互指，不强合。
- 复核扩充：`CHECK_SIZE/RADIUS/FONT_SIZE`（painter/cell-painters）、`FALLBACK_PADDING`（painter/cell-painters/interactions 的 CELL_PADDING_FALLBACK）、`ELLIPSIS/DOTS`（cell-painters 的 DOTS + text-wrap 的 ELLIPSIS 同值）。

**C3 死代码清理**（复核扩充后的 8 项清单）
- `interactions.resolveResizeDirty`、`resolveHoverDirtyRects`（仅自检消费）；`tree.buildFlatRows` 的 `parentKeys` 输出（无生产消费方）；`editor.resolveEditorComponent`、`cell-painters.getImageEntry`（仅自检）；`layout.COL_FALLBACK`（仅注释引用）；`paintState.tree`（painter 从不读）；`theme` 快照 `controlHeight`（仅自检断言存在性）。
- 处置口径：连同自检断言一并删，或标注 `self-check only`。

**C4 uniform 回退删除**（4 处）
- `layout.resolveRowGeometry`、`painter.rowGeometryOf` WeakMap 兜底、`editor.computeEditorStyle` 内联回退、`layout.rowAt` 等高分支。
- 硬约束（复核确认）：`self-checks/layout.js` 直接以参数调用 `computeViewRows/rowAt` 的 rowHeight 分支，删分支必须同改自检夹具；`rowGeometryOf` 删除后 `cellRectAt` 需加 rowGeometry 存在性断言。
- C5（注释体量）：方案明确存量不动，仅新增代码遵循。

### 阶段 4：按 profile 结论决定（当前多数无痛点证据）

- **P1-1 滚动自拷贝平移**：不启用（Key Context #2）。若未来重新评估，复核补充的第三条约束勿漏：resizeGuideX 与编辑浮层是 DOM，平移期间需跟随或临时隐藏；另需处理 dpx 整像素对齐、与 pending invalidate 队列合并、img 异步加载格回填。
- **P1-2 单元格 render 缓存**：收益判据是 GC 压力（items/attrs 每帧重建）而非 CPU。若实施：挂 `resolveCellContent` 入口而非 `drawCell` 内部（复核指出 `canvas-table.vue` onClick 的 check 判定路径也调它，挂错位置会出现同一格两套结果）；失效维度 = recordsVersion + 列准备重建 + recordNumber；events 闭包风险已评估（stable emit，安全）。
- **P2-1 估高分片**：降级为「records 替换仍超预算」的兜底。本次实测 records 替换 100k×6 列 = 29ms（改前 93ms），已不构成痛点，预计长期不做。
- **P2-2 缓存全清策略**：两段轮换或动态上限。复核已订正：全清间隔实测 30–50 帧非方案写的 ~7 帧，无实测尖刺，维持最低优先。
- **N2 每格对象分配**：paintCellRange 每格 rect、drawCell options、drawCellClipped itemRects 数组 → 每格复用 rect + 按 (row,col) 复用数组。纯 GC 收益。
- **N4 pointOf rect 缓存**：`getBoundingClientRect` 每次 pointermove 强制同步布局；relayout 末尾缓存、onResize 失效。µs 级收益、零风险。
- **N5 remeasureVisibleRows 行级 measured 标记**：跳过已精算行（record 引用 + 宽度签名）。收益在天花板附近。
- **N6 withImageRelay 每帧浅拷贝 state**：`{...state}` ~30 字段 + onImageLoad 闭包，可与 N2 合并处理。
- 已评估排除勿重做（复核「不建议做」节）：ctx.font 每格重设（50µs/帧）、trimItemHits、recomputeViewWindows 每帧新建 layout、宽度变化后严格单调 rescale。

### 其他待办

- 基线提交：当前改动未提交（用户未要求）。阶段 3 动工前建议先提交本基线，便于回归对照。

## References

- 方案：`agent-docs/plans/canvas-table-optimization/canvas-table-optimization.md`
- 复核（优先级以此为准）：`agent-docs/plans/canvas-table-optimization/canvas-table-optimization-review.md`
- 设计基线：`.pipeline/20261025-editable-table/02-design.md`、`.pipeline/20261023-canvas-table/02-design.md`
- 验证方法：`agent-docs/knowledge/patterns/canvas-table-performance-profiling.md`
- 自检面板：`http://localhost:3000/data/canvas-table/`（144 断言）；编辑链路 `/data/canvas-table-editable/`

## Suggested Skills

- `project-knowledge`（阶段 3/4 完成后若有新沉淀）
- playwright MCP（回归验证；注意前台页 rAF 约束，见知识库 pitfalls）
