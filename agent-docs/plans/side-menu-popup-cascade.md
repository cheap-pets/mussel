# SideMenu 弹层级联改造方案（每层单级、逐层浮出）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施并验证**（2026-10-10，§7 15 条断言全部通过；实施中两处修订：§4.4 规则 3 hide 只清自身计时器、§4.6 updatePosition 同步写 DOM 后再递归子层）。同日第二批改造见 §8，已通过 playwright 回归（新行为 + 级联主路径 + 互斥/ESC/外点/换锚复用） |
| 范围 | `src/components/side-menu/side-menu-popup.vue`（主体）、`side-menu-node.vue`（浮出判定）、`side-menu.vue`（弹层链）；demo 数据补充 |
| 不在范围 | 主树（非弹层）内联展开行为、`side-menu.js`、`side-menu.scss`（无必改项）、键盘可达性（维持现状缺口，见 §6.3） |
| 前置文档 | `agent-docs/plans/side-menu.md`（原设计）、`agent-docs/plans/side-menu-revision.md`（R2 浮出行为定稿） |
| 依据 | 源码静态分析（2026-10-10，行号以当日 dev 分支为准）；未做运行时验证 |

## 1. 目标

弹层（`side-menu-popup`）从「一个面板内联递归渲染整棵子树、默认全展开」改为「每层面板只平铺当前组的直接子项；面板内的组行 hover 时沿本层弹出方向继续浮出下一层面板（默认向右，父层左翻则向左延续；仅默认侧放不下且另一侧放得下时翻转，见 §4.7）」，即经典级联 flyout。

触发路径不变（R2 定稿）：折叠 rail 态 hover 一级组、展开态 hover 二级组，仍由主树行触发根弹层。本次只改弹层内部呈现与下钻方式。

## 2. 现状与问题根因

**现状行为**：hover 浮出组后面板显示该组整棵子树——组行在面板内 `popupRow` 恒为 false（`side-menu-node.vue:76-80` 的判定含 `!popup`），故 `v-if="isGroup && !popupRow"`（`side-menu-node.vue:28`）成立，子树内联递归渲染；`resetExpanded()`（`side-menu-popup.vue:117-121`）再把子树所有组写入展开态，实现「多级全展开」。

```
现状（一个面板装整棵子树）          目标（每层一级，逐层右浮）
┌─ rail ─┐   ┌─ 面板 ──────────┐   ┌─ rail ─┐   ┌─ L1 ─────┐   ┌─ L2 ─────┐
│ ▣ 项目 │ →  │ 项目管理         │   │ ▣ 项目 │ →  │ 项目管理  │ → │ 报表      │
│        │   │  · 项目列表      │   │        │   │  · 项目列表│   │  · 周报   │
│        │   │  · 报表 ▾        │   │        │   │  · 报表 › │   │  · 月报   │
│        │   │    · 周报        │   │        │   │           │   │           │
│        │   │    · 月报        │   │        │   │           │   │           │
└────────┘   └─────────────────┘   └────────┘   └───────────┘   └───────────┘
```

多级全展开的问题：面板高度与视觉复杂度随深度增长、缩进层级在弹层里重建（R3 已定稿弹层缩进从 0 起）、深层内容与「面板只做导航中转」的语义不符。

## 3. 交互设计

| 交互 | 行为 |
|---|---|
| 主树浮出组行 hover | 打开 L1 面板（现状不变），面板平铺直接子项 |
| 面板内组行 hover | 该行成为锚点，沿本层弹出方向继续弹出下一层面板（L2；仅默认侧放不下且另一侧放得下时翻转，见 §4.7），锚点行显示 `chevronRight` |
| 同层面板内换 hover 组行 | 复用同层弹层：换内容重定位、不重播动画（沿用根弹层 `anchorChanged` 逻辑）；换锚点时先关闭更深层（L3…） |
| 面板内叶子行点击 | 选中该项并关闭整条弹层链（根 `hide()` 级联） |
| 鼠标离开任一层面板 / 离开锚点行 | 300ms（`HIDE_DELAY`）延时关闭；进入链上面板即取消**该层及其祖先**的待关计时器，已离开的更深层按自身计时收起（见 §4.4 规则 1） |
| ESC / 点击链外 / window blur / fullscreenchange | 关闭整条链 |
| window resize / 滚动 | 链式重定位；锚点滚出视口的层收起并级联下层（见 §4.5） |
| 面板内组行点击 | 维持现状无动作（见 §6.2 可选项） |

