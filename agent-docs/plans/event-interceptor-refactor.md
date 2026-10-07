# EventInterceptor 事件计数加固与 sizechange 简化

| 项目 | 内容 |
|---|---|
| 状态 | **待实施**（2026-10-07 复核修订 + 追加卸载自动释放，见文末修订记录） |
| 范围 | `src/events/interceptor.js`（镜像账本 + transition API）、`src/events/resize.js`（删计数、改 transition 注册、派发带 detail、挂载状态清扫 §4.3）、`src/events/touch/index.js`（`interceptorRemove` 修复，见 §6） |
| 不在范围 | 放弃 prototype patch 改显式 API / 指令的路线（API 破坏性变更，与 `@sizechange` 零样板卖点冲突） |
| 文档同步 | 复核已完成：更正 `knowledge/patterns/sizechange-event.md` 的"卸载自动解绑"表述，新增 `knowledge/pitfalls/vue-unmount-no-listener-removal.md`；实施 §4.3 后需再更新该 pattern（新增挂载状态释放行为） |

---

## 1. 现状

- `interceptor.js`：patch `Element.prototype.addEventListener / removeEventListener`，按事件类型把 add/remove 调用转发给已注册 interceptor（`this` = 元素）。
- `resize.js`：为 `sizechange` 注册 interceptor，用挂在元素上的 `Symbol.for('mussel.event.resize.count')` 对 **add/remove 调用次数** 计数：0→1 时 `observe`，减到 0 时 `unobserve`，模块级共享单个 `ResizeObserver`。
- `touch/index.js`：以 `{ add, remove }` 形态注册手势类型（`interceptorRemove` 有既有缺陷，见 §6）。

## 2. 问题

### 2.1 计数与浏览器真实监听状态会漂移

计数把"调用次数"当"监听数"，但浏览器按 `type + callback + capture` 匹配有去重与 no-op 语义，两边对不上：

| 场景 | 浏览器行为 | 计数行为 | 后果 |
|---|---|---|---|
| 同一 listener 同 capture add 两次 | 第二次 no-op | 多记 1 | remove 一次后真实监听已空但计数 1，继续 observe |
| remove 从未 add 过的 listener | no-op | `count <= 1` 分支无条件清零 + unobserve | 仍存活的监听收不到事件 |
| add 与 remove 的 capture 不匹配 | no-op | 同上 | 同上 |
| `{ once: true }` 触发后内部自动移除 | 不经过 patched removeEventListener | 悬挂 +1 | unobserve 不掉，空派发 |
| `options.signal` abort 自动移除 | 不经过 patched removeEventListener | 悬挂 +1 | 同上 |

注：计数不会为负——`count <= 1` 分支（resize.js:24-26）本身就是 clamp；真正的放大器是"任何未匹配的 remove 在 `count <= 1` 时无条件清零并 unobserve"。第 2/3 行不是"减过头"，而是"一次空 remove 就把账清零"。

现网消费方（pagination、dialog、tooltip-panel、combo-wrapper、date-picker 系列、table、segmented、scroll-area、scrollbar）均为 Vue 模板单 add/remove 或自管成对调用，不触发上表的 add/remove 配对漂移；但 `EventInterceptor` 是库的公开导出（`src/index.js:63`），第三方裸 DOM 用法一旦踩中，故障形态（事件静默失效 / 观察不释放）极难排查。另见 §2.2——解绑路径的整体问题比配对漂移更大。

### 2.2 元素卸载不会触发解绑（实测）

实测（Vue 3.5.39 + modal demo）：

- my-dialog（`dispose-on-hide`）开/关一轮：`.mu-modal-mask`（模板 `@sizechange`）随 Teleport 子树卸载后 `isConnected=false`，计数仍为 1，全程无 `removeEventListener('sizechange')` 调用；唯一一条移除来自 `v-mu-scrollbar` 指令自管解绑的 `.mu-dialog__body`。
- `app.unmount()` 整树销毁：同样仅触发上述指令侧移除。
- 源码侧吻合：Vue 卸载路径只对元素做 `hostRemove`，不 patch props；面向用户监听的移除只发生在 `patchEvent` 把监听置空时。

结论：

1. 模板消费方元素卸载后一律保持 observe（现状如此；账本不改变这一点，释放由 §4.3 的挂载状态清扫补上）。detached 元素无 box 变化，RO 回调为惰性；元素是否被回收取决于浏览器对 detached 被观察目标的 GC 策略（规范未规定、实现有差异），不能依赖、也不宜断言"必泄漏"。
2. `@sizechange.once` 的"Vue 卸载自愈"不成立：浏览器 `once` 自动移除不走 patched remove，卸载也不出账 → 与裸 DOM 一样悬挂。
3. 现网唯一真正触达 0→unobserve 的路径是自管解绑的 scrollbar 指令。
4. 账本只在 remove 调用时变化，单靠它无法感知卸载；释放需要第二个生命周期信号——DOM 挂载状态。本方案以挂载状态清扫达成"卸载自动释放（有界延迟）"（§4.3）：不改 DX、组件侧零代码。

