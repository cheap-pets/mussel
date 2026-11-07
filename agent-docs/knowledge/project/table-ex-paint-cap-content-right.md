# table-ex 绘制收口：行带与 DOM 阴影统一 cap 至列内容区右缘

## 结论

一切横向越界敏感的绘制（行背景带/斑马/选中底色、head 滚动阴影）宽度统一 cap 至列内容区右缘视口 x（`contentRightXOf(layout)`，即 ΣcolWidths 对应位置）；cap 掉的延伸区补 `state.theme.bgNormal` 表格底色，不透出斑马/选中色。列总宽 ≥ 视口宽时 cap 不生效，行为不变。

## 来源

- src/components/table/ex/table-paint/paint-body.js（paintRowBandBackground）
- src/components/table/ex/table-ex.vue（headerShadowStyle computed）

## 注意

- head 滚动阴影不是 canvas 绘制：是壳内 DOM 投影条 `.mu-table-ex__header-shadow`（box-shadow 方案），CSS `width: 100%` 等于视口宽，窄列（ΣcolWidths < 表格宽）时越界，须经内联 style 下发 `width = min(stickyWidth, contentRightXOf(layout))` 收口。断言方式见 dom-shadow-canvas-imagedata-invisible。
- 新增绘制路径（色带、阴影类）不得以视口宽/`100%` 为宽度事实源，一律取 contentRightXOf 口径，避免窄列越界复发。
