# dialog 边缘拖拽调整大小（resizable）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施（2026-09-15）**，实现见 `src/components/modal/dialog-move-resize.js`；与本方案的差异见 §0.5，实施后评审见 `dialog-edge-resize-review.md` |
| 范围 | `src/components/modal/dialog.vue`、`dialog.scss`：新增 `resizable` prop + 8 方向边缘 resize；顺带修复「拖拽后最大化溢出」bug |
| 不在范围 | 定位方案改造（保持 flex 居中 + 手势物化的混合模型）、CSS `resize` 属性路线、mask 尺寸变化时对 dialog 尺寸的主动 clamp（仍由 CSS `max-width/height: 100%` 兜底）、`disposeOnHide` 下 `maximized` 未重置这个既有 bug（§5 仅给修法，未纳入） |
| 已确认决策 | `resizable` 默认 `false`（opt-in），存量 dialog 行为零变化 |

## 0. 修订记录

### v2 相对 v1

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 1 | 致命 | 最大尺寸直接用 `mask.clientWidth/Height`，忽略 CSS `max-width/height`（用户常经 class 覆盖，如 demo 的 `max-width: 90%`）。东/南拖拽出现死区；**西/北拖拽会让整个对话框跟着光标滑动、锚点失效** | §2.3 `maxEast/maxWest/...` |
| 2 | 警告 | `parseFloat(cs.minWidth) \|\| 320` 无法解析百分比（实测 `getComputedStyle` 对 `min-width:20%` 原样返回 `"20%"`），且 `min-width: 0` 会被 `\|\|` 吃成 320；改用现有 `resolvePixel` | §2.3 `minW/minH/cssMaxW/cssMaxH` |
| 3 | 警告 | 最大化还原：`position` 被重开逻辑清空后 `stashedPosition` 仍是旧值 → 取消最大化弹回旧位置；且还原时同步调 `correctPosition()` 会读到 Vue 尚未 flush 的旧 DOM 坐标，反过来覆盖 `stashedPosition` | §2.4 |
| 4 | 警告 | 边缘单击（未拖动）即物化尺寸/位置，把 `width="50%"` 永久变 px、flex 居中永久失效 | §2.3 阈值延迟物化 |
| 5 | 小问题 | `resizing` 声明后无人消费；`document.body.style.cursor` 挡不住子元素自带 cursor（按钮 `pointer`） | §2.3 / §2.5 `mu-dialog--resizing` |
| 6 | 小问题 | `resizeDirs` 未定义；边/角手柄在角部 6×6 重叠，需保证角排在边之后 | §2.2 |
| 7 | 小问题 | 复用 `utils/math.js` 的 `clamp` 会在 `min > max` 时静默换序，边界语义不清 | §2.3 `bounded` |
| 8 | 小问题 | 文档同步漏 `agent-docs/quick-reference_components.md` | §3 |

### v3 相对 v2

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 9 | 警告 | §5 disposeOnHide 修法 `maximized.value = false` 仅适用销毁场景；非销毁（默认）下 `mu-dialog--maximized` class 仍在 DOM → 图标与状态反向失配。改为 hide 时统一调用 `toggleWindowState()`，并声明行为变化 | §5（**仅细化建议，未纳入实施范围**） |
| 10 | 小问题 | onMouseUp 无条件 `correctPosition()`：未物化（纯点击）时 dialog 大于 mask 会被居中负偏移钉死 `top:0`，违背修订 #4「点击零副作用」。加 `materialized` 守卫 | §2.3 |

