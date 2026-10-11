# 横向菜单 Menu 组件方案（menu.vue）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施并验证**（2026-10-11 评审确认：不设 `select` 事件（§3.2）、不做激活项折叠豁免（§6.3）；同日实施，§9 断言 1-11 全部通过 + 库构建/eslint/stylelint 通过。实施偏差：`calculatePosition` 拆为垂直/水平两个子函数（eslint complexity ≤10），逻辑等价；demo 图标 `dots` 与 demo/src/common/app.js 原有注册重复，已去重） |
| 范围 | 新增 `src/components/side-menu/menu.vue` + `menu.scss`；小幅扩展 `menu-item.vue` / `popup-menu.vue` / `popup-menu.scss`；`side-menu/index.js` 注册导出；提取共享树工具；补图标与文案；新增 demo 页 |
| 不在范围 | side-menu 本体行为与样式（仅承受 menu-item / popup-menu 共改的回归）、收藏功能、键盘可达性（维持 side-menu 现状缺口）、文档同步（实施完成经确认后另行处理） |
| 前置文档 | `agent-docs/plans/side-menu.md`（原设计）、`side-menu-revision.md`（R2 浮出行为定稿）、`side-menu-popup-cascade.md`（弹层级联现行为） |
| 依据 | 源码静态分析（2026-10-11 dev 分支，行号以当日为准）；未做运行时验证 |

## 1. 目标

基于 side-menu 现有实现新增横向菜单组件 `MuMenu`（`<mu-menu>`）：

- 一级菜单项在栏内横向平铺；一级组行 hover 弹出下级面板，**复用 `popup-menu` 与弹层链**；
- 一级弹出方向默认**向下**；下方空间不足且上方放得下时**向上**翻转；
- 栏宽不足以容纳全部一级项时，溢出项折叠进栏尾「更多」触发器（⋯），hover 弹出同款面板展示被折叠项。

```
┌─ mu-menu ────────────────────────────────────────────┐
│ ▣ 首页   ▣ 项目管理 ▾   ▣ 质量管理 ▾   ▣ 设置      ⋯ │
└──────────────────────────────────────────┬───────────┘
                                           │ hover
                              ┌────────────▼────────────┐
                              │ 被折叠的一级项…（popup） │
                              └─────────────────────────┘
▣ 项目管理 ▾ hover：
┌──────────────┐
│ 项目管理 ▾    │ ← 锚点行（栏内）
├──────────────┴─────────┐
│ 弹层面板（向下，position=down）│ → 面板内组行 hover 继续向右级联（现状行为）
└────────────────────────┘
```

## 2. 交互设计

| 交互 | 行为 |
|---|---|
| 一级叶子行点击 | 选中（`activeItem` 置该项 id），emit `itemClick`；无弹层链时不涉及关闭 |
| 一级组行 hover | 浮出 L1 面板（向下，见 §5）；锚点行标 `popup-open` 保持 hover 态 |
| 一级组行点击 | 无动作（与 side-menu 弹层行现状一致，hover 驱动） |
| 面板内组行 hover / 换行 / 叶子点击 / 离开 | 沿用弹层链现行为（`side-menu-popup-cascade.md` §3）：逐层右浮、同层换锚复用、点叶子选中关整链、300ms 延时收起、进入链上面板清本层+祖先计时器 |
| ESC / 点击链外 / window blur / fullscreenchange | 关闭整条链（协调器，现状） |
| window resize / 滚动 | 链式重定位；锚点滚出视口即关（现状） |
| 「更多」触发器 hover | 以触发器为锚点弹出 L1 面板，内容为被折叠的一级项（含各自子树） |
| 栏宽变化（sizechange） | 重算溢出：变窄多折叠、变宽逐项回归；弹层打开期间内容随之更新（不重定位，见 §8） |
| 激活项被折叠 | 「更多」触发器呈激活高亮；面板内对应行及其祖先行按 activePath 高亮 |
| 根 `disabled` | `pointer-events` + `inert` 拦截，行弱化（同 side-menu） |

## 3. 组件结构与文件清单

### 3.1 结构