账本方案的价值仍在：修复 §2.1 全部漂移行，对公开导出的 `EventInterceptor`（第三方裸 DOM 用法）成立。

### 2.3 次要问题

- `Symbol.for(...)` 注册进全局 symbol registry，无跨副本共享意义（两次加载 mussel 时 interceptor / observer 本就不共享），应改局部 `Symbol()`，或随本方案直接消掉。
- 派发时未带 `detail`，消费方只能读 `event.target.clientWidth`（强制回流）；RO 回调里 `entry.contentRect` 是现成的。

## 3. 决策：单实例 ResizeObserver 保留

1. 帧级合并不依赖单实例——规范要求浏览器在同一帧内对所有 RO 实例统一派发，per-element 实例同样享受帧合并。
2. 单实例收益是常数级的（N 个元素同帧变化时 1 次回调 vs N 次回调、1 个对象 vs N 个），可忽略但无成本无风险。
3. **账本的复杂度与实例策略无关**：hook 点在 `add/removeEventListener`，任何方案都必须知道"元素上还有没有该事件监听"才能决定 observe / unobserve；per-element RO 一样要记账，还多建对象多回调——纯负优化。且 §2.2 的释放问题与实例策略无关：per-element RO 同样需要挂载状态清扫（§4.3）才能释放。
4. 能真正消灭记账的路线只有放弃 prototype patch 改显式 API / `v-resize` 指令，与已沉淀的设计决策（tooltip、dropdown-panel 方案文档；`@sizechange` 零模板样板）冲突，不做。

## 4. 方案：镜像账本 + transition API + 挂载状态清扫

核心思路：把"计数调用次数"升级为"镜像浏览器去重语义的真实监听账本"。去重语义属于 addEventListener 本身，账本放 interceptor 通用层；消费方只声明 0→1 / →0 两个 transition。账本之外的释放缺口（卸载不触发 remove，§2.2）由挂载状态清扫兜底（§4.3），两者正交。

### 4.1 interceptor.js

- 账本：`WeakMap<el, Map<type, { bubble: Map, capture: Map }>>`。内层 Map 的 key 为 listener，value 为 `{ signal, onAbort } | null`（供 AbortSignal 清理）。强引用无泄漏——挂在 WeakMap value 上，随元素一起释放。
- **适用范围**：仅对以 transition 形态（`{ activate, deactivate }`）注册的类型启用。legacy `{ add, remove }` 形态（touch 手势）保持现状：每次调用都转交，不计账、不去重，行为不变。
- capture 归一化（`options` 可为 null / boolean / 对象，注意 null 与布尔化）：

  ```js
  const capture = options !== null && typeof options === 'object' ? !!options.capture : !!options
  ```

- patched add / remove 语义（先记账与 transition，后调 native，与原实现顺序一致）：

  ```js
  // 伪码：remove 对称
  prototype.addEventListener = function (type, listener, options) {
    const itc = registeredInterceptors[type]

    if (itc?.activate) {
      if (!ledger.has(this, type, capture, listener)) {   // 已存在 → 浏览器将 no-op
        ledger.add(this, type, capture, listener, options?.signal)

        if (ledger.isFirst(this, type)) itc.activate(this) // (el, type) 0→1
      }
    } else {
      itc?.add?.call(this, type, listener, options)        // legacy：原样转交
    }

    prototypeAdd.call(this, type, listener, options)       // native 始终调用，去重由浏览器负责
  }
  ```

  remove 侧：账本未命中 → 不扣账、不触发 deactivate（修复 §2.1 表第 2/3 行）；出账至 0 → `deactivate(el)`。
- 新增注册形态（与现有 `add/remove` 原始 API 并存）：

  ```js
  EventInterceptor.register('sizechange', {
    activate (el) { observer?.observe(el) },
    deactivate (el) { observer?.unobserve(el) }
  })
  ```

- AbortSignal：patched add 检测 `options.signal`——
  1. signal 已 aborted → 浏览器不会注册，不入账；
  2. 入账时挂 abort 处理，同一 listener + signal 只挂一次（账本 value 记 `{ signal, onAbort }`）；
  3. abort 触发 → 走同一套出账 + deactivate 判定（修复 §2.1 表第 5 行）；
  4. 监听被显式 remove 出账后摘除 abort 处理，避免 signal 存活期间闭包持有 el / listener。
