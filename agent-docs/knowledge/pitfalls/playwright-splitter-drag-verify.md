# Playwright 模拟 splitter 拖拽：真实 mouse + scrollIntoView + 方向语义

## 触发特征
- 合成 `PointerEvent` 拖拽 mu-flex-splitter 无效，元素无 `active` 属性、面板宽度不变。
- `boundingBox()` 坐标为负或超出视口时 `page.mouse` 操作不命中目标。

## 根因
- splitter.vue `onPointerDown` 调用 `setPointerCapture(event.pointerId)`，合成事件 pointerId 无活跃指针抛 NotFoundError，后续 window 监听器未挂载（真实 CDP mouse 无此问题）。
- CDP mouse 在视口外坐标不产生有效 hit-test。
- collapse-only 分隔条（resizable 缺省 false）不走 resize 路径：拖动按方向触发折叠，target=prev 时向左（负 delta）折叠左侧面板、向右展开，阈值 40px。

## 做法
- 错误：`el.dispatchEvent(new PointerEvent('pointerdown', ...))` 模拟拖拽。
- 正确：`scrollIntoViewIfNeeded()` 后取 boundingBox，用 `page.mouse.move/down/move/up`（真实输入）；断言 resize 改宽须选 resizable: true 的分隔条，断言折叠用 collapse-only 并向 prev 面板方向拖。
- 可绕过：evaluate 中临时 `Element.prototype.setPointerCapture = () => {}`，但拖拽路径仍以真实鼠标为可靠。

## 来源
- src/components/layout/splitter.vue（setPointerDown / setPointerCapture / PREVIEW 与 COLLAPSE 阈值）
- demo 重构批次 7 验证（2026-10-20）
