VERDICT: REVISE

## 上轮问题核对（第 2 轮起）

| 上轮 # | 级别 | 结论 | 证据与说明 |
|---|---|---|---|
| 1 | major | 已解决 | A5 伪代码①②均先判 `value == null → null`（02-design.md:326-333），规则要点与风险行补齐（:340、:428）；自检与 demo clearable 用例列入 :115、:117、:446；源码证据 input.js:119 `clear(v = null)`、input.vue:7、combo-wrapper.vue:105-106 |
| 2 | major | 未完全解决 | 夹具已加（02-design.md:118 `disabled: record => record.id % 10 === 0`），但 G1-b / 测试计划 #8 的像素断言仍不可执行（见问题 1）；评审回应 :476 将 DOM 并排比对降为可选人工项，自动化只剩该断言 |
| 3 | major | 已解决 | 能力盘点 #4、A2、`getLayoutInfo()`、测试计划 #4 均改为「painter 外露统计 + 外部断言」（02-design.md:60、:174、:214、:443），被拒绝备选 #6 补齐理由（:420）；painter.js:694-697 确为 `draw` 返回统计，唯一 throw 在 :755。A7 仍有「lastPaint 断言」残句（见问题 3） |
| 4 | minor | 已解决 | :34、:50、:373、:448 统一为「9 文件 = 8 个 js/vue 共 3,696 行 + 1 个 scss」；实际目录 9 文件、js/vue 合计 3,696 行 |
| 5 | minor | 已解决 | :117、:446 改为 `records: records.value` 并注明 Ref 解包原因 |
| 6 | minor | 已解决 | :326-334 以 `editorType === 'input'` 为闸门，:339 写明数值列显式 `editor.type:'select'` 的例外；:115、:457 补「number 列 + editor.type:'select' + 显式 options → 原样」断言 |
| 7 | minor | 已解决 | :174、:214、:443 统一为 `ceil(viewH/rowH) + OVERSCAN + 1`，与 layout.js:139-146 的 `floor`/`ceil` 跨行口径及 self-checks/layout.js:186-190 一致 |
| 8 | minor | 已解决 | :116、:447 将 bgStrong 加入 `colorKeys`（12 色）、计数随 length 变 18、detail 文案更新；self-checks/theme.js:232-256 公式核对成立 |
| 9 | minor | 已解决 | :448、:458、:460、:462 将 `npm run build` 统一移至 S1；table-ex.vue 注释更新改归 G1-a（:114、:457），G1-a/G1-b 文件集不相交 |
| 10 | minor | 已解决 | :445 改为 `browser_run_code_unsafe` + `page.mouse`，用 `getCellRect` 换算列缘坐标 |
| 11 | minor | 已解决 | :446 新增打开后 `document.activeElement` 断言（input/select/date 为内部真实 input，switch 为 `__editor` 容器） |

## 检查项结论（每项一行）

1. 覆盖 — REVISE：10 条验收标准均有章节与测试行，新增/修改测试文件已列入改动清单与 G1-a/G1-b/G2；但 #8 的 disabled check 颜色断言不可执行（问题 1）。
2. 事实一致 — REVISE：路径/符号与 9 文件、painter 统计、`--mu-bg-strong` 定义等均可核；MuInput `type='number'` 的提交类型论述与 Vue 实现不符（问题 2）。
3. 约定一致 — PASS：纯 JavaScript、`<script setup>`、BEM `mu-`、`--mu-*`、受控 `update:*`、就近 scss import 均符合项目约定；未新增依赖。
4. 影响面 — REVISE：theme 快照与 demo 夹具已覆盖，但 `self-checks/cell-painters.js` 的 THEME 未随 bgStrong 更新（问题 1）；number/currency 的 e2e 断言不能区分改动前后（问题 2）。
5. 可实施 — REVISE：G1-a → G1-b/G2 → S1 有序，build 已归 S1；G1-b 完成判据中的像素断言按现文实施必失败（问题 1）。
6. 风险与回滚 — PASS：规整值类型变化、清空 null、enum 相等语义、聚焦删除等风险均有对策；回滚与 git 处置写明。
7. 范围 — PASS：三处增量均在既有文件内，无新增文件、未动注册与 catalog；文档同步按项目规约延后。
8. 并行组 — PASS：G1-a/G1-b 文件集合两两不相交；G2 仅依赖 G1-a；共享 `dist/` 已移入 S1 单次执行。

