VERDICT: REVISE

## 上轮问题核对（第 5 轮）

### 03-review-4.md 13 条（blocker 2 / major 7 / minor 4；设计头部 :3 写“minor 5”为笔误）

| # | 级别 | 结论 | 核对 |
|---|------|------|------|
| 1 | blocker | 已解决 | `self-checks/interactions.js` 已入改动清单（02-design.md:171）：:23 `resolveCellDblclick` import 删除、:361-395 断言组改 click 语义；canvas-table.vue 改动行明确删 :80 import 与 :21/:543-580 dblclick 链（:519）；G3 原子完成（:749）；回应见 :806。实际文件 :23/:361-395 与设计引用一致 |
| 2 | blocker | **部分解决（残留 blocker，见问题 1）** | 定宽链 `widthOverrides ?? col.width ?? type.width` 保持不动、仅弹性分支换基线，方向正确（:153/:432）；但 `solveWidths` 的隐式下限 80（layout.js:77）未处理，bool 60 仍被抬到 80；`TYPE_DEFAULT_WIDTHS[col.type]` 对无 type 列（默认 TextColumn）查不到 text 160。test #13（:736）与人工意见 3 仍不可通过 |
| 3 | major | **部分解决（残留 major，见问题 4）** | 事件存在性、payload 键名、tag 点击对齐已修（:231/:808）；但“DOM 版 dots 无 events.click”不成立（link.js:59-60、tag.js:59-60 在 if/else 之后绑定，table-row.vue:18 统一 `v-on`），设计中“dots 不命中”与 DOM 行为不一致，test #14（:737）按错误口径固化 |
| 4 | major | 已解决（计数表述残留 minor，见问题 10） | colors 改为固定全量读取、随 readSnapshot 重读，签名不变（:158/:602/:809），记录级 tag.color 与 `(record)=>` 配置可即时取色；`getThemeSnapshot` 无过期契约。计数 17 的来源表述仍不精确（问题 10） |
| 5 | major | 已解决 | 快照 17→21：`textColorMuted`/`bgDisabled` 入 `readSnapshot`（:158/:602/:810）；root.scss:46/:55/:101/:111 明暗双态与 :141 `controlHeight` 均已核对存在；theme/self-checks/测试 #3/#8/#14 全链同步 |
| 6 | major | 已解决 | `self-checks/index.js` 已入改动清单与 G1-a（:170/:746/:811）：import 并注册 text-wrap/row-geometry/tree 三组（6→9），判据改为面板出现三组并全绿；实际 index.js:15-29 为 6 组，引用成立 |
| 7 | major | **基本解决（残留 major，见问题 5）** | 数组值自动多行脱离 multiline 门控、variable 模式判定扩为 `_multiline || hasArrayValues`、模式只升不降（:273/:470-475/:812）；但 link 列同时落入“文本呈现列（数组值→value.length）”与“条目列（仅 multiline 竖排）”两类，规则冲突且无测试 |
| 8 | major | 已解决 | 测量/折行消费链闭环：theme.js 新导出 `createTextMeasurer()`、text-wrap 纯函数、row-geometry/painter state 注入 measure/wrapCache、cell-painters 与 row-geometry 共用 wrapLines/缓存（:145-146/:275/:602/:813）；theme.js:136-151 现有 `createMeasureCache` 引用成立 |
| 9 | major | 已解决 | itemHits 改 (row, col) 二级 Map、双 pass 不互覆、每次绘制批次按窗口行裁剪（:154/:460/:814）；painter.js:311/:520-572 双 pass 与 :568-572 固定列 pass 引用成立；self-checks/painter 与 #14 有对应断言 |
| 10 | minor | 已解决 | `buildFlatRows` 产出 `hasChildren` 平行数组（:147/:355/:815）；painter 箭头/空槽、`resolveTreeToggle`、`resolveCursor` 统一来源；tree.scss:35/:74 引用已修正 |
| 11 | minor | 已解决 | `computeEditorStyle` 改动清单简写已统一为 A5.4 完整表达式，含 `i < fixedCount ? 0 : scrollLeft`（:157/:816）；self-checks/editor 增固定列 + 横向滚动用例 |
| 12 | minor | 已解决 | 行高公式与 `computeRowHeights` 增 multiline link 分支，行数 = render 后条目数（含 max '...' 合并）（:146/:299-305/:817）；test #15 增 multiline link 断言 |
| 13 | minor | 已解决 | `tree`/`treeProps`/`treeExpandedKeys` 三 prop 入 watch 表，重建链含几何 rebuild + spacer + 锚定 + 整幅（:159/:358/:818）；demo 增切换控件、test #11 增断言 |

