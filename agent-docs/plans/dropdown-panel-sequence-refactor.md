# dropdown-panel 显隐时序重构（20ms 定时器链 → nextTick + 强制回流）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施（2026-09-13），Playwright 回归通过** |
| 范围 | `src/components/dropdown/dropdown-panel.vue` 的 `show()` 时序；`context-menu.vue` 同构改造 |
| 不在范围 | 定位算法（`updatePosition` 逻辑不动）、`[pop-up]` 属性动画体系、`hide()` 收尾（`getTransitionDuration + delay` 保留）、tooltip 组件（见 `tooltip-component.md` §5.1） |
| 结果 | 首次打开 ~60ms → ~8ms；再次打开 ~40ms → ~2ms；时序由微任务与强制布局保证 |

---

## 1. 现状（重构前）

### 1.1 时序代码（原 dropdown-panel.vue show()）

```js
Promise
  .resolve((!ready.value) && (ready.value = true) && delay())   // ① 20ms：等 v-if 挂载
  .then(() => {
    const el = panelEl.value
    el.removeAttribute('pop-up')
    el.style.transition = 'none'                                 // ② 关动画
    popupStyle.value = { transform: 'none', visibility: 'hidden' } // ③ 占位
    delay()
      .then(() => updatePosition() && delay())                   // ④ 20ms 后测量定位，再 ⑤ 20ms
      .then(() => { el.style.transition = null })
      .then(() => visible.value && el.setAttribute('pop-up', '')) // ⑥ 入场
  })
```

每个 20ms delay 实际等待的是「Vue patch + 一帧渲染」，这是三个 delay 存在的深层原因，不只是等 patch。

### 1.2 问题

- 固定开销：首次显示 3×20ms ≈ 60ms，再次显示 2×20ms = 40ms。
- `setTimeout` 与渲染帧不对齐：主线程忙时 20ms 可能跨 3+ 帧。
- 20ms 魔数无语义。

### 1.3 消费方盘点

`dropdown-panel` 经 `combo-wrapper.vue` 间接服务于：`select`、`combo-box`、`multi-select`、`date-input`、`date-range-input`、`time-input`、`color-input`；直接使用者：`mu-dropdown`（含 `mu-dropdown-button`）。

`context-menu.vue` 是同构的独立实现（Teleport + fixed + `pop-up` 属性 + 自有 show 编舞），锚点为鼠标坐标。

---

## 2. 方案

### 2.0 设计评审否决的原稿路线

原稿「删除占位样式 + scss 补 `pointer-events`（含 mask 豁免）」经评审存在三个连环缺陷，**未采用**：

1. **显示链路死锁**：`v-show="popupStyle"` 与 `updatePosition` 的 `isPositionAssignable()` 守卫都依赖 popupStyle 非空；删除占位后 popupStyle 永不写入，面板永不显示。
2. **二次显示测量错误**：`hide()` 不清除 `position` 属性，残留 `transform: scaleY(0)` 使 `getBoundingClientRect().height ≈ 0`，翻转判定失效。原占位中 `transform: 'none'` 的真实职责正是测量保护。
3. **FLIP 批次失效**：`:style` 响应式绑定的写入要等 nextTick patch，紧跟 `updatePosition()` 的 `void el.offsetWidth` 读不到定位样式；「强制回流分隔批次」分隔的两批里不含定位样式，入场过渡起点不可预期。

### 2.1 实施时序（保留占位，delay → nextTick）

入场编舞已提取为共享模块 `src/components/common/popup.js` 的 `runPopupSequence({ visible, ready, popupStyle, panelEl, updatePosition })`，`dropdown-panel.vue` 与 `context-menu.vue` 的 `show()` 各自保留前置逻辑（ctx 管理 / 事件解构）后调用；tooltip 落地时可直接复用。原始内联形态如下：

