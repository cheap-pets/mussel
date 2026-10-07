# sizechange 事件：监听元素尺寸变化

## 结论

需要监听某元素自身尺寸变化时，模板上直接 `@sizechange="handler"`，不写任何注册代码。组件内需要尺寸变化回调时禁止直接 `new ResizeObserver`，统一走本机制。

## 原因

实现在 `src/events/` 三个文件协同：

- `interceptor.js`：patch `Element.prototype.addEventListener / removeEventListener`。为某事件类型注册 interceptor 后，元素上首次 add 该类型监听时调 `interceptor.add`（`this` = 元素）、remove 时调 `interceptor.remove`——由此实现"有监听才观察"的按需挂载。
- `resize.js`：为 `sizechange` 注册 interceptor。模块级共享单个 `ResizeObserver`，per-element 引用计数（`Symbol.for('mussel.event.resize.count')` 挂在元素上）：计数 0→1 时 `observe`，减到 0 时 `unobserve`。RO 回调在**目标元素自身** dispatch `CustomEvent('sizechange')`。
- `custom-event.js`：`dispatchCustomEvent`，事件不冒泡、cancelable。

patch 的生效时机：`src/index.js` re-export `EventInterceptor` 时连带 import `events/index.js` → `./resize`，库入口加载即完成 patch，早于任何组件挂载。

共享单例 + 引用计数是有意设计（见 tooltip、dropdown-panel 方案文档中的决策）：避免每个消费方各建 RO 实例、各管生命周期。

## 注意

- **首次监听立即触发一次**：ResizeObserver observe 初始即回调，挂上监听就会收到一次当前尺寸的事件，可兼作初始化计算时机（pagination 的按钮数计算依赖此特性）。
- **不冒泡**：只能在目标元素上监听，不能委托到父级。
- **触发条件是元素自身 box 尺寸变化**：内容溢出但 box 尺寸不变不会触发；webfont 迟到导致字宽变化等场景需另行兜底（如 `document.fonts.ready`）。
- **引用计数与解绑**：同元素多个监听时，最后一个 remove 才真正 unobserve；解绑**只由显式 `removeEventListener` 驱动**。Vue 3 卸载元素/组件时不会移除模板监听（详见 [Vue 卸载元素不会移除模板事件监听](../pitfalls/vue-unmount-no-listener-removal.md)），卸载后元素仍被 observe——detached 状态回调惰性，是否被回收取决于浏览器对 detached 被观察目标的 GC 策略（规范未规定，不能依赖）。需要确定性释放的组件须在卸载钩子里显式 remove（现网唯一真正触达 unobserve 的是 scrollbar 指令）。
- **`once` / `signal` 自动移除不记账**：浏览器触发的自动移除（`{ once: true }`、`options.signal.abort()`）不经过本机制，计数悬挂、元素保持 observe；`@sizechange.once` 同理。
- **无内置节流**：每次 RO 回调直接派发，消费方自行 throttle/debounce（pagination 用 50ms throttle，scrollbar 走 30ms 档）。
- **SSR 安全**：`ResizeObserver` / `Element` 不存在时全部 no-op。
- handler 拿到的是 CustomEvent，尺寸需自行读 `event.target.clientWidth` 等。

现有消费方（改机制时回归）：pagination、dialog、tooltip-panel、combo-wrapper、date-range-picker、scrollbar。