`menu.vue` 与 `side-menu.vue` 同构的"宿主 + 弹层链"模式，但主栏无内联展开、无滚动区、无收藏：

```vue
<template>
  <nav ref="rootEl" class="mu-menu" :class="disabled && 'mu-menu--disabled'" :inert="disabled || null">
    <div ref="barEl" class="mu-menu__bar">
      <menu-item v-for="(node, index) in barItems" :key="node.id ?? index"
        :node="node" :level="0"
        @item-enter="onItemEnter(node, $event)" @item-leave="onItemLeave" />
      <div v-if="hasOverflow" ref="moreEl" class="mu-menu__more"
        :active="overflowActive || null" :title="t('Menu.MORE')"
        @mouseenter="onMoreEnter" @mouseleave="onMoreLeave">
        <mu-icon icon="dots" />
      </div>
    </div>
    <popup-menu v-for="i in popupLayerCount" :key="i"
      :ref="el => setLayer(i - 1, el)" :layer="i - 1" />
  </nav>
</template>
```

- `usePopupChain()`（`popup-chain.js` 现状复用，零改动）：menu.vue 持有层实例表并 provide `popupChain`。
- `barItems = items.slice(0, visibleCount)`，`hasOverflow = visibleCount < items.length`（§6）。
- 弹层统一挂 menu.vue 下（与 side-menu ad654ba 后的挂载方式一致），`popup-menu.vue` 不需感知宿主是谁。

### 3.2 API

```js
props: { items: Array, disabled: Boolean }
defineModel: activeItem
emits: ['itemClick']
```

- 不设 `select` 事件（已定稿）：side-menu 声明了 `select` 但从未 emit（`side-menu.vue:127` 全文无 `emit('select')`，属历史遗留死声明），menu.vue 不复制该坏味道；选中信号即 `v-model:activeItem`，点击信号即 `itemClick`。如需统一清理 side-menu 的死声明，另行处理。
- 不提供 favorites / accordion / collapsed / rail / width / header / footer——横向栏无此语义。

### 3.3 文件清单

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/components/side-menu/menu.vue` | 新增 | 组件主体（结构、上下文、溢出测量） |
| `src/components/side-menu/menu.scss` | 新增 | 栏布局、行覆盖、更多触发器样式 |
| `src/components/side-menu/menu-item.vue` | 修改 | 上下文 `horizontal` 适配（§4） |
| `src/components/side-menu/popup-menu.vue` | 修改 | 弹出方向参数化，支持 down/up（§5） |
| `src/components/side-menu/popup-menu.scss` | 修改 | `[position='down'/'up']` 入场位移 |
| `src/components/side-menu/tree.js` | 新增 | 从 `side-menu.vue` 原样提取 `walkTo` / `walk`（L90-113），两宿主共用 |
| `src/components/side-menu/side-menu.vue` | 修改 | `walkTo` / `walk` 改为 import（行为不变） |
| `src/components/side-menu/index.js` | 修改 | 追加 `export { default as MuMenu } from './menu.vue'`（经 `components/index.js` 的 SideMenuComponents 自动注册为 `<mu-menu>`，无重名冲突） |
| `src/icons/tabler-icons.js` | 修改 | 追加 `dots`（`~icons/outline/dots.svg`，横向三点） |
| `src/langs/zh.js` / `en.js` | 修改 | 追加 `Menu.MORE`（更多 / More） |
| `demo/src/menu/`（main-view.vue + main.js） | 新增 | demo 页（§9），`vite.demo.config.js` 按目录自动发现，另在 `demo/src/index.html` 加入口链接 |

## 4. menu-item 复用适配

`menu-item.vue` 注入 `sideMenu` 上下文，横向模式由上下文新键 `horizontal` 驱动（side-menu 不提供该键，全部现有路径不变）：

```js
// popupRow（改 menu-item.vue:55-60）
const popupRow = computed(() => {
  if (!isGroup.value) return false
  if (popup) return true
  if (menu.horizontal) return !props.level   // 横向主栏：一级组行 hover 浮出
  return collapsed.value ? !props.level : props.level === 1
})

