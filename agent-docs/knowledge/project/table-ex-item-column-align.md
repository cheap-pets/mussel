# table-ex 条目列对齐协议

## 结论

- 列 align（left/center/right）在 canvas 条目路径三处消费，命中矩形（itemHits）x 随对齐同步平移：
  - button 组（pill 与 column.link 两形态共用 drawButton）：两遍式——`layoutButtonEntries` 左缘起逐条省略计宽（截断/哨兵行为与左对齐基线一致），再 `itemsStartX` 平移起点（center 扣 rightInset）。
  - link 列竖排（drawLinkItems）：每条独占一行、按省略后实宽经 `alignedEntryX` 各自对齐（对齐 DOM 版 td `text-{align}` 作用于每行 inline 条目的语义）。
  - tag/其余横排 items（drawItems）：整组按 `itemsStartX` 分布。
- progress 为整宽轨道，无对齐语义，不消费 align。
- button 组末条宽被 `min(全宽, 右缘剩余)` 封顶 ⇒ 组总宽恒 ≤ 内容宽，itemsStartX 超宽回退分支在 button 上不可达（保留调用仅为口径统一）。

## 来源

src/components/table/ex/cell-painters.js（drawButton / drawLinkItems / itemsStartX / alignedEntryX），20261104 修复 button/link 列 align 不生效。

## 注意

- 第一遍测量恒从左缘起：对齐平移仅发生在未超宽时，全宽条目平移后仍放得下，不改变截断结果。
- 新增条目绘制路径时，对齐与 rightInset 扣减须与上述三处同口径，命中回报矩形必须用对齐后 x。