### v4 相对 v3

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 11 | 警告 | v3 称「已核实 `mu-scrollbar__tracks` 无 z-index，靠 DOM 顺序即可」**与代码不符**：`scrollbar.scss:22` 有 `z-index: var(--mu-z-index-layer)`（=10），手柄 `z-index: auto` → 滚动条轨道反而盖住手柄，右侧 6px 手柄实测仅 3px 命中。手柄须补 `z-index: calc(var(--mu-z-index-layer) + 1)`。连带 §5 取舍结论反转（先加 z-index 再谈是否缩窄） | §2.2 / §2.5 / §5 |
| 12 | 小问题 | §2.4 用 `await nextTick()`，但 `dialog.vue:63` 的 import 列表无 `nextTick`，照抄报错 | §2.4 |
| 13 | 小问题 | `resolvePixel` 对 `calc()`/`min()`/`max()`/`clamp()` 亦返回 undefined（实测 `min-width: calc(50% - 20px)` 原样返回），约束会静默失效为 `0`/`Infinity` 而非报错 | §2.3 / §5 |
| 14 | 小问题 | `dialog.scss:1` 的 `:fullscreen` 规则引用错位置，实际在 `src/styles/root.scss:159` | §2.4 |
| 15 | 疑问 | resize 结束未 emit，`userSize` 无对外出口（父组件无法持久化尺寸） | §2.5 决策：不对外暴露，§5 记录 |

### v5 相对 v4（本轮评审）

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 16 | 小问题 | §3 未记录地删除了 v3 的「顺带修正 AGENTS.md 过期路径」一句（修订表无对应条目）；该过期路径已核实为真（`docs/` 下无 quick-reference）。恢复该句 | §3 |
| 17 | 小问题 | §4-9 前提不成立：demo `my-dialog.vue` 当前未开启 `body-scrollbar`（全仓库 demo 无该属性用法，仅文档引用）。§3 demo 项明确 resizable 演示同时开启 | §3 / §4 |
| 18 | 小问题 | #11 与 §2.2 引用 scrollbar.scss z-index 行号偏一行（写作 `:21` / `:20-21`，实际 z-index 在 `:22`） | §0 / §2.2 |

## 0.5 实施差异（2026-09-15 实施后补记）

实现落在独立 composable `src/components/modal/dialog-move-resize.js`（导出 `useDialogMoveResize`），未内联在 dialog.vue。与方案正文的差异：

| 项 | 方案 | 实际实现 |
|---|---|---|
| resize 状态（§2.1/§2.5） | 双 ref：`resizing`（Boolean）+ `resizeCursor` | 单 ref `resizing` 直接承载方向光标字符串，truthy 兼作 `--resizing` class 开关与内联 cursor |
| window 监听（§2.3） | 手势内直接 add/removeEventListener | `bindWindowListeners()` 统一管理；`onScopeDispose` + `watch(modalVisible)` 兜底释放——`dispose-on-hide` 只把 `ready=false`（`modal.js:125`）卸载 Teleport 子树，组件实例不卸载、`onUnmounted` 不触发，隐藏时须主动释放，否则监听器与整页 resize 光标残留 |
| 手柄 z-index（§2.5） | `calc(var(--mu-z-index-layer) + 1)` | `calc(var(--mu-z-index-layer, 10) + 1)`，fallback 免疫 `container` 在 `.mu-root` 作用域外时变量未定义、整条声明失效（z-index 回落 `auto`） |

## 1. 现状定位机制（方案基础）

- `.mu-dialog` 已是 `position: absolute`（`dialog.scss:5`），脱离文档流，不是常规 flex item。
- mask（`dialog.vue:8`）的 `flex flex-center`（`layout.scss:125`）只决定 abs 子元素的 **static position**：
  - 未拖拽时（`top/left` 为 auto）→ 视觉居中，隐式坐标。
  - 拖拽后（`onDragStart` 写入 `position.top/left`，`dialog.vue:194`）→ 显式 px 坐标相对 mask（`position: fixed` + `inset: 0`，即 containing block / offsetParent），flex 影响失效。
- 该混合模型下「居中 → 拖拽坐标」无需任何 class 切换，写入 `top/left` 即静默覆盖。

**边缘 resize 的真实障碍**（不是定位方案）：

