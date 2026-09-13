# Tooltip 组件设计方案

| 项目 | 内容 |
|---|---|
| 状态 | 方案定稿（形态与视觉均已确认），待实现 |
| 范围 | **双形态**：`v-mu-tooltip` 指令（纯文本提示，零侵入）+ `<mu-tooltip>` 无包装组件（富内容，零 DOM 输出）；两形态共享单例浮层面板 |
| 不在范围 | 受控 `v-model:visible`、指令形态的 HTML 内容（见 §10） |
| 已确认决策 | 2026-09-12：视觉走**浅色浮层**（与 `mu-dropdown-panel` 同语言，不新增主题变量）；**带箭头**（可关）；形态选**指令 + 无包装组件双入口**（包裹式组件因额外 DOM 节点与布局干扰被否）；**placement 直接支持 12 方向**（主方向 × start / center / end 对齐） |

---

## 1. 背景与调研

### 1.1 现状

- V4、V3、V1 三代库均无 tooltip 组件/指令/样式，本方案为首个实现。
- 现有最接近的能力只有原生 `title` 属性：`mu-tags` 的 `tooltip` prop、`mu-multi-select` 的 `tagTooltip`，均为浏览器默认样式。

### 1.2 可复用基础设施

| 设施 | 位置 | 对 tooltip 的作用 |
|---|---|---|
| 锚点定位浮层 | `src/components/dropdown/dropdown-panel.vue` | fixed 定位 + `getBoundingClientRect()` 测量 + 主轴自动翻转 + `[pop-up]` 属性动画，照抄并扩展到 4 向；**显隐时序不照抄**，改用 §5.1 改进方案 |
| 弹层管理器 | `src/components/common/popup.js` 的 `usePopupManager` | 全局互斥、scroll/resize/blur/ESC/外点统一处理 |
| 挂载目标 | `inject('$mussel').rootElement` | Teleport 目标，暗色变量沿 DOM 级联自动继承；show 时切 `document.fullscreenElement \|\| rootEl` |
| 单例浮层懒加载 | `src/components/message/notifier.js` 的 `pluginNotifier` + `src/utils/vue.js` 的 `createDynamicComponent` | 单例面板创建模式：`{ container: app._container, appContext: app._context }`，`appContext` 继承使面板内 `inject('$mussel')` 可用 |
| 指令注册 | `src/components/scrollbar/directive.js` | `app.directive('mu-scrollbar', { mounted, updated, beforeUnmount })` 模式，tooltip 同款注册 `v-mu-tooltip` |
| 显隐时序 | `nextTick` + 强制回流（FLIP 配方，§5.1）；隐藏收尾用 `src/utils/style.js` 的 `getTransitionDuration()` | 入场 ≤1 帧、时序由规范保证；dropdown-panel 的 20ms 定时器链不照抄，其回填为独立任务（`docs/plans/dropdown-panel-sequence-refactor.md`） |
| 尺寸变化事件 | `src/events/resize.js` 的 `sizechange`：模块级共享 `ResizeObserver` + `EventInterceptor`（`interceptor.js` 篡改 `Element.prototype.addEventListener`）做引用计数，首个监听自动 observe、末个移除自动 unobserve；随库加载生效（`src/index.js:54` re-export 链引入） | 面板内容变化自动重定位：`@sizechange="updatePosition"`，同 `combo-wrapper.vue:7` / `table.vue` / `dialog.vue` 用法；**不直接使用原生 `ResizeObserver`** |

无第三方定位库（package.json 无 popper / floating-ui），延续自研路线。

### 1.3 备选方案（未采纳）

- **深色反色气泡**（antd / element 观感）：与浮层菜单区分度高，但需新增 `--mu-bg-tooltip` / `--mu-text-color-tooltip` 主题变量，且与库内浮层视觉语言割裂 → 未采纳。
- **包裹式组件**（初版方案，wrapper div + inline-flex）：额外 DOM 节点干扰布局（撑高、断行），模板嵌套啰嗦 → 未采纳，改为无包装组件 + 指令双形态。
- **不进 `usePopupManager`、只做局部事件**：可彻底避免与 dropdown 互斥、不阻断 modal ESC，但要自建 window 监听，重复基础设施 → 未采纳，风险见 §9。

