# drawer 边缘拖拽调整大小（resizable）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施**（经 4 轮评审修订 + Playwright 全清单验证，见 §0 实施记录） |
| 范围 | `src/components/modal/drawer.vue`、`drawer.scss`：新增 `resizable` prop + 单轴边缘 resize（新建 `src/components/modal/drawer-resize.js`）；`demo/src/modal/main-view.vue` 加演示；三处文档同步（含顺手修正 `width` 定位描述的既有偏差，§3） |
| 不在范围 | 抽屉的移动（无此需求）、多方向/角部手柄（drawer 锚定三边，只需单轴）、`emit('resize')` 与尺寸持久化（§5）、`position` 大小写导致的 class 失配（既有 bug，§5 仅记录）、`resolvePixel` 对 `calc()` 类 min/max 的静默失效（既有取舍） |
| 已确认决策 | `resizable` 默认 `false`（opt-in），存量 drawer 行为零变化；不 emit resize 事件；重开不保留用户尺寸 |

## 0. 修订记录

### 实施记录（v5 定稿后）

全部按方案落地，§4 清单 13 项 Playwright 验证通过。与方案的偏差：

| # | 偏差 | 说明 |
|---|---|---|
| 1 | `useDrawerResize` 入参增加第 5 项 `userSize` | §2.2 签名笔误：`userSize` 定义在 drawer.vue（§2.5），而 `onResizeStart` 须写入它，只能作为参数传入 |
| 2 | demo 增加两个用例 | container 抽屉（`position="right" width="60%"` + 定位容器 + `mu-scroll-box` 30 行，清单 8/10 落地）与 `Left(Case)` 按钮（清单 11 落地，运行时注入组件状态不可靠） |
| 3 | §2.3 手柄 scss 的属性顺序调整 | 项目 stylelint `order/properties-order` 要求 `cursor` 先于定位属性、组间空行；§2.3 单行写法为示意 |
| 4 | 清单 5 的验证方式 | 视口 180px 与 `min-width: 2000px` 双场景：CSS 层 min 胜出（元素撑到 min）、手柄溢出可视区无法发起拖拽，无 NaN/抖动——「可拖时的 bounded 停靠」由清单 2 的 min/max 停靠覆盖 |

验证要点：四向拖拽/锚定正确；min 200 / max 100%（含 class 覆盖 900px 精确停靠）；3px 阈值单轴判定（只点不拖不物化、抽屉不关）；拖拽中改 position → 立即终止（`--resizing` 移除、光标还原、后续 move 无响应）+ 尺寸回落 props；重开/静态切换重置；拖拽中 ESC 无残留；mask:false 可拖；container 场景手柄 z-index 11 命中（tracks 10）；`position="Left"` 无 JS 错误。

### v5 相对 v4（第 4 轮评审）

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 1 | 小问题 | §2.5 注释「函数返回数组会被判定为每次都变（引用不同），回调空跑」断言错误：watch getter 仅在其访问的依赖变化时重新执行，不存在无依赖变化的空跑；若成立则 `dialog-move-resize.js:221` 的同款单 getter 写法（§1.3 称已验证）自相矛盾。多 source 数组写法的实际收益是 Vue 逐元素比较、语义精确，非「避免空跑」 | §2.5 |
| 2 | 小问题 | §2.2 `releaseResize` 用途仍写「position 切换」，v4 后同样用于 props 尺寸变更；另补全伪代码两处：§2.4 步骤 5 的 `pageX`/`pageY` 初值、§2.3 script import 的 `reactive`/`watch` | §2.2 / §2.3 / §2.4 |

