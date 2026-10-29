# table-ex relayout 后不精算，格线停留估高

## 触发特征

替换 records / 切换夹具场景后，行高与格线位置不随多行内容变化（停留估高，多行文本列恒按 1 行估）；滚动 1px 后立即跳为精算高度。估高不可滚动时精算链完全不可达，格线恒错。

## 根因

`relayoutAndRedraw`（src/components/table/ex/table-ex.vue）结尾只 relayout + redraw，无 `remeasureVisibleRows`，行高停留在 row-geometry.js 估高下界。精算仅由 scroll 事件、编辑提交、主题刷新（onThemeChange 先例）触发。

## 做法

- 错误：新增会改变行高的数据路径只调 `relayoutAndRedraw`。
- 正确：行高可能变化时，relayout 后接「remeasure + recompute + redraw」三连（参照 onThemeChange）。

## 来源

src/components/table/ex/table-ex.vue、src/components/table/ex/row-geometry.js