---

## 2. API 设计（双形态）

### 2.1 指令形态：`v-mu-tooltip`

```html
<!-- 字符串 -->
<mu-button v-mu-tooltip="'删除后不可恢复'" danger>删除</mu-button>

<!-- 对象配置 -->
<mu-icon-button
  v-mu-tooltip="{ content: '刷新数据', placement: 'right' }"
  icon="refresh" />

<!-- 动态内容（updated 钩子自动同步） -->
<mu-button v-mu-tooltip="tipText">保存</mu-button>
```

- value：`string` 或 `{ content, placement, trigger, arrow, disabled }`（语义同组件 props）。
- 内容**仅纯文本**（`textContent` 渲染），无注入面；富内容走组件形态。
- 任意元素/组件直接挂，零 DOM 侵入。
- `disabled: true` 时隐藏并不再触发；`content` 为空等价不显示。
- 动态 value：指令 `updated` 钩子**按字段 diff** 后同步——内联对象 value 每次渲染都是新引用，不能靠引用比较；对显示中的面板只更新 content / placement，不重播动画。
- 无事件回调、无手动控制（指令场景不需要）。

### 2.2 组件形态：`<mu-tooltip>`（无包装）

```html
<!-- 基础：文本提示（默认 hover + top） -->
<mu-tooltip content="删除后不可恢复">
  <mu-button danger>删除</mu-button>
</mu-tooltip>

<!-- 富内容：#tooltip 插槽自定义提示内容，优先于 content prop -->
<mu-tooltip placement="bottom">
  <mu-icon-button icon="help" />
  <template #tooltip>
    支持 <b>富文本</b> 与 <mu-icon icon="info" />
  </template>
</mu-tooltip>

<!-- 手动控制 -->
<mu-tooltip ref="tipRef" content="..." @show="onShow" @hide="onHide">
  <mu-button>保存</mu-button>
</mu-tooltip>
```

- **renderless**：组件本体零 DOM 输出，`cloneVNode` 唯一子节点并把 mouseenter / mouseleave / focusin / click **链式合并**到其 props（不覆盖子元素自身回调）。
- 插槽：默认插槽 = 触发元素；`#tooltip` = 自定义提示内容（优先于 `content` prop，可放富文本与组件）。

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `content` | String | - | 提示文本；有 `#tooltip` 插槽时忽略 |
| `placement` | String | `'top'` | 12 值：`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'`；裸主方向 = 居中。主轴空间不足自动向对侧翻转（对齐后缀保留），交叉轴溢出夹紧、箭头跟随（见 §4） |
| `trigger` | String | `'hover'` | `'hover' \| 'focus' \| 'click'` |
| `arrow` | Boolean | `true` | 是否显示箭头 |
| `disabled` | Boolean | `false` | 禁用（不触发显示） |

| 项 | 内容 |
|---|---|
| 事件 | `show`、`hide` |
| expose | `show()`、`hide()`、`updatePosition()` |
| 约束 | 子节点必须是单个元素 vnode；纯文本、多节点、空插槽、多根 fragment 子组件不支持（dev 环境 `console.warn`） |
| 约束 | 子组件若把 `mouseenter` / `click` 等声明为组件 emit，合并的监听不落 DOM，tooltip 收不到（极罕见，与多根 fragment 同类边界） |

### 2.3 架构：单例面板 + 控制器

```
v-mu-tooltip 指令 ──┐
                    ├──→ controller（模块级单例）──懒建──→ panel.vue（唯一浮层实例）
<mu-tooltip> 组件 ──┘        │                              │ Teleport → rootElement
                             └── state: shallowReactive      │ usePopupManager
```