### v4 相对 v3（第 3 轮评审）

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 1 | 警告 | 拖拽进行中改 `props.width`/`props.height`：只清空 `userSize` 不终止拖拽，`onPointerMove` 闭包按旧 `base` 继续写回，props 变更被静默覆盖并回弹一次（与 v3 对 `position` 的处理不对称）。统一不变式：**props 尺寸/position 变更 ⇒ 终止拖拽 + 尺寸回落 props** | §2.5 / §2.6 / §4-4 |
| 2 | 警告 | 3px 阈值未写死判定条件：照抄 dialog 的 `Math.abs(dx) < 3 && Math.abs(dy) < 3`（两轴都小才不物化），drawer 单轴下非受控轴抖动即物化 → `width="50%"` 被永久改成 px 而视觉尺寸不变。须只判受控轴位移 | §2.4 步骤 5 |
| 3 | 小问题 | §2.3 模板只补了 mask 的 `ref="maskEl"`，漏了 drawer 元素上的 `ref="drawerEl"`；script 侧 `shallowRef` 声明与 composable 调用未列 | §2.3 |
| 4 | 小问题 | 验证清单缺 3 条：「手柄上原地 click 不关抽屉」（§2.4 末段的论证核心）、`position="Left"` 不抛错（v2 修订 #1 的修复断言）、拖拽中改 `props.width` | §4-4/11/12 |
| 5 | 小问题 | `rounded` 抽屉的手柄矩形与圆角不拟合：角部 6×6 三角落在圆角外，命中区略大于可见区 | §5 |
| 6 | 小问题 | 三处文档的「`width`（left/right 时有效）」与 §1.2 实测不符：`--top`/`--bottom` 传 `width` 时面板水平居中、宽度只是不参与拉伸 | §3 / §5 |

本轮复核（Playwright，demo `:3000/modal/`）：§1.2 全部几何断言独立复现一致 —— `--left` `{x:0, w:855, h:930}`、computed `margin: 0px` / `right: 855px`；`--bottom` + `width="50%"` `{x:428, y:730, w:855, h:200}`、`margin: 0px 427.5px`（等值 margin 先解）；`offsetWidth` 855 = `rect.width` 855（demo 含 `padding: 16px`）；computed `min/max` 为 `200px`/`100%`；`overflow: visible`。

### v3 相对 v2（第 2 轮评审）

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 1 | 疑问（已决策） | 拖拽进行中父组件改 `position`：§2.5 watch 清空 `userSize` 后，`onPointerMove` 闭包按旧 `dir.axis` 继续写回，旧维度拖拽值残留在新 position 上。决策：**position 变化 ⇒ 终止拖拽 + 尺寸回落 props**（统一不变式，无论拖拽是否进行中） | §2.2 / §2.5 / §2.6 / §4-4 |

### v2 相对 v1（本轮评审）

| # | 严重度 | 问题 | 修订位置 |
|---|---|---|---|
| 1 | 警告 | `resizeMap` 直接用 `props.position` 索引，但 validator 经 `v.toLowerCase()`（`drawer.vue:42`）放行 `position="Left"`，而 class 未归一（`mu-drawer--${position}`，`drawer.vue:13`）→ 查表得 `undefined`，读 `.axis` 抛错。须 `props.position.toLowerCase()` | §2.4 `resolveDir()` |
| 2 | 警告 | v1 只给了 `--resizing` 的 scss，未给 `drawer.vue:13-14` 的模板改造清单（`:class` 的 `resizing && …`、`:style` 的 `cursor: resizing \|\| undefined`），实施易漏 | §2.3 模板改造 |
| 3 | 警告 | `position` 在 drawer 保持打开时变化，`userSize` 处置未定义：已物化的 width/height 会残留 | §2.5 状态协调 |
| 4 | 小问题 | min/max 未写明「按 axis 只取对应维度」：`drawer.scss:8-11` 的 `min-height: 200px` / `max-height: 100%` 在 `--left`/`--right` 下作用于 `top:0;bottom:0` 拉伸出的高度，与拖宽度无关 | §2.4 `onResizeStart` 步骤 2 |
| 5 | 小问题 | v1 称「`@pointerdown.stop` 双保险」依据错误：mask 关闭判定由 `popup.js:114-122` 绑在 **window 捕获阶段**的 `mousedown`/`mouseup` 派发，`.stop` 拦不住；真正保证是 `targetIsMask`（`modal.js:27-29`）判 target + down/up 双端均在 mask（`modal.js:74-83`） | §2.4 末段 |
| 6 | 小问题 | `margin: auto`（`drawer.scss:12`）的几何未核实：实测 `--top`/`--bottom` + `width` 下抽屉 **水平居中**（left/width/right 均非 auto 时先解等值 margin，CSS 2.1 §10.3.7，`right: 0` 未被忽略），与 `drawer.md:102`「width 仅 left/right 有效」不符；对本方案无阻塞，但须补回归断言 | §1.2 / §4-6 |
| 7 | 小问题 | 手柄命中区与滚动条/内容的交互代价未记录（6px 压在内容边缘，`mu-scroll-box` 场景正是滚动条轨道区） | §5 |
| 8 | 小问题 | 验证清单缺 3 项：容器小于 min 200px 时的无 NaN/抖动、`mask: false` 时手柄可用、手柄 z-index 回归 | §4-5/8/9/10 |
| 9 | 疑问 | 不 emit resize / 不保留尺寸的决策与 dialog 一致，但侧面板的尺寸持久化诉求更强，须注明后续接缝 | §5 |