1. `size` 是纯 computed（`dialog.vue:135`），直接映射 `props.width/height`，无可变状态。
2. 从未拖拽的 dialog 改 `width`（如拖东边缘）时，static position 随新宽度重新居中，对侧边缘跟着动。
3. CSS `min-width: 320px / min-height: 160px`（`dialog.scss:11-13`）与内联 width 的数学一致性；且 skill 参考（`references/components/containers.md:198`）明确用户会经 class 覆盖 min/max 尺寸，JS 常量会失配。**同理 max 也必须按 computed 口径读取**（见 §2.3）。
4. 手势与 `onDragStart` 的 header classList 守卫、maximized 态的协调。

**现存 bug**（本方案顺带修复）：拖拽后（如 `left: 200px`）再最大化，`mu-dialog--maximized`（`dialog.scss:30`）只 `!important` 覆盖 width/height，内联 `top/left` 残留 → 宽 100% 从 left=200px 起算，右侧溢出 200px。`toggleWindowState`（`dialog.vue:234`）未处理 position。

**否决路线**：

- 改为「始终显式绝对坐标」（pure absolute）：失去视口 resize 自动居中；初始居中需 JS 测量（首帧/SSR 时序复杂化）；maximized 协调问题不消失。
- CSS `resize: both`：仅右/下角、UA 行为不可控、无 min/max 约束、与 flex 居中同样冲突。

---

## 2. 方案

### 2.1 props 与状态（dialog.vue）

```js
props: { ..., resizable: Boolean }   // 默认 false，显式开启

const resizing = ref()
const resizeCursor = ref()
const userSize = reactive({ width: undefined, height: undefined })  // 用户 resize 覆盖值（px 字符串）
const stashedPosition = { top: undefined, left: undefined }        // 最大化暂存

const size = computed(() => ({
  width: userSize.width ?? resolveSize(props.width),
  height: userSize.height ?? resolveSize(props.height)
}))
```

`resolveSize` 支持 `50%`/`auto`；物化后 `userSize` 存 px 字符串，`:style="{ ...size, ...position }"` 绑定不变。

**可选**：`watch(() => [props.width, props.height], () => Object.assign(userSize, { width: undefined, height: undefined }))`，让父组件在 resize 后改 props 尺寸仍能生效（否则 `userSize` 永久压制 props）。代价是「props 变化丢弃用户 resize」，符合「props 为真源」的直觉。

### 2.2 模板手柄

```html
<!-- footer 之后、.mu-dialog（overflow: hidden）内侧 -->
<template v-if="resizable && !maximized">
  <div v-for="dir in resizeDirs" :key="dir"
    class="mu-dialog__resize-handle"
    :class="`mu-dialog__resize-handle--${dir}`"
    @mousedown.stop="onResizeStart($event, dir)" />
</template>
```

```js
// 边在角之前：角手柄与边手柄在角部 6×6 区域重叠，两者同为定位元素，
// 由 DOM 顺序决定绘制顺序，角必须靠后才拿得到命中
const resizeDirs = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']
```

- 手柄是 header/body/footer 的兄弟节点，`onDragStart` 的 header classList 守卫天然放行；`.stop` 双保险。
- 手柄须排在 `.mu-dialog__body`（`dialog.scss:83` 也是 `position: relative`）之后，才能盖住 body 内容。
- **手柄必须显式设置 z-index 高于滚动条轨道**：`.mu-scrollbar__tracks` 为 `position: sticky !important` + `z-index: var(--mu-z-index-layer)`（`scrollbar.scss:21-22`，值为 10，`root.scss:127`），而手柄 `z-index: auto`，同在 mask 的 stacking context 内（`.mu-dialog` 常态 `isolation: auto`、无 transform/opacity，不形成新 stacking context）→ **轨道会盖住手柄**。实测右侧 6px 手柄仅外侧 3px 可命中，另 3px 落在 track-y 上（`elementFromPoint` 验证；与 `--mu-scrollbar_width: 6px` / `--mu-scrollbar_margin: 3px`（`scrollbar.scss:2-3`）一致，track 定位由指令内联样式完成）。故 §2.5 给手柄 `z-index: calc(var(--mu-z-index-layer) + 1)`，勿用 `--mu-z-index-above`（值为 1，不够）。
- maximized（含 `maximizeToFullscreen` 变体）时不渲染。