- **controller**（`controller.js`）：模块级 `shallowReactive` 状态（`visible / anchor / content / placement / trigger / arrow / onShow / onHide`），首次 show 时 `createDynamicComponent({ container: app._container, appContext: app._context, component: Panel, props: { state } })` 懒建面板——同 `notifier.js` 的 `pluginNotifier` 模式；`appContext` 继承使面板内 `inject('$mussel')` 可解析。
- **panel.vue**（`MusselTooltipPanel`，内部组件不对外导出）：接收 `state` prop（同 notifier 接 `notifications` 的模式），内部 `watch(visible)` 驱动显隐时序；content 支持 String 与 vnode 数组（组件插槽内容）。
- **指令注册**（`index.js` 的 `install(app)`）：`app.directive('mu-tooltip', { mounted, updated, beforeUnmount })`，同 `scrollbar/directive.js` 模式；`install` 由 `components/index.js` 的 `_install` 自动调用（同 message 模块），无需改注册逻辑。
- 同屏仅一个 tooltip：单例面板天然保证；与 dropdown 的互斥由 `usePopupManager` 处理。
- **锚点切换语义**：A 显示中触发 B → 保留显示、替换 content、重定位，**无退出 / 入场动画**（高频列表场景不闪）；仅当 B 触发失败（如 content 为空）才走完整 hide。
- **vnode 实现约束**：`#tooltip` 插槽内容每次显示 / 更新都**重新调用 slot 函数**取新 vnode；controller 与 panel 均不缓存已渲染 vnode（vnode 二次渲染会异常）。

### 2.4 使用注意（两形态共同）

- **disabled 控件**：原生 `disabled` 属性的控件（如 `mu-button`，见 `src/components/button/button.vue:6`）不派发任何鼠标事件，tooltip 无法触发。需要"解释为什么禁用"时，外层包一个非 disabled 元素再挂 tooltip；根治需将 `mu-button` 改为 `aria-disabled` 方案（§10 独立评估）。
- **原生 `title` 双提示**：两形态都不处理元素自带的 `title` 属性，同时存在会出现浏览器原生 + mu 双提示，建议移除。

---

## 3. 视觉规范

与 `mu-dropdown-panel` 同一套浮层语言，**不新增主题变量**，暗色模式零代码（变量级联自动切换）。

```scss
.mu-tooltip-panel {
  position: fixed !important;
  z-index: var(--mu-z-index-popup);                      // 1000
  max-width: calc(var(--mu-base-spacing) * 40);          // 320px，长文本换行
  padding: var(--mu-half-spacing) var(--mu-base-spacing); // 4px 8px
  border-radius: var(--mu-radius-control);               // 4px
  font-size: var(--mu-font-size-small);                  // 12px
  color: var(--mu-text-color-normal);
  background: var(--mu-bg-overlay);
  box-shadow: var(--mu-shadow-popup);
  // 动画：属性驱动（同 dropdown 模式）
  opacity: 0;
  pointer-events: none;   // 定位窗口期不可见也不可点，[pop-up] 时恢复
  transition-duration: .1s;
  transition-property: opacity, transform;

  // 箭头：8px 旋转方块
  &::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--mu-bg-overlay);
    box-shadow: var(--mu-shadow-hairline);   // 注意：面板边内侧一半的描边会与面板 shadow 环形成双线，实现时可用 clip-path 只描外露两边
    transform: rotate(45deg);
  }

  &[position="top"]    { transform: scaleY(.9); transform-origin: bottom; &::after { bottom: -4px; left: calc(50% - 4px + var(--mu-tooltip-arrow-offset, 0px)); } }
  &[position="bottom"] { transform: scaleY(.9); transform-origin: top;    &::after { top: -4px;    left: calc(50% - 4px + var(--mu-tooltip-arrow-offset, 0px)); } }
  &[position="left"]   { transform: scaleX(.9); transform-origin: right;  &::after { right: -4px;  top: calc(50% - 4px + var(--mu-tooltip-arrow-offset, 0px)); } }
  &[position="right"]  { transform: scaleX(.9); transform-origin: left;   &::after { left: -4px;   top: calc(50% - 4px + var(--mu-tooltip-arrow-offset, 0px)); } }

  &[pop-up] { opacity: 1; transform: none; pointer-events: auto; }

  &:not([arrow])::after { display: none; }
}
```

