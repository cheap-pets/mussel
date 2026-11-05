VERDICT: AMENDED

## 上次回应核对（第 2 次起）

首轮（r=1），无上次交叉记录与设计者回应；不适用。decisions.md 4 条决定均核对未被推翻（设计未改文档、未提交、按 standard、未解问题 1 按 [设计/1] 采默认不动文档）。

## 检查项结论（每项一行）

1. **覆盖**：验收 1-4 均有设计与断言，但原测试计划 3 条手段不可执行（1a/1b 边带采样口径错、3 的 enum click 打不开选中、4c 依赖页内 `location.reload()` 且 4d 无脚本），已修正并补齐；验收 4d（冻结列 + 自动滚动）原无脚本实现，已补 A6b/A6c。
2. **事实一致**：`editorRectOf`/`editorGridlineFlagsOf`（editor.js:61-90）、`spanRectOf`（spans.js:206-217）、`resolveSpanCell`（spans.js:170-180）、`resolveCellContent`（cell-content.js:140-158）、`getLayoutInfo`（use-table-api.js:73-91）、`layout.fixedWidth/viewH/stickyWidth`（layout.js:323-344）、`borderColorSoft`（theme.js:113、root.scss:50）、demo 列序与 `editable=true`（main-view.vue:1012、477-484）均核对通过；三处行号小偏已顺手改正（`interactions.js` 438、`paint-overlay.js` 180、`cell-tooltip.js:26`）。
3. **约定一致**：kebab-case / `use-*` / ≤500 行 / 表体区 `withClip` / `warn once` / `useX(host)` 均符合；新增「自检断言同步」符合 knowledge canvas-pixel-assert-anchor-drift（原设计漏此约定）。
4. **影响面**：原设计漏 `demo/src/data/table-ex/self-checks/painter.js:901/:905`（新增灰描边使 2 处既有断言恒败），已列入改动清单、实施步骤、lint 与目录边界；其余调用方、依赖、配置无遗漏。
5. **可实施**：步骤有序、片间依赖无环；9.5 步骤键位可用性逐项列出（无 TDZ）；附录 A 改为可直接粘贴执行的脚本（就绪门 + 断言键集）。
6. **风险与回滚**：单向门无、双向门与爆炸半径明确；风险 3 原「自检不覆盖 hover 描边像素」判断有误已改写；新增风险 7（hover/选中叠加）与 8（headless 无焦点剪贴板）。
7. **范围**：唯一超出「零 demo 改动」的是自检断言同步，属验收 1 的回归门必需，无其他扩范围。
8. **切片**：3 片各有行为判据与断言键集；依赖 1→2→3 无环；片间文件集合相交但为串行追加（非并发），可并发片为空。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 方案概述首句、模块边界句、改动清单、确认零改动 | 「零 demo 改动 / 7 文件」→「demo 仅自检文件同步 2 处像素断言 / 7 文件 + painter.js」 | 灰描边落在被 hover 格左缘：painter.js:901 采样 (300,50)（金额列左缘）、:905 采样 (60,50)（名称列左缘），期望 row0Band≈(245,245,245)（hoverBg 0.04 叠白），实际 borderColorSoft=(232,236,241)（theme.js:113 → root.scss:50 → src/colors.js gray4=#c9cdd1），容差 2 → 恒败 | 是 |
| 2 | 遵循约定新增「自检断言同步」条、风险 3 重写、绘制节钉死 `paintHoverPlainStroke` 谓词 | 「自检断言不覆盖 hover 描边像素」→ 列出 2 处恒败断言 + 其余不受影响的采样点（:518/:529/:1238/:1242）；谓词由一行口语式改为可照抄的 `blue` 表达式 | knowledge canvas-pixel-assert-anchor-drift 要求 grep 全量扫 self-checks，不以方案清单为准；谓词不定死时 :905（`editable` 未传）的期望值随实现歧义（若实现误加 `state.editable` 前置则不画灰，改后断言反而不成立） | 是 |
| 3 | 测试计划 1a/1b | 边带 = 格矩形四缘 → `strokeRectOf` 口径：左 x、上 y+ti（row>0）、右 x+w−1−ri（col<末列或 blankTail）、下 y+h−1 | editorRectOf 只内缩 top/right（editor.js:61-71）：非首行上缘、非末列右缘的采样点原会落到格线（borderColorSoft），使 1a 的 `hoverGone` 与 1b 的蓝缘断言必败；A5 的 (1,2) 亦然 | 是 |
| 4 | 测试计划 3、附录 A4 | `click(0,9)` 复制 enum → `click(0,2)` + ArrowRight×7 到 (0,9) | 等级列 `editable:true, editor:true`（main-view.vue:477-484），demo `editable=ref(true)`（:1012）→ 点击开编辑器、selectCell 不执行，原断言必败 | 是 |
| 5 | 测试计划 4a | 只断言新格蓝缘 → 增 `!hasBorder(0,2,BLUE)`（旧格消失） | 原计划文字要求「旧格边带消失」但脚本未断言，覆盖缺口 | 是 |
| 6 | 测试计划 4c/6、附录 A0/A2b/A7 | 页内 `location.reload()` + 「刷新后独立段」→ A0 置于页面刚加载首段；表头清除改用金额列 col 5（非 sortable）的 headerPoint | `location.reload()` 在 `Runtime.evaluate` 的 async IIFE 内会中断上下文，out 丢失；col 2/3/4 为 sortable，表头点击会改 orderBy 与行序，掩盖「表头清除」语义 | 是 |
| 7 | 测试计划 4d、附录 A6b/A6c | 「↓ 连按 3 次后校验可见」→ 冻结列 ← 到 col0 + ↓×20（scrollTop>0、行可视）+ 末列连按后 scrollLeft>0 且末列左右缘在画布内 | 原 3 次不出视口（可视行 ≈6），未验证自动滚动；横向自动滚动原无断言 | 是 |
| 8 | 测试计划 2、风险 8、附录 A 页内段 | `Browser.grantPermissions` + `navigator.clipboard.readText()` → 预置 `navigator.clipboard.writeText` 包装捕获 `__copyCalls` | headless 页面无 document focus 时 `writeText` 抛 NotAllowedError（与安全上下文无关），主案不稳；包装法同时覆盖「图形列零写入」断言 | 是 |
| 9 | 附录 A 全文 | 骨架 + `location.reload` + 无就绪门 → 可执行脚本：CDP 传输层、就绪门（`getLayoutInfo` + `.ct-check-item--pass`）、`strokeRectOf/bands/hasBorder`、A0-A9 断言语义、node 侧过滤/退出码 | 追加约束要求脚本可直接执行；原骨架含「略」与不可执行的 reload 段 | 是 |
| 10 | 接口「伪代码（复制提取）」 | 直接 resolveCellContent → 首行 `CELL_COPY_EXCLUDED_TYPES.includes(column.type)` + record 空判 | check 列 items 带 `text: '✓'`（check.js:10-21），只靠 items 分支会复制出 '✓'；类型清单必须前置 | 是 |
| 11 | 接口 `resolveSelectionScroll` JSDoc、裁定 5 | 字段列表 → 绝对式公式 + `layout.fixedWidth`/`viewH` | layout 已提供 `fixedWidth`（layout.js:328）与 `viewH`（:319），原列表未点名，实施者易自行用 `colLefts[fixedCount]` 或漏 viewH | 是 |
| 12 | use-cell-select 契约、组装节 | 只写「非空挂 / 置空摘」→ 幂等 attach/detach + 连按时取 `el.scrollTop/scrollLeft` 实时值 + 9.5 可读键逐项核对 | 连按方向键时 layout 滚动值滞后（recomputeViewWindows 在 scroll rAF），左/上移判定会误判「已可见」；TDZ 属追加约束点名的高风险点 | 是 |
| 13 | 实施步骤（片 1-3、集成） | 概述式步骤 → 具体行锚 + 「分片断言键集」+ 集成复核（painter.js diff 仅 3 hunk、lint 含自检文件、停 demo watch） | 追加约束：实施清单须可直接照做，不留 T1 判断点 | 是 |
| 14 | 前置门、未解问题 1、被拒备选 2、三处行号 | 文字化门禁 → 可执行轮询脚本（含 self-checks 目录）；未解问题标注 decisions.md [设计/1]；修正过期引用 | 门禁原为自然语言，fast 角色需自行判断；行号/引用为事实小偏 | 否 |

## 未解决异议（累计）

无。