### 已核实成立（v1 前提，实测支撑）

| 项 | 证据 |
|---|---|
| 单轴、无锚点联动 | 实测 `--left`（`width="50%"`）改内联 width：400px → `{x:0,w:400}`；1200px → `{x:0,w:1200}`，左边缘恒为 0，右边缘随动。故可省掉 dialog 的坐标物化与 `correctPosition` |
| `offsetWidth` 口径与 CSS width 一致 | `root.scss:164-166` 为 `box-sizing: border-box`；实测 demo（`padding: 16px`）`offsetWidth` 855 = `rect.width` 855，首次物化无跳变 |
| min/max 可解析 | 实测 computed `minWidth/minHeight: 200px`、`maxWidth/maxHeight: 100%`，非 `calc()` 写法，`resolvePixel` 均能换算 |
| 手柄 z-index 依据充分 | `scrollbar.scss:22` 的 `--mu-z-index-layer` = 10（`root.scss:127`），手柄取 11 严格大于 |
| 兜底释放必要 | `modal.js:117-127` 的 `disposeOnHide` 只卸载 Teleport 子树（实例不卸载、`onScopeDispose` 不触发），须靠 `watch(modalVisible)`；`onScopeDispose` 覆盖真卸载 |
| 不复用 `useDialogMoveResize` | 其 8 方向手柄、`maximized` 协调、`correctPosition`、position 物化在 drawer 全不适用 |

## 1. 现状与前提

### 1.1 定位模型

`.mu-drawer` 是 `position: absolute`（`drawer.scss:6`），包含块是 mask（`modal-mask.scss:2-4`，`fixed; inset: 0`；`container` 场景为 `absolute` 铺满容器）。各 position 的定位（`drawer.scss:26-60`）：

| position | 定位边 | 有效尺寸维度 | 拖拽手柄所在边线 |
|---|---|---|---|
| `left` | `top:0; bottom:0; left:0`（right auto） | width | 右边线（`width: 6px; right: 0`） |
| `right` | `top:0; right:0; bottom:0`（left auto） | width | 左边线 |
| `top` | `top:0; right:0; left:0`（bottom auto） | height | 底边线 |
| `bottom` | `right:0; bottom:0; left:0`（top auto） | height | 顶边线 |

`left`/`right` 的高度由 `top:0; bottom:0` 拉伸铺满，`top`/`bottom` 的宽度由 `left:0; right:0` 决定（未传 `width` 时铺满）。两侧均只有单一维度受 props 控制，**拖对侧边线只改一个维度，不需要反向改坐标**——这是本方案比 `dialog-edge-resize` 简单的根本原因。

### 1.2 已实测的几何（Playwright，demo `:3000/modal/`）

- `--left` + `width="50%"`：`{x:0, y:0, w:855, h:930}`，mask `1710×930`；computed `margin: 0px`（`right: auto` → auto margin 解析为 0）、`right: 855px`（解出值）。→ 贴左锚定成立。
- `--bottom` + `width="50%"`：`{x:428, y:730, w:855, h:200}`；改内联 height 为 300px → `{y:630, h:300}`。→ 底边锚定成立（`y = 930 - 300`），但宽度 **水平居中**（`x = (1710-855)/2`）：左侧三个值（left/width/right）均非 auto 且 `margin: auto` 时，CSS 2.1 §10.3.7 先解等值 margin，over-constrained 的「忽略 right」不生效。
- 未传 `width` 的 `--top`/`--bottom`：`left:0; right:0; width: auto` → width 解出铺满，auto margin 视为 0（`drawer.md:102` 的「width 仅 left/right 有效」对未传 width 的默认场景成立，传了 width 则居中，属既有行为）。
- 高度 `200px`（`--bottom` 无 height prop）= `min-height: 200px` 撑起，非内容高。

