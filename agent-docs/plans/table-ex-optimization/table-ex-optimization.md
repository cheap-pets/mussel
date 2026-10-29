# canvas-table 性能与复杂度优化方案

> 依据：2026-10-26 对 `src/components/canvas-table/`（11 文件 ~6,600 行）全量源码走查。
> 基线：`agent-docs/plans/20261025-editable-table/`（02-design.md 为行为权威）、
> `agent-docs/plans/20261023-canvas-table/02-design.md` 被拒绝备选 #5（滚动自拷贝为 profile 后备选）。
> 本文只做评估与方案，未改代码。

## 总体判断

架构无需重构：纯函数模块 + 组件壳编排 + painter 分区脏区管线 + Fenwick 变高几何 +
估高/精算双层行高 + 三缓存注入，层次清晰。优化点集中在三类：

1. 最热路径（滚动帧、hover 帧）存在**未走缓存的重复测量与重绘放大**（P0 两项，低风险高收益）；
2. 两条**设计已预留的备选**（滚动自拷贝、render 缓存类）具备启用条件但需先 profile（P1）;
3. 组件壳 1488 行承载了过多可收拢的状态机与双实现残留（C1–C4）。

---

## 性能项

### P0-1 单行省略 `ellipsize` 未走测量缓存，且为线性逐字符扫描

- 现状：`cell-painters.js:350-358` `ellipsize` 循环 `ctx.measureText(text.slice(0, end) + '...')`
  逐字符回退，O(len) 次未缓存测量。同路径 `drawItemText`（L650）、`drawLinkEntry`（L741）、
  `drawTag`（L709，另有一次重复 measureText L711）、`measureItem`（L620）均直连
  `ctx.measureText`，全部绕过缓存。
- 影响：滚动/hover 每帧对每个截断格执行。CJK 长文本 100 字符截到 10 字 ≈ 90 次测量；
  300 可视格满截断 ≈ 2.7 万次 measureText/帧（量级 10–50ms），是帧预算最大单一消耗点。
- 证据缺口：设计采纳的 P0「文本测量缓存」（20261023 02-design.md A4）仅在 `painter.js`
  落地（`ellipsizeText` L114-123 经 `measureCached`）；最热的表体单元格路径没接上，属实现缺口而非设计取舍。
- 方案：
  1. 前缀宽度单调 ⇒ 二分收缩替代线性回退（O(len) → O(log len)，100 字符 90 次 → 7 次）；
  2. 测量改走注入的 `measure(text, font)`（state.measure，theme.js `createMeasureCache`
     实例），与行高精算/折行共用同一缓存。`drawCell` 已接收 measure，透传到 ellipsize 系即可；
  3. `drawTag` 收敛为一次 ellipsize（宽度 = 测量结果 + padding），消除重复测量。
- 风险：低。纯计算路径替换，demo 自检面板（`/data/canvas-table/` 9 组 144 断言）+
  `lastPaint.elapsed` 前后对比即可验证。
- 备注：缓存 key 含 font，主题切换后旧条目自然失配，无额外失效逻辑。

### P0-2 脏区重绘时 `paintFixedArea` 固定列全高重绘（行带放大 ~25×）

- 现状：`painter.js` 行带/列带/单格/调宽带四个入口（L711 / L745 / L776 / L815）在 clip 内调用
  `paintFixedArea`（L401-419），其内部 `paintCellRange(ctx, state, viewRowsRange(layout), …)`
  对**全部可视行**执行 drawCell（render 函数 + 测量 + 绘制指令），clip 只丢弃像素、不省计算。
- 影响：hover 行带重绘本应 1 行，固定列存在时固定区实际重算 ~25 行 × fixed 列。
  `paintCellRange` 内逐格 `drawCell` → `resolveCellContent` → 用户 render 函数，全部白跑。
- 方案：`paintFixedArea(ctx, state, rowRange)` 增加行区间参数，带内仅画与区间相交的行
  （`bandToX` 不传、遮挡由分区顺序承担的既有语义不变）。
- 风险：低。分区顺序与擦除起点不变；自检面板含 fixed 场景断言可回归。

### P1-1 滚动整幅重绘 → `drawImage` 自拷贝平移（设计预留备选）

- 现状：`scrollFrame`（canvas-table.vue:634-638）每帧 `redraw()` = clearRect + 五分区全量重绘
  （含表头、固定列、overlay）。视口 ≈ 25 行 × 15 列 = 375 格/帧。