### 03-human-1.md 六条（按 blocker 对待）

| # | 意见 | 结论 | 核对 |
|---|------|------|------|
| 1 | tree（props.tree + key/parentKey） | 满足；残留问题 6、7 | A1（:213-216）props/事件/方法齐全；A2.4（:342-380）平铺 + treeProps 可配、迭代 DFS + 防环 + 孤儿挂根、展开态宽松受控、锚定/clamp/commit 均有；tree.js/self-checks/tree/test #11 在 G1-a/G3。`defaultExpandLevel` 语义与树缩进行高仍有问题 |
| 2 | 编辑 UI（单击/hover/边框与边距） | 满足；残留问题 14（switch） | 单击进编辑与冲突矩阵（A5.2）、hover cursor+描边（A5.3）、内容区矩形与两态边距（A5.4）完整；dblclick 删除三处原子同步（:171/:519/:749）；input.scss:181/:249-253、canvas-table.scss:105-121 核对成立 |
| 3 | 预设列类型默认宽度 | **未完全满足**（问题 1） | `TYPE_DEFAULT_WIDTHS` 表（A3.2 :432-452）与测试 #13（:736）存在；弹性分支 80px 隐式下限未改，bool 60 无效；无 type 的 text 列（demo main-view.vue:297）查不到 160 |
| 4 | 链接/进度/多按钮/多标签（颜色可定义） | 满足；残留问题 4、5、10 | progress/button 新类型、link 多条/danger/disabled、tag 17 色、itemHits、`cell-item-click` 均有；progress/button 的绘制分发、dots 行为、colors 计数仍待修 |
| 5 | 多行文本 + 变高行虚拟滚动重设计 | **部分满足**（问题 2、5、7） | Fenwick 选型（A2.3）、估高+精算+单调+锚定（A2.2）、缓存、树联动（A2.4）成立；multiline+lineClamp 的 TextColumn items 路径绕过 drawText；link 数组规则冲突；树形缩进未入行高测量 |
| 7 | 遗留问题处置 | 满足 | 03-review-3 minor 6 条逐条关闭；未解 1（文档三处同步）保持未解且不自决（A8 #15）；未解 2（MuSelect 相等语义）以 select.js:95-99/option.vue:26 证据关闭，本轮复核成立 |

## 检查项结论（每项一行）

