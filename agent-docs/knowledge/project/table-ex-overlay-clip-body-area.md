# table-ex 覆盖层绘制须裁剪到表体区

## 结论

painter 分区 5（paintOverlay/paintHoverOverlay）绘制分两类口径：

- hover 行带/列带：统一 withClip 到表体区 `[0, headHeight, stickyWidth, stickyHeight - headHeight]`（y 向），且刻意**横穿固定列**（x=0 起画，不裁固定列区）。
- 选中描边（paintCellSelection）：须 withClip 同时裁表体区 y 向**与固定列区**（x 向 `clipX0 = selected.col < fixedCount ? 0 : fixedWidth`）——固定列在分区 5 之后不重绘，描边滚入固定列覆盖区会压在固定列上。

分区 5 在分区 4（表头）之后绘制，hoverBg 为半透明色（`--mu-gray-translucent`），高亮矩形按视口 y 起画，行滚入表头后会溢入表头叠色。在分区 5 内新增绘制项（描边/图标/参考线除外）同样必须遵守对应裁剪。

## 来源

- src/components/table/ex/table-paint/painter.js paintHoverOverlay（20261031 修复）
- src/components/table/ex/table-paint/paint-overlay.js paintCellSelection（20261106 固定列选中框修复）
- 脏区路径差异：行带/列带/单格/调宽入口的外层 clip 已把 y 收敛到 ≥ headHeight，唯 paintFull（滚动 redraw 走整幅）无外层收敛，溢出仅在该路径可见。

## 注意

- 调宽参考线（resizeGuideX）刻意全高（穿过表头），不在裁剪内。
- 表头底色 `--mu-bg-fill` 本身不透明（gray-1 hex），"半透明叠加"观感来自分区 5 的半透明 hoverBg 画在表头之上，不是表头底色半透明。
- 指针驱动 `colAt` 固定列优先，完全滚入固定列的格不可能被选中/命中；描边压固定列仅"部分滚入"的窄条场景可见。
