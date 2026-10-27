# grid-template-rows 展开动画期间执行 scrollIntoView 会错位

## 结论

用 `grid-template-rows: 0fr → 1fr` 过渡做展开动画的容器（side-menu 组展开、同款配方的折叠面板），在触发展开的同一 tick 内 `nextTick` 后执行 `scrollIntoView` / `scrollIntoViewIfNeeded`，滚动目标按**动画中间态**的位置计算，最终落点错误（表现为"没滚到位"）。

发生了展开变化时，须等动画时长结束后再滚（实现取 `setTimeout(scroll, 200)` 对应 150ms 过渡）；无展开变化时可立即滚。

## 原因

nextTick 只保证 DOM patch 完成，`0fr → 1fr` 的插值还在进行中，目标元素的位置随插值持续变化；浏览器滚动 API 按调用瞬间的 getBoundingClientRect 计算。

## 注意

- 首次挂载另有一层延迟（side-menu 取 100ms，避开初始渲染抖动），与动画延迟是两回事。
- 验证方式：断言目标行 rect 完全落在滚动容器 rect 内，而不是只看 scroll 事件是否发生。