```js
async function show (options = {}) {
  // ……anchor / width / trigger / ctx 处理全部不动

  if (!visible.value) {
    visible.value = true
    container.value = document.fullscreenElement || rootEl
    emit('show')

    // 占位与 ready 挂载同批 patch：v-show 恢复（产生布局，可测量）、
    // transform: none 覆盖上次残留的 scaleY(0)（position 属性在 hide 后不清除）
    if (!ready.value) ready.value = true
    popupStyle.value = { transform: 'none', visibility: 'hidden' }

    await nextTick()
    if (!visible.value) return            // 快速开关守卫（此时尚无内联残留）

    const el = panelEl.value
    el.style.transition = 'none'          // 先于一切样式批次，同原码抑制策略
    el.removeAttribute('pop-up')

    updatePosition()                      // 测量（getBoundingClientRect 即强制回流）+ 写定位
    await nextTick()                      // patch：left/top 入 DOM，占位被整体替换

    if (!visible.value) {
      el.style.transition = null          // 清内联残留再退
      return
    }

    void el.offsetWidth                   // 强制回流：scaleY(0) + 定位固化为过渡起点
    el.style.transition = null
    el.setAttribute('pop-up', '')         // 入场：scaleY(0)→1
  }
}
```

**等价性论证**

| 原等待点 | 替代手段 | 依据 |
|---|---|---|
| ① delay 等挂载 | 与占位同批写入 + `await nextTick()` | Vue patch 是微任务，DOM 与布局随 patch 可用 |
| ④ delay 等占位提交 | `await nextTick()`（patch display 恢复 + 占位生效） | `getBoundingClientRect` 同步完成布局计算，无需渲染帧 |
| ⑤ delay 等定位先于动画 | `await nextTick()`（left/top 入 DOM）+ `void el.offsetWidth` | 回流把 `scaleY(0)`（占位被替换、position 属性生效）固化为 before-change 值，pop-up 触发时起点干净 |

2 patch + 2 强制回流是该动画体系（transition + 属性驱动 + 响应式 style 绑定）下的结构性下限；总延迟微任务级。

**快速开关守卫的残留清理**：`el.style.transition = 'none'` 写入后有两个 await 窗口，窗口内 hide 时守卫必须先清 `transition: null` 再 return，否则内联 `transition: none` 永久残留，下次打开动画全灭（原 `.then` 链的清理是无条件执行的，等价性要求保留这一点）。

### 2.2 占位与样式

- 占位 `{ transform: 'none', visibility: 'hidden' }` **保留**（v-show 复位、updatePosition 守卫、测量保护三职责不变）。
- `dropdown-panel.scss` **未改动**：无 `pointer-events` 规则、无 mask 豁免（原稿 §2.2 整节撤销——`visibility: hidden` 本就不可点，mask 模式行为与原实现一致）。

### 2.3 `hide()` 不动

`removeAttribute('pop-up')` → `delay(getTransitionDuration(el))` → 清 `popupStyle` 的收尾保持原样。因占位保留，`popupStyle = null` 的 v-show 复位机制无需联动调整。

---

## 3. 风险（实施后复核）

| 风险 | 结论 |
|---|---|
| 入场起点依赖浏览器过渡实现 | 已验证：连续帧采样 scaleY 0.000 → 1.000，起点干净 |
| scrollbar 模式 | `attach` 仅注册上下文与事件、无测量，不依赖时序；长列表打开正常 |
| 消费方回归 | combo-box 页 8 个输入（combo-box ×4 / select ×3 / multi-select）全过 |
| 快速开关 | 无 `transition: none` 残留、无半显示态卡死 |
| context-menu 漏改 | 已同批改造（无 position/scaleY，缺陷 2 天然不存在） |

---

## 4. 落地与验证结果

| # | 步骤 | 状态 |
|---|---|---|
| 1 | `dropdown-panel.vue` show() 重写 | ✅ |
| 2 | `context-menu.vue` 同构改造 | ✅ |
| 3 | scss 改动 | 无需（见 §2.2） |

