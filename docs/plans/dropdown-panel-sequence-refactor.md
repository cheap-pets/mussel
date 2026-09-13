# dropdown-panel 显隐时序重构方案（20ms 定时器链 → nextTick + 强制回流）

| 项目 | 内容 |
|---|---|
| 状态 | 草案，待排期（建议在 tooltip 组件落地验证新时序后实施） |
| 范围 | `src/components/dropdown/dropdown-panel.vue` 的 `show()` 时序（`Promise + delay()` 链）；`context-menu.vue` 同构时序一并评估 |
| 不在范围 | 定位算法（`updatePosition` 逻辑不动）、`[pop-up]` 属性动画体系、`hide()` 收尾（`getTransitionDuration + delay` 保留）、tooltip 组件（直接采用新时序，见 `tooltip-component.md` §5.1） |
| 目标 | 消除 40~60ms 固定入场延迟与时序不确定性；**行为等价重构**，视觉与交互无回归 |

---

## 1. 现状

### 1.1 时序代码（dropdown-panel.vue:165-183）

```js
Promise
  .resolve((!ready.value) && (ready.value = true) && delay())   // ① 20ms：等 v-if 挂载
  .then(() => {
    const el = panelEl.value
    el.removeAttribute('pop-up')
    el.style.transition = 'none'                                 // ② 关动画
    popupStyle.value = { transform: 'none', visibility: 'hidden' } // ③ 无坐标隐藏占位
    delay()
      .then(() => updatePosition() && delay())                   // ④ 20ms 后测量定位，再 ⑤ 20ms 等定位先于动画
      .then(() => { el.style.transition = null })
      .then(() => visible.value && el.setAttribute('pop-up', '')) // ⑥ 触发入场
  })
```

四个等待点实际需要的是：① Vue patch 完成（微任务即可）、④⑤ 同一帧内的样式批次提交（强制回流即可）。`setTimeout(20)` 是覆盖这两件事的钝器。

### 1.2 问题

- 固定开销：首次显示 3×20ms ≈ 60ms，再次显示 2×20ms = 40ms（60fps 下一帧 16.7ms，白等 2.4~3.6 帧）。
- `setTimeout` 与渲染帧不对齐：主线程忙时 20ms 可能跨 3+ 帧，时序正确性靠运气。
- 20ms 魔数无语义，维护需重新推导。

### 1.3 消费方盘点（影响面）

`dropdown-panel` 经 `combo-wrapper.vue` 间接服务于：`select`、`combo-box`、`multi-select`、`date-input`、`date-range-input`、`time-input`、`color-input`；直接使用者：`mu-dropdown`（含 `mu-dropdown-button`）。改动一处全部受益，也全部需要回归。

`context-menu.vue:49-76` 是同构的独立实现（Teleport + fixed + `pop-up` 属性 + 自有 show 编舞），锚点为鼠标坐标。

---

## 2. 方案

### 2.1 新时序（与 `tooltip-component.md` §5.1 同款）

```js
async function show (options = {}) {
  // ……原 anchor / width / height / trigger / onHideCallback 处理全部不动

  if (!visible.value) {
    visible.value = true
    container.value = document.fullscreenElement || rootEl
    emit('show')

    if (!ready.value) {
      ready.value = true
      await nextTick()                    // ① 替代首个 delay：Vue patch 完成即 DOM/布局可用
    }

    if (!visible.value) return            // 快速开关守卫（对应原 visible.value && … 检查）

    const el = panelEl.value
    el.style.transition = 'none'          // ② 关动画
    el.removeAttribute('pop-up')

    updatePosition()                      // getBoundingClientRect 强制同步布局，测量精确
    void el.offsetWidth                   // ④⑤ 替代两个 delay：本帧提交定位 + position 属性
    el.style.transition = null
    el.setAttribute('pop-up', '')         // ⑥ 入场过渡从干净起点开始
  }
}
```

**等价性论证**

| 原等待点 | 替代手段 | 依据 |
|---|---|---|
| ① delay 等挂载 | `await nextTick()` | Vue patch 是微任务，DOM 与布局随 patch 可用 |
| ④ delay 等占位样式提交 | 删除（见 §2.2），`getBoundingClientRect` 强制同步布局 | 测量本身触发同步 recalc |
| ⑤ delay 等定位先于动画 | `void el.offsetWidth` 强制回流 | FLIP 标准配方：回流分隔样式批次，`transition: 'none'` 批内生效，定位/`position` 属性不会触发过渡 |