### 2.3 手势逻辑（核心，与 `onDragStart` 同构）

```js
import { resolveSize, resolvePixel } from '@/utils/size'

const cursorMap = {
  n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize'
}

// 与 CSS 层叠规则一致：min 优先于 max（min > max 时按 min 生效）
function bounded (value, min, max) {
  return Math.max(min, Math.min(value, Math.max(min, max)))
}

function onResizeStart (event, dir) {
  if (maximized.value || event.button !== 0) return

  const dlg = dialogEl.value
  const cs = getComputedStyle(dlg)
  const mask = maskEl.value

  const maskW = mask.clientWidth
  const maskH = mask.clientHeight

  // min/max 会被用户 class 覆盖，且可能是 %，只能读 computed style。
  // 注意 getComputedStyle 对 min/max 不做 px 归一（返回 "20%"/"90%"/"none"），
  // 必须用 resolvePixel 按 mask 尺寸换算。
  // 局限：resolvePixel 只认 px/% 后缀，对 "none"/"auto" 及 calc()/min()/max()/clamp()
  // 一律返回 undefined → 回落 0 / Infinity，即约束静默失效（不报错）。见 §5。
  const minW = resolvePixel(cs.minWidth, maskW) || 0
  const minH = resolvePixel(cs.minHeight, maskH) || 0
  const cssMaxW = resolvePixel(cs.maxWidth, maskW)
  const cssMaxH = resolvePixel(cs.maxHeight, maskH)

  const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = dlg
  const right = left + width
  const bottom = top + height

  // 上限：CSS max 与「不越过 mask 边界」取小。
  // 只用 maskW 当上限会在用户设了 max-width:90% 时高估：东/南出现拖不动的死区，
  // 西/北更糟 —— position.left 继续减小而渲染宽度被 CSS 卡死，整个对话框跟着光标滑走。
  const limitW = v => Math.min(cssMaxW ?? Infinity, v)
  const limitH = v => Math.min(cssMaxH ?? Infinity, v)
  const maxEast = limitW(maskW - left)     // 右边缘 ≤ mask 右边
  const maxWest = limitW(right)            // left = right - w ≥ 0
  const maxSouth = limitH(maskH - top)
  const maxNorth = limitH(bottom)

  const base = { width, height, left, top }
  const { pageX, pageY } = event
  const prevCursor = document.documentElement.style.cursor

  let materialized = false

  // 物化延后到首次有效位移：边缘上的单击不应把 width="50%" 永久变成 px、永久废掉 flex 居中
  function materialize () {
    position.top = `${base.top}px`
    position.left = `${base.left}px`
    userSize.width = `${base.width}px`
    userSize.height = `${base.height}px`
    materialized = true

    resizing.value = true
    resizeCursor.value = cursorMap[dir]
    document.documentElement.style.cursor = resizeCursor.value
  }

  function onMouseMove (e) {
    const dx = e.pageX - pageX
    const dy = e.pageY - pageY

    if (!materialized) {
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return
      materialize()
    }

    if (dir.includes('e')) userSize.width = `${bounded(base.width + dx, minW, maxEast)}px`
    if (dir.includes('s')) userSize.height = `${bounded(base.height + dy, minH, maxSouth)}px`

    if (dir.includes('w')) {
      const w = bounded(base.width - dx, minW, maxWest)
      userSize.width = `${w}px`
      position.left = `${right - w}px`
    }
    if (dir.includes('n')) {
      const h = bounded(base.height - dy, minH, maxNorth)
      userSize.height = `${h}px`
      position.top = `${bottom - h}px`
    }
  }

  function onMouseUp () {
    resizing.value = false
    resizeCursor.value = undefined
    document.documentElement.style.cursor = prevCursor   // 还原而非置空，避免清掉页面自身设置

    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)

    // 仅在确有拖动时 clamp：未物化（纯点击）时 dialog 若大于 mask，
    // 居中 static position 为负偏移，无条件 clamp 会把纯点击钉死 top:0（违背点击零副作用）
    if (materialized) correctPosition()
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
```

