# fixed 弹层 right/bottom 定位基准不含滚动条

## 触发特征

`position: fixed` 弹层按 `right`/`bottom` 属性定位的侧（即面板落在锚点 left/top 侧）整体偏移一个滚动条宽度：页面有垂直滚动条时 `left` 侧多出 ~15px，有水平滚动条时 `top` 侧多出 ~15px；用 `left`/`top` 属性定位的侧正常。

## 根因

`window.innerWidth/innerHeight` 含经典滚动条；fixed 元素 `right`/`bottom` 的解析基准是布局视口（`document.documentElement.clientWidth/clientHeight`，不含滚动条）。以 innerWidth 推算 `right` 值会整体偏移 scrollbar 宽。锚点 `getBoundingClientRect()` 与 clientX 同系（相对视口），不受影响，仅视口总量取错。

## 做法

- 错误：`const { innerWidth, innerHeight } = window` 后推算 `right`/`bottom` 值。
- 正确：统一取 `document.documentElement.clientWidth/clientHeight` 作为视口宽高（主轴空间、交叉轴 clamp 同步替换），与 fixed 定位基准一致。

已修（均改为 documentElement.clientWidth/clientHeight）：`tooltip-panel.vue`、`dropdown-panel.vue`、`context-menu.vue`、`popup-menu.vue`（calculateVerticalPosition / calculateHorizontalPosition 两处）。全库剩余 innerWidth/innerHeight 用法仅 `utils/dom.js` isElementInViewport（可见性判定，不写定位值，属容差）。

既有独立问题（未修）：context-menu.vue 用 pageX/pageY（文档坐标）定位 fixed 面板，页面滚动后定位整体偏移 scrollX/scrollY，与滚动条基准无关。

## 来源

src/components/tooltip/tooltip-panel.js updatePosition；Playwright 实测（3440 宽视口 + 15px 滚动条，left 侧 gap 24 → 修复后 9）。