| 项 | 现状 | 新方案 |
|---|---|---|
| 首次显示 | ~60ms | 1 patch + 2 次强制回流，亚毫秒级 |
| 再次显示 | ~40ms | 同上 |
| 时序确定性 | 定时器，忙时漂移 | 规范保证（同步布局） |

### 2.2 占位样式清理（含 mask 模式豁免）

原 `popupStyle = { transform: 'none', visibility: 'hidden' }` 占位删除：

- 基础态 `opacity: 0` 已不可见；
- `dropdown-panel.scss` 基础态补 `pointer-events: none`，`[pop-up]` 态补 `pointer-events: auto`——消除定位窗口期"不可见但可点"。

**⚠️ mask 模式豁免**：`.mu-dropdown-panel.mu-popup-mask` 是全屏遮罩，依赖点击遮罩关闭（`onClick` 里 `mu-popup-mask` 命中即 hide）。基础态 `pointer-events: none` 会让遮罩不可点、无法关闭。必须加：

```scss
&.mu-popup-mask { pointer-events: auto; }   // 遮罩模式豁免，保持可点击
```

（tooltip 面板无 mask 模式，无此问题。）

### 2.3 `hide()` 不动

`removeAttribute('pop-up')` → `delay(getTransitionDuration(el))` → 清 `popupStyle` 的收尾本就近似事件驱动，行为等价优先，本次不改。`transitionend` 化列为未决问题（§5）。

---

## 3. 风险

| 风险 | 概率 | 缓解 |
|---|---|---|
| 同批写入的过渡起点判定依赖浏览器实现 | 低 | 已用强制回流分隔批次，FLIP 通用配方在主流浏览器验证充分；demo 回归确认入场起点为 `scaleY(0)` |
| mask 模式被 `pointer-events: none` 破坏（无法点击关闭） | 必现（若漏加豁免） | §2.2 豁免规则 + 验证清单专项 |
| scrollbar 模式（`v-mu-scrollbar` 指令初始化时机） | 低 | 指令在 mounted 同步 attach，不依赖 delay；回归验证 |
| 消费方多（7+ 组件间接使用） | — | 行为等价重构；demo 全量回归（§4） |
| 快速开关（等待窗口内 hide） | 低 | `await nextTick()` 后 `visible` 守卫提前返回 |
| `context-menu.vue` 同构但独立实现，漏改则行为不一致 | 中 | 纳入本次范围一并改（§4 步骤 3） |

---

## 4. 落地步骤

| # | 步骤 | 文件 | 验证 |
|---|---|---|---|
| 1 | `show()` 重写为 nextTick + 强制回流 | `dropdown-panel.vue` | demo dropdown 页：首次/再次打开延迟、入场动画起点干净 |
| 2 | 删占位样式、加 `pointer-events` 规则（mask 豁免） | `dropdown-panel.vue`、`dropdown-panel.scss` | 定位窗口期不误触；mask 模式点击关闭正常 |
| 3 | `context-menu.vue` 同构改造 | `context-menu.vue` | 右键菜单打开行为一致 |
| 4 | 全量回归 | demo | select / combo-box / multi-select / date-input / date-range-input / time-input / color-input 全过 |

### 验证清单

- [ ] 首次 / 再次打开无 40ms+ 迟滞（肉眼 + `performance.mark` 前后对比）
- [ ] 入场动画起点干净：`scaleY` 从 0 起、无位置跳变 / 中间闪烁
- [ ] 快速连续开关无残留（面板不卡在半显示态）
- [ ] resize / scroll 重定位正常（`onCaptureWindowResize` / `onCaptureScroll` 路径不受影响）
- [ ] combo 连续切换锚点无闪烁
- [ ] mask 模式：全屏遮罩可点击关闭
- [ ] scrollbar 模式（长列表下拉）正常
- [ ] fullscreen 场景（dropdown demo 的 Request Fullscreen 用例）正常
- [ ] hover 触发类（`dropdown-trigger="hover"`）延迟隐藏逻辑不受影响

---

## 5. 未决问题

1. **`context-menu.vue` 是否同批改？** 建议同批（代码量小，且留到以后必然行为不一致）；若拆开需在改动说明中标注。
2. **`hide()` 收尾是否顺带 `transitionend` 化？** 倾向不做——行为等价优先，收益低；留待有实际诉求再评估。
3. **是否顺带监听 `sizechange` 自动重定位？** dropdown 面板内容（items）在显示中极少变化，收益低；不做，避免范围膨胀（若将来做，用 `@sizechange`，同 combo-wrapper 用法，勿直接 new `ResizeObserver`）。
