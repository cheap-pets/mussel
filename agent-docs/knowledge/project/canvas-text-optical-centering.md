# canvas 文本光学居中锚 centeredTextAnchor

## 结论

cell-painters.js 内 `centeredTextAnchor` 统一文本垂直居中：textBaseline 用 `'alphabetic'`，y = centerY + (fontBoundingBoxAscent - fontBoundingBoxDescent) / 2；`fontBoundingBox*` 缺失时回退 `'middle'` 原行为。tag/button/progress 等 fillText 站点统一走该锚，新增绘制站点勿再手写 `'middle'`。

## 来源

src/components/table/ex/cell-painters.js；demo/src/data/table-ex/self-checks/cell-painters.js

## 注意

- `'middle'` 按 em box 中点取基线，CJK ink 中心偏上 1~2px；与 DOM flex 光学居中口径不同，像素断言以 ink 中心为准（|偏移| ≤ 1px）。
- 度量口径随 `textBaseline` 取值变化，自检采样须与锚同口径。