- 动画幅度 `scale(.9)`：比 dropdown 的 `scaleY(0)` 柔和，小气泡观感更好；实现时可调。
- 面板不可设 `overflow: hidden`（箭头需突出），tooltip 无滚动需求，无冲突。
- 主轴间距 GAP = 6px（`--mu-inline-spacing`），箭头突出约 4px。

---

## 4. 定位算法（updatePosition）

fixed 定位 + `getBoundingClientRect()` 测量。记：

```
锚点 rect：{ aw, ah, al, ar, at, ab }
面板 rect：{ dw, dh }
视口：{ tw, th }
GAP = 6（--mu-inline-spacing），MARGIN = 4（--mu-half-spacing）
```

### 4.1 主轴（以 placement = top / top-start / top-end 为例）

```
1. at - GAP >= dh            → 放上方，position = 'top'，  style.bottom = th - at + GAP
2. 否则 th - ab - GAP >= dh  → 翻转下方，position = 'bottom'，style.top = ab + GAP
3. 两侧都不够                → 放空间更大一侧，允许溢出
left / right 同理，轴互换。
```

- 实际主方向写入面板 `position` 属性（驱动 transform-origin 与箭头边）。
- **翻转只换主轴，对齐后缀保留**：`top-start` 放不下 → `bottom-start`。

### 4.2 交叉轴对齐（top / bottom 时的水平方向；left / right 轴互换）

```
对齐档决定理想位置：
  start： idealLeft = al              // 面板左缘对齐锚点左缘
  end：   idealLeft = ar - dw         // 面板右缘对齐锚点右缘
  center：idealLeft = al + (aw - dw) / 2
夹紧：left = clamp(idealLeft, MARGIN, tw - dw - MARGIN)
```

对齐档溢出不做档位降级（start 溢出不切 center），统一靠夹紧 + 箭头跟随兜底。

### 4.3 箭头统一公式（对齐档与夹紧共用一套）

```
箭头始终指向锚点中心：
  anchorCenter = al + aw / 2
  arrowOffset  = anchorCenter - (left + dw / 2)     // 相对面板中心
  arrowOffset  = clamp(arrowOffset, -(dw/2 - 8), dw/2 - 8)
  写入面板内联变量 --mu-tooltip-arrow-offset
```

start / end 对齐、居中被夹紧、窄面板宽锚点（dw < aw）等所有情形均由此公式覆盖，SCSS 无需感知对齐档，箭头定位规则不变。

left / right 主方向时**轴互换**：`anchorCenter = at + ah / 2`，`arrowOffset` 相对面板垂直中心，公式其余部分不变。

### 4.4 与 dropdown-panel 的差异

| 项 | dropdown-panel | tooltip |
|---|---|---|
| 方向 | 仅 top / bottom | 4 主方向 × 3 对齐档 |
| 交叉轴 | 左对齐锚点（宽度撑满时） | start / center / end 对齐 + 视口夹紧 |
| 箭头 | 无 | 有，统一公式随对齐与夹紧修正 |
| 宽度 | 可 `'anchor'` 跟随 | 内容自适应 + max-width |

---

## 5. 显隐时序与触发

### 5.1 时序（nextTick + 强制回流，FLIP 配方）

不照抄 dropdown-panel 的 20ms 定时器链——固定 40~60ms 入场开销、`setTimeout` 与渲染帧不对齐、时序靠定时器运气（详细论证与 dropdown 回填方案见 `docs/plans/dropdown-panel-sequence-refactor.md`）：

