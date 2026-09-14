# Tooltip 组件实现复查与改造方案

| 项目 | 内容 |
|---|---|
| 状态 | **已实施并回归通过**（2026-09-14 复查，同日实施）。复查对象为当前工作区：分支 `tooltip-component`，`tooltip-core.js` 合并在途（`tooltip-controller.js` / `tooltip-directive.js` 已删除） |
| 范围 | `src/components/dropdown/tooltip-core.js`、`tooltip.vue`、`tooltip-panel.vue`、`tooltip-panel.scss`、`src/utils/dom.js` 的 `isElementInViewport` |
| 不在范围 | 定位算法本身（主轴翻转 / 交叉轴夹紧 / 箭头跟随，`tooltip-panel.vue:113`）、12 方向语义、视觉语言（浅色浮层 + 箭头）、`common/popup.js` 的编舞与 coordinator（本次不动） |
| 前置文档 | `tooltip-component.md`（原始设计，已实施）、`popup-manager-refactor.md`、`dropdown-panel-sequence-refactor.md` |
| 复查结论 | 架构方向成立（per-app 单例 controller + 双形态共用锚点事件工厂 + 主轴/交叉轴度量归一），但有 **2 个实测可复现缺陷** 与 1 个 API 归属缺陷；另有 3 处一致性/维护性问题。缺陷修复为小改动，不触及定位算法与编舞 |

---

## 1. 复查结论

### 1.1 确认成立的设计（不改）

| 设计 | 位置 | 评价 |
|---|---|---|
| per-app controller + 单例面板懒建 | `tooltip-core.js:32` `createTooltipController(app)`，`ensurePanel()` 走 `createDynamicComponent({ container: app._container, appContext: app._context })` | 与 `pluginNotifier` 同形；多 app 隔离正确（`appContext` 继承使面板内 `inject('$mussel')` 解析到本 app） |
| 双形态共用锚点事件 | `createTooltipAnchorHandlers`（`tooltip-core.js:130`） | 指令 `addEventListener` 与组件 vnode props 共用同一份 handler 工厂，`trigger` 动态变化无需重绑 |
| 主轴/交叉轴度量归一 | `tooltip-panel.vue:83` `getAxisMetrics(vertical, …)` | 垂直/水平互为镜像，消掉了 HEAD 版两段复制代码（`-99 +89`） |
| 显示中热更新不重播动画 | `tooltip-core.js:86`（`if (!state.visible)`）+ 面板 `watch` 重定位 | 锚点切换 / placement 调整不会闪一次入场动画 |
| 编舞复用 `usePopupRunner` | `common/popup.js:48` | dropdown-panel / context-menu / tooltip-panel 三处收敛到同一 runner |
| 箭头边线用放大 1px 实底三角 | `tooltip-panel.scss:21-42` | `clip-path` 与 `box-shadow` 互斥下的正确解法，注释已说明原因 |

### 1.2 问题清单

| # | 问题 | 严重度 | 性质 |
|---|---|---|---|
| 2.1 | 锚点脱离文档后面板永久残留（无兜底） | 警告 | 缺陷，已实测复现 |
| 2.2 | 锚点切换时 `onShow` / `onHide` 不配对 | 警告 | 缺陷，已实测复现 |
| 2.3 | expose 的 `hide` / `updatePosition` 无归属校验 | 小问题 | API 语义 |
| 3.1 | 热更新字段清单在两形态各存一份 | 小问题 | 一致性 |
| 3.2 | `contentComponent` 每次 content 变化都重建组件 | 小问题 | 性能 |
| 3.3 | `HIDE_DELAY` 与 `dropdown-panel` 的 300ms 各存一份 | 小问题 | 维护性 |

---

## 2. 缺陷（实测复现）

复现环境：`localhost:3000/dropdown/`（watch 构建常驻），通过 `app.config.globalProperties.$mussel.tooltip` 直接驱动 controller。

### 2.1 锚点脱离文档后面板永久残留

**现象**（实测）

```
show(anchor, { content, trigger: 'hover' })  → 等 600ms
  { popup: true, opacity: '1', position: 'top' }
anchor.remove()                              → 等 600ms
  { popup: true, opacity: '1' }              ← 面板仍可见，停在原位
  state.visible: true, state.anchor.isConnected: false
仅补充滚动（真实 scroll）：
  { popup: true, visible: true }             ← 兜底路径未生效
```