关键点：

- **min/max 全部读 computed style 而非常量**：JS 常量与 CSS（含用户 class 覆盖）不一致时，西/北边缘锚点漂移、东/南出现死区。百分比也必须换算，`getComputedStyle` 不会代劳。
- **东/南边缘也要物化 left/top**：否则 flex 居中随宽度变化移动对侧边缘。
- 沿用 `pageX/pageY` + `window` mouse 监听，与现有拖拽一致；手势纯客户端，SSR 无影响。
- `bounded` 不用 `utils/math.js` 的 `clamp`：后者在 `min > max` 时静默交换边界（`math.js:2-4`），mask 小于 min 尺寸（小视口）时语义不清。此处显式让 min 胜出，与 CSS 一致。
- `base.width/height` 用 `offsetWidth/offsetHeight`（渲染真值）：props 宽已被 CSS max 卡小时 base 即卡后值，首帧无突跳。

### 2.4 状态协调

**重开重置**——扩展 `watchEffect`（`dialog.vue:271`）：

```js
watchEffect(() => {
  if (props.visible && !props.keepPosition) {
    Object.assign(position, { top: undefined, left: undefined })
    Object.assign(userSize, { width: undefined, height: undefined })
    Object.assign(stashedPosition, { top: undefined, left: undefined })   // 必须一并清，否则取消最大化会弹回上一次的旧坐标
  }
})
```

`keepPosition` 语义顺带扩展为「保留位置与尺寸」（向后兼容）。

**最大化修复**（`toggleWindowState`，`dialog.vue:234`）：

```js
// 实现时须补 nextTick 导入：dialog.vue:63 现有的 vue import 列表里没有它
async function toggleWindowState () {
  maximized.value = !maximized.value

  if (maximized.value) {
    if (props.maximizeToFullscreen) {
      dialogEl.value.requestFullscreen()
    } else {
      Object.assign(stashedPosition, { top: position.top, left: position.left })
      position.top = position.left = undefined   // width/height 已被 !important 覆盖，无需动
      dialogEl.value.classList.add('mu-dialog--maximized')
    }
  } else {
    if (props.maximizeToFullscreen) {
      document.exitFullscreen()
    } else {
      Object.assign(position, stashedPosition)
      dialogEl.value.classList.remove('mu-dialog--maximized')

      // 仅当最大化前确有显式坐标才 clamp：否则会把「靠 flex 居中」的 dialog 钉成绝对坐标，
      // 从此不再随视口变化重新居中
      if (stashedPosition.top !== undefined || stashedPosition.left !== undefined) {
        await nextTick()          // 等 position 写进内联 style，否则读到的是最大化时的旧坐标
        correctPosition()         // 最大化期间视口可能已变小
      }
    }
  }
}
```

fullscreen 变体不需要处理（Fullscreen API 接管布局，背景由 `.mu-root & :fullscreen` 规则接管，`src/styles/root.scss:159`，不在 `dialog.scss`）。

**视口变化**：现有 `@sizechange` → `debounceCorrectPosition` 继续负责 clamp，不扩大范围。

### 2.5 样式（dialog.scss）