- 设计依据：20261023 02-design.md 被拒绝备选 #5 —— 「v1 不做，列为后续 profile 后的
  性能备选」。启用前置条件：**P0 两项落地后 `lastPaint.elapsed` 仍持续超帧预算**
  （60fps 预算 16.7ms，绘制侧留 8ms 阈值）再实施。
- 方案要点：竖滚时仅对表头下区域（含固定列，固定列竖向随内容位移、横绘正确）自拷贝
  `drawImage(canvas, …)` 平移 |Δ|，新暴露条带走既有 `paintRowBand` 管线（先擦除）；
  表头与 overlay（hover 矩形随内容位移后天然正确）不动。需处理：dpx 整像素对齐、
  与 pending invalidate 队列合并、img 异步加载格的回填。
- 收益：滚动帧从 O(可视格) 降为 O(新暴露条带)。

### P1-2 单元格 render 结果缓存

- 现状：`drawCell`（cell-painters.js:244）每帧对每个可视格重跑 `resolveCellContent`
  （L186-198）→ `col._render({ record, recordNumber, value, emit })`（用户函数）并构造
  items 数组。DOM 版表格每格只跑一次。除 CPU 外还产生持续 GC 压力（items/attrs 对象）。
- 方案：`WeakMap<record, Map<colKey, { version, recordNumber, content }>>`；
  失效维度 = `recordsVersion`（异步就地修改通道即失效信号，兼容「records 不 deep watch」
  三通道契约）+ 列准备重建（preparedColumns computed 引用变化）+ recordNumber
  （recordsOffset/树平铺变化）。
- 风险：中。render 产物含 events 闭包（cell-item-click 通道），需确认缓存后闭包仍指向
  当次 emit（壳传 stable emit，理论安全）；demo 有 cell-item-click / dots 断言可回归。
  建议内部实现、无 API 变化，P0 落地后按 profile 结论决定是否启用。

### P2-1 估高全量扫描 O(n×cols) 在 records 替换/树 toggle 时同步执行

- 现状：`relayoutAndRedraw`（canvas-table.vue:506-537）scanDirty 即全量 `computeRowHeights`：
  100k 行 × 20 列 = 2M 次 `_value(record)`（用户函数）+ link 列 render 计数，
  单次 50–200ms 主线程阻塞。uniform 且输入未变时已跳过（lastScan 比对）。
- 设计已权衡：全量精算被拒（首屏秒级耗时），现行 = 估高下界 + 进窗精算 + 单调收敛。
- 可选增强：行数超阈值（如 2 万）时估高分片（首屏同步 + 其余 rAF idle 分片），
  totalHeight 渐进精确、滚动条渐进增长——该观感设计已接受（A2.2）。
  小数据量保持同步路径。复杂度中，仅在确认大数据切换卡顿为真实痛点后做。

### P2-2 缓存全清策略（measure 2000 / wrap 2000 / image 200）

- 现状：三缓存超限整体清空（theme.js:14、text-wrap.js:16、cell-painters.js:49）。
  快速长滚时每 ~7 帧全清 → 重测量突发。设计已拒绝 LRU（过重）。
- 可选：两段轮换清半，或上限按「视口格数 × 10」动态化。低优先，profile 出尖刺再动。

### 不建议动的项（已有决策覆盖）

- 单 canvas 分区绘制、原生滚动容器 + sticky canvas、MutationObserver 暗色感知、
  records 不 deep watch、缓存不做 LRU：均为 20261023 设计显式决策。
- `recomputeViewWindows` 每帧新建 layout 对象：GC 压力可忽略，浅拷贝维持响应式语义清晰。
- y-scrolled class 翻转触发 theme watcher 重读 55 个 computed style：经
  `snapshotsEqual` 门控后不 onChange，频率仅滚动边界 crossings，可忽略。

---

## 复杂度项

### C1 canvas-table.vue 巨壳拆分（1488 行，11 个 watch）

壳内三块自洽状态机可抽离，行为不变、自检护航：

| 抽离物 | 内容 | 行数估计 |
|---|---|---|
| `createRowGeometryController`（row-geometry.js 或新文件） | measuredRowHeights/签名失效/估高混入/模式升级/rebuild/remeasureVisibleRows/remeasureRow/锚定补偿（现散在壳内 5 个函数，不变量靠注释交叉引用：L267-286、L456-471、L583-630、L677-741、L1294-1320） | ~250 |
| `useColumnResize`（composable） | startResize/applyOverrideGeometry/widthOverrides/clickGuard 接线（L1069-1150） | ~90 |
| `useTreeRows`（composable） | childrenIndex/flatRows/treeExpanded/初始展开解析/toggle/expandAll/collapseAll/树 watch（L196-261、L1172-1250） | ~140 |