### 1.3 参照实现

`src/components/modal/dialog-move-resize.js` 已验证的四件机制，本方案沿用（但代码自包含，不复用该 composable）：

1. `bindWindowListeners`（`:74-91`）统一管理 pointer 监听 + 释放回调，`onScopeDispose` + `watch(modalVisible)` 兜底。
2. min/max 读 computed style 而非 JS 常量（用户可经 class 覆盖），百分比按 mask 尺寸换算（`resolvePixel`）。
3. 上限取 `min(cssMax, 不越出 mask)`——只用 mask 尺寸会在用户设了 `max-width: 90%` 时高估（`dialog-edge-resize.md` v2 修订 #1 的教训）。
4. 3px 阈值延迟物化：边缘上的纯点击不把 `width="50%"` 永久变成 px。

## 2. 方案

### 2.1 prop

```js
resizable: Boolean   // 默认 false，opt-in
```

### 2.2 实现位置

新建 `src/components/modal/drawer-resize.js`，导出 `useDrawerResize({ props, drawerEl, maskEl, modalVisible, userSize })`（`userSize` 为 drawer.vue 持有的物化尺寸，见 §2.5），返回 `{ resizing, onResizeStart, releaseResize }`——`releaseResize` 即 `bindWindowListeners` 的释放回调（移除 window 监听 + §2.4 步骤 7 的还原），供 position / props 尺寸变更（§2.5 合并 watch）终止进行中的拖拽。与 `dialog-move-resize.js` 平行。`bounded`（min > max 时 min 胜出，与 CSS 一致）与 `bindWindowListeners` 自包含复制，不动已验证的 dialog 代码；复制处加注释交叉引用 `dialog-move-resize.js`。

### 2.3 模板与样式

`drawer.vue` 改造清单（模板 + script，`dialog.vue:167-168` 的对应项）：

```html
<div
  v-show="modalVisible"
  ref="maskEl"
  class="mu-drawer-mask mu-modal-mask"
  …>

  <div
    ref="drawerEl"
    v-bind="$attrs"
    class="mu-drawer"
    :class="[`mu-drawer--${position}`, rounded && 'mu-drawer--rounded', resizing && 'mu-drawer--resizing']"
    :style="{ ...drawerSize, cursor: resizing || undefined }">
    <slot />
    <div v-if="resizable" class="mu-drawer__resize-handle" @pointerdown.stop="onResizeStart" />
  </div>
</div>
```

script 侧新增（`shallowRef`/`reactive`/`watch` 并入现有 `vue` import，`drawer.vue:25` 现仅 `computed`）：

```js
const maskEl = shallowRef()
const drawerEl = shallowRef()

const { resizing, onResizeStart, releaseResize } = useDrawerResize({
  props, drawerEl, maskEl, modalVisible
})
```

手柄无需 modifier：位置由 position class 派生，四条规则覆盖四向（`drawer.scss`）：

```scss
.mu-drawer__resize-handle {
  $t: 6px;

  position: absolute;
  touch-action: none;
  user-select: none;

  // 须高于 .mu-scrollbar__tracks（scrollbar.scss:22 的 --mu-z-index-layer = 10），
  // 否则内容滚动条轨道盖住手柄；fallback 兜底 container 在 .mu-root 外时变量未定义导致整条声明失效
  z-index: calc(var(--mu-z-index-layer, 10) + 1);

  .mu-drawer--left &   { top: 0; bottom: 0; right: 0; width: $t;  cursor: e-resize; }
  .mu-drawer--right &  { top: 0; bottom: 0; left: 0;  width: $t;  cursor: w-resize; }
  .mu-drawer--top &    { left: 0; right: 0; bottom: 0; height: $t; cursor: s-resize; }
  .mu-drawer--bottom & { left: 0; right: 0; top: 0;    height: $t; cursor: n-resize; }
}

.mu-drawer--resizing {
  user-select: none;

  // 内容自带 cursor（.mu-button: pointer 等）会盖住继承值，
  // 指针落在抽屉内容上时单纯设 body cursor 挡不住闪烁
  * { cursor: inherit !important; }
}
```

