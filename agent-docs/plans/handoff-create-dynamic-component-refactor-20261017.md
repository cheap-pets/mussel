# Handoff — createDynamicComponent 重构（render 实现）

> 2026-10-17。接续 `handoff-create-dynamic-component-20261017.md`，用户授权完全重构。

## Goal

以更优实现替换 `src/utils/vue.js` 的 `createDynamicComponent`：修复 dispose 非幂等、清理死代码，保持 notifier / message-box / tooltip 三处行为不变。此项已完成。

## Current State

- 已完成：`createApp` 方案改为 `createVNode + render`，三处调用方同步更新。
- 已验证：`npm run build`（dev + prod）通过；demo 包重建通过；Playwright 回归 `/message/`（并发 Alert 创建/关闭、notify 渲染）与 `/dropdown/`（组件与指令两种 tooltip 形态）均正常，无新增控制台错误。
- 未提交：工作区改动保留，等待用户决定是否提交。

## Key Context

- **决策：弃用 `createApp`，改为 `render` + 宿主 `appContext`**。与 `app.mount` 内部同路径（Vue 自己也是设置 `vnode.appContext = context` 后 `render`）。
  - 原实现 `Object.assign(app._context, hostApp._context)` 会把宿主的 `app` 字段、mixins、各类缓存一并写入新 app 的 context，语义上把动态 app 的 `context.app` 指回宿主；render 直接共享宿主 context，继承更准确。
  - dispose 天然幂等：`render(null, el)` 在 `el._vnode` 为空时是 no-op，另加 `disposed` guard。原实现二次调用会在 `container.removeChild(undefined)` 抛 TypeError。
  - 私有 API 面没有变大：仍依赖 `app._context` / `app._container`（Vue 无公开方式枚举全局组件 / provides），但已收敛到工具内部，调用方统一传 `app`。
- **已删除**：`options.el` 死分支（三处调用方均不传）、注释掉的 `renderComponent` 备选、notifier 中多余的 `!!`。
- **明确未做（范围外）**：宿主 app 卸载后 notifier / tooltip 的单例面板仍是孤儿 DOM + 存活实例。若后续要支持 SPA 反复 mount/unmount，可挂 `app.onUnmount(dispose)`（Vue 3.5.39 可用）；注意 message-box 是每实例 dispose，逐次注册 cleanup 会累积在 `pluginCleanupFns`（无注销 API），建议只对单例注册。
- **验证环境陷阱**：Playwright 页面 `visibilityState=hidden`，`TransitionGroup` 的 `nextFrame` 不执行，notify 离场元素会停在 `leave-active` 不消失。这是已有环境限制（见 knowledge pitfall），不要误判为本次重构回归；通知项实际已从状态移除。
- **文档未更新**：内部工具、无对外 API 变化；按项目规范未改 `skills/`、`docs/`、`docs-site/`。

## Changed Files

- `src/utils/vue.js` — `createDynamicComponent` 改为 `{ app, component, props }` + render 实现
- `src/components/message/notifier.js` — 调用方式同步
- `src/components/message/message-box.js` — 调用方式同步
- `src/components/tooltip/tooltip-core.js` — 调用方式同步

## Next Steps

1. Review 上述 4 个文件的 diff；如需提交，按项目 commit 规范，例如 `🔨: createDynamicComponent 改为 render 实现并幂等 dispose`。
2. 可选：决定是否实现宿主 `app.onUnmount` 清理（见 Key Context 的注意事项）。
3. 可选：评估是否把「动态挂载复用宿主 appContext 用 render 而非 createApp」沉淀进 `agent-docs/knowledge/`（patterns 或 tradeoffs）。

## References

- 前置分析（其“保留 createApp”结论已被本次决策取代）：`agent-docs/plans/handoff-create-dynamic-component-20261017.md`
- Vue mount 内部实现：`node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js`（`vnode.appContext = context`）
- 验证页面：`http://localhost:3000/message/`、`http://localhost:3000/dropdown/`
- 环境陷阱：`agent-docs/knowledge/pitfalls/playwright-hidden-page-resize-observer.md`

## Suggested Skills

- 无必须项。若执行第 3 步，使用 `project-knowledge` skill。