// expandIcon（改 menu-item.vue:71-77）：popupRow 行的箭头指向弹出方向
// 弹层内行 → chevronRight（链向右）；横向主栏行 → chevronDown（向下弹）
const expandIcon = computed(() => {
  if (!isGroup.value || railMode.value) return null
  if (popupRow.value) return (!popup && menu.horizontal) ? 'chevronDown' : 'chevronRight'
  return props.expanded ? 'chevronDown' : 'chevronRight'
})
```

连锁不变项（复核过）：

- `railMode`（L46）：menu 上下文 `collapsed` 恒 false → 恒 false，栏行正常显示 label 与箭头；
- 栏行 `flex: none` 定宽（§7）不触发省略截断 → `checkOverflow` 恒 false、`rowTitle` 恒 null；
- `showFavoriteBtn`：menu 上下文 `favoritesSet` 为 null → 不显示星标；`toggleFavorite`/`toggleExpand` 提供空函数兜底；
- `active` / `isRowActive`：叶子 `activeItem` 命中、祖先 `activePath` 命中，与 side-menu 同语义。

menu.vue 提供的上下文（provide key 沿用 `'sideMenu'`，`popup-menu.vue:47` 与 `menu-item.vue:38` 的 inject 零改动）：

```js
provide('sideMenu', {
  popup: false,
  horizontal: true,
  basePosition: 'down',            // 链头默认弹出侧（§5）
  collapsed: ref(false),           // 供 showHeader / railMode 判定
  activeItem,
  activePath,                      // 同 side-menu 的 walkTo 祖先集 computed
  favoritesKey: null,
  favoritesSet: computed(() => null),
  toggleFavorite: () => {},
  toggleExpand: () => {},
  onSelectItem,                    // popupLayers[0]?.hide() + activeItem 置值
  onItemClick                      // emit('itemClick', node)
})
```

`onItemEnter` / `onItemLeave` 与 side-menu（L200-206）完全一致：`showLayer(0, event.currentTarget, node)` / `popupLayers[0]?.delayHide()`。

## 5. popup-menu 方向扩展（down / up）

现状 `popup-menu.vue` 主轴为水平（right/left），`updatePosition` 的 base 继承为 `parentPopup?.position ?? 'right'`（L156-159）。扩展为轴参数化：

### 5.1 base 解析（链头取宿主声明，子层继承）

```js
// 链头：side-menu 未声明 basePosition → 'right'（现状行为不变）；menu 声明 'down'
// 子层：继承父层 position；父层为纵向（down/up）时子层回水平 'right'（经典级联）
function resolveBase () {
  const inherited = parentPopup?.position.value
  if (inherited === 'down' || inherited === 'up') return 'right'
  return inherited ?? menu.basePosition ?? 'right'
}
```

### 5.2 calculatePosition 双轴分支（L117-147 参数化）

水平主轴分支（base `'right' | 'left'`）**逐字保留现状逻辑**；新增垂直主轴分支：

```
base ∈ {'down','up'}（GAP=8、MARGIN=8 沿用）：
主轴（垂直）：
  downSpace = vh - anchorRect.bottom - GAP
  upSpace   = anchorRect.top - GAP
  fits = { down: downSpace >= ph, up: upSpace >= ph }
  pos  = fits[base] || !fits[other] ? base : other        // 仅默认侧放不下且另一侧放得下才翻转，两侧不足保持默认侧（防方向锯齿，与现状同策）
  down → style.top    = anchorRect.bottom + GAP
  up   → style.bottom = vh - anchorRect.top + GAP          // 上缘锚定锚点上缘，宽度变化不漂移（同 left-hang 用 right 的理由）
交叉轴（水平）：
  默认左对齐 style.left = anchorRect.left
  右溢出（left + pw > vw - MARGIN）→ 右对齐 style.right = vw - anchorRect.right
  最终夹紧：面板任一边不出 MARGIN（pw > vw - 2*MARGIN 时退化为 left = MARGIN）
