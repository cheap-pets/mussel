# table-ex tag 列 +n 溢出汇聚 tag

## 结论

- tag 列 pill 放不下时，绘制层在末尾渲染灰色 `+n` pill（n = 未显示标签数；宽度预算不足等无解场景回退现状不渲染）。
- 绘制入口：`item-painters.js` drawItems 增 `tagOverflowBadge` 参数（仅 tag 列开，`cell-painters.js` 按列门控）+ 私有 `tagOverflowPlanOf` / `drawTagOverflowPill`；pill 命中矩形随绘制帧携带剩余项全文。
- hover 编排：`hit-test.js` resolveTooltipTarget 增可选 `itemHits` 与 plus 目标 → `use-cell-tooltip.js` plus 分支（去重/过期守卫按 plus 感知比较）。
- 与格级溢出 tooltip 按指针位置互斥；`+n` tooltip 受 `title: false` 同口径抑制（`isAutoTitle` 单一真值，渲染与提示分离——pill 仍渲染，仅不出 tooltip）。

## 来源

src/components/table/ex/cell-paint/item-painters.js、cell-painters.js、cell-tooltip.js、interaction/hit-test.js、composables/use-cell-tooltip.js（worktree 2026-11-10，未提交；叠加在溢出 tooltip 任务之上）

## 注意

- 验证：`/data/table-ex/?scene=items` row2「标签（+n）」列灰色 +7 pill → tooltip 7 项 `；` join；row1 无 pill 无 tooltip；`title:false` 列 pill 有、tooltip 无。
- hover 断言须「中性移出 + 等面板 display:none」（pointer-events:auto 面板物理遮挡相邻格，直接移入假 FAIL）。
- hit-test.js / item-painters.js 各 1 条 eslint complexity warning（12>10），设计真值矩阵所致，已知豁免。
- 回滚：改动清单 8 文件中 main-view.vue 与两个自检文件同时含溢出 tooltip 任务改动，只撤本任务新增块/列，勿整文件还原。
