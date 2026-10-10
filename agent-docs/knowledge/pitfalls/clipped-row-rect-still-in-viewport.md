# 被滚动裁剪容器滚出的行 rect 仍在视口内

## 结论

`isElementInViewport`（`src/utils/dom.js`）只对窗口边界求交。行元素被最近滚动裁剪容器（本项目内为 `mu-scroll-box`：菜单 body / 弹层面板 body）滚出可见区后，`getBoundingClientRect` 仍可能落在视口范围内 → 误报可见。锚点可见性判定须再加一层与裁剪容器可见矩形的求交（side-menu-popup 的 `isAnchorVisible`：`el.closest('.mu-scroll-box')` 取裁剪矩形后相交测试）。

## 原因

`getBoundingClientRect` 返回布局位置，不受 `overflow: hidden/auto` 裁剪影响；容器滚出区的行 rect 位于容器外、但可能仍在窗口内。side-menu 弹层跟随锚点重定位时若只查视口，会出现「锚点行已滚没、弹层跟随残影或滞留」。

## 注意

- 通用场景应对所有 `overflow != visible` 祖先求交（或用 IntersectionObserver）；本项目锚点行必然位于唯一的 `mu-scroll-box` 内，`closest` 单层即可。
- 部分可见（行跨容器边缘）仍算可见——与 hover 可达性一致，勿把部分相交判为不可见。
