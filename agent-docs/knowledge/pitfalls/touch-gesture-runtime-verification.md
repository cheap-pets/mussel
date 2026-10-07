# 桌面环境下触摸手势的运行时验证

## 结论

桌面 Chrome 无 `'ontouchstart'`，`src/events/touch/index.js` 的注册门槛不通过 → 手势类型（tap / press / pan\*）的拦截器完全不注册，直接 `el.addEventListener('tap', f)` 不会建立手势上下文（`el.__mussel_gesture` 为空），手势代码在桌面无法运行时验证。

绕过办法：导航前伪造门槛 + 手动派发合成触摸事件，无需触摸设备或 CDP 模拟。

## 方法

1. 预置门槛（必须在库脚本执行前生效）：
   `await page.addInitScript(() => Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true, writable: true }))`
   随后导航到**加载库的组件页**（demo `/` 首页不加载库，见 [Playwright 后台页面…](./playwright-hidden-page-resize-observer.md)）。
2. 合成触摸事件：识别器只读 `touches / targetTouches / changedTouches`，touch 对象需带 `identifier / target / screenX / screenY / pageX / pageY`。用 `CustomEvent` 挂上这些属性后 `dispatchEvent` 与真实链路等价（`evaluate` 里做）：
   - `touchstart`：`touches = targetTouches = [t]`，`changedTouches = [t]`
   - `touchend`：`touches = targetTouches = []`，`changedTouches = [t]`
3. press 等按时长识别的用例走 `setTimeout`（750ms 阈值 + 775ms 复核），用 `page.clock.runFor(900)` 驱动。
4. 断言用 DOM 数据：`el.__mussel_gesture`（`GESTURE_CONTEXT_PROP`）存在性判断 bind / unbind，`ctx.listeners` 判断各手势类型的清账（含"移除某类型最后一个监听后 `ctx.listeners` 的键"）。

## 注意

- 手势状态机是页面级共享（`gs.activeElement` / `gs.activeGesture`）：一次成功的 press 识别会把后续 tap 挡掉（`activeGesture` 不匹配即 `continue`）。同一元素连续验证多种手势时，把 press / 长按用例放到最后，或换新元素。
- 曾尝试 CDP `Emulation.setTouchEmulationEnabled` 绕门槛：MCP 下 `page.context().newCDPSession` 被拒（`Target.attachToBrowserTarget` Not allowed），该路不可用。