## 4. 技术方案

### 4.1 组件结构：popup 递归自持子弹层

`side-menu-popup` 模板内在 `Teleport` 内追加自身的子实例，形成懒展开的递归链：

```vue
<Teleport v-if="ready" :to="container">
  <div class="mu-side-menu-popup" ...>…标题 + 单层列表…</div>
  <side-menu-popup ref="subPopupRef" />   <!-- SFC 隐式自引用 -->
</Teleport>
```

- 懒挂载：`Teleport v-if="ready"` 门控，本层首次 `show` 才实例化下一层组件壳；下一层自身 `ready=false` 时不产生 DOM。递归深度随菜单深度逐层展开，不会挂载期无限递归。
- 每层一个子弹层槽位（单实例复用），同层锚点切换复用面板——与根弹层现有行为一致。
- 组件自引用用 Vue SFC 的文件名隐式自引用，无需显式 import 自身。

**备选（未采纳）**：menu 上下文维护 layer 数组 + `v-for` 渲染 N 个弹层实例。跨层引用（定时器、级联关闭、链内命中判断）仍需按索引互联，公共状态更多；递归方案让每层的下钻逻辑自包含，改动最小。

### 4.2 provide 路由 openPopup

现状 `side-menu.vue:227-228` 把 `openPopup`/`delayPopupHide` 指向根弹层实例。级联后由各层弹层覆盖路由，使「面板内行的 hover 弹出」天然指向本层的子弹层：

```js
// side-menu-popup.vue
const menu = inject('sideMenu')
const subPopupRef = shallowRef()

provide('sideMenu', {
  ...menu,
  popup: true,
  openPopup: (anchor, node) => subPopupRef.value?.show(anchor, node),
  delayPopupHide: () => subPopupRef.value?.delayHide()
})
```

- 主树行 inject 根上下文 → 根弹层；L1 面板内行 inject L1 覆盖上下文 → L1 的子弹层（L2）。逐层递归，`side-menu-node.vue` 的事件代码零改动。
- provide 的是箭头函数闭包，`subPopupRef` 调用时求值，无 TDZ 风险（对照知识库 `watch-immediate-callback-tdz`：危险的是立即执行回调，闭包延迟求值不在其列）。
- 子弹层 inject 到的已是父层覆盖过的上下文（`popup: true` 等），再向下传递时语义不变。

### 4.3 浮出判定：popup 内组行一律 popupRow

`side-menu-node.vue:76-80` 改为：

```js
const popupRow = computed(() => {
  if (!isGroup.value) return false
  // 弹层内组行：hover 继续浮出下一层；主树：折叠态一级组 / 展开态二级组（R2 定稿）
  if (popup) return true
  return collapsed.value ? !props.level : props.level === 1
})
```

连锁自动成立、无需另改的表达式（复核过）：

- `v-if="isGroup && !popupRow"`：popup 内组行 popupRow=true → 不再内联渲染子树；
- `:expanded="(!popupRow && groupExpanded) || null"`：恒 null，弹层内无展开态；
- `expandIcon`（`side-menu-node.vue:96-102`）：popupRow → 恒 `chevronRight`；
- `onClick`：popupRow 分支跳过 `toggleExpand`，维持无动作；
- `showFavoriteBtn`：组行无星标，不受影响。

### 4.4 定时器链：向上清、按需臂

每层弹层持有自己的 `hideTimer`。两条规则：