对照组（同一路径下正常锚点滚出视口，功能正确）：

```
show(anchor)  → 等 600ms → { popup: true, visible: true }
window.scrollTo 使 anchor 滚出视口 → 等 500ms → { popup: false, visible: false }
```

**原因**（两层，缺一不可）

1. **无清理路径。** 指令形态有 `beforeUnmount`（`tooltip-core.js:214`，`controller.state.anchor === el` 时 `hide()`），但 `tooltip.vue` 与 `tooltip-panel.vue` 全文没有任何卸载 / 更新钩子（`grep onBeforeUnmount|onUnmounted|beforeUnmount|unmounted` 仅命中指令一处）。组件形态的子节点被 `v-if` 摘掉时，`render` 在 `tooltip.vue:112` 提前 `return children`，`anchorVnode` 仍指向已脱离文档的旧 DOM，controller 无从感知。
2. **兜底守卫拦不住。** `isElementInViewport`（`utils/dom.js:49`）只看 rect：元素脱离文档后 rect 全 0，`0 <= innerHeight && 0 >= 0` 恒成立 → 判定为"在视口内"。于是 `hideOrReposition`（`tooltip-panel.vue:204`）与 `onCaptureScroll`（`tooltip-panel.vue:211`）走 `updatePosition` 分支而非 `hide` 分支，用全 0 的 rect 重算，面板被钉在视口角落。

叠加 hover 型是唯一没有外点关闭路径的浮层（`onCaptureMouseDown` 仅在 `trigger === 'click'` 时生效，`tooltip-panel.vue:195`），而 DOM 移除不会派发 `mouseleave` —— 三条路径同时失效，面板永久残留。

`dropdown-panel.vue:205/215` 是同一个守卫的调用点，存在同样缺陷（rect 全 0 判为可见）。它平时不显眼，因为 dropdown 的 `onCaptureMouseDown` 对所有 trigger 生效，外点即可关闭；但只要用户在面板开着时滚动、且锚点恰被移除，同样会残留。

**修复**

`src/utils/dom.js`：

```js
export function isElementInViewport (element) {
  // 脱离文档的元素 rect 全为 0，会被下面的判定误判为"在视口内"
  if (!element?.isConnected) return false

  const { top, bottom, left, right } = element.getBoundingClientRect()

  return (
    top <= window.innerHeight && bottom >= 0 &&
    left <= window.innerWidth && right >= 0
  )
}
```

`src/components/dropdown/tooltip.vue`：

```js
import { inject, watch, cloneVNode, onBeforeUnmount, onUpdated } from 'vue'

// setup 内
function releaseAnchor () {
  // 仅当显示中的就是本组件锚点时收起，避免误关别人的 tooltip
  if (anchorVnode?.el && controller.state.anchor === anchorVnode.el) controller.hide()
}

      onBeforeUnmount(() => {
        // 清掉 300ms 显示延迟窗口内卸载组件的 pending showTimer（DOM 移除不派发 mouseleave）
        handlers.dispose()
        releaseAnchor()
      })

      // 子节点被 v-if 摘除时本组件仍会重渲染，但 render 提前 return，
      // anchorVnode 保留旧 vnode，其 el 已脱离文档
      onUpdated(() => {
        if (anchorVnode?.el && !anchorVnode.el.isConnected) releaseAnchor()
      })
```

两处修复的分工：`isConnected` 覆盖"任意触发路径下的失效锚点"（滚动 / resize 兜底重新生效），钩子覆盖"锚点静默消失、没有任何事件"这一 hover 型必踩的路径。只做其中一处都不足以覆盖全部场景。

实施补充：卸载钩子还需调用 `handlers.dispose()`——否则 mouseenter 后 300ms 延迟窗口内卸载组件时，pending showTimer 仍会把面板显示到已脱离文档的锚点上（指令形态的 `unbind` 已有此清理，组件形态对齐）。

**不建议**在 `render` 的 early-return 分支里直接调 `releaseAnchor()`：render 期间改写响应式状态属反模式，且 `onUpdated` 已能覆盖同一时机。

### 2.2 锚点切换时 onShow / onHide 不配对

**现象**（实测，直接驱动 controller）

```
show(b1, { onShow: () => 'showB1', onHide: () => 'hideB1' })  → 等 250ms
show(b2, { onShow: () => 'showB2', onHide: () => 'hideB2' })  → 等 250ms
hide()                                                        → 等 250ms

回调序列：['showB1', 'hideB2']
期望：     ['showB1', 'hideB1', 'showB2', 'hideB2']
```

