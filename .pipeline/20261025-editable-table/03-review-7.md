VERDICT: REVISE

## 上轮问题核对（第 7 轮：03-review-6.md 11 条 + 人工意见不回退）

### 03-review-6.md 11 条（blocker 1 / major 5 / minor 5）

| # | 级别 | 结论 | 依据 / 残留 |
|---|------|------|-------------|
| 1 | blocker | 已解决 | 改动清单新增「共享文件（2）」表（02-design.md:152-157）、A3.3 三层路径（:496）、A1 payload 条目对象（:241）、G2 单步原子（:830/:834）、A8 #22（:744）、风险表（:787）、回滚 `git checkout --`（:798）、test #14 与 LinkColumn compile 断言（:819/:184）。实读核对：link.js:9-15 `valueToLinks` 包 caption、:18 `{ max, danger, disabled }`、:50 item 解构、:46-47/:59-60 dots 与 events.click；tag.js:46/:49-56/:59-60；link.scss:1-24（danger :13-19、disabled :21-24）；root.scss 语义色 `-0..-9`（:23-25）与 12 彩色键（src/colors.js）均存在，4+12+danger=17 色闭环。附注：Vue 3 对对象型 text 实际渲染 JSON 串（table-row.vue:21 + toDisplayString），非设计所述的 `[object Object]`；"坏显示→caption" 结论不变 |
| 2 | major | 已解决 | `resolveTypeMinWidth` 导出（:163/:489）、壳 `startResize` 传参（:169/:524/:831）；真实 clamp 位置实读 = interactions.js:221-226，`findResizeColumn`（:290-321）无 clamp；self-checks/interactions 组合断言（:181）+ test #6（:811）配套 |
| 3 | major | **部分解决（残留 major，见问题 3）** | `hitTest` 增 x/y/cellX、`resolveCursor` 第三参 context 已入设计（:166/:502/:574）；但 cellX 口径（列缘 vs 内容区）、A4.3 仍写 `hit.x`、槽位与绘制位置错位 8px |
| 4 | major | 已解决 | 条目级 dots 全文统一 `'...'`：A1 :241、A3.3 :498、A3.4/A4.3 :540-543、A3.5 :513、test #3/#14 :808/:819、风险表 :786、自检 :183/:184 同口径；文本视觉省略 `'…'` 二分写明。残留：历史回应表 :931 的 maxItems `'…'` 未加勘误（不影响现行规格） |
| 5 | major | 已解决 | 伪代码 `clamp(base.width, col.minWidth == null ? base.minWidth : min, max)`（:461-468），下限复用 layout.js:62 已解析 `min`；self-checks/layout 字符串用例（:182）+ test #13（:818） |
| 6 | major | 已解决（引入步骤依赖，见问题 2） | `_resolveMaxLines(record)` 闭包（:165）、A3.5 :512、A5.1/A5.5 :555/:607、风险表 :784、自检 :178/:184、test #15 :820；闭包挂 `prepareColumn` 属 G2，与 G1-a 自检冲突 |
| 7 | minor | 已解决 | `resolveInitialExpandedKeys` 签名扩 records/keyOf/parentKeyOf/childrenIndex + 内部 BFS（:150）、A2.4 :374、自检 :179 |
| 8 | minor | 已解决 | `treeIndents(colIndex, row)`（:149/:169/:313/:393）；历史行 :916 未加勘误（无实质影响） |
| 9 | minor | 已解决 | theme.js 职责收缩（:168/:668/:829/:960）；残留 A2.2 :335 "theme.js onChange 链"表述（见问题 10） |
| 10 | minor | 已解决 | :139 "form/index.js 导出 20 项 = 17 输入组件 + MuForm/MuFormRow/MuFormField"；实读 form/index.js 20 条 export，成立 |
| 11 | minor | 已解决 | :596-597 引 input.scss:181（`border: 1px solid`）、:248-252（`&:focus-within`，box-shadow 实读 :251）；实读一致 |