1. **清除向上走全链**：进入任一面板，本层与全部祖先的待关计时器都取消（鼠标仍在链上，整链必须保活；**不含后代**——从深层回到上层面板时，更深层按自身计时收起，见 §7 断言 14）。子→父通道：父弹层 `provide('sideMenuPopup', { clearHideTimer, delayHide, position })`（`position` 为本层定位结果 ref，供子层取默认侧，见 §4.7；函数声明提升，setup 内 provide 安全），子弹层 `inject('sideMenuPopup', null)`。
2. **臂定（arm）分两种**：
   - **面板 mouseleave → 臂自己 + 全部祖先**。解决「从最深层直接移出到空白处」时祖先链计时器已被早前进入清除、链滞留不关的孤儿问题：整链同时臂定、300ms 后整体收起。中途回到上层面板则由规则 1 清除。
   - **锚点行 mouseleave（经 `delayPopupHide` 路由）→ 只臂子弹层自己**。鼠标可能仍在父面板内移动（换行），臂定祖先会在停留叶子行时误收整链。

```js
function clearHideTimer () {
  clearTimeout(hideTimer)
  hideTimer = undefined
  parentPopup?.clearHideTimer()          // 向上清全链
}

function delayHide (withAncestors) {
  clearHideTimer()
  hideTimer = setTimeout(hide, HIDE_DELAY)
  if (withAncestors) parentPopup?.delayHide(true)
}
```

注意：现模板 `@mouseleave="delayHide"` 会把 MouseEvent 传入首参，新签名下会误判为 truthy。须改为 `@mouseleave="delayHide(true)"` 显式传参（或 `() => delayHide(true)`），`@mouseenter="clearHideTimer"` 不受影响。

**不做三角形轨迹检测**（经典 flyout 防误关优化）：GAP=4px  transit 极短，`HIDE_DELAY` 容忍足够；列为明确不做的决策，见 §6.4。

3. **hide() 只清自身计时器，不走向上通道**（实施修订）：链收起时各层计时器几乎同时臂定、先后触发（最深层先触发）。若 hide 内沿用 clearHideTimer 的向上清语义，先触发层的 hide 会取消祖先尚未触发的计时器，链滞留成孤儿面板（§7 断言 5 实测暴露）。hide 内直接 `clearTimeout(hideTimer)`；向上清仅属于面板 mouseenter（保活）与 delayHide 重臂两个场景。

### 4.5 协调器集成：仅链头注册

`createPopupCoordinator`（`src/components/common/popup.js:140-148`）的 `claimPopup` 有**弹层单例互斥**：新弹层激活会 hide 旧 activePopup。若每层都 `usePopupManager`，打开 L2 会把 L1（链头）关掉。因此：

- **链头（根弹层）**：`inject('sideMenuPopup')` 为空 → 照常 `usePopupManager` 注册，成为 coordinator 的 activePopup。
- **子弹层**：inject 到父层引用 → 不注册 manager，生命周期完全由父层驱动（show/hide/重定位均经模板 ref 由父层或祖先的链式调用触达）。
- 互斥语义保持：链开时其他弹层（如 dropdown、另一个 side-menu 的弹层）claim → coordinator hide 链头 → 级联关整链；子弹层从未 claim，无残留 release。

链头 manager 的 handler 扩展为链感知（均定义在 popup 组件内、经 `defineExpose` 递归）：