收益：变高行不变量（单调不回缩、签名失效、锚定补偿）收拢单模块可独立单测；
壳降到 ~900 行纯编排。风险：接线面广，须逐块迁移 + 自检面板全程 PASS。

### C2 双实现与镜像常量收拢

| 重复 | 位置 | 处置 |
|---|---|---|
| ellipsize 双实现（一份带缓存一份没有） | painter.js:114 / cell-painters.js:350 | P0-1 顺带合一：cell-painters 经注入 measure，painter 表头路径同源 |
| `isExpandedKey` ×2 | painter.js:144 / cell-painters.js:436 | 提公共小函数（tree.js 或 utils） |
| `TREE_INDENT` ×3 | row-geometry.js:27（导出）/ interactions.js:20 / cell-painters.js:46 | 统一 import row-geometry 导出（interactions 已 import layout，无隔离障碍；cell-painters 的 A8 隔离仅限 theme/layout，row-geometry 可放行或落 constants） |
| 树箭头三角坐标 ×2（注释自认「需同步」） | cell-painters.js:455 / painter.js:571 | 短期：抽 `drawTreeArrow(ctx, x, centerY, expanded, color)` 共用；中期：评估 hover 取色下沉分区 1（hover 态入 drawCell），删除 overlay 镜像层 |
| `cellFontOf` ×3 | cell-painters.js:334 / row-geometry.js:51 / painter.js:107（headerFontOf） | 落共享（接受 theme 快照入参，无隔离冲突） |
| check 方框绘制 ×2 | painter.js:435 / cell-painters.js:660 | 几何相近但状态不同（header 无 disabled），保留并注释互指即可，不强合 |

### C3 生产未用的导出 API 清理

- `interactions.resolveResizeDirty`（L296）、`resolveHoverDirtyRects`（L324）：设计期方案残留，
  壳已改用 painter 带 invalidate，现仅 `demo/.../self-checks/interactions.js` 消费。
- `tree.buildFlatRows` 的 `parentKeys` 输出（tree.js:102）：壳的 flatInfo 只取
  levels + hasChildren（canvas-table.vue:388-390），无生产消费方。
- 处置：连同对应自检断言一并删除；或如保留自检即标注「self-check only」。
  避免后续维护者误判为活跃 API。

### C4 uniform 回退层 ×4 收拢

rowGeometry 缺省回退分散四处：`layout.resolveRowGeometry`（L197）、`painter.rowGeometryOf`
WeakMap 兜底（L154）、`editor.computeEditorStyle` 内联 topAt/heightAt 回退（L365）、
`layout.rowAt` 等高分支（L306）。生产路径 `relayout()` 恒产 rowGeometry，回退仅为
自检/手织 layout 容错。处置：契约改为 rowGeometry 必传，自检夹具统一构造 uniform
几何，删四处回退分支。纯删分支、风险低。

### C5 注释体量（仅记录，不建议批量改）

大量注释引用流水线编号（02-design.md A2.2 管线 4 等），对新维护者有跳跃成本，但具
追溯价值。新增代码遵循即可，存量不动。

---

## 实施顺序与验证

| 阶段 | 内容 | 前置 |
|---|---|---|
| 1 | P0-1 ellipsize 二分+缓存；P0-2 固定列带内收敛 | 无 |
| 2 | profile（demo 100k 行档位，前台滚动 + lastPaint.elapsed 记录）→ 按结论决定 P1-1 / P1-2 是否实施 | 阶段 1 |
| 3 | C1 壳拆分（逐块迁移）；C2/C3/C4 清理 | 阶段 1（行为基线稳定） |
| 4 | P2-1 分片估高 / P2-2 缓存策略（按痛点） | profile 结论 |

验证手段：
- `http://localhost:3000/data/canvas-table/` 自检面板 9 组 144 断言全程 PASS；
  `/data/canvas-table-editable/` 编辑链路手动回归。
- `getLayoutInfo().lastPaint.elapsed`（demo 调试面板已暴露）做优化前后帧耗时对比。
- 帧感复核必须前台页（后台页 rAF 停发，知识库已录陷阱
  `agent-docs/knowledge/pitfalls/playwright-hidden-page-resize-observer.md`）。