1. **覆盖** — REVISE：#13 bool/无 type 默认宽、#14 progress/button 分发与 dots、#15 multiline+lineClamp 与树+多行均无可用设计与测试闭环；其余验收/人工意见有章节和测试行。
2. **事实一致** — REVISE：抽样核对 layout.js:70-79、painter.js:74-87/:311/:520-572、theme.js:52-72/:136-151、root.scss:46/:55/:101/:111/:141、tree.scss:3/:35/:74、text.js:19-29、link.js:59-60、tag.js:59-60、table-row.vue:13-22、tree.vue:3/:30、tree-node.vue:100-106 均成立；但 dots 无 events.click 的引证不成立（问题 4），colors “12 基础”与 root.scss 13 色不符（问题 10）；input.scss:96-99 实为链接 hover 色（字号 :17、行高 :106），结论成立但引证不准。
3. **约定一致** — REVISE：纯 JS、Composition API、BEM、`--mu-*` 快照、受控 `update:*` 符合；dots 行为偏离 DOM 版（问题 4），`defaultExpandLevel` 与 tree 组件 0-based `props.level <= level` 语义不符（问题 8），progress/button 未入列类型注册表（问题 6）。
4. **影响面** — REVISE：漏 G2 中间态的组件壳调用（问题 3）、变高行 cell rect/裁剪（问题 9）、树缩进对行高测量（问题 7）、主题/字号变化对 variable 行高（问题 15）、paintState 的 flatInfo（问题 13）。
5. **可实施** — REVISE：G2 的 layout/painter 改动会使未改动的组件壳运行时报错（问题 3）；lineClamp item 路径（问题 2）与 progress/button 分发（问题 6）缺明确落点；`resolveItemClick`/`resolveTreeToggle` 缺指针 x（问题 12）。
6. **风险与回滚** — REVISE：回滚已改为三目录 `cp -r`/robocopy 备份，正确；但风险表未识别默认宽下限（问题 1）、lineClamp item（问题 2）、G2 中间态（问题 3）、树+多行行高（问题 7）、defaultExpandLevel 语义（问题 8）。
7. **范围** — PASS：tree、编辑 UI、默认宽、新列型、多行变高均在人工意见/验收内；未改 table/注册/catalog，文档同步仍延后（A8 #15）；无超范围重写。
8. **并行组** — PASS：G1-a/G1-b 文件集不相交；G2 依赖两者、G3 依赖 G2，均串行；G3 内 dblclick 三处原子完成（:752）；`npm run build` 仅 S1 单次。G2 的运行时问题是可实施问题，不是分组冲突。

## 问题清单

1. **[blocker]** 02-design.md:153/:432/:442/:452/:736（关联 src/components/canvas-table/layout.js:77、demo/src/data/canvas-table/main-view.vue:297、src/components/table/column-types/index.js:33）— `TYPE_DEFAULT_WIDTHS` 只替换弹性分支初始宽，未改 80px 隐式下限；bool 60 被抬到 80，无 type 列（默认 TextColumn）查不到 text 160 — **证据**：layout.js:77 现状 `widths[i] = clamp(COL_FALLBACK, col.minWidth == null ? COL_FALLBACK : min, max)`；设计 :432 只写“初始宽由 COL_FALLBACK 改为 `TYPE_DEFAULT_WIDTHS[type] ?? COL_FALLBACK`（参与剩余宽均摊与 min/max clamp，语义不变）”，未说明 `col.minWidth == null` 时下限仍为 COL_FALLBACK=80；A3.2 表 bool :442=60；test #13 :736“窄容器 → 逐列 = 默认宽”；demo 的“名称”列 `{ field:'name', minWidth:80 }` 无 type（main-view.vue:297），`resolveColumnType(undefined)` 回退 TextColumn（index.js:33），但 `TYPE_DEFAULT_WIDTHS[undefined]` 为 80 — **建议**：明确 `clamp(TYPE_DEFAULT_WIDTHS[col.type ?? 'text'] ?? COL_FALLBACK, col.minWidth ?? 0, max)` 或等价的 min 语义；self-checks/layout 与 test #13 补 bool 60、无 type text 160 断言；同步风险表。

2. **[blocker]** 02-design.md:155/:426/:473/:476/:738（关联 src/components/table/column-types/text.js:19-29、src/components/canvas-table/cell-painters.js:114-126/:160-163）— `multiline + lineClamp` 的现有 TextColumn 返回 `items`，`drawText` 多行分支不会执行，lineClamp 变体与“数组值 + lineClamp”无法按设计渲染 — **证据**：TextColumn 在 `column.multiline && column.lineClamp` 时返回 `{ items:[{ is:'div', text:value, attrs:{ class:'line-clamp' } }] }`（text.js:19-29）；`resolveCellContent` 返回 items（cell-painters.js:114-126），`drawCell` 走 `drawItems`（:160-163）；设计的多行绘制写明在 `drawText`（:155/:473/:476），`drawItems` 仅收集/单行绘制；test #15 :738 明确含“lineClamp 变体” — **建议**：在 `drawCell`/`prepareColumn` 明确 `_multiline` 文本列的分发（在 `resolveCellContent` 前用 `_text`/`_value` 走 `drawText`，或让 `drawItems` 识别 `line-clamp` item 并复用同一 `wrapLines`/lineClamp）；补 multiline+lineClamp、数组+lineClamp 自检/e2e。