| handler | 链感知改法 |
|---|---|
| `onCaptureMouseDown` | 命中判断改 `!isInsideChain(target)`：`anchor.contains ‖ panelEl.contains ‖ subPopupRef.value?.isInsideChain(target)`（递归，子弹层锚点在父面板内，面板判断已覆盖锚点；可选链防子层未挂载）。否则点击子弹层内条目会误关整链 |
| `onCaptureEscKeyDown` | 链头 `hide()`，级联关整链（见 §6.1） |
| `onCaptureWindowResize` | 与 `onCaptureScroll` 同走 `handleAnchorMove()`（无 event）：重定位 / 锚点滚出视口才关，行为不变。**注意源码现状即此语义**（`side-menu-popup.vue:183`），不得照「与 blur 并列关链」实现 |
| `onCaptureWindowBlur` / `fullscreenchange` | 链头 `hide()` 级联，行为不变 |
| `onCaptureScroll` | 每层执行现有 `handleAnchorMove(event)` 逻辑后委托 `subPopupRef.value?.handleAnchorMove(event)`：锚点滚出视口的层 hide（级联下层）、滚动容器含本层锚点则重定位。子层重定位跟随不在链头追加调用，统一由 §4.6 的 `updatePosition` 递归承担 |

### 4.6 级联关闭与锚点切换

`side-menu-popup.vue` 现有方法的最小增量：

- `hide()`：开头追加 `subPopupRef.value?.hide()`（向下级联；ESC/外点/选中/互斥/`isCollapsed` watch 全部经此自动关整链）。
- `show()` 的 `anchorChanged` 分支：换锚点前 `subPopupRef.value?.hide()`——旧锚点行的下级面板（L3…）锚点 DOM 已随内容切换消失，须先收起。
- `updatePosition()`：末尾追加 `subPopupRef.value?.updatePosition()`（各层有 `isPositionAssignable` 守卫，不可定位时自然跳过）。定位结果须**同步写入 DOM**（清 left/right/top 旧键后 `Object.assign(el.style, style)`）再递归：`popupStyle` 经响应式 patch 是异步的，子层立即读父面板内锚点 rect 会拿到父面板旧位置，resize/scroll 下子层不跟随（实施修订，§7 断言 15 实测暴露）。
- `handleAnchorMove(event)`：末尾追加 `subPopupRef.value?.handleAnchorMove(event)` 向下委托（各层自行判断锚点出视口与滚动容器命中，见 §4.5 scroll/resize 行；子层重定位跟随经 `updatePosition` 递归，不在此重复）。
- `defineExpose` 增加：`isInsideChain`、`handleAnchorMove`（供父层/链头委托）；`clearHideTimer`、`delayHide` 经 provide('sideMenuPopup') 供子层上行调用（模板 ref 只能取到 expose 面，provide 面与 expose 面按通道分开声明）。

### 4.7 定位复用与方向规则（2026-10-10 二次修订）

子弹层锚点为父面板内的行元素：锚点 rect 取 `getBoundingClientRect`，fixed 面板内行的 rect 即视口坐标；垂直翻转夹紧、左悬挂用 `right` 定位的原逻辑原样适用。GAP/MARGIN/max-height 均不变。

**主轴方向规则：默认侧 + 继承 + 翻转**。每层有默认侧 `base`：链头恒 `'right'`，子层继承父层当前 `position`（沿父层弹出方向延续）。仅当默认侧放不下且另一侧放得下时才翻转；两侧都不足保持默认侧延伸：

```js
// base：链头 'right'，子层取父层 position；other 为另一侧
const fits = { right: rightSpace >= pw, left: leftSpace >= pw }
const position = fits[base] || !fits[other] ? base : other
```

- `base` 的传递：每层 `updatePosition` 将结果存入组件内 `position` 状态，经 §4.4 的 `provide('sideMenuPopup')` 通道随 `clearHideTimer`/`delayHide` 一并提供；子层取 `parentPopup?.position.value ?? 'right'`。`updatePosition` 的递归（§4.6）先算父层再算子层，子层取到的 `base` 时序天然正确。
- 原第三分支「两侧都不足时取空间更大一侧」删除：按左右空间对比选边可能把子弹层翻到父面板一侧、盖住 rail，造成级联方向锯齿反转。新规则两侧都不足时保持默认侧延伸，接受横向溢出的代价（见 §6.8）。
- **继承消除锯齿**：菜单靠右、L1 左翻时，若子层默认向右，L2 会因右侧余量恢复（≈ 菜单宽 + 20）恒向右弹、盖住 rail 与主菜单；继承后 L2 的 `base='left'` 且左侧余量恒充足，级联逐层向左延续。
- L1（`base` 恒 `'right'`）行为与单侧规则一致：左挂 rail 下 `rightSpace ≈ vw - 52` 恒大于面板宽度 → 恒右；菜单置于视口右侧时左翻（左侧充足、右侧不足）。

