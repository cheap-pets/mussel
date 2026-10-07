# Playwright 后台页面：rAF / ResizeObserver 停发，定时器节流

## 结论

Playwright MCP 的浏览器窗口处于后台/最小化时，页面 `document.visibilityState === 'hidden'`：

- 渲染帧暂停：`requestAnimationFrame` 不回调，`ResizeObserver`（含库内共享 RO → `sizechange` 事件）完全不派发——连新 `observe` 的初始回调也不发。
- `setTimeout` / `setInterval` 被节流：延迟对齐到秒级，页面后台超过约 5 分钟后进一步对齐到分钟级。依赖 interval 的周期逻辑（如 sizechange 的挂载状态清扫）在 wait 期间可能一次都不执行。

验证依赖 `sizechange`/RO 的行为时，用 `el.dispatchEvent(new CustomEvent('sizechange'))` 手动等价模拟：消费方（如 pagination 的 recalc）读的是真实 DOM 尺寸（clientWidth/getBoundingClientRect，同步可测），事件只承担"通知变化"职责，手动派发与 RO 派发链路等价。

验证依赖 interval 的周期逻辑（如挂载状态清扫）时，用 `page.clock` 假时钟驱动，不改源码常量、不依赖 `browser_wait_for`（等待期间页面随时可能转 hidden）：`browser_run_code_unsafe` 里先 `await page.clock.install()` 再导航，之后 `await page.clock.runFor(11000)` 精确触发周期回调——页面 hidden 下也照常执行（interval 回调是纯 JS，不依赖渲染帧）。

## 原因

Chromium 的 RO 回调在渲染阶段交付；页面不可见时渲染帧暂停，交付挂起。定时器走 Chrome 后台节流策略（budget-based throttling）。两者都不是库代码缺陷——用户切回标签页后浏览器会补发/补跑。

## 注意

- 排查顺序：先测 `document.visibilityState` 与 rAF 是否回调，再怀疑事件链路。本次排查中 handler 手动派发生效、独立 RO 探针零回调、refCount 正常，最后 rAF 探针定位到页面 hidden。
- `browser_tabs select` / `page.bringToFront()` 不一定让窗口前台化；窗口级后台需操作系统层面激活（实测 `bringToFront` 后仍为 `hidden`）。
- 微任务（Promise/nextTick）不受影响；`browser_evaluate` 执行期间页面必为活跃态，可利用这一点在 evaluate 内做短时等待采样。
- 站点选页：demo 首页（`/`）不加载库（无 `Element.prototype` patch、无 dev 计数、无 `Mussel` 全局），验证 mussel 行为必须用组件页（`/table/` 等）。选错页面时的现象是"补丁不在、手势上下文不建立"，容易误判为库缺陷。
- `page.clock.install()` 会同时接管页面的 `Date` / `setTimeout` / `setInterval` / `rAF`，它们不再自动前进（页面自身的 debounce/throttle 也停在原地）；只适合驱动"我方关心"的定时逻辑。