### 人工 1 / 人工 2 不回退核对

- **人工 1 六条**：tree（A1/A2.4/A3.4 + tree.js + test #11）、编辑 UI（A5.2–A5.4 + test #12）、默认宽/最小宽（A3.2 + test #13）、新列型/17 色（A3.3/A6.1 + test #14）、多行变高（A2.2–A2.4 + test #15）、遗留处置（回应表）均在，无能力缩减。
- **人工 2 四条**：默认宽+最小宽 ✓；text/link 文本/数字/数组 + maxLines/maxItems + textarea/数组换行 ✓；17 色（含 link.color 全链路）✓；其余按建议 ✓。
- **唯一与 decisions.md 字面冲突**：maxLines 溢出末行字符设计为 `'…'`（U+2026），decisions.md:6 用户原文为 `'...'`（见问题 4）。

## 检查项结论（每项一行）

1. **覆盖** — REVISE：验收 #11/#12/#14/#15 均有章节与测试行，新增/修改测试文件全部列入改动清单与步骤；但 #11 的槽位断言（:816）按错误口径写（问题 3），textarea 边距与 link disabled 判定无断言（问题 5/7）。
2. **事实一致** — PASS：抽样复核 link.js/link.scss/tag.scss/text.js/interactions.js/layout.js/painter.js/theme.js/editor.js/canvas-table.vue/form/index.js/input.scss/root.scss/tree.vue/tree-node.vue，全部引用行号与符号成立；仅计数标签（:137/:173）与 `[object Object]` 描述有偏差（问题 8，附注）。
3. **约定一致** — PASS：纯 JS / Composition API / BEM / `--mu-*` / 受控数据流 / 17 色口径符合；共享 link.js 改动已在范围与影响面显式声明。
4. **影响面** — REVISE：paintState `displayRows` 在 G2 缺壳侧组装（问题 1）；G1-a 自检依赖 G2 的 prepareColumn 产物（问题 2）；其余调用方/共享文件/回滚已覆盖。
5. **可实施** — REVISE：问题 1 致 G2 完成态 demo 空白；问题 2 致 G1-a 判据不可达；问题 3 致树槽命中区与绘制不一致。
6. **风险与回滚** — PASS：三目录备份 + 两共享文件 `git checkout --` 正确（:798，两文件实读已跟踪且干净）；P1/P2/P4/P5/P6/P8 均有风险行与对策；问题 1/3 的风险未入表（按对应问题修）。
7. **范围** — PASS：无超出验收/人工意见的能力；共享文件改动限定在 link 对象数组+color 的必要链路上，A8 #22 声明 DOM 影响；文档同步按项目规约延后。
8. **并行组** — REVISE：G1-a 与 G1-b 文件集不相交 ✓、G3 依赖 G2 串行 ✓、S1 集成 ✓；但 G1-a 依赖列写 "—"，实际依赖 G2 的 `_resolveMaxLines`/`_maxItems`（问题 2），不满足"步骤可独立验证"。

## 问题清单