```scss
.mu-dialog__resize-handle {
  $t: 6px;

  // 必须高于 .mu-scrollbar__tracks 的 z-index（--mu-z-index-layer = 10），
  // 否则滚动条轨道盖住右侧手柄（实测 6px 中仅 3px 可命中）
  z-index: calc(var(--mu-z-index-layer) + 1);

  position: absolute;
  user-select: none;

  &--n  { top: 0;    left: $t;   right: $t;   height: $t; cursor: n-resize; }
  &--s  { bottom: 0; left: $t;   right: $t;   height: $t; cursor: s-resize; }
  &--e  { right: 0;  top: $t;    bottom: $t;  width: $t;  cursor: e-resize; }
  &--w  { left: 0;   top: $t;    bottom: $t;  width: $t;  cursor: w-resize; }
  &--nw { top: 0;    left: 0;    width: $t*2; height: $t*2; cursor: nwse-resize; }
  &--ne { top: 0;    right: 0;   width: $t*2; height: $t*2; cursor: nesw-resize; }
  &--sw { bottom: 0; left: 0;    width: $t*2; height: $t*2; cursor: nesw-resize; }
  &--se { bottom: 0; right: 0;   width: $t*2; height: $t*2; cursor: nwse-resize; }
}
```

resize 期间接管光标与选区，挂在 `.mu-dialog` 的 `&.mu-dialog--resizing` 内（与 `--dragging` 同层）：

```scss
&.mu-dialog--resizing {
  user-select: none;

  // 子元素自带 cursor（.mu-dialog__sys-button: pointer 等）会盖住继承值，
  // 指针落在对话框内容上时单纯设 body cursor 挡不住闪烁
  * { cursor: inherit !important; }
}
```

模板同步：

```html
:class="{ 'mu-dialog--dragging': dragging, 'mu-dialog--resizing': resizing }"
:style="{ ...size, ...position, cursor: resizing ? resizeCursor : undefined }"
```

- 手柄必须在 `.mu-dialog`（`overflow: hidden`）**内侧**，负偏移会被裁剪。
- `.mu-dialog` 现有 transition 只有 transform/opacity，宽高不参与过渡，无冲突。
- 光标走「dialog 内联 cursor + `--resizing` 覆盖后代」+「`documentElement` 兜住 mask 空白区」两条路，覆盖指针离开手柄与离开对话框两种情形。
- **不 emit resize 事件**（决策）：`userSize` 保持组件内部状态，父组件需持久化尺寸时经已 expose 的 `dialogEl` 自读，或后续按需加 `emit('resize', { width, height })`。理由：`keepPosition` 已覆盖「重开保持」这一主要场景。

---

## 3. 文档与 demo 同步

| 文件 | 内容 |
|---|---|
| `demo/src/modal/my-dialog.vue` 或 `main-view.vue` | 加 `resizable` 演示，**同时开启 `body-scrollbar`**（demo 现无该属性用法；§4-9 手柄 z-index 回归断言以此为准） |
| `docs-site/components/dialog.md` | props 表加 `resizable`；`keepPosition` 语义更新为「保留位置与尺寸」 |
| `skills/mussel-ui/references/components/containers.md` | 同步 props 表；`:198` 附近补「resize 受 computed min/max 约束（支持 px 与 %）」说明 |
| `agent-docs/quick-reference_components.md` | 同步 dialog props 表（`:437` 的 `keep-position` 行、`:520` 的 min/max 注释）。 |

`resizable` 与 `keepPosition` 都需在 props 表标注交互语义：`keepPosition` 从「保留位置」扩为「保留位置+尺寸」后，无法再表达「只保留位置」；如需拆开须另立 prop，当前决策是接受合并。

## 4. 验证清单（playwright，demo 站 3000 端口）