即：B1 的 `onHide` 丢失、B2 的 `onShow` 从未触发，最后 `hide` 触发的是 B2 的回调。鼠标快速划过一排带 tooltip 的元素即可触发；组件形态的 `@show` / `@hide` 事件与指令的 `onShow` / `onHide` 均继承此错乱。

**原因**

面板的显隐回调挂在 `watch(() => state.visible)` 上（`tooltip-panel.vue:172-183`）。锚点切换时 `state.visible` 始终为 `true`（`tooltip-core.js:86` 的 `if (!state.visible)` 不为真），watch 不重跑 —— 于是既没机会补发旧锚点的 `onHide`，也没机会触发新锚点的 `onShow`，而 `Object.assign`（`tooltip-core.js:81`）已经把两个回调字段覆盖成新值。

`dropdown-panel.vue:129-148` 有 `anchorChanged` 分支专门处理同一件事（切换时先 `ctx.onHide?.()`），tooltip 的 controller 缺这一步。

**修复**（`tooltip-core.js` 的 `show()`）

```js
  // 锚点切换（面板已显示）：visible 不变，面板 watch 不触发，
  // 需在此补发旧锚点 onHide 与新锚点 onShow（同 dropdown-panel 的 anchorChanged 分支）
  const anchorChanged = state.visible && state.anchor !== anchor

  if (anchorChanged) state.onHide?.()

  Object.assign(state, { anchor, content, placement, trigger, arrow, onShow, onHide })

  ensurePanel()

  if (!state.visible) state.visible = true
  else if (anchorChanged) state.onShow?.()
```

配对推演（三种调用路径）：

| 路径 | anchorChanged | 面板 watch | 回调 |
|---|---|---|---|
| 首开（visible false→true） | false | 触发 | `onShow` ×1 |
| 切换锚点（visible 保持 true） | true | 不触发 | 旧 `onHide` ×1 + 新 `onShow` ×1 |
| 同锚点热更新（`sync`，`tooltip-core.js:109`） | false | 不触发 | 无（符合"热更新不重播"语义） |
| `hide()` | — | 触发 | 当前锚点 `onHide` ×1 |

`disabled` / 空 content 的早退分支（`tooltip-core.js:76-79`）已正确走 `hide()`，无需改动。

### 2.3 expose 的 hide / updatePosition 无归属校验

`tooltip.vue:93-99` 直接把全局面板方法转发出去。`show` 因为要传锚点天然安全，另两个不是：

```js
// 外部通过 ref 调用会关掉屏幕上别人的 tooltip
tipRef.hide()
```

**修复**

```js
  expose({
    show: () => {
      if (anchorVnode?.el) controller.show(anchorVnode.el, buildOptions())
    },
    hide: () => {
      if (controller.state.anchor === anchorVnode?.el) controller.hide()
    },
    updatePosition: () => {
      if (controller.state.anchor === anchorVnode?.el) controller.updatePosition()
    }
  })
```

初始 `state.anchor` 为 `null`，与 `anchorVnode?.el` 的 `undefined` 不相等，无需额外空值分支。归属判断复用了指令卸载钩子的同一表达式（`tooltip-core.js:218`），若后续多处使用，可考虑在 controller 上收敛为 `isAnchor(anchor)`。

---

## 3. 一致性改造（建议，与 §2 同批）

### 3.1 热更新字段清单两份

`SYNC_FIELDS`（`tooltip-core.js:15`）与组件形态 watch 的依赖数组（`tooltip.vue:89`）是同语义的两份手工清单，项数恰好一致的 5 个字段。漏改任何一份都会产生"指令形态能热更新、组件形态不能"的静默差异。

组件形态的 watch 本身就是值比较，不需要 `optionsChanged`（它存在的原因是 `updated` 钩子每次渲染都触发），只需复用同一份字段清单：

```js
import { ANCHOR_EVENTS, SYNC_FIELDS, createTooltipAnchorHandlers } from './tooltip-core'

  watch(
    () => SYNC_FIELDS.map(field => props[field]),
    () => controller.sync(anchorVnode?.el, buildOptions())
  )
```

同时把 `SYNC_FIELDS` 的注释从"指令 diff 用"改为"两形态共用的热更新字段集"，避免下一位读者误以为它是指令私有。

