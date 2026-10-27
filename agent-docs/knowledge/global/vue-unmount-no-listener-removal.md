# Vue 卸载元素不会移除模板事件监听

## 结论

Vue 3 在元素/组件卸载时**不会**对模板监听（`@event`）调用 `removeEventListener`。任何"组件卸载会自动解绑 DOM 监听"的假设都不成立；需要确定性清理时必须显式移除。

## 原因

实测（Vue 3.5.39，demo modal 页）：

- `dispose-on-hide` dialog 的 Teleport 子树卸载后，带 `@sizechange` 的 mask 元素 `isConnected=false`，但 `removeEventListener('sizechange')` 从未被调用（元素上挂的引用计数保持为 1）。
- `app.unmount()` 整树销毁结果相同（唯一一条移除来自 `v-mu-scrollbar` 指令自管解绑的 body 元素）。
- 源码侧吻合：Vue 卸载路径只对元素做 `hostRemove`，不 patch props；runtime-dom 里面向用户监听的移除只发生在 `patchEvent` 把监听置空时（如重渲染移除绑定）。

## 注意

- Vue 的依据是"元素脱离 DOM 后监听随元素成为垃圾"；但对把监听当资源记账的机制（如 `sizechange` 的 ResizeObserver 观察）是致命的——卸载后记账不会归零，观察与引用不会释放。detached 元素无 box 变化，RO 回调为惰性，但观察状态本身一直保留。
- 观察中的 detached 元素是否随 GC 回收，规范未规定、浏览器实现有差异，不能依赖；需要确定性释放的场景，在组件卸载钩子（`onBeforeUnmount`/`onUnmounted`）或指令 `unmounted` 里显式 `removeEventListener`（参考 `scrollbar.js` 的 `ctx.remove`）。
- 该行为只针对 DOM 实例监听；组件自定义事件（`emit`）的监听随组件销毁正常失效，两者不要混为一谈。