手柄只出现在对侧边线，`.mu-drawer` 无 `overflow: hidden`（与 dialog 不同），边缘内侧定位无裁剪风险；`.mu-drawer` 现有 transition 只有 transform/opacity，宽高不参与，无冲突。

### 2.4 手势逻辑（`drawer-resize.js`）

```js
// 对侧边线 → 受控维度与位移符号
const resizeMap = {
  left:   { axis: 'width',  sign: 1,  cursor: 'e-resize' },  // 拖右边线：width + dx
  right:  { axis: 'width',  sign: -1, cursor: 'w-resize' },  // 拖左边线：width − dx
  top:    { axis: 'height', sign: 1,  cursor: 's-resize' },  // 拖底边线：height + dy
  bottom: { axis: 'height', sign: -1, cursor: 'n-resize' }   // 拖顶边线：height − dy
}

// 与 CSS 一致：min > max 时 min 胜出（utils/math 的 clamp 会静默换序）
function bounded (value, min, max) {
  return Math.max(min, Math.min(value, Math.max(min, max)))
}
```

`onResizeStart(event)` 流程：

1. 守卫 `event.button !== 0`；`event.currentTarget.setPointerCapture(event.pointerId)`。
2. **归一 position**：`const dir = resizeMap[props.position.toLowerCase()]`（`drawer.vue:42` validator 同样 `toLowerCase`，不改 class 命名口径——该失配属既有 bug，见 §5）。
3. **min/max 按 axis 只取对应维度**（另一维度的 min/max 由 CSS 自行拉伸/约束，与拖拽无关）：

```js
const cs = getComputedStyle(drawerEl.value)
const maskW = maskEl.value.clientWidth
const maskH = maskEl.value.clientHeight

const isWidth = dir.axis === 'width'
const min = resolvePixel(isWidth ? cs.minWidth : cs.minHeight, isWidth ? maskW : maskH) || 0
const cssMax = resolvePixel(isWidth ? cs.maxWidth : cs.maxHeight, isWidth ? maskW : maskH)

// 上限取 CSS max 与「不越出 mask」的较小者；只用 mask 尺寸会在用户设了 max-width 时高估
const max = Math.min(cssMax ?? Infinity, isWidth ? maskW : maskH)
```

   局限：`resolvePixel`（`size.js:3-6`）只认 `px`/`%` 后缀，`calc()`/`min()`/`max()`/`clamp()` 返回 `undefined` → min 回落 0、max 回落 Infinity，约束静默失效（不报错）。drawer 默认 `min-*: 200px` / `max-*: 100%` 可解析，非默认写法见 §5。
4. base 取 `offsetWidth`/`offsetHeight`（渲染真值，与 CSS width 同口径：项目 `box-sizing: border-box`；props 宽被 CSS max 卡小时无首帧突跳）。
5. move：初值取 pointerdown 时的 `const { pageX, pageY } = event`（dialog 同款，`dialog-move-resize.js:146`），先取受控轴位移 `const delta = isWidth ? e.pageX - pageX : e.pageY - pageY`，再做 3px 阈值延迟物化：

```js
if (!materialized) {
  // 只判受控轴：照抄 dialog 的「两轴都 < 3」会让非受控轴抖动也触发物化，
  // width="50%" 被改写成 px 而视觉尺寸不变
  if (Math.abs(delta) < 3) return
  materialize()   // userSize[dir.axis] = `${base}px`；resizing.value = dir.cursor + documentElement.style.cursor
}
```

6. 写值：`userSize[dir.axis] = `${bounded(base + dir.sign * delta, min, max)}px``。
7. up：释放监听、`resizing.value = null`、还原 `documentElement.style.cursor`（还原为 `prevCursor`，非置空，避免清掉页面自身设置）。

监听经 `bindWindowListeners` 绑 `pointermove`/`pointerup`/`pointercancel`；`onScopeDispose` + `watch(modalVisible)` 兜底释放（`dispose-on-hide` 只卸载 Teleport 子树、实例不卸载，不主动释放会残留整页 resize 光标）。

**不会误关抽屉**：mask 的关闭判定来自 window **捕获阶段**的 `mousedown`/`mouseup`（`popup.js:114-122`），`.stop` 拦不住；保证来自 `targetIsMask`（`modal.js:27-29`）判 target 为 mask 且 down/up 双端均在 mask（`modal.js:74-83`）——手柄 pointerdown 的 target 是手柄，`isMouseDownInMask` 为 false，条件不成立。`.stop` 仅作装饰。

