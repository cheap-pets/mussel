VERDICT: REVISE

## 上轮问题核对（第 2 轮起）

第 1 轮评审，无上轮问题记录。

## 检查项结论（每项一行）

1. 覆盖 — REVISE：10 条验收标准均有对应章节与测试行；但 #8 的 disabled check 像素断言无 canvas 夹具（问题 2），#7 的 null 清空路径无断言（问题 1）；新增/修改测试文件已列入改动清单。
2. 事实一致 — REVISE：关键路径/符号基本可核；painter.js:694-697 的「内建 lastPaint 断言」不存在（问题 3）；「8 文件」与实际 9 文件不符（问题 4）；其余引用（editor.js:345-360/420/449-468、theme.js:52-72、layout.js:139-146/290-321、canvas-table.vue:92-127/779-785 等）核对存在。
3. 约定一致 — PASS：纯 JavaScript、Vue 3 `<script setup>`、BEM `mu-`、`--mu-*`、受控 `update:*`、就近 scss import 均符合项目约定。
4. 影响面 — REVISE：遗漏 theme self-check 精确字段数（问题 8）、disabled check 夹具（问题 2）、null 规整路径（问题 1）、并行 build 的 `dist/`（问题 9）、focus 回归（问题 11）。
5. 可实施 — REVISE：G1-a/G1-b/G2/S1 有序且文件集基本可执行；但并行组内 build 共享输出与注释依赖（问题 9）、#6 的浏览器拖拽手段（问题 10）需先修正。
6. 风险与回滚 — REVISE：主要风险有缓解；null 输入、disabled check 夹具、theme 计数未入风险表/测试（问题 1/2/8）。
7. 范围 — PASS：三处增量（类型规整/主题字段/死代码）均在验收标准内，无超范围重写；未新增文件、未动注册。
8. 并行组 — REVISE：G1-a/G1-b 文件集两两不相交、G2 仅依赖 G1-a；但 build 输出 `dist/` 未移入集成步骤，G1-b 的 canvas-table.vue 注释依赖 G1-a（问题 9）。

## 问题清单

