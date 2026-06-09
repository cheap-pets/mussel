# splitter 拖拽范围计算 (calcSiblingSizeLimit)

## 计算逻辑

返回 `{ targetEl, min, max }`:

- **min** — targetEl 的 `min-width/height`（CSS 属性，默认 0）
- **max** — `Math.min(cssMax, totalSize - otherMin)`

其中:
- `totalSize = prevEl.clientWidth + nextEl.clientWidth`（prev + next 尺寸总和）
- `otherMin` — 对侧面板的 `min-width/height`
- `cssMax` — targetEl 的 `max-width/height`（CSS 属性，默认 Infinity）

## 设计决策

1. **用 `prev + next` 而非容器总尺寸**: 拖拽本质是 prev 和 next 之间的空间再分配，center/splitter/padding/gap 尺寸不变，用两者之和避开所有干扰项。
2. **用 `clientWidth` 而非 `offsetWidth`**: clientWidth 不含 border。外部样式可能给面板加 border，offsetWidth 会偏大。
3. **center 的 flex-basis 不直接参与计算**: center 在 prev+next 和不变时自动吸收剩余空间，不需要额外约束。