```
show():
  visible = true
  container = document.fullscreenElement || rootEl
  首次懒建面板（controller createDynamicComponent）后 await nextTick()   // 等 Vue patch，微任务级

  const el = panelEl
  el.style.transition = 'none'      // 关动画
  el.removeAttribute('pop-up')
  updatePosition()                  // getBoundingClientRect 本身强制同步布局，测量精确
  void el.offsetWidth               // 强制回流：定位 + position 属性本帧提交（transition 已关，不会动画）
  el.style.transition = null        // 恢复动画
  el.setAttribute('pop-up', '')     // 入场过渡从干净起点开始

hide():
  移除 [pop-up] → 过渡退出
  delay(getTransitionDuration(el)) 后清空 popupStyle（v-show 隐藏）   // 收尾沿用 dropdown 现方案
```

- 首次显示从 ~60ms 降到 1 个 Vue patch + 2 次强制回流（亚毫秒级）；再次显示同理。
- 原 `visibility: hidden` 隐藏占位**省去**：基础态 `opacity: 0` 已不可见，配合基础样式 `pointer-events: none`（未 `[pop-up]` 时，见 §3）消除定位窗口期"不可见但可点"。
- 面板监听 `sizechange` 事件（`@sizechange="updatePosition"`）：显示中内容变化（`#tooltip` 富内容热更新）导致尺寸改变时自动重定位，无需 controller 手动触发。用库内 `src/events/resize.js` 封装（共享 `ResizeObserver` + 引用计数，模板上直接 `@sizechange` 即生效），不直接使用原生 `ResizeObserver`。
- 快速开关守卫：`await nextTick()` 后若 `visible` 已被置否（等待窗口内 hide）直接返回，对应原代码的 `visible.value && el.setAttribute(...)` 检查。

### 5.2 触发方式（两形态一致，事件绑在锚点元素上）

| trigger | 显示 | 隐藏 |
|---|---|---|
| `hover` | 锚点 `mouseenter`，**100ms 显示延迟**（防扫过误触） | `mouseleave` → **300ms 延迟隐藏**（同 dropdown）；面板自身 `mouseenter` 取消定时器、`mouseleave` 延迟隐藏（富内容可停留） |
| `focus` | 锚点 `focusin` | `focusout` → 延迟隐藏 |
| `click` | 锚点 `click` 切换 | 外点 `mousedown`（manager 捕获）、ESC |

延迟值硬编码（`SHOW_DELAY = 100`、`HIDE_DELAY = 300`），不设为 prop——与 dropdown 的 300ms 隐藏延迟同策略，需要时再开放。

---

## 6. 全局协调（usePopupManager）

复用 `usePopupManager(visible, { ... })`，注册以下回调（逻辑同 dropdown-panel）：

| 回调 | 行为 |
|---|---|
| `onCaptureWindowResize` | `updatePosition()`；锚点出视口（`isElementInViewport`）则 hide |
| `onCaptureScroll` | **逐行照抄** `dropdown-panel.vue:252` 的 `onCaptureScroll`：锚点出视口（`isElementInViewport`）→ hide；否则滚动元素（`event.target`）包含锚点 → `updatePosition()` 实时跟随重定位。捕获阶段注册（`popup.js:40`）天然覆盖页面滚动与任意嵌套滚动容器 |
| `onCaptureEscKeyDown` | 非 hover 触发时 hide |
| `onCaptureMouseDown` | 仅 click 触发时：点击在锚点与面板外 → hide |
| window `blur` / `fullscreenchange` | 自动 hide（manager 内建） |

单例面板只注册一次 manager，指令与组件形态共用。

已知边界：滚轮滚动后浏览器不派发 `mouseleave`（需鼠标再移动一次），会出现 tooltip 贴着锚点跟随、但鼠标实际已悬在别处的窗口期——hover 类浮层通病（antd / element 同样），接受不改。

---

## 7. 文件清单与落地步骤

