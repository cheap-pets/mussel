# Teleport 弹层与宿主组件的 CSS 变量级联断裂

## 结论

组件内经 `Teleport` 挂到 `$mussel.rootElement` 的弹层（tooltip-panel / dropdown-panel / side-menu-popup），脱离宿主组件的 DOM 子树，宿主类上声明的组件级 CSS 变量（如 `.mu-side-menu` 上的 `--mu-side-menu_*`）对弹层内元素**不生效**。

弹层自身的类必须重复声明所需变量的默认值，使用方可按同名单独覆盖。

## 原因

CSS 自定义属性沿 DOM 树级联。Teleport 把弹层移到 `.mu-root` 下，宿主与弹层变为兄弟节点，宿主上定义的变量无法到达弹层内的行/图标等元素——`var()` 解析失败后对应声明整条失效（如 `min-height: var(--mu-side-menu_item-height)` 失效导致行高塌成内容高）。

## 注意

- 变量重复声明只放"弹层内实际用到的"（side-menu-popup：indent / item-height / popup-width / popup-gap），与宿主保持同值。
- 主题/暗色变量（`--mu-*` 全局系）不受影响——它们定义在 `.mu-root` / `.mu-dark` 上，弹层仍在该子树内。
- 新增带 Teleport 弹层的组件时，把"弹层内用了哪些宿主变量"作为检查项，Playwright 断言弹层内行高/缩进可兜住此类回归。