### 2.5 状态协调（`drawer.vue`）

```js
const userSize = reactive({ width: undefined, height: undefined })

const drawerSize = computed(() => ({
  width: userSize.width ?? resolveSize(props.width),
  height: userSize.height ?? resolveSize(props.height)
}))

// 重开重置：drawer 无 keepPosition，重开恢复 props 尺寸
watch(() => props.visible, v => {
  if (v) userSize.width = userSize.height = undefined
})

// props 尺寸/position 为真源：任一变更 ⇒ 终止进行中的拖拽 + 丢弃物化尺寸。
// 尺寸变更不先 release 时，move 闭包按旧 base 继续写回，把 props 变更静默覆盖并回弹一次；
// position 变更时旧维度的 px 在另一维度上语义失效（如 width 物化后切到 bottom）。
// 多 source 数组写法：Vue 对数组 source 逐元素比较，语义精确；
// 单 getter 返回数组（dialog-move-resize.js:221 的写法）行为等价但依赖引用比较，不宜再效仿
// watch 回调同步执行，期间不会插入 pointermove，先 release 再清空即无残留。
// pointer capture 无需显式释放：pointerup 时浏览器自动释放（dialog 同款，从不显式 release）
watch([() => props.width, () => props.height, () => props.position], () => {
  releaseResize()
  userSize.width = userSize.height = undefined
})
```

### 2.6 决策点

| 决策 | 结论 |
|---|---|
| 重开是否保留用户尺寸 | 不保留，`visible` 变 true 时清空 `userSize`（与 dialog 默认行为一致） |
| 是否 emit resize | 不 emit（同 dialog），`userSize` 保持内部状态；接缝位置见 §5 |
| 拖拽中 props 尺寸或 position 变化 | 终止拖拽（`releaseResize`）+ 尺寸回落 props；统一不变式「props 尺寸/position 变化 ⇒ 物化尺寸作废」，指针需重新发起拖拽 |
| 拖拽中视口变化 | 不主动 clamp `userSize`，CSS `max-*: 100%` 兜底显示；再次拖拽时 `base` 取被压后的 `offsetWidth`，自愈 |
| 是否复用 `useDialogMoveResize` | 不复用（8 方向、`maximized` 协调、`correctPosition`、position 物化均不适用），自包含复制 |
| 是否加 `overflow: hidden` | 不加，手柄在内侧边缘，无溢出风险 |

## 3. 文档与 demo 同步

| 文件 | 内容 |
|---|---|
| `docs-site/components/drawer.md` | API 表加 `resizable`；演示区加可拖拽抽屉示例；修正 `:21`/`:102` 的「`width`（left/right 时有效）」—— `--top`/`--bottom` 传 `width` 时面板水平居中（§1.2），宽度只是不参与拉伸 |
| `docs/quick-reference_components.md` | drawer 段同步 `resizable`；修正 `:578` 的 `width` 描述（同因） |
| `skills/mussel-ui/references/components/containers.md` | 同步 props 表，补「resize 受 computed min/max 约束（支持 px 与 %）」说明；修正 `:240` 的 `width` 描述（同因） |
| `demo/src/modal/main-view.vue:49` | drawer 用例加 `resizable`（现为 `width="50%"` + `maskVisible`/`rounded` 开关） |

## 4. 验证清单（Playwright，demo `:3000/modal/`）