| # | 步骤 | 文件 | 检查点（每步通过后再继续） |
|---|---|---|---|
| 1 | 面板（形态无关的核心） | `src/components/tooltip/panel.vue`（`MusselTooltipPanel`：Teleport + 定位 + 显隐时序 + manager）、`panel.scss` | demo 临时手调 `show()`：12 方向 / 主轴翻转 / 箭头统一公式（对齐 + 夹紧）/ max-width 换行 / 暗色变量（`getComputedStyle`）均正确；入场 ≤1 帧无闪烁、定位窗口期不可点；显示中改内容经 `sizechange` 事件自动重定位；stylelint 通过 |
| 2 | 控制器 | `src/components/tooltip/controller.js`：`shallowReactive` 状态 + `createDynamicComponent` 懒建 + `showTooltip / hideTooltip` + `install(app)`（注册指令、捕获 app 上下文） | 首次 show 懒建面板且**仅建一次**，连续调用不重复创建；锚点切换直接重定位无闪烁；绕过 install 的场景走 `.mu-root` 兜底不崩 |
| 3 | 指令 | `src/components/tooltip/directive.js`：value 解析（string / object）、mounted / updated / beforeUnmount | 字符串 / 对象 value 触发；动态 value 按字段 diff 更新且**不重播动画**；`disabled` / 空 content 即时隐藏；显示中卸载元素无残留监听 |
| 4 | 组件 | `src/components/tooltip/tooltip.vue`：render fn + `cloneVNode` 事件链式合并 + props watch 同步 + 事件 / expose | 子元素自身 `click` / `mouseenter` 回调与 tooltip 共存；`#tooltip` 富内容正常渲染且动态更新；非单子节点 dev 警告；`show` / `hide` 事件与 expose 方法可用 |
| 5 | 导出与注册 | `src/components/tooltip/index.js`（`export { default as MuTooltip }` + `export { install }`）；`src/components/index.js` 加 `import * as TooltipComponents from './tooltip'` + `_install(TooltipComponents)`（`install` 自动调用，无需改注册逻辑） | demo 中 `v-mu-tooltip` 指令与全局 `<mu-tooltip>` 均可用；`npm run build` 产物包含 tooltip 代码 |
| 6 | demo | 新增 `demo/src/tooltip/main.js`、`main-view.vue`（指令：字符串/对象/动态/disabled；组件：12 方向矩阵/翻转/focus、click/`#tooltip` 插槽富内容/长文本/theme-switch）；`demo/src/index.html` 加 `.app-tile` 卡片 | demo 页全场景可交互；缩小窗口验证视口边缘翻转与箭头跟随；dark 切换正常 |
| 7 | 文档同步（AGENTS.md 强制） | `docs/quick-reference_components.md` 的 `## 7 - 反馈` 下加 `### MuTooltip`（组件用法）与指令用法段（登记位置参照 `v-mu-scrollbar` 现有写法）；`skills/mussel-ui/references/components/feedback.md` 同步；`skills/mussel-ui/SKILL.md` 组件速查表补行 | docs 与 skills/references 两处内容一致；SKILL.md 速查表含 tooltip 行 |

无需改构建配置：库构建走 import 链，demo 目录 glob 自动发现。

---

## 8. 验证清单

**指令形态**
- [ ] 字符串 / 对象 value 均可触发；任意原生元素与组件可挂
- [ ] 动态 value（`updated`）内容热更新；`disabled: true` 隐藏并停止触发
- [ ] 元素卸载（`beforeUnmount`）时若正在显示则隐藏、监听清理无泄漏

**组件形态**
- [ ] 子元素自身 `mouseenter` / `click` 等回调不被覆盖（链式共存）
- [ ] `#tooltip` 插槽富内容；`content` prop 动态更新
- [ ] 非单元素子节点（纯文本 / 多节点）dev 警告
- [ ] `show` / `hide` 事件与 expose 方法