- `once` 不做包装修复，标注不支持：浏览器自动移除不经过 patched remove，卸载也不出账（§2.2）——裸 DOM 与 Vue 模板同样悬挂。文档不得写"Vue 自愈"。
- 元素卸载不触发 remove（模板监听）：监听本身不会被移除（Vue 行为，见 knowledge pitfall），但观察由 §4.3 的挂载状态清扫在元素脱离文档后有界延迟内释放；JSDoc 与文档按此表述（不写"卸载自动解绑"，也不写"永不释放"）。

### 4.2 resize.js：删计数与派发 detail

计数、`Symbol.for`、`count <= 1` 分支全部删除，缩到 observer 定义 + 上面 3 行注册。派发改为带尺寸数据：

```js
new ResizeObserver(entries => {
  entries.forEach(entry => dispatchCustomEvent(entry.target, 'sizechange', { detail: entry }))
})
```

`detail` 向后兼容：现有消费方读 `event.target.clientWidth` 不受影响，可渐进迁移到 `event.detail.contentRect` 免强制回流。注意 `entry` 持有 target 且仅在回调内有效，文档提示消费方读取即弃、不要缓存。

### 4.3 resize.js：挂载状态清扫（卸载自动释放）

定位：账本管"谁在听"（0→1 / →0，§4.1），本层管"元素还值不值得观察"——释放不依赖 remove 调用，由 DOM 挂载状态兜底。组件侧零代码、DX 不变。

设计（示意，非最终代码）：

```js
const refs = new Set()         // Set<WeakRef<Element>>：可遍历、不持有强引用
const state = new WeakMap()    // el -> { observed, dormant, seenConnected, inRefs }
let timer

function activate (el) {
  let st = state.get(el)

  if (!st) {
    st = {}
    state.set(el, st)
  }

  if (st.observed) return

  st.observed = true
  st.dormant = false
  if (el.isConnected) st.seenConnected = true

  observer.observe(el)

  if (!st.inRefs) {
    refs.add(new WeakRef(el))
    st.inRefs = true
  }

  timer ??= setInterval(sweep, SWEEP_INTERVAL)   // 首次 observe 才启表
}

function deactivate (el) {
  const st = state.get(el)

  if (st) {
    st.observed = false
    st.dormant = false
  }

  observer.unobserve(el)                          // 显式释放 = 立即释放（快路径）
}

function sweep () {
  for (const ref of refs) {
    const el = ref.deref()
    const st = el && state.get(el)

    if (!el || !st) { refs.delete(ref); continue }                                     // 元素已回收
    if (!st.observed && !st.dormant) { refs.delete(ref); st.inRefs = false; continue }  // 已被显式释放
    if (!st.seenConnected) { if (el.isConnected) st.seenConnected = true; continue }    // 从未入过文档：宽限
    if (!el.isConnected) { observer.unobserve(el); st.observed = false; st.dormant = true }
    else if (st.dormant) { observer.observe(el); st.observed = true; st.dormant = false } // 离屏挂回：自愈
  }

  if (!refs.size) { clearInterval(timer); timer = undefined }
}
```

要点：

- **释放条件**：曾挂载（`seenConnected`）且当前 `!isConnected` → unobserve；读标志位，不触发回流。
- **重挂载自愈**：被清扫元素留在 `refs` 标 `dormant`，之后任一次清扫发现它重回文档即自动恢复观察（≤ 一个周期）——补掉"纯清扫方案对离屏缓存节点再挂回"的缺口。
- **宽限**：从未进过文档的元素不误伤（"先 add 监听、再插入 DOM"的写法不受影响）。
- **成本**：惰性定时器（首个 observe 启动，条目清空停表）+ 每次 O(观察中元素数)；周期可配（`SWEEP_INTERVAL`，默认 10s），需要更省可换空闲时段自循环。
- **语义无损**：detached 元素本来就无 box 变化、RO 回调惰性；延迟释放只影响观察条目的保留时长。显式 remove 的立即释放快路径（scrollbar 现状）保留。
- **可断言**：dev 构建暴露观察计数（`refs.size`），供 §5.7 断言。

不采用的替代（结论与理由，避免后续重复评估）：

