# canvas-table 前台性能验证：原型劫持计数 + props 直替 + lastRelayout

## 结论

- 计数：劫持 `CanvasRenderingContext2D.prototype.measureText / setTransform`（可写），包 counter 后复原；measureText 计数反映测量缓存真实底层调用（缓存命中不计）。
- 注入大数据/列：`document.querySelector('.mu-canvas-table').__vueParentComponent.props.records / columns / placeholder / fixedLeftColumns` 直替；props watch 异步 flush，赋值后须 `setTimeout ≥ 60ms` 再读结果。
- 耗时归因：`getLayoutInfo().lastPaint.elapsed` 只覆盖 paint()；relayout 阶段（估高扫描/几何重建）看 `getLayoutInfo().lastRelayout = { elapsed, scanCount, rebuild }`，scanCount 0 = 估高签名命中跳过扫描。

## 陷阱

- `getCellRect(row, col)` 返回当前滚动位置下的视口坐标：目标列在视口外（colLefts[col] 超出画布宽）时像素采样/点击落空；目标行不在 viewRows 内时 invalidate 被窗口校验拒绝，hover 计数得 0 的假象——测前先复位 scrollTop/scrollLeft 并核对 viewRows。
- MuInput 编辑器的 Enter 提交不响应合成 `KeyboardEvent`（dispatchEvent），须 playwright 真实键盘 `page.keyboard.press('Enter')`。
- canvas 像素断言数亮度暗像素（lum < 100），不数 alpha 通道：行底色不透明，alpha 恒饱和全命中。

## 来源

src/components/canvas-table/canvas-table.vue（getLayoutInfo/lastRelayout）、demo/src/data/canvas-table/main-view.vue（调试面板），2026-10-26 canvas-table 优化验证实测。