### 3.2 contentComponent 每次 content 变化都重建

`tooltip-panel.vue:39-45` 对字符串内容也返回 `{ render: () => h('span', null, content) }`。`computed` 在 content 变化时产生新对象引用，`<component :is>` 会卸载旧节点再挂新节点，而这里只需要一次文本 patch。

```js
  // 仅 vnode 工厂（#tooltip 插槽）走动态组件；字符串走模板中的静态 span
  const contentComponent = computed(() => {
    const content = state.content

    return isFunction(content) ? { render: () => content() } : null
  })
```

```html
  <component :is="contentComponent" v-if="contentComponent" />
  <span v-else>{{ state.content }}</span>
```

附带好处：字符串路径回到 Vue 的文本插值，天然无 `v-html` 注入面（与 quick-reference 中"`textContent` 渲染，无注入面"的现有承诺一致，不新增变量）。

### 3.3 HIDE_DELAY 常量重复

`HIDE_DELAY = 300`（`tooltip-core.js:9`）与 `dropdown-panel.vue:174` 内联的 `setTimeout(hide, 300)` 是同一个浮层隐藏延迟。两处各自演化会出现观感不一致。建议提到 `common/popup.js` 导出：

```js
// 浮层移出后的隐藏延迟（tooltip / dropdown 共用）
export const HIDE_DELAY = 300
```

`SHOW_DELAY = 300` 只有 tooltip 使用，且"延迟开放为 prop"已登记为后续可扩展项（`tooltip-component.md` §10.2），本次不动。

---

## 4. 实施批次

改动集中在 3 个文件，建议一批完成，便于一次回归：

| 批次 | 内容 | 文件 |
|---|---|---|
| 1 | 缺陷修复：`isConnected` 守卫 + 组件形态卸载/更新清理 | `utils/dom.js`、`tooltip.vue` |
| 2 | 缺陷修复：`onShow` / `onHide` 配对 | `tooltip-core.js` |
| 3 | API 归属校验 | `tooltip.vue` |
| 4 | 一致性改造（§3.1 / 3.2 / 3.3） | `tooltip.vue`、`tooltip-panel.vue`、`tooltip-core.js`、`common/popup.js`、`dropdown-panel.vue` |

批次 1、2 是独立缺陷，可先单独验证再叠加；批次 4 中 §3.3 会改动 `dropdown-panel.vue`，需连带回归 dropdown。

批次 1 改动 `utils/dom.js` 会同时影响 `dropdown-panel`，两个组件都要回归（见 §5）。

---

## 5. 验证清单

用 Playwright DOM 断言，全部通过 `localhost:3000/dropdown/`（watch 构建常驻，404 再跑 `npm run build:demo`）。

**§2.1 锚点残留**

- [ ] 复现步骤重跑：`show(anchor)` → `anchor.remove()` → 面板应收起（`pop-up` 移除、`state.visible === false`）
- [ ] 锚点被移除后，仅滚动页面（真实 scroll）也能收起
- [ ] 组件形态：`v-if` 包裹的锚点由真变假，tooltip 随之收起，且 `state.anchor` 不再指向已卸载元素
- [ ] 组件形态：锚点所在组件整体卸载（如切页），tooltip 收起，无残留监听
- [ ] 回归（正常路径未坏）：锚点滚出视口 → 收起；锚点仍在视口 → 跟随重定位
- [ ] 回归 dropdown-panel：面板开着时锚点被移除 + 滚动 → 收起

**§2.2 回调配对**

- [ ] 指令形态：连续 hover 两个元素，`onShow` / `onHide` 成对出现，且顺序为 `show(A) → hide(A) → show(B)`
- [ ] 组件形态：`@show` / `@hide` 计数与锚点切换次数一致
- [ ] 同锚点热更新（改 `content` / `placement`）：不触发 `show` / `hide`，且不重播入场动画
- [ ] `hide()` 后回调不再补发（无重复 `onHide`）

**§2.3 归属**

- [ ] A、B 两个组件形态实例，A 显示中调用 `bRef.hide()` → A 的面板不受影响
- [ ] A 显示中调用 `bRef.updatePosition()` → A 的面板位置不变

**§3 一致性**