3. **[major]** 02-design.md:153/:748（关联 src/components/canvas-table/canvas-table.vue:293-305/:332-337/:404-417、painter.js:115-117/:120-127、interactions.js:54）— G2 把 `relayout`/`rowAt` 改为必需 `rowGeometry`，但 G2 不动组件壳，现有调用仍传 `rowCount`/`rowHeight`；G2 判据“dblclick 链保持现状可用”不成立 — **证据**：layout.js 改动行 :153 写 `relayout` 签名“替代单值 rowCount”、`contentHeight = headHeight + rowGeometry.totalHeight`；G2 文件集不含 canvas-table.vue，判据 :748 仍称“demo 页可编译（本步不动 interactions.js 与组件壳——dblclick 链保持现状可用）”；壳 :293-305 调 `computeLayout({ rowCount, ... })` 无 rowGeometry，:332-337 用 `computeViewRows({ rowCount })`，interactions.hitTest 调 `rowAt({ rowHeight, rowCount })`；painter :115-117 依 `layout.rowHeight` — 按设计字面实施，G2 完成态绘制与命中即抛错/不可用 — **建议**：G2 保留 `rowGeometry` 缺省（由 `rowHeight`/`rowCount` 构造 uniform geometry）或把壳的最小几何接线并入 G2 并调整文件集/判据；G2 判据改为“demo 实际绘制 + dblclick 可验证”。

4. **[major]** 02-design.md:231/:460/:808/:737（关联 src/components/table/column-types/link.js:36-60、tag.js:36-63、src/components/table/table-row.vue:13-22、docs-site/components/table.md:220）— “DOM 版 dots 无 events.click”不成立；canvas 计划让 '...' 条目不命中，与 DOM 版行为不一致，验收 #3 的 API 对照与 test #14 口径错误 — **证据**：link.js:59-60、tag.js:59-60 的 `events.click` 位于 `if (idx === dotsIndex) ... else ...` 之后，dots 条目同样绑定；table-row.vue:18 `v-on="item.events"` 对所有 item 生效；docs-site table.md:220 写明 `cell-item-click` 参数 `{ record, column, link/tag }`，未排除 dots — **建议**：与 DOM 一致让 dots 也发 `{ record, column, link|tag: '...' }`，或在 A1/A8 显式声明差异并修正 link.js/tag.js 引证；test #14 :737 同步；若要保留“不命中”，需给出迁移说明。

5. **[major]** 02-design.md:299-305/:470/:473/:474/:738（关联 src/components/table/column-types/link.js:9-15）— link 列同时被定义为“文本呈现列（数组值无条件多行）”和“条目列（仅 multiline 竖排）”，行高公式与绘制路径冲突，且无测试覆盖 — **证据**：A3.5 :470 的“文本呈现列”列表含 link，:473 写数组值每元素一行；A3.3 :458 与 :474 只让 `multiline` link 竖排；A2.2 :299-305 同时存在“数组值列（文本呈现）→ value.length”和“multiline link 列 → render items 计数”两个分支；LinkColumn 的 `valueToLinks` 把数组 value 转 items（link.js:9-15）；test #15 :738 只测文本数组与 multiline link，未测 link 数组值 — **建议**：把 link 明确为条目列（数组值走 items，只有 multiline 竖排）并从“文本呈现列”列表排除，或定义 link 数组值无条件竖排并删除 multiline 门控；统一 A2.2 分支、绘制路径与测试。