1. [major] 02-design.md:325-331（A5 normalizeCommitValue）— null 输入落入 `Number(value)` 分支：`Number(null) === 0`。MuInput 清空按钮返回 null（src/components/form/input.js:119 `function clear (v = null)`，input.vue:7 clear 按钮），MuSelect/combo-wrapper 清空也写 null（src/components/form/combo-wrapper.vue:105）；打开值为 null 的数值单元格后未编辑直接失焦提交，同样把 null 写成 0。这与 02-design.md:13「清空提交 null」及 :440「清空输入提交后为 null」的验收断言矛盾，且 :419-426 风险表未列该路径 — 建议：规整层显式增加 `value == null → null`（input 与数值 enum 分支均加，且先于 Number()）；self-checks/editor.js 增加 null、clear 图标、无编辑失焦三组用例；demo 侧用 clearable 列覆盖；同步更新 A5 规则与风险表。
2. [major] 02-design.md:441（测试计划 #8）与 :452（G1-b 完成判据）— 要求「check disabled 底衬像素 = `--mu-bg-strong` 计算值（与 DOM 版 table 并排比对）」，但 canvas 侧没有 disabled check 夹具，该断言无法执行。demo/src/data/canvas-table/main-view.vue:293-336 与 :339-346 的 check 列均无 `disabled`；前序 agent-docs/plans/20261023-canvas-table/05-verify-2.md:13 已记录「demo disabled check 夹具缺」且未补；本次改动清单与实施步骤也未新增该夹具或 cell-painters 颜色断言 — 建议：G1-b 增加 canvas-table demo 的 disabled check 列（或 self-checks/cell-painters.js 用含 `bgStrong` 的 theme 做离屏像素断言），并把对应文件与断言写入改动清单、G1-b 完成判据和测试计划 #8。
3. [major] 02-design.md:60、:213、:437 — 声称 painter.js:694-697 有「lastPaint.rowCount ≤ 视口行数 + OVERSCAN」的内建断言、违反即抛错；实际 painter.js:694-697 只是 `draw()` 返回 `paint()` 统计，`paint()` 内没有 rowCount 比较或 throw（唯一 throw 是 painter.js:755 对 canvas ctx 的 TypeError）。前序 05-verify-2.md:37 的 lastPaint 结论也是外部断言，不是内建约束 — 建议：二选一——把该断言作为本期实现项加入 painter.js 并列入改动清单/步骤；或把 A2、能力盘点、测试计划改为「外部断言 lastPaint」，删除「违反即抛错，属实现内建约束」的表述，避免验收依赖不存在的机制。
4. [minor] 02-design.md:34、:50、:369、:442 — 文中反复称 canvas-table 为「8 文件」，测试计划 #9 又以 `ls src/components/canvas-table/ = 8 文件` 作为通过判据；实际目录有 9 个文件（canvas-table.vue、canvas-table.scss、cell-painters.js、editor.js、index.js、interactions.js、layout.js、painter.js、theme.js），按判据执行会失败；且 02-design.md:371-384 的 A7 树本身列了 9 项 — 建议：统一为 9 文件，或明确「8 个 js/vue 文件 + 1 个 scss」，并让测试计划 #9 使用同一口径（或改为断言文件清单而非计数）。
5. [minor] 02-design.md:117、:440 — 夹具写成 `window.__canvasTableEditable = { records, columns }`，测试计划读 `window.__canvasTableEditable.records[i].price`；demo 的 `records` 是 `ref`（demo/src/data/canvas-table-editable/main-view.vue:82 `const records = ref(createRecords())`），直接挂到 window 会得到 Ref 对象，`records[i]` 为 undefined — 建议：夹具改为 `records: records.value` 或 getter，测试计划同步；或测试计划改用 `.records.value[i]`。
6. [minor] 02-design.md:325-331 与 :336 — 规整条件自相矛盾：伪代码①限定 `editorType === 'input'`，规则要点却称「锚定列类型……无论 editor.type 是否显式为 input，提交均收敛为 number」。number/currency 列配 `editor: { type: 'select' }` 时按伪代码不规整、按文字规整，实施与自检没有唯一答案；self-checks/editor.js 新增用例只列「显式 options 不规整」，未覆盖该组合 — 建议：二选一并在伪代码与规则要点统一；若采用列类型锚定，补该组合断言；若保留 editorType 闸门，删除/限定「无论」表述。
7. [minor] 02-design.md:173、:437 — 断言口径 `rowCount ≤ ceil(视口高/rowHeight) + OVERSCAN` 在 scrollTop 非行对齐时会多 1：layout.js:139-146 的 `start = floor(scrollTop/rowH)`、`end = ceil((scrollTop+viewH)/rowH)+OVERSCAN`，跨行时 count 可达 `ceil(viewH/rowH)+OVERSCAN+1`；前序 05-verify-2.md:37 与 demo/src/data/canvas-table/self-checks/layout.js:186-190 均用 +1 — 建议：测试阈值改为 `ceil(viewH/rowH)+OVERSCAN+1`，或直接断言 `lastPaint.rowCount ≤ getLayoutInfo().viewRows.count`；明确跳跃滚动位置可含非行对齐值。
8. [minor] 02-design.md:116、:444 — self-checks/theme.js 现有 `readSnapshot` 断言用 `colorKeys.length + 2 + pxKeys.length` 精确锁定字段数（demo/src/data/canvas-table/self-checks/theme.js:232-256）；若 bgStrong 作为独立断言新增而未加入 `colorKeys`，快照变为 18 字段会使该断言失败；即使加入 `colorKeys`，:259 的「11 色」detail 也需更新 — 建议：明确把 bgStrong 加入 `colorKeys`（或同步更新计数断言与 detail），并在 G1-b 完成判据中保留「自检面板 theme 组全绿」。
9. [minor] 02-design.md:451-456 — G1-a/G1-b 标为并行组，但两者完成判据都含 `build 通过`，`npm run build` 写共享 `dist/`（AGENTS.md 常用命令），并行执行会争用生成目录；另 G1-b 的 canvas-table.vue 注释更新依赖 G1-a 删除 editor.js 死路径（02-design.md:114、:452） — 建议：把 build 验证移到 S1（或指定单次构建），注释更新随 G1-a 或 S1；若保留并行，明确 `dist/` 的并发处理。
10. [minor] 02-design.md:439 — 测试计划 #6 用 `browser_drag` 拖列缘，但 canvas 是单个元素，MCP `browser_drag` 按元素起点/终点拖拽，无法定位列缘坐标；前序 05-verify-2.md:27 实际用 `page.mouse` — 建议：改为 `browser_run_code_unsafe` + `page.mouse` 拖拽并断言 `colWidths`，或 `browser_evaluate` 触发 pointer 事件；测试计划写明具体手段。
11. [minor] 02-design.md:424 与 :440 — 风险表称「A5/G2 用例『打开后焦点在内部 input/容器』回归」，但测试计划 #7 没有焦点断言（仅浮层 rect、提交/取消、validate 等）；删除 focusAfterRender 后聚焦路径若退化，当前计划不会发现；demo/src/data/canvas-table/self-checks/editor.js:14 也把聚焦留给 S1/A6 浏览器用例 — 建议：在测试计划 #7 增加打开后 `document.activeElement` 为内部 `<input>`（switch 为 `__editor` 容器）的断言。