### Playwright 验证（demo，localhost:3000）

- [x] 首次打开 **8ms**、再次打开 **1.5ms**（原 60/40ms；rAF 帧级测量）
- [x] 入场动画起点干净：scaleY 采样 `0.000 → 0.214 → 0.578 → 0.803 → 0.925 → 0.983 → 1.000`；`transitionstart` 事件 `opacity + transform` 均触发
- [x] 定位对齐：panelTop = btnBottom + 4px（margin-top），宽度 anchor 模式正确
- [x] 二次显示（position 属性残留场景）：定位值与首次一致，测量保护生效
- [x] 翻转：下方空间不足时 `position="top"`，panelBottom = btnTop - 4px
- [x] 快速连续开关 ×6：无 `transition: none` 残留（`el.style.transition === ''`），无卡死
- [x] 外点关闭：117ms 完整收尾（display none + pop-up 移除）；ESC 关闭正常
- [x] hover 触发：mouseover 打开、mouseleave 后 434ms 延迟关闭（300ms delayHide + 100ms 退出）
- [x] context-menu：右键出现、定位正确（贴底分支 bottom:0 为算法预期）、点项关闭正常
- [x] 消费方：combo-box ×4（含 editable 箭头展开、底部 fixed 翻转）、select ×3（含 50 项长列表）、multi-select：16~18ms 打开、对齐 delta=4px、选中关闭 116ms、值更新正确
- [x] resize / scroll 捕获：面板保持打开不误杀
- [ ] fullscreen 场景：未自动化验证（headless 手势限制）；`container` 切换逻辑为同步原样迁移，风险低
- [ ] mask 模式：demo 无用例；显隐机制未改动，行为等价

---

## 5. 未决问题

1. ~~`context-menu.vue` 是否同批改~~ → 已同批完成。
2. **`hide()` 收尾是否 `transitionend` 化**：维持不做——行为等价优先，收益低。
3. **是否监听 `sizechange` 自动重定位**：不做，避免范围膨胀（若将来做，同 combo-wrapper 用法，勿直接 new `ResizeObserver`）。
4. **tooltip 方案（`tooltip-component.md` §5.1）的时序与本方案差异**：tooltip 为新组件，可采用同步 `el.style` 直写绕过响应式 patch（省 patch #2）；若沿用响应式绑定，直接复用 `runPopupSequence`（其原稿中 `updatePosition()` 后直接 `void el.offsetWidth` 的写法存在 §2.0 缺陷 3）。
5. ~~**`show()` 同步窗口内的 `hide()` 请求（2026-09-13 复检，缺陷确认，待修复）**~~ → **已修复（2026-09-13）**：首次打开时 `emit('show')` 的同步处理窗口内（`visible` 已 true、面板未挂载）父组件调用 `hide()`，曾被 `panelEl` 守卫整段跳过——hide 请求被丢弃且不 emit `'hide'`。demo 实证（修复前）：`hide()` 在守卫前无条件清空 `ctx`，编舞继续执行到 `updatePosition()` 时读 `ctx.anchor.getBoundingClientRect()` 抛 `TypeError`（unhandled rejection），面板卡占位态（`visibility: hidden` + 内联 `transition: none` 残留）；再次 `show()` 走"已开切换锚点"分支，无动画显示且 transition 残留永久。**修复**：`hide()` 先置 `visible = false` 并 emit `'hide'`，面板未挂载时仅跳过 DOM 收尾，编舞在 `await nextTick()` 后的快速开关守卫处自然中止；`context-menu.vue` 同构修改。修复后验证：无 TypeError、`'show'`/`'hide'` 成对发出、无 transition 残留、占位态二次 show 走完整编舞正常打开（delta=4px）。注：旧 20ms 链时代此场景在 `getTransitionDuration(null)` 处同步崩溃，属既有缺陷显形而非本次回归。