6. **[major]** 02-design.md:393-394/:424/:456-457/:155/:737（关联 src/components/table/column-types/index.js:11-27/:33、src/components/canvas-table/cell-painters.js:90-107/:142-173）— progress/button 未入列类型注册表，现有 `prepareColumn`/`_render` 会把它们回退 TextColumn 并绘制文本；设计只写“新增 drawProgress/drawButton”，未定义分发/取值，故“items 7 类”不成立 — **证据**：column-types/index.js 无 progress/button，`resolveColumnType` 对未知类型回退 TextColumn（:33）；cell-painters.prepareColumn 调 `resolveColumnType`（:93），`drawCell` 走 `resolveCellContent` → `drawText`/`drawItems`（:151-170）；设计 :424 把 progress/button 计入 items 七类，但二者并不由 `render` 产出 items；test #14 :737 要断言进度条/按钮绘制 — **建议**：明确 canvas-only 分发（`col.type === 'progress' | 'button'` 在 `resolveCellContent` 前调用 `drawProgress`/`drawButton`），写清 value/buttons/progressOption 取值、disabled 与 itemHits；修正“items 7 类”表述；补 self-checks/test #14。

7. **[major]** 02-design.md:146/:299-306/:360/:377/:734/:738（关联 src/components/tree/tree.scss:3）— 树形列缩进/箭头槽缩减文本宽度，但 `computeRowHeights` 签名无 levels/flatInfo，树+多行列按全宽估算行高，会偏小 — **证据**：A3.4 :360 绘制 `level×16px` 缩进 + 16px 箭头槽；A2.4 :377 写“树行高走同一估高/精算管线（flatRows 即 records 输入）”；row-geometry 签名 :146 仅 `records/columns/colWidths/theme/measure/wrapCache`，无层级；A2.2 :299-306 用 contentWidth 计算 lines；test #11/#15 无树+多行用例 — **建议**：把 `levels`/`flatInfo` 或每行 content inset 传入 `computeRowHeights`/`ensureRowMeasured`，树形列 contentWidth 减 `16×level + 16`；补树+长文本行高断言。

8. **[major]** 02-design.md:216/:358/:734（关联 src/components/tree/tree.vue:3/:30、src/components/tree/tree-node.vue:100-106）— `defaultExpandLevel` 语义自相矛盾：A1 写 0=全收起，A2.4 写 BFS 收集 ≤ level 层（0 会收集根并展开根），所引 tree 的 `autoExpandLevel` 又是 `props.level <= level`（根 level 0，0 展开根） — **证据**：tree.vue:3 `:level="0"`，tree-node.vue:101-106 `props.level <= level`；A1 :216 “0 = 全收起”“对齐 autoExpandLevel 语义子集”；A2.4 :358 “BFS 收集 ≤ level 层的全部有子节点 key”；test #11 :734 用 defaultExpandLevel 1 未断言 0/1 边界 — **建议**：二选一并写清 0-based/1-based：`level < defaultExpandLevel`（0=收起）或 `level <= defaultExpandLevel`（对齐 tree，0=根展开）；同步 A1/A2.4/self-checks/tree 与 test #11。

9. **[major]** 02-design.md:154/:241（关联 src/components/canvas-table/painter.js:120-127/:228-233/:594-596）— 变高行只改 `viewportRowY`/行背景/网格线/overlay 行带，未改 `cellRectAt`、`paintCellRange` 单元格 rect 高度与 `paintCellRegion` 的 `rowHeight+1` 裁剪；变高行内条目垂直居中与单格脏区重绘会错 — **证据**：painter.js:120-127 `cellRectAt` height=`layout.rowHeight`；:228-233 单元格 rect.height=`layout.rowHeight`；:594-596 rect 高度 `layout.rowHeight+1`；A1 :241 承诺 `getCellRect` height=heightAt；test #12 用 getCellRect 对浮层、#15 未断言变高行内 tag/link 居中 — **建议**：`cellRectAt`/`paintCellRange` cell rect/`paintCellRegion` clip 统一用 `heightAt`/`bottomAt`；补变高行+非多行条目列与单格脏区重绘断言。

10. **[minor]** 02-design.md:19/:158/:459/:602/:726/:809（关联 src/styles/root.scss:1-6/:33-35/:92-95、src/styles/tag.scss:28-45）— colors “固定 17 色（12 基础 + 5 语义）”的计数与引证不精确：root.scss 的 `$BASE_COLORS` 含 gray 共 13 色（+5 语义=18），不是 12；实际 17 对应 tag.scss 的 12 彩色 + 5 语义（gray 为回退）；:92-95 只是暗色语义色 translucent，基础色 translucent 仅在 :33-35（暗色继承） — **证据**：root.scss:1-6、:33-35、:92-95；tag.scss:28-45；A6.1 :602 与 self-checks/theme 断言 17 — **建议**：明确列出 12 个彩色名（排除 gray，gray 为回退），引 tag.scss:28-45；修正“明暗双态全定义”的引用。