### 4.8 删除项

`side-menu-popup.vue`：

- `resetExpanded()` 及 `walk` import——弹层内不再有内联展开，「默认全展开」语义随单级平铺消失；
- `provide('sideMenuExpandToggle', createExpandToggle(...))`——弹层内所有组行均为 popupRow，`onClick` 不会走到 `toggleExpand`，无需提供；import 里的 `createExpandToggle`（`side-menu-popup.vue:32`）一并删除。

`useSideMenuExpand`（WeakSet + tick）仍服务主树内联展开，不动。

## 5. 改动明细

| 文件 | 改动 | 量级 |
|---|---|---|
| `src/components/side-menu/side-menu-popup.vue` | 递归子实例 + provide 路由（§4.2）/ 定时器链（§4.4）/ 链头专属 manager 与链感知 handler（§4.5）/ 级联关闭（§4.6）/ 主轴方向规则与父层方向继承（§4.7）/ 删除展开相关（§4.8） | 主体，约 +60~80 行净变化 |
| `src/components/side-menu/side-menu-node.vue` | `popupRow` 判定加 popup 分支（§4.3），注释同步 | ~5 行 |
| `src/components/side-menu/side-menu.vue` | 无必改项（`onSelectItem`/`isCollapsed` watch 经根 `hide()` 级联自动生效） | 0 |
| `src/components/side-menu/side-menu.js` | 无 | 0 |
| `src/components/side-menu/side-menu.scss` | 无必改项（弹层类样式对每层实例通用；`teleport-popup-css-vars` 坑对子弹层同样已由类内重复声明覆盖） | 0 |
| `demo/src/side-menu/main-view.vue` | `menus` 里 `project-report` 下补一个嵌套组（如 `report-custom` 组带 2~3 叶子），供 L2→L3 级联验证 | ~8 行 |

## 6. 决策记录

1. **ESC 关整链而非逐层**：逐层关需焦点/鼠标所在层判定，链上无焦点追踪（键盘可达性缺口本身未解，见 §6.3）；整链关简单可预期。
2. **面板内组行点击维持无动作**：hover-only 与现状一致；「点击组行立即打开下一层」（触屏友好）列为后续可选增强，不进本方案。
3. **键盘可达性维持现状缺口**：`side-menu-revision.md` R2 讨论中 B 方案（补键盘路径）未采纳，本方案不扩大也不修复；弹层内容依旧 hover-only 可达。
4. **不做 hover 轨迹三角形检测**：面板间 GAP=4px，配合 300ms `HIDE_DELAY` 足够容忍；引入三角形检测的复杂度不成比例。
5. **`warnDeepLevel`（>3 层 dev 告警）保留，但注明实际不可达**：级联弹层技术上支持任意深度，「不推荐深层菜单」的产品建议不变。弹层内节点恒 `level=0`、主树最深渲染到 level 1（popupRow 组不再内联递归），`side-menu-node.vue:170` 的 `props.level > 2` 恒 false——该告警在现状与本方案下均不触发，属既有死代码，本方案不处理。
6. **每层面板保留标题栏**：各级标题提供所在层上下文，现状 `groupLabel`（锚点组标题）逻辑逐层自然成立。
7. **弹层内叶子行 `data-key` 不变**：一个节点只在其父组的面板中出现（主树内联或弹层二者其一），无重复 key 风险；`scrollToKey` 查询域在 nav 内，teleport 面板不受影响。
8. **子弹层沿父层弹出方向延伸**：每层默认侧为父层 `position`（链头 `'right'`），仅默认侧放不下且另一侧放得下时翻转；两侧都不足保持默认侧，不做「取空间更大一侧」的兜底（§4.7）。按空间对比选边会造成级联方向锯齿（右→左→右交替、面板反复盖住父侧与 rail）；保持默认侧延续，方向语义稳定。

   推论（实施时须知）：`leftSpace = anchorRect.left - GAP`，即视口左缘到锚点行左缘的距离。左挂 rail 布局下 L1 恒右（右侧即视口余量），子层 `base` 恒 `'right'`，而子层锚点左缘 ≈ 68px（rail 48 + GAP 4 + 行内边距 16）恒小于面板 `min-width: 200px`，故 **L2 及更深层在 rail 布局下实际永远向右**，左翻分支等价于死代码——这正是规则想要的效果。菜单整体位于视口右侧时 L1 左翻，子层 `base='left'` 且左侧余量恒充足 → 级联逐层向左延续，不盖 rail（见 §7 断言 12）。

   代价：极窄视口下延续侧放不下且另一侧也不足时，面板沿默认侧溢出（不由 `max-width` 兜底，`max-width` 约束的是面板自身宽而非可用空间）；接受，深层菜单本就不推荐。

