# table-ex recordsVersion 行高粘性契约（精算缓存快照跳过）

## 结论

- 滚动帧 `remeasureVisibleRows` 按行快照 `{ height, indent, recordsVersion }` 跳过已精算行：几何值 === 缓存值且行版本一致才跳过；`recordsVersion` 未变时不重算。
- 就地修改 records 后行高要更新，**必须 `recordsVersion++`**（树开合、编辑提交等内部路径已接线）——这是精算缓存跳过成立的前提，漏 bump 的表现：就地改长文本后行高不变、滚出再滚回仍旧行高。
- records 替换（引用新）、列宽/字体度量签名变化、spans 变化、列定义变化各有独立失效链，使用方无需干预；快照与树缩进快照是正确性前置，改动须同批验证树模式。

## 来源

src/components/table/ex/row-geometry-controller.js（remeasureVisibleRows / syncMeasuredHeightCache）、table-ex.vue 合并 watch（recordsVersion 接线），code@worktree(2026-11-05)。
