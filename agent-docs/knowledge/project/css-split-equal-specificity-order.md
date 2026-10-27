# 集中样式拆分到各组件后，同特异性覆盖规则跨文件失效

## 结论

把一个集中式 `.scss` 拆到各组件就近维护时，凡原先依赖**同文件书写顺序**生效的同特异性覆盖规则（典型：根级状态类覆盖元素状态属性，如 `.mu-xxx--disabled .mu-xxx__item` 覆盖 `.mu-xxx__item[active]`，均 0,2,0），拆分后会随组件 import 顺序漂移而失效。

处理方式：把覆盖规则**随被覆盖的选择器一起搬进同一个文件**，并保持书写顺序（覆盖规则在后）；不要留在状态类所在文件里赌 import 顺序。

## 原因

- 集中式文件内，靠"写在后面"实现同特异性覆盖是隐式约定，lint 无法发现。
- 拆分后每条规则的去向由"语义归属"决定，顺序语义容易被忽略；vite 库构建按组件 import 顺序拼接 CSS，宿主侧顺序不可控。
- 两个选择器特异性不同（如 0,2,0 vs 0,1,0）则无此问题，顺序无关。

## 案例

side-menu 重构（side-menu.scss 拆为 side-menu / menu-item / popup-menu 三份）：`.mu-side-menu--disabled .mu-side-menu__item`（行弱化）留在 side-menu.scss，而 `.mu-side-menu__item[active]`（行高亮）进了 menu-item.scss —— 拼接后 `[active]` 在后，禁用态盖不住激活高亮。修复：行弱化规则移入 menu-item.scss 置尾（根态类 `.mu-side-menu--disabled` 本体仍留在 side-menu.scss，仅 `pointer-events`）。

## 注意

- 拆分前先扫一遍待拆文件中互相同特异性的"覆盖对"（状态修饰类 vs 元素属性选择器是高发区）。
- 验证须覆盖"叠加态"（禁用 + 激活同时存在），单一状态各测一遍发现不了。