## 问题清单

1. [major] 02-design.md:447（测试计划 #8）、:458（G1-b 完成判据）、:476（评审回应 #2）；demo/src/data/table-ex/self-checks/cell-painters.js:20-33 — disabled check 底衬像素断言不可执行：`--mu-bg-strong` 是 8% alpha 的半透明色，canvas 先画行底色再画 check 底衬，采样像素是合成色，不可能等于 `getThemeSnapshot().bgStrong` 的 rgb；且未规定采样点（16×16 圆角框居中，勾选行的 ✓ 覆盖中心；斑马行/hover 还会改变底色）。另外 self-checks/cell-painters.js 的 THEME 未加 bgStrong，改动后现有 disabled check 断言中 `theme?.bgStrong` 为 undefined，fillStyle 赋值被忽略，模块级断言不再验证新底衬色 — 证据：src/styles/root.scss:54、:110（`rgb(from ... / 0.08)`）；src/components/table-ex/painter.js:214-235（先 `fillRect` 行背景再 `drawCell`）；src/components/table-ex/cell-painters.js:364-371（半透明圆角矩形填充后描边/✓）；demo/src/data/table-ex/self-checks/painter.js:154-165（现有 `blendColor` 半透明叠加辅助）；demo/src/data/table-ex/self-checks/cell-painters.js:26（THEME 仅 hoverBg，无 bgStrong） — 建议：G1-b 中给 self-checks/cell-painters.js 的 THEME 补 bgStrong，并以 `blendColor(bgStrong, 行底色)` 口径断言；测试计划 #8 明确采样点（禁用行、未勾选、盒内避开 ✓/圆角、鼠标移开避免 hover），或改为 canvas 与 DOM 版 table 的 disabled check 像素自动并排比对，同步改动清单、G1-b 判据与 :476 回应。

2. [minor] 02-design.md:314、:427（并与 :72「差距 #1」表述相关）— 事实错误：MuInput 的 `type='number'` 路径并非产出字符串。Vue 3.5.39 的 `vModelText` 在 `type=number` 时自动 `looseToNumber`（node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js:1577、:1580），MuInput 的 `<input v-model>` 经 `inputAttrs` 绑定 number（src/components/form/input.vue:6、input.js:54-59），故 number/currency 缺省编辑器提交数值，`record[field]` 不会发生 number→string 漂移；真实漂移仅在显式文本输入（`editor.type:'input'` 且未注入 type）与数值 enum。据此，测试计划 #7 的 price/stock `typeof === 'number'` 断言在改动前也会通过，不能验证 input 规整 — 建议：修正差距 #1 与 :314 的表述；如需端到端覆盖 input 规整，demo 增加显式 text 输入的 number/currency 列（或沿用 self-check 纯函数覆盖），并保留数值 enum 的 e2e；风险表 :427 改为已核实结论（type=number 自动转 number，文本输入为 string）。

3. [minor] 02-design.md:384（A7 文件树）；demo/src/data/table-ex/self-checks/editor.js:8、:176、:375 — 旧口径文案未列入同步：A7 仍写 painter「lastPaint 断言」，与 :60、:174、:214、:420 已改为「库内无断言/外部断言」不一致；self-checks/editor.js 头部与 :176 仍声明「提交值 = mapping key 字符串」，G1-a 只列新增断言与 editor.js 头注更新，未包含该测试文件说明及 :375 断言文案（数值原值现回写 number） — 建议：A7 改为「lastPaint 统计（外部断言来源）」；G1-a 同步 self-checks/editor.js 头注与相关断言文案（注明 string/boolean 原值提交 key 字符串、number 原值保持 number）。
