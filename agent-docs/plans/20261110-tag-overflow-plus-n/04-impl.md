# 实施记录

## 改动文件

| 文件 | 设计步骤 |
|---|---|
| `src/components/table/ex/cell-paint/item-painters.js` | 1.1：文件头注释补 tag 列 +n 溢出汇聚；drawItems 签名增 `tagOverflowBadge = false`；layoutItemPositions 后插 plan 求值；start 实参改 `plan ? plan.groupWidth : offset`；循环上限 `limit`（循环体原样）；循环后 pill 绘制；新增私有 `tagOverflowPlanOf` / `drawTagOverflowPill`；drawItems 上方注释补 pill 说明 |
| `src/components/table/ex/cell-paint/cell-painters.js` | 1.2：drawContentItems 的 drawItems 实参增 `tagOverflowBadge: col.type === 'tag'`（:200） |
| `src/components/table/ex/cell-paint/cell-tooltip.js` | 1.3：导出 `isAutoTitle`（joinTooltipText 后）；resolveCellTooltip :225 改用（行为等价） |
| `src/components/table/ex/interaction/hit-test.js` | 1.4：新增私有 `isPointInRect` / `findTagOverflowPill`；resolveTooltipTarget 增可选 `itemHits` 与 plus 目标；JSDoc 增 @param itemHits 与 @returns plus 说明 |
| `src/components/table/ex/composables/use-cell-tooltip.js` | 1.5：新增 `isSameTooltipCell` / `findPlusEntry`；scheduleCellTooltip 传 `itemHits: host.paintState.itemHits`、去重改 plus 感知；showCellTooltip 过期守卫改 plus 感知 + plus 分支（isAutoTitle 门控、锚点 entry.rect、内容 entry.title）；import 增 isAutoTitle；@host-reads 补 paintState |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 2.1：checks 数组末尾新增 drawItems +n 块（溢出 k=2 / title:false 仍渲染 / 未溢出 / 无解回退） |
| `demo/src/data/table-ex/self-checks/interactions.js` | 2.2：checks 数组末尾新增 resolveTooltipTarget plus 块 |
| `demo/src/data/table-ex/main-view.vue` | 3.1：itemColumns「按钮（溢出）」后插 2 列（「标签（+n）」右对齐、「标签（+n·title:false）」，field 复用 tagsOverflow） |

无新增文件；无 scss 改动。git status 复核：本任务改动 = 上表 8 文件；工作区其余改动（form 调试、cell-content.js、table-ex.vue、docs/skills、上一任务 agent-docs）为基线内容，未触碰。

## 偏离

无。设计逐条落地，无方案改动。备注（非偏离）：1.4 完成判据 `grep -n "plus: true"` 实际命中 2 处——代码行 1 处 + JSDoc 注记 1 处，JSDoc 提及 `plus: true` 为设计原文明确要求的 @returns 补文，语义满足「命中 1」的代码行意图。

## 自检

命令与结果（均实跑）：

- 片1 完成判据 grep（全过）：
  - `grep -c "tagOverflowBadge" item-painters.js` = 3（≥2）
  - `grep -c "tag-overflow" item-painters.js` = 1（≥1）
  - `grep -n "tagOverflowBadge: col.type === 'tag'" cell-painters.js` = 1 命中（:200）
  - `grep -c "isAutoTitle" cell-tooltip.js` = 2；`raw !== true && raw != null` = 0
  - `grep -c "findTagOverflowPill" hit-test.js` = 2；`plus: true` 命中（见偏离备注）
  - `grep -c "isSameTooltipCell" use-cell-tooltip.js` = 3；`isAutoTitle` = 2；`isSamePoint(next, tooltipCell)` = 0
- `npx eslint --ext .js,.vue src` → exit 0（2 个 complexity warning：cell-tooltip.js resolveCellTooltip 11、use-cell-tooltip.js showCellTooltip 12 > 10，warning 不阻 exit 0，同 cell-tooltip complexity 12 既有豁免先例；设计风险节已预告）
- `npx eslint --ext .js,.vue src demo/src` → exit 0（同上 2 warning）
- `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` → exit 0
- A5 自检面板（`?bust=20261110impl1`，onMounted 首跑，未点重跑）：`自检结果（245/245 通过）`、`.ct-check-item--fail` 数 0；两个新块均在通过列表（✓[cell-painters] drawItems：tag 列 +n 溢出汇聚…、✓[interactions] resolveTooltipTarget：+n 汇聚 pill…）
- A4-1（`?scene=items&bust=20261110impl2`）：`getLayoutInfo().colWidths.length === 15`，前五 `[120,150,150,150,150]`
- A1+A2（row2 col3「标签（+n）」pill 位 = left+width−20）：中性移出后面板确认收起 → hover 等 700ms → `.mu-tooltip-panel` 存在且 display 'block'（命中即证明 pill 已渲染）；textContent = `溢出标签2；溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7；溢出标签8`，split('；') 7 项、序号连续、parts[0] ≠ '溢出标签1'、末项 '溢出标签8'、length 7 ∈ [1,7]、分隔符 '；' 与格级全文同字面
- A3（row1 col3 未溢出列 pill 位 hover 等 700ms）：面板不存在/display 'none' ✓
- A4-2（row2 col4 title:false 列 pill 位 hover 等 700ms）：无面板 ✓（裁决：渲染在 2.1 自检锁定，提示被抑制）
- A4-3（row2 col1 于 left+40 hover 等 700ms）：textContent 逐字 = `溢出标签1；溢出标签2；溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7；溢出标签8`（8 项全量，上一任务行为回归）
- A4-4（row2 col2 中心 hover 等 700ms）：textContent = `短；这是一条超长按钮文字标题溢出提示夹具` ✓
- A4-5（`?scene=default&bust=20261110impl3`）：col4 hover → longText 全文 `极长文本夹具：用于验证单元格文字溢出时悬停自动显示完整内容提示`；col5 hover 等 800ms → 无面板 ✓
- 控制台 error 仅 1 条：`ERR_INVALID_URL @ data:image/png;base64,AAAA1`，为既有负向夹具的无效 data URI（非本次改动引入）

每段 hover 前均执行中性移出（mouse.move(5,5) + 等 900ms）并确认面板收起（防面板指针拦截假 FAIL）；坐标均在滚动 scrollIntoView 后重取 getCellRect。

## 遗留

- eslint complexity warning 2 处（见上），与既有豁免口径一致，未新增抑制注释。
- 「标签（彩色）」row4（12 标签）等既有夹具格按设计预期出现 +n pill（行为扩面即任务目标），未逐格截图核对。
- 自检面板「重跑自检」预热后恒败为已知行为，本次只认首跑结果。
- 未 commit / 未 push / 未装依赖；文档（docs/docs-site/skills）未更新（任务约束）。