**共同**
- [ ] hover 100ms 出现、移开 300ms 消失；鼠标移入面板不消失（富内容场景）
- [ ] 入场时序：show 后 ≤1 帧完成定位，无中间闪烁（nextTick + 强制回流，§5.1）
- [ ] 定位窗口期面板不可点（`pointer-events` 规则）
- [ ] 显示中内容变化自动重定位（面板 `sizechange` 事件，不直接用 `ResizeObserver`）
- [ ] 12 方向 placement 正确（含 start / end 对齐档）；翻转时对齐后缀保留
- [ ] 锚点贴视口右缘 / 下缘时自动翻转
- [ ] 交叉轴夹紧与 start / end 对齐时，箭头均指向锚点中心（`--mu-tooltip-arrow-offset` 统一公式生效）
- [ ] `arrow` 属性关闭箭头；长文本 320px 换行
- [ ] 单例互斥：指令与组件先后触发，同屏只有一个 tooltip
- [ ] 暗色模式背景 / 文字 / 阴影变量生效（`getComputedStyle` 校验）
- [ ] 滚动容器内锚点滚动跟随重定位；锚点出视口隐藏
- [ ] 全屏元素内正常（container 切 `fullscreenElement`）
- [ ] 锚点直接切换（A 显示中触发 B）无闪烁，内容即时替换（§2.3 切换语义）
- [ ] 原生 disabled 控件上不触发（§2.4 已知限制，非 bug；外层包裹非 disabled 元素后可触发）
- [ ] stylelint 通过（报错先 `stylelint --fix`）

验证入口：`localhost:3000/tooltip/`（watch 构建常驻，404 再跑 `npm run build:demo`），Playwright DOM 断言优先，视觉问题才用截图。

---

## 9. 风险与边界

| 风险 | 评估 | 缓解 |
|---|---|---|
| `cloneVNode` 事件合并覆盖子元素回调 | 中（表单类子组件常见自带 click/focus） | 合并时 wrap 原回调链式执行；验证清单专项覆盖 |
| 组件形态子节点约束（单元素） | 低，dev `console.warn` 提示 | 文档明示约束；指令形态可兜底任意元素 |
| 单例面板与 dropdown 互斥：tooltip 显示会关掉已开的 dropdown | 低概率（同一锚点同时挂两者的场景少） | 行为与"同屏一个浮层"的既有约定一致，接受 |
| manager 的 keydown else-if 链：tooltip 可见期间 modal 的 ESC 被拦截 | 极低（hover 离开即隐） | 如实际出现，评估 tooltip 不消费 ESC 或单开监听 |
| 交叉轴夹紧后箭头被 clamp 到面板边缘，极端窄屏不再精确指向锚点中心 | 视觉可接受 | clamp 保底不出面板 |
| `createDynamicComponent` 独立 app：provide / inject 依赖 `appContext` 继承 | 已有 notifier / message-box 验证 | 同款传参；绕过 `install` 直接 import 组件的场景兜底 `document.querySelector('.mu-root') \|\| document.body` |
| 原生 disabled 控件不派发鼠标事件，tooltip 无法触发 | 高频场景（"解释为什么禁用"） | v1 已知限制（§2.4：外层包裹非 disabled 元素）；根治靠 mu-button 改 `aria-disabled`（§10 独立评估） |
| Teleport 目标必须是 `rootElement` 而非硬编码 body | — | 实现约束：业务方自定义 root 时硬编码 body 会丢变量级联 |

---

## 10. 后续可扩展项

1. **受控模式**：`v-model:visible` + 手动 trigger。
2. **延迟开放为 prop**：`show-delay` / `hide-delay`，有真实需求再加。
3. **指令 HTML 内容**：value 传 HTML 字符串经 `sanitizeHTML` 清洗后 `v-html`（同 message-box 策略），有需求再开。
4. **mu-button disabled 改造评估**：`aria-disabled` + 样式替代原生 disabled 属性，使 disabled 控件可触发 tooltip（当前限制见 §2.4）；牵连键盘语义与表单提交行为，独立任务。