```

### 5.3 连锁改动

- `updatePosition`（L166）：清旧定位补 `el.style.bottom = ''`（新增 bottom 定位通道）；
- `popup-menu.scss`（L32-38 后追加）：

```scss
&[position='down'] { transform: translateY(-8px); }
&[position='up']   { transform: translateY(8px); }
```

- `position` attr 值域扩为 4 向，`[pop-up]` 收敛 `transform: none` 现状已覆盖；
- `showHeader`（L75）：menu 上下文 `collapsed` 恒 false → 链头无标题栏，符合预期（栏内锚点行 label 本身可见）；
- `max-height: calc(100vh - 16px)` 与 MARGIN 对应关系在纵向同样成立，不改。

## 6. 溢出折叠（测量与收敛）

### 6.1 布局前提

- `.mu-menu__bar`：`display: flex; flex-wrap: nowrap; gap: var(--mu-half-spacing)`，子项 `flex: none`——**无省略截断**，项宽为内容内在宽，可直接测量（规避知识库 `flex-ellipsis-breaks-rect-measurement` 的截断坑）；
- 根 `.mu-menu` `overflow: hidden`：测量首帧溢出被裁剪，不撑破页面；
- 「更多」触发器**定宽方形**（`width: var(--mu-side-menu_item-height)`），宽度不参与 DOM 测量。

### 6.2 测量方案（采纳：全量渲染 → 测量缓存 → 直算）

参照 pagination（`bar/pagination.vue`）的"渲染-测量-收敛"哲学，但菜单项无档位概念，一次测量直算：

1. **全量帧**：`visibleCount = items.length` 渲染全部一级项，`await nextTick()`；
2. **测量**：读各栏行 `getBoundingClientRect().width` 写入宽度缓存（按 node.id 键控）；
3. **直算**：`visibleCount = max n ∈ [0, N]`，使 `Σw[0..n-1] + gap·(n-1) + (n < N ? gap + T : 0) ≤ innerWidth`（gap 取 `getComputedStyle(barEl).gap`，T 为触发器定宽）；应用后溢出项卸载、触发器按需出现。

**触发时机**：

| 时机 | 动作 |
|---|---|
| 挂载（`@sizechange` 首挂即触发，见知识库 `sizechange-event` 模式） | 全量帧流程 |
| `items` watch | 全量帧流程（新项无缓存宽度） |
| `document.fonts.ready` | 全量帧流程（字宽变化，同 pagination） |
| `@sizechange`（throttle 50ms，noLeading） | 缓存直算；同时复测当前可见行宽度，与缓存漂移 > 0.5px（主题字号变化类）→ 升级为全量帧 |

**守卫**：`generation` 计数 + `destroyed` 标志使进行中的旧流程作废（pagination L160-183 同款）；`innerWidth ≤ 0`（隐藏挂载）时 `visibleCount = 0` 全折叠，恢复可见后 RO 再触发收敛。

### 6.3 折叠内容与激活态

- 合成溢出组节点：`{ id: '__overflow__', label: t('Menu.MORE'), items: items.slice(visibleCount) }`，触发器 hover 直接 `showLayer(0, moreEl, 溢出组节点)`（与 side-menu 主树行触发同路径，弹层内组行逐层级联照旧）；
- `overflowActive = computed(...)`：activeItem 落在被折叠项子树内则为真（复用 `walkTo` 对溢出切片判定），触发器 `[active]` 高亮；
- **不做激活项豁免**（已定稿，激活项不折叠的特例）：保持纯顺序折叠，触发器高亮已提示入口。

### 6.4 备选（未采纳）

- **隐藏测量条**（并行渲染全部项的隐形容器供测量）：逻辑最确定、无首帧闪动，但双份 DOM 且须与栏行样式严格同步，维护负担大；
- **探测式增减**（栏溢出则逐项减、有富余则逐项试加）：无缓存但增长探测必闪一帧、循环轮次多。

首帧闪动与 pagination 同级（仅挂载/换数据/主题切换一帧），接受。

## 7. 样式方案（menu.scss）

```scss
.mu-menu {
  // menu-item.scss 的行样式变量声明在 .mu-side-menu / .mu-side-menu-popup 上，
  // 栏内行须在本根重声明同值（弹层面板侧 popup-menu.scss 已自带，不受影响）
  --mu-side-menu_item-height: 40px;
  --mu-side-menu_icon-size: 24px;
  --mu-side-menu_indent: 20px;

  overflow: hidden;
  display: flex;
  background: var(--mu-bg-normal);
}