- Vue 全局 mixin / 插件卸载钩子：覆盖不了元素级 `v-if`（组件实例未卸载），仍需遍历子树。
- patch `removeChild` / `replaceChildren` 等 DOM 方法：漏 `innerHTML = ''` 等批量路径，覆盖不全且更侵入。
- `FinalizationRegistry` 兜底：RO 是否保留目标不由我们决定，目标可能永不进 GC，兜底可能永不触发。
- `MutationObserver` 驱动：可作零延迟精确档（把清扫触发从定时器换成 mutation），但引入全站 DOM 变更回调；收益（把 ≤ 一个周期的延迟归零）不抵成本。
- 依赖引擎 GC 回收 detached 被观察元素：规范未定义、实现有差异（WebKit 曾有真实泄漏），不能作为方案。

## 5. 验证

无测试框架，用 demo 页面 + Playwright（DOM 断言；每项先做正向对照，再验证目标行为）：

1. **回归消费方**：`http://localhost:3000/table/`（pagination、scroll-area、table 均在）、modal / dropdown / calendar 等 demo，确认 `@sizechange` 正常触发。
2. **首次挂载立即触发一次**：挂上监听即刻收到一次当前尺寸（pagination 按钮数计算依赖）。
3. **去重语义**：同一元素 `addEventListener('sizechange', fn)` 连调两次、`removeEventListener` 一次 → 改尺寸不再派发（对照：未移除时改尺寸有派发）；再 remove 一次无异常。
4. **未匹配 remove 不误清账**：只 remove 不 add → 无异常、不触发 deactivate；capture 不匹配的 remove → 真实监听仍收到事件。
5. **AbortSignal**：`{ signal }` 添加后 `abort()` → 改尺寸不再派发；已 aborted 的 signal 添加 → 不产生 observe。
6. **detail**：断言事件对象 `event.detail.contentRect` 存在。
7. **卸载自动释放（清扫）**：打开再关闭 `dispose-on-hide` dialog → 等一个清扫周期（断言时临时调短）→ dev 观察计数归零；再把该元素插回文档 → 自动恢复观察（dormant 自愈）并收到一次初始 sizechange。
8. **释放快路径**：scrollbar 指令卸载 → 立即释放，不等清扫周期（现网既有行为不回退）。

## 6. 范围外发现（touch/index.js，实施本方案时一并修）

`interceptorRemove`（src/events/touch/index.js:23-35）三处缺陷，须一并修复——只修前两处会引入新缺陷：

- L26 取 `ctx[type]`，应为 `ctx.listeners[type]`，恒为 undefined → 手势监听实际**永远不会被移除**；
- L30 `splice(idx, 0)` 应为 `splice(idx, 1)`，即使路径可达也删不掉任何东西；
- L32 / L33 判空对象错位：修好 L26 后 `listeners` 是"当前 type 的数组"，`delete listeners[type]` 变成对数组的无效操作，`Object.keys(listeners)` 只看当前 type → 移除某 type 的最后一个监听就会 `unbind`，把其他 type（tap / pan…）仍存活的监听一并拆掉（静默失效）。判空必须基于 `ctx.listeners` 整体。

建议写法：

```js
function interceptorRemove (type, listener, options) {
  const ctx = this[GESTURE_CONTEXT_PROP]

  if (!ctx) return

  const listeners = ctx.listeners[type]
  const idx = listeners?.indexOf(listener)

  if (idx < 0) return

  listeners.splice(idx, 1)

  if (!listeners.length) delete ctx.listeners[type]
  if (!Object.keys(ctx.listeners).length) unbind(this, options)
}
```

---

## 附：修订记录

**2026-10-07 复核修订**

1. 新增 §2.2：实测 Vue 卸载不触发 `removeEventListener`；据此改写 §2.1 消费方结论、§3 第 3 点、§4.1 `once` 表述，并把"卸载必解绑"移出本方案目标（写入"不在范围"）——该边界已由追加修订撤销。
2. §2.1：修正计数语义（clamp 而非负值）与漂移后果描述。
3. §4.1：补账本适用范围（仅 transition 形态）、capture 归一化修正（null / 布尔化）、add/remove 伪码、AbortSignal 四条边界、once 统一悬挂结论。
4. §4.2：补 `detail` 生命周期提示。
5. §5：原"卸载组件后无泄漏告警"改为可执行断言；补首次挂载触发回归与正向对照。
6. §6：由"两处缺陷"补全为三处，给出完整修复写法；touch 修复列入正式范围。

**2026-10-07 追加修订（卸载自动释放）**

1. 新增 §4.3：挂载状态清扫——释放不依赖 remove 调用，卸载元素在一个清扫周期内自动释放，离屏重挂载自愈；组件零代码。
2. §2.2 结论 1/4、§3 第 3 点、§4 标题与核心思路、§4.1 元素卸载条目同步改写；撤销"不在范围 ②"。
3. §5 新增 7/8 两条（卸载自动释放、释放快路径）；状态 / 范围 / 文档同步行同步。