1. **[major]** 02-design.md:164/:281/:830（关联 src/components/canvas-table/canvas-table.vue:203-221/:229，壳侧组装在 :169 G3） — G2 中间态绘制断链：painter 改读 `state.displayRows`，但 G2 不动组件壳，壳仍只写 `paintState.records`；G2 判据"demo 页可编译且绘制/命中正常"不成立 — **证据**：设计 :164「绘制状态对象（paintState）契约扩展：`records` → `displayRows`（…取代直接读 records）」、:281「`displayRows`…取代直接读 records」；G2 判据 :830「demo 页可编译且绘制/命中正常（本步不动 interactions.js 与组件壳…）」；壳现状 canvas-table.vue:229 `paintState.records = props.records`、:203-221 state 字段表无 displayRows；displayRows 组装明确列在 G3（:169/:831）。按设计实施后 G2 完成态 `displayRows` 为 undefined，`paintCellRange`/`isSelectedRow`/`paintOverlay` 取不到行（仅背景/网格线） — **建议**：painter 读取 `state.displayRows ?? state.records`（与 rowGeometry 的 `resolveRowGeometry` 缺省回退同款，写入 A2.1/painter 行与 G2 判据），或把壳的最小 `displayRows: props.records` 组装并入 G2 并同步文件集与判据；补 G2 判据的可观察项。
2. **[major]** 02-design.md:178 与 :165/:149/:828 — G1-a 的 row-geometry 自检依赖 G2 的 `prepareColumn` 扩展，G1-a「三组全绿」不可达 — **证据**：自检行 :178 写「函数形态 lineClamp … 两条 record 各自按求值行数计高——**内部列夹具经 prepareColumn 产出**」及「link 条目 `min(render 计数, maxItems)`」；而 `_resolveMaxLines(record)`/`_maxItems`/`_isTreeColumn` 均由 `prepareColumn` 在 **G2** 追加（:165）；G1-a 文件集不含 cell-painters.js，依赖列写 "—"（:828），判据却要求「自检面板出现并全绿 text-wrap/row-geometry/tree 三组（… maxLines 钳制/maxItems 计数 …）」 — **建议**：G1-a 自检的夹具列改为手写 `_maxLines`/`_resolveMaxLines`/`_maxItems` 字段（不经 prepareColumn），或把依赖闭包的断言移到 G2 的 row-geometry/cell-painters 自检；同步 G1-a 依赖与判据。
3. **[major]** 02-design.md:166/:502/:538/:181/:816 — 树箭头槽命中区与绘制位置错位 8px，且同一判定存在三种口径 — **证据**：interactions 行 :166 定义 `cellX = x − (colLefts[colIndex] − (fixed ? 0 : scrollLeft))`（列缘相对）；A3.4 :502 却称 cellX「相对命中列**内容区**左缘偏移」，判据 `cellX < level×16 + 16`；绘制侧明确「**内容区**前置 `level×16` 缩进 + 16px 箭头槽」（:165/:502），即箭头落在 `colLeft + padding + level×16 … +16`（padding=8px，canvas-table.scss 镜像 `--cell-padding: 8px`）；据此命中区整体左移 8px、箭头右半 8px 不响应、父行左侧 padding 区反会 toggle；且 A4.3 :538 仍写「**hit.x 判定槽内**」，与 cellX 冲突。self-checks/interactions（:181）与 test #11（:816）均按该错误口径写断言 — **建议**：统一 cellX 为内容区相对（`x − (colLefts[i] − (i < fixed ? 0 : scrollLeft)) − padding`）或判据改为 `cellX − padding ∈ [level×16, level×16+16)`；A4.3 改 `hit.cellX`；自检/测试改为点击 `getCellRect().x + padding + level×16 + 8`（箭头中心）并补"箭头右半可 toggle"断言。
4. **[minor]** decisions.md:6 与 02-design.md:21/:418/:512/:54/:820 — maxLines 溢出末行字符与已确认决定不一致 — **证据**：decisions.md:6 记录用户原文「maxLines:Number 定义多行（最大 10，**溢出末行显示 '...'**）」；设计 A3.5 :512 / A3.1 :418 / 验收对照 :54 / test #15 :820 统一为 `'…'`（U+2026），理由为"文本视觉省略 vs 条目字面值二分"（评审 6 P4 仅对条目/dots 放行该二分） — **建议**：改回 `'...'`，或在 S1 前向用户确认该字符例外并写入实施约束。
5. **[minor]** 02-design.md:170/:591/:595-598 — textarea 编辑器横向 padding 破坏"编辑/非编辑边距一致"约束，且无测试覆盖 — **证据**：canvas-table.scss 行 :170 设 `textarea.mu-input { padding: 3px 10px }`；A5.4 浮层 `left = 格左 + (padding − 1)`（:591）、边框 1px → 编辑器文本左缘 = 格左 + 7 + 1 + 10 = **+18px**，非编辑态文本 = `格左 + 8px`（:595）；A5.4 仅对 input/select 推导"精确一致"（:596-597），test #7/#12（:812/:817）只断言 input 态边距 — **建议**：textarea 用 `padding-left: 0`（或按 `padding − 1 − 1` 反算），并在 test #7 补 textarea 文本左缘与非编辑态差 ≤1px 断言。
6. **[minor]** 02-design.md:393 与 :312-314 — 树形列行高公式漏扣 padding，与绘制侧内容宽不一致 — **证据**：A2.4 :393 写「`contentWidth = 列宽 − (16 × level + 16)`」；A2.2 :312-314 写「contentWidth 按列扣树形列 inset」；绘制侧文本区 = `rect.width − 2×padding − (16×level+16)`（:165 内容区前置缩进 + drawText 现状 contentWidth = rect.width − padding*2，cell-painters.js:202）；按 A2.4 字面实现行高偏小、树形列长文本末行被截 — **建议**：统一写 `contentWidth = 列宽 − 2×padding − (16×level+16)`，同步 A2.2/A2.4/self-checks/row-geometry 夹具。
7. **[minor]** 02-design.md:165/:498（关联 src/components/table/column-types/link.js:55） — link disabled 的实际值是空串，设计只写"读取 `item.attrs.disabled`"未定判定方式 — **证据**：link.js:54-55 `if (disabled) item.attrs.disabled = ''`（属性值 `''`，真值判断为 false）；cell-painters 现有 drawCheck 用存在性判定（cell-painters.js:360 `attrs.disabled != null && attrs.disabled !== false`）；若按真值判断，disabled link 仍绘主色、并可能发 `cell-item-click`，test #14「disabled 三态取色 / 只续链不发事件」（:819/:498）会失败 — **建议**：两处（绘制取色、命中/发事件）明确用存在性判定，写入 A3.3/A4.3 与自检断言。
8. **[minor]** 02-design.md:137/:173 — 文件计数与实际不符，影响 impl-verify 对照 — **证据**：`demo/src/data/canvas-table/self-checks/` 实为 6 个断言文件 + index.js（设计 :137 写"现状 7 断言文件 + index.js"）；本轮修改的自检文件为 7 个（index/interactions/layout/painter/cell-painters/theme/editor，见 :180-186），:173 标题写"自检 3 新增 + 5 修改" — **建议**：按实际修正计数（文件行本身完整，仅标题/口径）。
9. **[minor]** 02-design.md:226 与 :374 — `defaultExpandLevel` 解析时机自相矛盾 — **证据**：A1 :226「初始展开层级，**仅首布局前解析一次**」；A2.4 :374 要求 `treeProps` 变化「defaultExpandLevel 重解析」、:374 又写「tree 关闭→开启时…首开按 defaultExpandLevel 解析」 — **建议**：统一为"首次入场解析 + treeProps 变化/首开重解析"，并同步 watch 契约。
10. **[minor]** 02-design.md:335 与 :168/:668/:829 — A2.2 契约⑤残留"theme.js onChange 链"职责表述，与 P9 结论冲突 — **证据**：:335「契约接入点 = **theme.js onChange 链**与组件壳 relayout 前」；:168/:668/:829 明确 theme.js 仅发信号、重估/rebuild/锚定全部在壳 onChange 处理器 — **建议**：:335 改为"themeWatcher 通知 → 壳 onChange 处理器（relayout 前）"。
11. **[minor]** 02-design.md:830 — G2 判据引用 G3 才落地的夹具，该步无法验证 — **证据**：G2 判据 :830 含「DOM 版 mu-table 参照段 link 对象数组渲染正常（link.js/link.scss 改动的 DOM 侧验证）」；link 列三态与 DOM 参照段改动在 main-view.vue（:187），其文件集归 G3（:831）；现状 demo 列定义无 link 列（demo/src/data/canvas-table/main-view.vue:295-331） — **建议**：把该句移到 G3 判据，或把 link 列夹具提前到 G2。
