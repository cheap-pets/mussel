# 项目知识

> 按 project-knowledge skill 规范维护：新知识写入 `pitfalls/`、`patterns/`、`conventions/`、`constraints/`、`tradeoffs/` 子目录，并在此索引登记。方案/规划类文档归 `agent-docs/plans/`，不入知识库。

## Patterns

- [sizechange 事件：监听元素尺寸变化](./patterns/sizechange-event.md)
  共享 ResizeObserver + prototype patch 实现的 `@sizechange`，禁止直接 new ResizeObserver；注意首挂即触发一次、不冒泡、卸载不解绑。

## Pitfalls

- [Teleport 弹层与宿主组件的 CSS 变量级联断裂](./pitfalls/teleport-popup-css-vars.md)
  弹层 Teleport 到 root 后宿主类上的组件级 CSS 变量不生效，弹层类须重复声明默认值。

- [grid-template-rows 展开动画期间执行 scrollIntoView 会错位](./pitfalls/scroll-during-grid-rows-animation.md)
  nextTick 后立即滚动按动画中间态计算，须等动画时长结束后再滚。

- [Vue 卸载元素不会移除模板事件监听](./pitfalls/vue-unmount-no-listener-removal.md)
  Vue 3 卸载时不调 removeEventListener（unmount 只 hostRemove），"卸载自动解绑"假设不成立，依赖记账的观察机制不会归零。

- [Playwright 后台页面：rAF / ResizeObserver 停发，定时器节流](./pitfalls/playwright-hidden-page-resize-observer.md)
  浏览器窗口后台时页面 hidden，渲染阶段 API 停发、setTimeout/setInterval 被节流；验证 sizechange 用手动 dispatch 等价模拟，验证 interval 周期逻辑改用 `page.clock` 假时钟驱动（不改源码常量），验证页须选加载库的组件页（demo `/` 首页不加载库）。

- [flex 压缩截断破坏 rect 内容宽测量](./pitfalls/flex-ellipsis-breaks-rect-measurement.md)
  `overflow: hidden` 使 flex item 最小宽度归零、行溢出时被压出省略号，rect 跨度随之缩小；实测内容宽须用 Range 补回文本自然宽并计入首尾子元素 margin。

- [桌面环境下触摸手势的运行时验证](./pitfalls/touch-gesture-runtime-verification.md)
  桌面 Chrome 无 `'ontouchstart'` 导致手势拦截器不注册；伪造门槛（addInitScript）+ 合成触摸事件 + `page.clock` 驱动长按计时，可在桌面完整验证 tap / press 与 bind/unbind 清账。

- [inert 子树内元素不参与 hit-test](./pitfalls/inert-subtree-no-hover-no-click.md)
  inert 元素整棵子树不匹配 `:hover`、鼠标事件不派发；hover 显现/可点的附属元素（如收藏星标）移入 inert 行内即失效，置于 inert 容器外不受影响。

- [grid 0fr 收缩轨道计入 item margin](./pitfalls/grid-0fr-track-margin-leak.md)
  `grid-template-rows: 0fr` 收起动画中 item 的 margin 泄漏进轨道尺寸（收起残留空隙）；间距须放进 overflow hidden 裁剪区内的首子元素上。

- [grid 过渡中 auto 轨道被 fr 插值隆起](./pitfalls/grid-auto-track-fr-transition-bump.md)
  `auto 0fr ↔ auto 1fr` 过渡中 content-based 轨道每帧按 fr 中间态重解析、钟形膨胀（行内内容抖动）；首轨道须用确定长度或单 fr 轨道独立成动画容器。

- [watch immediate 回调的 TDZ 陷阱](./pitfalls/watch-immediate-callback-tdz.md)
  `immediate: true` 回调在 watch() 返回前同步执行，回调内引用 unwatch 句柄或后置声明变量会 ReferenceError；标志前置 + nextTick 停表。

- [级联延时收起：hide 不可向上清祖先计时器](./pitfalls/cascade-delay-hide-clears-ancestor-timer.md)
  整链同延时臂定后先触发的 hide 若向上清，会取消祖先未触发的计时器、链滞留成孤儿；hide 只清自身，向上清仅限 mouseenter 保活与 delayHide 重臂。

- [响应式 style patch 异步：递归重定位读到旧 rect](./pitfalls/reactive-style-patch-vs-recursive-rect-read.md)
  同步递归链中子层读父面板内锚点 rect 时，父面板样式尚未 patch 落地；递归前须清旧键后同步 Object.assign(el.style, style)。

- [被滚动裁剪容器滚出的行 rect 仍在视口内](./pitfalls/clipped-row-rect-still-in-viewport.md)
  `isElementInViewport` 只查窗口边界，被 `mu-scroll-box` 裁剪滚出的行误报可见；锚点可见性须再与裁剪容器可见矩形求交。

## Constraints

- [国际化：locale 无响应式，运行时不可切换](./constraints/langs-locale-not-reactive.md)
  locale 仅安装时确定一次，无响应式来源；依赖文案宽度的计算不必为"切语言"预留重算路径。