11. **[minor]** 02-design.md:384/:727（关联 src/components/canvas-table/painter.js:675/:678/:680-687）— variable 模式 `lastPaint.rowCount == viewRows.count` 仅对整幅绘制成立；hover/单格脏区绘制返回的 rowCount 是脏区行数，test #4 若在脏区绘制后读取会误判 — **证据**：painter 的 `paint` 对 full/region 分别返回 stats（:675/:678/:680-687）；A2.5 :384 写等式；test #4 :727 — **建议**：测试前强制整幅（`refreshTheme()`/`recordsVersion++`）或把断言限定为“最近一次整幅绘制”并记录 full paint 统计。

12. **[minor]** 02-design.md:156/:355（关联 src/components/canvas-table/interactions.js:38-60、src/components/canvas-table/canvas-table.vue:400-418）— `resolveItemClick`/`resolveTreeToggle` 需要指针坐标才能判断条目 rect/树槽 x，但签名只有 hit/itemHits/flatInfo；`hitTest` 返回的 hit 不含 x/y，壳的 `point` 在 `hitAt` 外层 — **证据**：hitTest 返回 `{ isHeader, colIndex, rowIndex, resizeCol }`（interactions.js:59）；A4.3 点击链与 A3.4 树槽判定需要 x；canvas-table.vue:400-418 的 point 未进入 hit — **建议**：给 hit 增 x/y 或给两函数传 point，并在 A1/A4.3 写明。

13. **[minor]** 02-design.md:155/:156/:159（关联 src/components/canvas-table/canvas-table.vue:203-221）— painter state 增 `displayRows`/`flatInfo` 未列明；树绘制/命中需要 levels/hasChildren，当前 state 契约只有 records/columns，`flatInfo.hasChildren[row]` 无数据来源 — **证据**：paintState 字段见 canvas-table.vue:203-221；设计 :155 写 `flatInfo.hasChildren[row]`、:156 写 `resolveTreeToggle`；:159 只说“树接线…供全部绘制/交互消费” — **建议**：在 paintState/hit 输入明确 `displayRows` + `flatInfo`（levels/hasChildren），并列入 canvas-table.vue 改动行与自检夹具。

14. **[minor]** 02-design.md:539-551（关联 src/components/canvas-table/editor.js:189-206）— switch 编辑器“border 字段忽略”但 `editorH = controlHeight + (border ? 2 : 0)`，bool 列缺省 border true 会使浮层高 34px，而 switch 无边框概念 — **证据**：A5.4 :539-542 公式；:551 “switch 编辑器无边框概念（border 字段忽略）”；editor.js:189-206 现状 style 仅定位 — **建议**：switch 分支 `editorH = controlHeight`（或 switch 实际高度）、`bordered=false`；self-checks/editor 补 switch 高度断言。

15. **[minor]** 02-design.md:319/:604（关联 src/components/canvas-table/theme.js:158-175/:209-214）— 主题/字号/`--cell-line-height` 变化只走 relayout+重绘，未把 variable 行高重估列入 A2.2 数据契约⑤；多行列在根字号或行高变量覆盖后行高会保留旧值 — **证据**：A2.2 :319 的契约⑤只列“调宽 up / 容器 resize / 列显隐”；A6.1 :604 主题刷新只写“重读快照 → relayout → 整幅”；`createThemeWatcher` 的 onChange/refresh（theme.js:158-175/:209-214）会触发 relayout，但设计未说明 `computeRowHeights`/rebuild + 锚定；test #8 :731 有“根字号覆盖跟随” — **建议**：契约⑤增 theme/font/lineHeight 维度，刷新时清 wrap 缓存（key 已含 font/width）+ 全量快速重估/rebuild + 锚定；test #8 补多行行高跟随断言。
