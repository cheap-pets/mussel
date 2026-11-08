# table-ex itemHits 修剪豁免集与帧内容解耦

## 结论

`paint-body.js trimItemHits` 修剪 itemHits 时，锚行豁免判定的唯一依据是本帧 `beginSpanFrame(state.spans)` 传入的锚行集合（spanKeepRows 单例），与帧类型（整幅 / header / 行带 / 其他脏区）及该帧实际绘制的行范围无关：`row < start || row >= end` 越窗的锚行，只要在本帧 spanKeepRows 内即保留条目。改 itemHits 修剪逻辑时勿按"本帧画了哪些行"推断豁免范围。

## 来源

- src/components/table/ex/table-paint/paint-body.js（trimItemHits / beginSpanFrame）
- src/components/table/ex/table-paint/painter.js（endSpanFrame 消费）
- 修复任务记录：agent-docs/plans/20261108-table-bugfix-pipeline/（问题 3，peer 评审 M1）

## 注意

- 修复前豁免条件 `row >= end && keepRows.has(row)` 不可达：region pass 绘制的区域锚行恒 `< viewRows.end`，导致合并区域锚行滚出窗口上方后区域内 link/tag/button 命中丢失。
- 自检覆盖：demo/src/data/table-ex/self-checks/painter.js 末尾 20261108 问题 3 断言（整幅/header/行带三帧类型）。