1. 四个 position 各拖一次：受控维度随动、锚定边不动、方向正确（`left` 拖右边线向右变宽；`bottom` 拖顶边线向上变高）。
2. 拖到极限：停在 computed min（默认 200px）与 max（`100%` mask 尺寸）；用户经 class 覆盖 `max-width` 时同样停在覆盖值。
3. `width="50%"`：拖动后物化 px；边缘上**只点不拖**仍是 `50%`、仍是居中/贴边原状（阈值 + 未物化守卫生效）。
4. resize 后改 `props.width` → 覆盖值被丢弃、回到 props 尺寸；关闭重开 → 恢复 props 尺寸；保持打开时改 `position` → 尺寸重置；**拖拽进行中改 `position` 或 `props.width`** → 拖拽立即终止（此后移动指针无响应）、尺寸回落 props、无 resize 光标与监听残留。
5. 容器（mask 或 `container` 指定元素）小于 min 200px：无 NaN、无抖动，尺寸保持 min（`bounded` 让 min 胜出，与 CSS 一致，溢出可接受）。
6. **`--top`/`--bottom` + `width` 场景：拖高度时宽度与水平位置不变**（`margin: auto` 居中几何的回归断言，见 §1.2）。
7. `mask: false`：手柄仍可拖（`modal-mask.scss:14-21` 的 `pointer-events: none` 由 `& > *` 恢复，手柄随 drawer 拿到 `auto`）。
8. 内容含 `mu-scroll-box`：整段 6px 手柄可命中（z-index 11 > tracks 10 的回归断言）；指针移到内容按钮/图标上光标仍为 resize（无闪烁）。
9. 拖拽中按 ESC 关闭、以及 `dispose-on-hide` 场景下关闭：无监听器残留、无整页 resize 光标残留。
10. `container="#div1"`（absolute mask，demo 已有）下上述行为一致。
11. `position="Left"`（大写，validator 放行）：拖拽不抛错（`resizeMap` 查表命中；class 失配属既有 bug，见 §5）。
12. 手柄上 pointerdown → 原地 pointerup（不移动）：抽屉**不被关闭**（§2.4 末段的断言），且 `width="50%"` 未被物化。
13. 新 scss 过 `stylelint --fix`，eslint 通过。

## 5. 已知取舍

- **手柄压住内容边缘 6px**：`left`/`right` 抽屉的手柄正落在内容最右/最左 6px 上；内容用 `mu-scroll-box` 时该处是滚动条轨道交互区（`--mu-scrollbar_width: 6px` / `--mu-scrollbar_margin: 3px`，`scrollbar.scss:2-3`）。z-index 11 保证手柄优先命中，代价是滚动条外侧 6px 不可拖。与 `dialog-edge-resize` 同款取舍，是否缩窄手柄（6px → 4px）待实测误触率后再定。
- **`rounded` 抽屉的手柄角部溢出**：手柄是矩形（`--left` 为 `top:0;bottom:0;right:0`），与 `mu-drawer--rounded` 的圆角不拟合 —— 外侧上/下 6×6 三角落在圆角之外，命中区略大于可见区，功能无害（dialog 角手柄有同类偏差）。不处理。
- **三处文档「`width`（left/right 时有效）」与实测不符**：`--top`/`--bottom` 传 `width` 时面板水平居中（宽度生效，只是不参与拉伸），见 §1.2。属既有文档偏差，随 §3 一并修正。
- **`min-*`/`max-*` 用 `calc()`/`min()`/`max()`/`clamp()` 时约束静默失效**：`resolvePixel` 只认 `px`/`%`（`size.js:3-6`），其余返回 `undefined` → min 回落 0、max 回落 Infinity，拖拽不受约束且无告警。当前不处理；如要支持，可改为临时挂载探针元素实测。
- **`width="50%"` 经首次 resize 后物化为 px**，不再随视口百分比伸缩（属预期；props 主动变更会经 §2.5 的 watch 丢弃覆盖值）。
- **不对外暴露尺寸变化**：无 `emit('resize')`，父组件无法直接获知调整结果。侧面板对尺寸记忆的诉求强于 dialog，如需补，加在 `onResizeUp` 的 `materialized` 分支内，或新增 `keepSize` prop 与 §2.5 的「重开重置」互斥（`keepPosition` 在本组件不存在，须另立）。
- **既有 bug（本方案外，仅记录）**：`position` 传入大写（validator 允许 `'Left'`，`drawer.vue:42`）时 class 为 `mu-drawer--Left`，无 CSS 匹配 → 抽屉定位整体失效。修法：`drawer.vue:13` 与模板其他位置统一 `position.toLowerCase()`（或用 computed 归一）。
- 移动端拖拽沿用 pointer 事件（与 dialog 一致，已从 mouse 迁移）。
- `container` 指向可滚动容器时 `pageX` 增量与 `offsetLeft` 增量失配——drawer 不用 `offsetLeft`（只按 axis 改尺寸），不受此影响。