## 7. 验证计划

demo 页 `http://localhost:3000/side-menu/` + playwright DOM 断言（rollup watch 已构建则直接访问；面板为 Teleport 到 root 的 fixed 元素，断言用 DOM 查询，不依赖截图）。

前置：按 §5 补 demo 嵌套组数据；断言 12 需菜单位于视口右半（右缘距视口右缘 < L1 面板宽，demo 中选靠右列 rail 实例并 `browser_resize` 微调；demo 容器为 flex-wrap，收窄过度会使实例换行回行首，须取实例仍靠右的临界视口宽）。

| # | 场景 | 断言 |
|---|---|---|
| 1 | 折叠 rail hover `项目管理` | L1 面板出现；列表仅 3 行（`project-list`/`project-plan`/`project-report`）；面板内无 `.mu-side-menu__group`（不内联） |
| 2 | L1 内 hover `报表` 行 | L2 面板在其右侧出现，标题「报表」，含 `report-custom` 组行 + report 叶子行；`报表` 行 expand 图标为 chevronRight |
| 3 | L2 内 hover 嵌套组行 | L3 面板出现，内容为该组叶子 |
| 4 | 鼠标 L1 → L2 → L3 逐层进入 | 期间无面板被 300ms 计时器误关（每层停留 >400ms 验证） |
| 5 | 从 L3 直接移出到空白 | 整链在 ~300ms 后全部隐藏 |
| 6 | L2 内点击叶子（如 `report-monthly`） | 整链关闭；`activeItem` 更新为该 id |
| 7 | 链开时按 ESC / 点击链外 / 触发 window blur | 整链关闭 |
| 8 | L1 内从组行 A 移到组行 B（无停顿） | L2 复用同一 DOM 面板（无重播动画类切换），内容换为 B 子项，位置跟随 B |
| 9 | 链开时打开页面上另一个弹层组件（如 demo 中 dropdown） | side-menu 整链被互斥关闭 |
| 10 | 展开态 hover 二级组 `报表` | 同样单层 + 级联（R2 触发路径回归） |
| 11 | 折叠 rail hover 收藏组 | 面板单层叶子列表，星标行为不变（收藏均为叶子，无级联） |
| 12 | 菜单实例位于视口右半（L1 右侧余量 < L1 面板宽、左侧充足），折叠 rail hover 一级组后再 hover L1 内组行 | L1 `position="left"`；L2 `position="left"` 沿父层方向向左延续，不盖 rail（§4.7 继承） |
| 13 | 左挂 rail 布局 + 视口收窄到 L2 两侧都放不下，hover L1 内的组行 | L2 保持 `position="right"`（不左翻，与 §6.8 推论一致） |
| 14 | 链开至 L3 后鼠标直接回到 L1 面板停留 | L3、L2 依自身 300ms 计时先后收起，L1 保留显示（§4.4 规则 1 不含后代的边界） |
| 15 | 链开至 L2 后滚动链头锚点所在滚动容器（菜单 body），或 window resize | 链头跟随锚点重定位、子层经 `updatePosition` 递归同步跟随（§4.5/§4.6）；锚点滚出视口则整链收起 |