.mu-menu__bar {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--mu-half-spacing);
  align-items: stretch;
  min-width: 0;
}
```

- **行覆盖用后代选择器** `.mu-menu__bar > .mu-side-menu__item`（改 `width: auto; flex: none; margin-top: 0`——对冲 `menu-item.scss:61-64` 的相邻行 `margin-top`）：特异性 (0,2,0) > (0,1,0)，跨文件生效不依赖书写顺序（知识库 `css-split-equal-specificity-order`：等特异性才是坑；**不**用 fallthrough class 方案，那会退化为等特异性依赖 import 顺序）；
- `.mu-menu__more`：定宽方形，hover 背景 / `[active]` 主色高亮，对齐行高变量；
- `.mu-menu--disabled`：`pointer-events: none` + 行弱化（同 side-menu 禁用模式，弱化覆盖规则写在 menu.scss 内置尾，勿跨文件依赖顺序）；
- 弹层面板样式（`popup-menu.scss`）共用，零视觉分叉；暗色模式经 Teleport 落 root 变量，现状机制不变（知识库 `teleport-popup-css-vars` 已由弹层自声明默认值覆盖）。

## 8. 边界与已知取舍

1. **弹层打开期间溢出重算**：面板内容（被折叠项集合）响应式更新，但 `popup-menu.show` 仅在 `anchorChanged` 时重定位（L216-220）——锚点（触发器/栏行）未变、面板宽度变时不重定位。side-menu 现状同样存在（items 热更场景），记录不处理。
2. **两侧都不足时保持默认侧**（向下延伸被视口裁剪）：与现状水平弹层同策，防方向锯齿；面板 `max-height: calc(100vh - 16px)` + 内部 `mu-scroll-box` 兜底。
3. **退化窄容器**：`visibleCount = 0` 时仅剩触发器（全量折叠），不再降级隐藏触发器。
4. **RTL**：项目无 RTL 支持，不预留。
5. **键盘可达性**：维持与 side-menu 相同的现状缺口（hover 驱动弹层、无 roving tabindex），不在此方案内补。

## 9. 验证（demo + playwright，DOM/可访问性快照断言优先）

新增 `demo/src/menu/`：基础用例、多级深树、窄容器溢出（可调宽度 slider/button）、贴底容器（向上翻转）、disabled、与 side-menu / dropdown 共存互斥；数据复用 side-menu demo 树。

断言清单：

1. 栏内一级项横排，组行带 chevronDown，叶子行无箭头；
2. hover 一级组行 → L1 面板出现且 `[position="down"]`，锚点行带 `popup-open`；
3. 面板内组行 hover → L2 面板 `[position="right"]`，链式延展；
4. 菜单置于视口贴底 → L1 面板 `[position="up"]`；
5. 收窄容器 → 超出项从栏内消失、触发器出现；hover 触发器 → 面板列出被折叠项（含下级）；
6. 拉宽容器 → 被折叠项逐项回归、无溢出时触发器消失；
7. 点击面板叶子 → `activeItem` 更新、整链收起、`itemClick` 触发；
8. activeItem 落被折叠子树 → 触发器 `[active]`，面板内祖先行 `[active]`；
9. ESC / 链外 mousedown / window blur → 整链关闭；与同页 dropdown 弹层互斥；
10. `disabled` → 根 inert、行不可交互；
11. **回归 side-menu**：跑 `side-menu-popup-cascade.md` §7 级联断言 + side-menu demo 各用例（menu-item / popup-menu 共改波及面）。

## 10. 实施顺序

1. `tree.js` 提取 + side-menu.vue 改 import（纯重构，先行回归 side-menu demo）；
2. `popup-menu.vue` 方向参数化 + scss（回归 side-menu 弹层方向仍为 right）；
3. `menu-item.vue` `horizontal` 适配（side-menu 无该键，回归不变）；
4. 图标 / 文案 / `menu.vue` + `menu.scss` / 注册导出；
5. demo 页 + playwright 全量断言。
