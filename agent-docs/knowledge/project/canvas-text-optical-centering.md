# canvas 文本光学居中锚 centeredTextAnchor

## 结论

cell-paint/cell-text.js 导出的 `centeredTextAnchor` 统一文本垂直居中：临时切 `textBaseline='alphabetic'` 测 CJK 探针字符 `'永'`（`CJK_PROBE_CHAR`）的 `actualBoundingBoxAscent/Descent`，offset = `Math.round((ascent - descent) / 2)`，y = centerY + offset、baseline `'alphabetic'`。度量缺失/非有限/墨迹零高 → 回退 `{ y: centerY, baseline: 'middle' }` 原行为。字形级站点（iconfont glyph、✓）走 `centeredGlyphAnchor`（逐字形同公式，`inkHalfDiffOffsetOf` 共享）。新增绘制站点勿再手写 `'middle'`。

度量模块级全局缓存：`textAnchorCache` 键 = ctx.font（不可探测时 `stub:` 前缀），`glyphAnchorCache` 键 = 能力前缀 + glyph + '\u0000' + ctx.font，同字体/字形不重测；`document.fonts.status !== 'loaded'` 时即用即弃不写缓存（防固化回退/tofu 度量），fonts ready 后稳态零重测。能力探测按 ctx 实例缓存（`__muTextAnchorCapable`）。

## 来源

src/components/table/ex/cell-paint/cell-text.js；demo/src/data/table-ex/self-checks/cell-painters.js

## 注意

- 换墨迹半差的原因：fontBoundingBox 半差在部分系统字体下与 CJK ink 中心偏差 1~2px 且随系统漂移；actualBoundingBox 随当前系统实测，跨系统一致。
- `actualBoundingBox*` 读数随 textBaseline 变化，测量须固定 alphabetic；自检采样与锚同口径，像素断言以 ink 中心为准。
- fonts 未 loaded 窗口内每次绘制重测（量级 = 可见站点数），换取不固化回退/tofu 度量；widthCache 同病不扩大处理。
