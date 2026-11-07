# table-ex hover 高亮与脏区随合并区域联动

## 结论

hover 高亮与指针脏区必须同批按合并区域联动，仅改一处会漏高亮或残影：

- 绘制侧：paintHoverHighlight 的行/列带几何取 `spanRectOf(layout, spans, record, row, col)`——合并格取区域包围盒（跨合并的行/列），普通格回退物理格矩形原式；宽/高 cap（contentRightXOf/contentBottomYOf）与行带/列带语义不变。
- 脏区侧：use-pointer `hoverRegions` 列带失效区间按 `regionAt(spans, row, col)` 的 `[colFrom, colTo)` 取，无区域回退 `[col, col+1)`；唯一调用点 updateHover 传 `ctx.spans.value`。

## 来源

- src/components/table/ex/table-paint/paint-overlay.js paintHoverRow/paintHoverCol/paintHoverHighlight
- src/components/table/ex/composables/use-pointer.js colBandRegionsOf/hoverRegions（20261106 修复）

## 注意

- hoverBg 半透明（theme.js translucent 色）：禁止"物理带 + 区域矩形补画"方案，交叠处两次混色变深；区域矩形须一次性替代物理带几何。
- cell 模式经 spanRectOf 天然在合并区域内，无需额外处理。
- 无 spans（未启用合并）时两处均退化为物理格原式，零行为差异。
