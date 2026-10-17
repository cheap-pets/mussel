# Handoff — createDynamicComponent 加固方案

> 2026-10-17 分析会话产出。本会话只做了分析评审，未改任何代码。

## Goal

加固 `src/utils/vue.js` 的 `createDynamicComponent`：修复 dispose 非幂等隐患，顺手清理冗余写法。范围仅限该工具函数及其调用方的最小改动，不切换实现方案。

## Current State

- 分析完成：实现 + 三处调用方（notifier / tooltip / message-box）+ appContext 继承依赖链已全部读过，结论见下。
- 代码未动，无验证记录。

## Key Context

- **结论：保留 `createApp` 方案，不切换到 `createVNode + render`**（`vue.js` 内注释掉的 `renderComponent` 即该方案）。否决理由：单例场景 app 实例开销可忽略；现有代码本就依赖 `app._context` / `app._container` 私有字段，`vnode.appContext` 同为私有约定，私有面无降级；render 版唯一实际收益（dispose 天然幂等）用 1 行 guard 即可拿到。
- **真实隐患：dispose 非幂等**。`vue.js` 返回的 dispose 二次调用时 `app?.unmount()` 被跳过，但 `container.removeChild(el)` 收到 `undefined` → TypeError。目前没炸是因为 message-box 调用点（`message-box.js` callback 内 `dispose?.()` 后立即 `dispose = undefined`）在函数外防了重入——防线位置错，调用方易踩。
- **appContext 继承是刚需，不能删**：动态面板内 `usePopupRunner` / `usePopupManager` 均 `inject('$mussel')`（`src/components/common/popup.js:54,185`），且依赖宿主全局组件/指令注册表与 `config.globalProperties`，全挂在宿主 `_context` 上，经 `Object.assign(app._context, appContext)` 引用共享。
- 三处调用方两种生命周期：notifier（`notifier.js:26`）、tooltip（`tooltip-core.js:50`）懒建单例、dispose 存 `exist` 永不调用；message-box（`message-box.js:33`）每次调用临时创建、回调后延时 300ms dispose。
- **可选硬化，当前不做**（用户未要求，勿擅自扩大）：
  - `Object.assign` 全量合并改为白名单（`app`/`config`/`components`/`directives`/`provides`），降低对 Vue 内部 context 字段漂移的耦合。
  - 宿主 `app.unmount()` 后单例面板成孤儿 DOM + 存活 app；如需支持 SPA 反复 mount/unmount，可把 dispose 挂宿主 `app.onUnmount`（Vue 3.4+，项目 3.5.39 可用）。当前按页面级生命周期设计，不构成问题。

## Changed Files

无（纯分析会话）。

## Next Steps

1. `src/utils/vue.js` dispose 首行加幂等 guard：

   ```js
   return () => {
     if (!app) return

     app.unmount()

     if (!options.el) {
       container.removeChild(el)
     }

     el = undefined
     app = undefined
   }
   ```

2. `src/components/message/notifier.js:26`：`exist = exist || !!createDynamicComponent(...)` 去掉 `!!`（dispose 恒 truthy），与 `tooltip-core.js:50` 写法统一。
3. （可选，先问用户）`options.el` 为死分支——三处调用方均不传。删除可简化 `el` 创建与 dispose 分支；若保留作通用工具扩展位则不动。
4. 验证：demo 页回归 notifier（连续 notify）、messageBox（alert/confirm 关闭）、tooltip（hover 显示/切锚点）三路径；确认控制台无新告警。
5. 完成后按项目规范：文档三处同步仅在用户确认后进行（本改动不改组件对外 API，预期无需动文档）。

## References

- 实现：`src/utils/vue.js`（含注释掉的 render 版备选）
- 调用方：`src/components/message/notifier.js`、`src/components/message/message-box.js`、`src/components/tooltip/tooltip-core.js`
- 继承依赖：`src/components/common/popup.js`（`inject('$mussel')`）、`src/index.js`（install 提供 `$mussel`）
- 背景文档：`agent-docs/plans/tooltip-component.md`、`agent-docs/plans/tooltip-refactor.md`（单例面板创建模式、多 app 隔离验证记录）

## Suggested Skills

无必须项；如后续扩大到 context 合并白名单 / onUnmount 联动，再评估。