1. 拖 SE 角：`offsetWidth/offsetHeight` 增大，左上角不动。
2. 拖 W 边到极限：宽停在 computed `min-width`（demo 为 640），右边缘不动（锚点正确）。
3. 未拖拽过的 dialog 直接拖 E 边：左边缘不动（物化生效）；边缘上**只点不拖**：尺寸仍为 `50%`、仍居中，且 `top/left` 未被钉死（阈值 + mouseUp 守卫生效）。
4. max 约束：demo 的 `max-width: 90%` 下拖 E / W 到极限，宽停在 90% mask 宽；**W 边关键断言：对话框不滑动、右边缘不动**。S 边同理停在 `max-height`。
5. mask 小于 min 尺寸（缩窗口到 < 640）：无 NaN、无抖动，宽保持 min。
6. resize → 关闭 → 重开：恢复 props 尺寸与居中；`keepPosition` 保留位置与尺寸。
7. 拖拽 → 最大化：无溢出（bug 修复）；还原后位置/尺寸恢复；**未拖拽过**的 dialog 最大化再还原后仍随视口 resize 居中（未被钉成绝对坐标）。
8. 最大化期间缩小视口 → 还原：位置被 clamp 回可见区。
9. **`body-scrollbar` 开启时（§3 更新后的 demo），右侧 E 手柄整段 6px 均可拖**（对 z-index 修复的回归断言）；鼠标移到按钮/图标上光标仍是 resize（无闪烁）。
10. `container="#div1"`（absolute mask）下上述行为一致。
11. 新 scss 过 `stylelint --fix`，eslint 通过。

## 5. 已知取舍

- **右侧手柄与自定义滚动条轨道重叠**：已用 `z-index: calc(var(--mu-z-index-layer) + 1)` 让手柄优先命中。是否再缩窄手柄（6px → 4px）待实测视觉/误触后再定；**注意必须先加 z-index 再判断**，否则 6px 中仅 3px 生效，会误判成「手柄太宽」而错误缩窄。
- **`min-width/max-width` 用 `calc()`/`min()`/`max()`/`clamp()` 时约束静默失效**：`resolvePixel` 只认 `px`/`%` 后缀（`size.js:3-6`），其余返回 `undefined` → min 回落 0、max 回落 Infinity，拖拽不受约束且无任何告警。当前不处理（用户经 class 覆盖为这些写法的情况罕见）；如后续要支持，可改为临时挂载探针元素实测。
- `width="50%"` 等 props 经首次 resize 后物化为 px，后续不再随视口百分比伸缩（属预期，§2.1 的可选 watch 只处理 props 主动变更）。
- **不对外暴露尺寸变化**：无 `emit('resize')`，父组件无法直接获知调整后的尺寸（`dialogEl` 已 expose 可自读）。如需补，加在 `onMouseUp` 的 `materialized` 分支内。
- 移动端不可用（沿用 mouse 事件，与现有拖拽一致）。
- `container` 指向可滚动容器时，`pageX` 增量与 `offsetLeft` 增量会失配（既有拖拽已存在，非本方案引入）。
- **既有问题（本方案外，未纳入实施范围，仅记录修法）**：`watch(() => props.visible)`（`dialog.vue:266`）只在 `maximizeToFullscreen` 变体下重置 `maximized`。`disposeOnHide` 时 DOM 被销毁重建，`maximized` 仍为 `true` 但 class 已丢失 → 图标显示「还原」而窗口并未最大化；叠加本方案会让 resize 手柄在重开后持续隐藏。修法：hide 时对两个变体统一调用 `toggleWindowState()`（else 分支移除 class + 还原 position；`correctPosition` 首行 `if (!modalVisible.value) return`（`dialog.vue:171`）构成守卫，隐藏期调用安全；`disposeOnHide` 的 DOM 销毁在 `delay(200)` 之后，`modal.js:118-127`，hide 当帧 `dialogEl.value` 非空）。**勿直接置 `maximized.value = false`**——非销毁场景（默认 `disposeOnHide=false`）下 class 仍在 DOM，会造成图标与状态反向失配。注意统一后是行为变化：class 变体目前「隐藏再打开保持最大化」（`dialog.vue:266` 条件含 `props.maximizeToFullscreen`），统一后不再保持。