实施完成后，对外文档三处同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`）另行提交评审，不在本方案内。

## 8. 第二批改造（2026-10-10 实施后追加）

五项行为/架构调整，除特别注明外均以 §4 原方案为基础增量：

### 8.1 锚点不可见判定：视口 + 裁剪容器求交

`isElementInViewport` 只查窗口边界：被滚动裁剪容器（菜单 body / 父面板 body，均 `mu-scroll-box`）滚出的行 rect 仍可能落在视口内 → 误报可见，表现为锚点行已滚没而弹层跟随残影或滞留。新增 `isAnchorVisible(el)`：视口判定 + `el.closest('.mu-scroll-box')` 可见矩形求交，两处使用：

- `show()` 入口守卫：锚点不可见不弹出（含 chain.open 生成新层 `await nextTick()` 期间锚点已被滚走的时序）；
- `handleAnchorMove()`：原 `isElementInViewport` 判定换为 `isAnchorVisible`，滚动/缩放时不可见即收链。

### 8.2 已浮出下级的锚点行保持 hover 态

`show()` 给锚点行设 `popup-open` 属性、换锚点/`hide()` 时移除；scss `.mu-side-menu__item` 的 `&:hover` 选择器并列 `&[popup-open]`，同为灰底。直接 DOM 属性而非响应式状态：弹层本就同步写 DOM（定位），避免整面板重渲染。

### 8.3 标题栏仅收拢态一级弹层显示

`showHeader = !layer && menu.collapsed`：rail 锚点行只有图标，标题提供分组上下文；展开态二级组弹层与 L2+ 子层（§6.6 的「每层保留标题栏」决策就此作废）锚点行标签本身可见，不重复。

### 8.4 间距调大

`GAP` 4→8（面板与锚点水平间距），入场位移 `translateX(±4px)`→`±8px` 同步对齐；§6.4 注记中 GAP=4 的表述随之失效，`HIDE_DELAY` 容忍度结论不变。

### 8.5 弹层实例统一挂 side-menu（架构，取代 §4.1 递归自引用）

§4.1 的递归方案（每层模板内 `<side-menu-popup ref="subPopupRef" />`）改为 side-menu 集中持有：`v-for="i in popupLayerCount"` 按层序惰性生成实例（生成后常驻复用），链路经 `provide('sideMenuPopupChain', { open, getLayer })`：

- **上行通道**：原 `provide('sideMenuPopup')`（clearHideTimer/delayHide/position）删除——子层实例不再位于父层组件子树内，provide/inject 不可达；改为父层 `defineExpose` 面（新增 `clearHideTimer`、`position`，经 expose 代理 ref 自动解包），子层 setup 期经 `chain.getLayer(layer - 1)` 直取（实例先生成父层后生成子层，时序保证）。
- **下行访问**：`subPopupRef.value` → `subPopup() = chain.getLayer(layer + 1)`（未生成为空，可选链语义不变）。
- **弹层路由**：`openPopup` → `chain.open(layer + 1, anchor, node)`：新层首次触发先扩容 v-for、`await nextTick()` 待挂载后 `show`；层 0 走 side-menu 的 `menuContext.openPopup`（同一路由，无扩容）。
- **链头判定**：`!parentPopup` → `!props.layer`。
- 原 §4.1「备选未采纳」的理由（按索引互联、公共状态多）在统一挂载后不再成立：实例按层序生成、常驻复用，实例表 + 访问器比递归 ref 更直接，且消除 SFC 隐式自引用与嵌套 Teleport；provide 上行通道因兄弟挂载天然不可达，改走 expose 面属架构必然。