- [ ] 字符串 content 切换时 DOM 节点未被替换（可用节点引用比对或 MutationObserver 断言）
- [ ] `#tooltip` 插槽富内容仍可热更新，并经 `sizechange` 自动重定位
- [ ] 12 方向 placement 矩阵 + 主轴翻转 + 交叉轴夹紧 + 箭头跟随锚点中心（视觉抽查）
- [ ] 暗色模式变量正常（`mu-dark`）
- [ ] stylelint 通过（报错先 `stylelint --fix`）
- [ ] `npm run build` 产物正常，无新增 Vue warn

---

## 6. 风险与边界

| 风险 | 评估 | 缓解 |
|---|---|---|
| `isElementInViewport` 改动影响 dropdown-panel | 中：两处调用点共用同一函数 | 该函数全局仅 2 个调用点（`dropdown-panel.vue:205/215`、`tooltip-panel.vue:207/214`），语义变更方向是"更严格"，不会误隐藏仍在文档中的元素；回归项见 §5 |
| `onUpdated` 中读 `anchorVnode.el.isConnected` 增加每帧开销 | 极低：一次属性读取 | 仅在组件因 props/slots 变化重渲染时执行 |
| `onUpdated` 时序晚于父组件移除子元素 | 低：父 patch 移除 DOM → 子组件 patch → `onUpdated`，顺序天然正确 | §5 有独立验证项；若实测时序不符，退化为 render 分支内调用 |
| §3.1 改动 watch 触发粒度 | 极低：`() => SYNC_FIELDS.map(...)` 与原数组字面量写法语义等价 | 见 §3.1 的触发语义说明；回归项见 §5 |

---

## 6.1 关于 §3.1 的触发语义（避免误判）

`() => SYNC_FIELDS.map(field => props[field])` 每次求值都返回新数组，容易误认为"引用恒不等 → 每次渲染都触发 sync"。实际不是：

Vue 的 `watch` 只在**依赖变化时**重新求值 getter。该 getter 的依赖就是 `SYNC_FIELDS` 里那 5 个 prop，取值顺序与数组字面量写法完全一致；只有这 5 个字段之一变化才会重跑 getter，此时数组内容确实变了，`Object.is` 比较失败并触发回调是**预期行为**。其余 prop 变化不会让 getter 重跑，因而不会触发。

结论：§3.1 是纯等价替换（清单来源从字面量改为常量），不是行为变更。若实施时想进一步降低不确定性，可退回保留字面量写法、仅加注释指向 `SYNC_FIELDS`。

---

## 7. 不在本次范围（待决）

以下项在复查中确认存在，但属独立议题，本次不改：

1. **面板无 a11y 语义**：缺 `role="tooltip"` 与锚点 `aria-describedby` 关联。`tooltip-component.md` 通篇未涉及 a11y，属设计缺口而非实现缺陷，需要先定语义（含 `click` 型是否应为 `role="dialog"`）再改。
2. **面板 `pointer-events: auto`**：`.mu-tooltip-panel[pop-up]`（`tooltip-panel.scss:112`）配合 `@mouseover.stop="controller.clearHideTimer"`（`tooltip-panel.vue:9`）使面板可悬停保持，代价是遮住其下方元素并阻断冒泡，与"纯提示"语义有张力。若改为 `pointer-events: none` 则 hover 移入面板即消失，需先确认期望行为（antd 默认 `pointer-events: none`）。
3. **文件归位**：tooltip 借住 `dropdown/index.js` 的 `install`（会随 `_install(DropdownComponents)` 被拉起），与 `tooltip-component.md` §8 设计的独立 `tooltip/` 目录不符。若单独发布 dropdown 模块会连带 tooltip。涉及导出面调整，建议独立提交。
4. **定位算法抽取**：tooltip 的完整主轴翻转 + 交叉轴夹紧 + 箭头跟随（`tooltip-panel.vue:113`）与 `dropdown-panel` 的简化版并存。若后续再出 popover 类组件，值得抽 `common/position.js`；当前两处需求不同（dropdown 无箭头、对齐语义简单），提前抽象收益不足。
5. **scroll 事件 target 假设**：`tooltip-panel.vue:216` 与 `dropdown-panel.vue:217` 的 `event.target.contains(...)` 假设 target 是 Element。真实滚动时 target 为 `document`（`contains` 存在），但合成事件（`target` 为 `window`）会抛 `TypeError: event.target.contains is not a function`。非真实缺陷，若要加固可改 `event.target?.contains?.(...)`。
6. **延迟可配**：`show-delay` / `hide-delay` 开放为 prop（`tooltip-component.md` §10.2）。
