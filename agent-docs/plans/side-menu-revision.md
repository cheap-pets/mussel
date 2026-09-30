# SideMenu 修订方案

| 项目 | 内容 |
|---|---|
| 状态 | **已实施**（2026-09-30 代码审查产出，同日评估修订；R2/R3/R5/R6 已定稿，见 §7。代码于 2026-10-01 实施并经 demo 页验证；R6 文档同步暂缓） |
| 范围 | `src/components/side-menu/` 的缺陷修复、API 简化（§3）与口径统一；对外文档同步（需确认后执行） |
| 不在范围 | 新增能力（键盘漫游、搜索过滤、hover 整栏浮出等，见 `side-menu.md` §9） |
| 前置文档 | `agent-docs/plans/side-menu.md`（原设计，状态"已实施"） |
| 依据 | 全量代码审查 + demo 页运行时复现（R1 / R2 / R4 已实测，其余为静态结论） |

## 0. 验证环境（复现本文实测结论的方法）

demo 页构建（`vite.demo.config.js`）把 `vue` 指向 `node_modules/vue/dist/vue.esm-browser.js`（dev 版）且 `minify: false`，因此浏览器控制台可经 DOM 拿到组件实例：

```js
// 组件实例（dev 版 Vue 在元素上挂 __vueParentComponent）
const menu = document.querySelectorAll('.mu-side-menu')[1]
const inst = menu.__vueParentComponent

// expose 的方法：expand / collapse / expandTo / scrollIntoView
inst.exposed.expandTo('report-weekly')
```

无测试框架，验证一律走 demo 页（`http://localhost:3000/side-menu/`）+ DOM 断言，不依赖截图。

## 1. 当前实现基线

```
src/components/side-menu/
├── side-menu.vue         # 容器：props/models、收藏派生、激活同步、折叠、provide('sideMenu')、expose
├── side-menu-node.vue    # 递归行：组/叶子、浮出判定（popupRow）、收藏星标、tooltip/弹层触发
├── side-menu-popup.vue   # 折叠态/hover 浮层：右侧定位 + 双向翻转 + 限高，usePopupManager/usePopupRunner
├── side-menu.js          # useSideMenuExpand()：keys(Set) 受控/非受控 + accordion + walkTo + prune
├── default-options.js    # DEFAULT_DATA_PROPS / DEFAULT_EXPAND_ICONS
└── side-menu.scss
```

关键数据流与读写路径：

```
props.data ──┬─→ rootData（favorites 启用时前置内置「我的收藏」组）
v-model:favorites ─┘        │
                            ├─→ useSideMenuExpand（keys 集合）
                            │     ├─ 受控：expandedKeys 为数组时以 props 为准，写走 commit → emit
                            │     └─ 非受控：innerKeys（ref<Set>），写即生效
                            └─→ side-menu-node 递归渲染 / side-menu-popup 弹层渲染
```

`provide('sideMenu')` 是上下文契约：`side-menu-popup.vue:38-43` 用 `{...menu, popup: true, isExpanded, setExpanded}` 覆盖局部展开态，使同一 `side-menu-node` 在弹层内表现为"默认全展开、状态存面板本地"。

## 2. 缺陷修订

### R1 [致命] 受控模式批量展开只保留最后一个 key

**现象**：`auto-expand-active` / `expandTo()` 在受控模式（绑定 `v-model:expanded-keys`）下，一次需展开多个祖先组时只有最后一个生效，激活项仍不可见。

**实测（demo 2：`v-model:expanded-keys` + `accordion`）**：

| 步骤 | 结果 |
|---|---|
| 初始（auto-expand 后） | `expandedKeys = ['quality']` |
| `inst.exposed.expandTo('report-weekly')`（父链 `group > project-report`） | 期望 `['group','project-report']`；实测 `['quality','project-report']`，`group` 丢失 |
| DOM 校验 | 展开的 `.mu-side-menu__group[expanded]` 仅 1 个；`report-weekly` 不可见 |
| 对照：非受控 demo 1 `expand('group','quality')` | 两组均展开，行为正常 |

**根因**：`side-menu.js:101` 的 `expand()` 逐 key 调 `setExpanded`，而 `setExpanded`（`side-menu.js:76`）每次从 `keys.value` 读当前集合重建 `next` 后立即 `commit`。受控时 `keys.value = new Set(expandedKeys.value)`（`side-menu.js:26`）读的是 props，而 props 要等父组件重新渲染后才更新——同一同步块内每次读到的都是旧值，第 N 次 commit 覆盖第 N-1 次（已对照 Vue 3.5.39 `useModel` 源码确认：父组件绑定 v-model 时 `set` 仅 `emit` 不写 `localValue`，`get` 返回的 `localValue` 要等 props 变化后才经 `watchSyncEffect` 同步）。`side-menu.vue:226` 的 `expand(...missing)`（父链展开）与 `side-menu.js:127` 的 `expandTo` 共用该路径，故受影响面覆盖 `auto-expand-active` 主场景（plan §5.2「异步数据到达 + 激活项定位」）。

**附带影响**：受控下 N 个 key 触发 N 次 `update:expanded-keys`（N 次父更新）；`accordion` 的收拢判断基于过期快照，同级互斥结果错乱（上例中 `group` 与 `quality` 同为一级组，本应互斥）。

**修订**：批量语义下沉为「一轮 Set 操作 + 单次 commit」。`side-menu.js` 替换 `setExpanded` / `expand` / `collapse` 三个函数：

```js
// entries: [[key, expanded], ...]，一次同步块内累积后单次提交
function update (entries) {
  const next = new Set(keys.value)
  let changed = false

  for (const [key, value] of entries) {
    if (!isGroup(findNode(key)) || next.has(key) === value) continue

    if (value && accordion.value) {
      getSiblings(key).forEach(sibling => {
        const siblingKey = sibling[keyProp.value]

        if (siblingKey !== key && isGroup(sibling) && next.delete(siblingKey)) {
          onChange?.(siblingKey, false)
        }
      })
    }

    if (value) next.add(key)
    else next.delete(key)

    changed = true
    onChange?.(key, value)
  }

  if (changed) commit(next)
}

function setExpanded (key, value) {
  update([[key, value]])
}

function expand (...targets) {
  update(targets.map(key => [key, true]))
}

function collapse (...targets) {
  update(targets.map(key => [key, false]))
}
```

语义说明（保持与逐次点击一致）：`entries` 按序处理，`accordion` 下同层的收拢结果落在"最后一个被展开的组"上；已处于目标状态的 key 不产生 `onChange`（与原实现一致）；`expand`/`collapse`/`setExpanded` 对外签名不变，`side-menu.vue` 与 `side-menu-node.vue` 无需改动。

**验证**：

1. demo 2 在 `group` 处于折叠态时调用 `inst.exposed.expandTo('report-weekly')` → 页面显示 `expanded: ['group','project-report']`（修复前为 `['quality','project-report']`），且展开的 `.mu-side-menu__group[expanded]` 为 `group`。
2. 同一路径覆盖 `auto-expand-active`：受控 + 三级数据下把 `v-model:active-item` 从浅层项切到 `report-weekly`（demo 2 可临时加按钮，或用实例改父组件状态）→ 父链两级自动展开。
3. 非受控不回归：demo 1 `expand('group','quality')` 两组仍同时展开；单 key 展开、accordion 同级互斥（逐次点击）行为不变。

注：R2 已定稿保留浮出行为——`project-report` 为浮出组，其子项只在 hover 浮层渲染（`side-menu-node.vue:44-45` 的 `v-if="isGroup && !popupRow"`），`scrollToKey` 因行高为 0 直接返回，`report-weekly` 不在文档流。验证以第 1/2 条断言为准，不断言其可见性与滚动定位。

### R2 [警告] 展开态二级组为 hover 浮层：点击与键盘均不可达，且与文档口径冲突

**现象（实测）**：展开态下 hover 二级组「报表」弹出 400×248 浮层面板；点击该组头无任何反应；该节点内不存在 `.mu-side-menu__group` 容器——子项不在文档流，Tab 焦点进不去，键盘用户无法访问二级组的子项（组头带 `aria-haspopup="menu"`，但无任何键盘路径打开面板）。

**根因**：`side-menu-node.vue:97-101` 的 `popupRow` 判定为

```js
collapsed.value ? !props.level : props.level === 1
```

即展开态下 **level 1（二级组）** 就走浮层，且 `onClick`（`side-menu-node.vue:183-194`）对 `popupRow` 直接跳过 `setExpanded`。而原设计口径为展开态组全部内联展开：`side-menu.md` §5.1 明确"组头点击整行或箭头均可切换"（无浮层例外）、§4.2 明确超三级"渲染不截断"。"**三级**及更深不在体内展开"一语实际仅见于实现自身的注释（`side-menu-node.vue:95-96`）——实现偏离设计后注释随实现走。即实现把浮层门槛提前了一级，且未补点击/键盘路径。

**修订（2026-09-30 定稿：保留现行为，浮出面板加标题栏）**：

`popupRow` 判定维持现状（展开态二级组、折叠 rail 一级组浮出；A0 完整回退／A 二级内联／B 补键盘可达均未采纳）。在浮出面板（`side-menu-popup.vue`，两条触发路径共用）顶部增加标题栏：

- 标题栏：锚点组（上级分组）的图标 + 标题，沿用 `mu-side-menu__item` 行样式体系；标题栏下方分隔线（`--mu-border-color-soft`）。
- 交互：锚点组未禁用时标题栏可交互——hover 高亮，点击触发该组的 `itemClick` 旁路事件（与组头点击一致），不切换展开、不关闭面板；禁用时静态呈现。
- 缓解与边界：标题栏为浮层补上分组上下文与点击入口；键盘不可达保留为已知边界（浮层维持 hover 驱动）；「与原设计口径冲突」经 R6 文档按实际行为落笔消解。

**验证**：展开态 hover 二级组「报表」→ 面板顶部显示「报表」图标 + 标题、下方分隔线；点击标题栏 Events 面板出现 `itemClick` 且面板不关闭；`disabled` 锚点组的标题栏无 hover/click 响应；折叠 rail 一级组浮层同样带标题栏；demo 8 互斥、折叠切换先关浮层行为不变。

### R3 [警告] `--mu-side-menu_level` 口径三处不一致

| 位置 | 口径 |
|---|---|
| `side-menu-popup.vue:16` 传 `:level="0"`（实测：`report-weekly` 主树 padding-left 56px、弹层内 36px） | 弹层内缩进从 0 重置 |
| `side-menu.scss:47` 注释"level 为完整菜单树中的层级，弹层内不重置" | 保持原树层级 |
| `side-menu.md` §10"按 `:level="groupLevel + 1"` 起递归（一级组弹出，故首行恒为 1）" | 保持原树层级 |

三者互斥，使用 `item` 插槽自绘缩进的人会踩空。

**修订（2026-09-30 定稿：方案 A）**：

- 弹层是独立面板，缩进从 0 重建更自然（现状即合理）。改 `side-menu.scss:47` 注释与 `side-menu.md` §10 表述（§4.4 的 item 插槽 `level` 说明随插槽删除消失，见 §3 P6）；对外文档同步（R6 暂缓，口径已记入 §2 R6）时写明"`level` 在弹层内重置为 0（面板自身留白由 `.mu-side-menu-popup` padding 提供）"。
- 方案 B（弹层保持原树 level，`show()` 透传 `groupLevel + 1`）未采纳。

### R4 [警告] `prune()` 在 data 未就绪/为空时清空展开态

**现象（实测）**：demo 3 先 `expand('g0','g1')`，点 "Reload Data (async)"（data 先置空、1s 后重建）→ 回来后 `g0`/`g1` 全部折叠。

**根因**：`side-menu.js:132` 的 `prune()` 只按"当前 data 找不到该 key → 删除"判定，无"数据未加载"与"key 确实不存在"的区分。data 短暂为空（异步刷新、路由切换重载）时会把全部展开 key 清空；受控模式下 `commit` 会 `emit` 覆盖业务数据——业务若按 `side-menu.md` §9 做「localStorage 恢复展开态 → 数据后到」，恢复出来的 keys 会在数据到达前被组件清掉。同源问题：`side-menu.vue:249` 的 watch 把 `prune` 绑在 `[activeItem, data]` 上，每次点击菜单项都跑一次 O(展开数 × 全树) 校验。

**修订**：

```js
// side-menu.js（守卫须用 sourceData 判断：data 是含内置收藏组的 rootData，
// 收藏启用时即便 props.data 为空 rootData 仍非空，用 data 判断守卫失效）
function prune () {
  if (!sourceData.value?.length) return // 数据未就绪/为空：不清空，避免误删 default 与业务传入的 key
  ...原逻辑
}
```

```js
// side-menu.vue：prune 只跟随 data，激活变化不再触发全树校验
watch(() => props.data, () => {
  prune()
  syncActive()
})

watch(activeItem, syncActive)
```

**验证**：

1. demo 3 重复上文操作 → 数据重建后 `g0`/`g1` 保持展开。
2. 受控场景：业务侧先设 `expandedKeys = ['group']`、`data` 后到达 → 数据到达后 `group` 仍展开（不被 prune 清掉）。
3. `data` 中确实删除某组后，其展开 key 仍被清理（prune 原语义不回归）。
4. 收藏 + 异步刷新：demo 3 临时绑定 `v-model:favorites` 后重复 1 的操作 → 数据重建后展开态同样保持（守卫基于 `sourceData`，不受 rootData 中收藏组影响）。

### R5 [警告] `scrollIntoView` 在收藏双入口下命中收藏组副本

**现象**：`side-menu.vue:199-210` 用 `rootEl.querySelector('[data-key="..."]')` 定位，而 DOM 顺序上收藏组在 `data` 之前；激活项被收藏时滚动命中收藏组里的副本，而 `auto-expand-active` 展开的是原树父链（`walkTo` 只走 `sourceData`）——滚动定位与原树上下文不一致。

**修订（2026-09-30 定稿：方案 A）**：

- **方案 A**：给「位于收藏组内」的行加标记，滚动时排除。`side-menu-node.vue` 已拿到 `props.parentKeys`，主树中收藏组的直接子项其 `parentKeys[0]` 即 `FAVORITES_KEY`：

  ```js
  // side-menu-node.vue
  const inFavoritesGroup = computed(() => props.parentKeys?.[0] === FAVORITES_KEY)
  ```

  ```html
  <!-- side-menu-node.vue：行 button 上 -->
  :data-favorites="inFavoritesGroup || null"
  ```

  ```js
  // side-menu.vue
  rootEl.value
    ?.querySelector(`[data-key="${CSS.escape(String(key))}"]:not([data-favorites])`)
  ```

  注意弹层内渲染同样传 `:parent-keys="[groupKey]"`，若 hover 的是收藏组，其面板内的行也会带该标记——但弹层不在 `rootEl` 内，不影响本选择器作用域。

- 方案 B（不改，仅文档说明）未采纳。

### R6 [警告] 对外文档三处未同步

**2026-09-30 定稿：先不同步**。以下清单与口径保留，执行时机后定（§7）。

全库检索 `skills/`、`docs/`、`docs-site/` 均无 `side-menu` / `SideMenu` 条目（`side-menu.md` §8 列为"待确认"）。按项目约定「完成代码实现后，未经用户确认，不更新文档」，本项需确认后执行。

**同步清单**（含 R2 / R3 定稿后的口径）：

1. `skills/mussel-ui/references/components/containers.md`（导航类，与 MuTabs 同文件）
2. `docs/quick-reference_components.md`
3. `docs-site/components/side-menu.md` + `.vitepress/config.mts`「导航与容器」分组登记

文档需落笔的关键口径：§3 定稿后的 API 形态（父链自动展开与滚动定位恒开、`defaultExpandAll`、图标固定、根 `disabled` 的 class/inert 语义、无 `item` 插槽）、展开态二级组浮出与面板标题栏交互（R2 结论）、键盘可达性边界（R2）、`level` 在弹层内重置为 0（R3 结论）、受控模式下 `update:expanded-keys` 与 `prune` 的行为边界（R1/R4 修复后的实际表现）、滚动定位排除收藏组副本与收藏组不自动展开（R5/P1）。

## 3. API 简化（2026-09-30 定稿）

用户定稿，与缺陷修同一批实施；对外 API 以本节为准，R6 文档同步按此落笔。

### P1 去掉 `autoExpandActive`——父链自动展开恒开，不展开「我的收藏」

- `side-menu.vue` 删 prop；`syncActive` 中 `props.autoExpandActive` 条件移除。
- 「不展开我的收藏」为既有语义：`walkTo` 只走 `sourceData`，`FAVORITES_KEY` 不在原树、永不进父链，无需额外改动。文档口径写明"激活项被收藏时只展开其原树父链，收藏组不自动展开"。
- 验证：demo 3 三种时序父链展开照常；demo 5 激活收藏项时收藏组保持折叠、原树父链展开。

### P2 去掉 `scrollIntoView`——滚动定位恒开

- 删 prop；`syncActive` 中 `props.scrollIntoView` 条件移除；expose 的 `scrollIntoView(key?)` 方法保留不变。
- 验证：demo 3 滚动定位照常；expose 调用仍生效。

### P3 去掉 `expandIcons`——图标固定为当前默认

- 删 prop 与 `expandIcons` computed、`$mussel.options.sideMenu.expandIcons` 全局选项合并；provide('sideMenu') 移除 `expandIcons`；`default-options.js` 删 `DEFAULT_EXPAND_ICONS`。
- `side-menu-node.vue`：`expandIcon` 固定 `groupExpanded ? 'chevronDown' : 'chevronRight'`（浮出组恒 `chevronRight`）；`sameExpandIcon`（同图标旋转）随之删除。
- demo 7 移除 `:expand-icons` 用例。
- 验证：demo 1~8 箭头切换正常、无残留引用。

### P4 去掉 `defaultExpandedKeys`，新增 `defaultExpandAll: Boolean`（默认 false）

- `useSideMenuExpand` 的 `defaultExpandedKeys` 参数替换为 `defaultExpandAll`（容器传 `toRef(props, 'defaultExpandAll')`）。
- 非受控初始集合：`defaultExpandAll` 为 true 时一次性收集结构树（rootData，含收藏组）全部组 key 填充；初始填充不追溯 accordion 收拢（与原 `defaultExpandedKeys` 口径一致）；受控模式忽略。
- 异步时序：初始 data 为空时集合为空，data 首次非空到达时补一次全展开（组件生命周期内仅此一次，避免业务刷新数据后重置用户已收拢状态）；空数据期间由 R4 守卫保护。
- 验证：同步数据全组展开；demo 3 加 `defaultExpandAll` → 数据到达后全展开，再次 Reload 不重置已收拢状态；受控模式忽略；accordion 组合初始态不追溯互斥。

### P5 `disabled` 不再经 provide——根 class + inert 控制

- provide('sideMenu') 移除 `disabled`；node 的 `isDisabled` 仅看数据级 `disabled`。
- 根 nav：`disabled` 时挂 `mu-side-menu--disabled` 类 + `inert` 属性；scss 以类控制视觉弱化与 `pointer-events: none`。仅 class 时 `pointer-events` 拦不住键盘 Tab/Enter，故同时挂 `inert`（属性随 prop 切换，仍不经 provide）。
- 验证：demo 6 切换根 disabled——鼠标点击与 Tab 聚焦均不可达、视觉弱化、`.mu-dark` 下正确；数据级 disabled 行为不变。

### P6 去掉 `item` 插槽（R3 定稿附带）

- `side-menu-node.vue` 删 `itemRender` / `itemScope`；`side-menu.vue` slots 透传中移除 `item`；组头与叶子固定默认渲染（图标 + label）。
- `header` / `footer` 插槽保留。
- demo 4 移除 `#item` 用例。
- 小问题 #10（item 插槽折叠态 `.mu-side-menu__item-label` 隐式契约）随插槽删除失效。
- 验证：demo 4 默认渲染正常；无 `slots.item` 残留引用。

## 4. 小问题清单

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| 1 | `side-menu-popup.vue:36-43` | `localExpanded` 用普通对象做 key map，`__proto__` / `constructor` 等原型键语义会被卷入 | 换 `Map`，或用 `Object.create(null)` |
| 2 | `side-menu-popup.vue:147-152` 与 `:167-172` | `hideOrReposition` 与 `onCaptureScroll` 的「锚点离开视口则隐藏」判断重复；两者非等价——后者多 `event.target.contains(anchor)` 条件（仅滚动容器含锚点才重定位） | 合并为一个 `handleAnchorMove(event?)`，须保留该条件，避免无关滚动触发重定位 |
| 3 | `side-menu-popup.vue:75-77` | 每次定位都 `getComputedStyle(el)` 读 `--mu-side-menu_popup-gap` | 与 `MARGIN` 同源：常量 + CSS 变量各写一处注释对应，或缓存首次读取结果 |
| 4 | `side-menu.js:40` / `:56` / `:110`，`side-menu-node.vue:113` | `findNode` / `getSiblings` / `walkTo` / `hasActiveDescendant` 是同一递归的四份拷贝 | 抽 `walk(nodes, visit)` 工具放 `side-menu.js` |
| 5 | `side-menu-node.vue:113-127` | `hasActiveDescendant` 对每个组节点递归整棵子树，总代价 O(n × depth) | 可选：由激活项向上冒泡，或渲染时自顶向下传激活路径 |
| 6 | `side-menu-node.vue:245-256` | 双 `<script>` 块仅为承载模块级 `levelWarned` | 把告警与标志移到 `side-menu.js`（与 `FAVORITES_KEY` 同处） |
| 7 | `side-menu-node.vue:130-133` | `isRowActive` 用 `menu.favoritesEnabled.value`，同文件 `:156` 已解构出 `favoritesEnabled` | 统一用解构后的引用 |
| 8 | `side-menu.vue:260-267` | 折叠时读 `$mussel.tooltip.state.anchor` 判断归属，耦合 tooltip controller 内部结构 | 由 tooltip controller 暴露 `isAnchorIn(el)` 之类的查询 |
| 9 | `side-menu.vue:146` | 收藏组标题 `t('SideMenu.FAVORITES')`：`t()` 非响应式（`src/langs/index.js` 的 `resources` 是普通变量），语言切换后标题不更新 | 全库同现状（calendar 等亦然）；若要修需引入 locale 响应式源，单独立项 |
| 10 | ~~`item` 插槽~~ | 插槽已由 P6 删除，隐式契约消失 | 无需处理 |
| 11 | `side-menu.vue:109-110` | `favoritesBound` 是 setup 期 `vnode.props` 快照，动态 `v-bind` 切换绑定不生效 | 边缘场景，dev 文档说明即可 |
| 12 | `side-menu-popup.vue` 面板 | `aria-haspopup="menu"` 但面板无 `role="menu"` 与无障碍名称，与 §5.6「不使用菜单角色」的口径半冲突 | 去掉 `aria-haspopup`，或补全角色与名称（与 R2 方案 B 绑定） |
| 13 | ~~`default-expanded-keys` + 异步 data~~ | prop 已由 P4 删除，原场景消失；`defaultExpandAll` 的异步时序由 P4（首达补展开）+ R4（空数据守卫）覆盖 | 无需单独改 |
| 14 | `default-options.js` 映射校验 | `props` 映射键写错（如 `childNode`）静默不生效 | dev 环境对未知映射键 `console.warn`（对照 `key` 缺失的既有告警） |

## 5. 实施步骤

| 批次 | 内容 | 改动文件 | 验证 |
|---|---|---|---|
| 0 | API 简化 P1~P6（§3） | `side-menu.vue`、`side-menu.js`、`side-menu-node.vue`、`default-options.js`、`demo/src/side-menu/` | §3 各条验证 + demo 1~8 回归 |
| 1 | R1（致命）+ R4 + 小问题 4/6/7 | `side-menu.js`、`side-menu.vue`、`side-menu-node.vue` | §2 各条验证 + demo 1~8 全量回归 |
| 2 | R2 浮出面板标题栏 + R3 方案 A（注释/文档口径修正） | `side-menu-popup.vue`、`side-menu.scss`、`side-menu.md` | §2 R2/R3 验证 + 组展开/浮层/弹层缩进逐项核对 |
| 3 | R5 + 小问题 1/2/3/5/8/12/14 | 同上 | demo 5 收藏场景 + 折叠 rail 场景 |
| 4 | R6 文档三处同步（已定稿：暂缓） | `skills/`、`docs/`、`docs-site/` | 文档站构建通过 + 与实现口径逐条对照 |

批 0 与批 1 改动同域（side-menu.js / side-menu.vue / side-menu-node.vue），建议合并实施、按批分别验证；批 1 与批 2 代码改动独立，可并行（R2 已定稿保留浮出，R1 验证按其注中断言执行、不断言 `report-weekly` 可见性）。批 4 已定稿暂缓，后续执行时文档按 §3 API 与 §7 决策落笔。

## 6. 回归清单（每批改完必跑）

1. demo 1：多级渲染、叶子选中、组头半强度激活态、传组 key / 不存在 key 静默。
2. demo 2：受控展开往返、accordion 同级互斥、`groupExpand` / `groupCollapse` 事件序列（R1 修复后事件次数由 N 次降为 1 次，属预期变化）。
3. demo 3：父链自动展开 + 滚动定位（P1/P2 后恒开、无 prop 开关；首挂载 / key 变化 / 数据异步到达三种时序）+ 数据刷新保持（R4）。
4. demo 4：`collapsed` 宽度过渡、图标条、叶子 tooltip、组浮层（含标题栏）、`header`/`footer` 插槽（`item` 已删）、`collapse-button`。
5. demo 5：收藏启用条件、星标 hover/常显、点击不触发 `select`、`disabled` 项可收藏、收藏组置顶与双高亮、空收藏组头仍渲染。
6. demo 6/7：根级 `disabled`（根 class/inert 路径）、字段映射、`defaultExpandAll` 用例（同步/异步/受控忽略）。
7. demo 8：弹层与 dropdown 互斥、折叠切换先关浮层。
8. `.mu-dark` 下全部状态视觉抽查。

## 7. 决策记录（2026-09-30 定稿）

| 项 | 决策 |
|---|---|
| R2 | 保留现行为（展开态二级组浮出），浮出面板顶部加标题栏：上级组图标 + 标题 + 分隔线；未禁用时标题可交互（详见 §2 R2） |
| R3 | 方案 A：弹层内 `level` 重置为 0，修正注释与文档口径；同时去掉 `item` 插槽（§3 P6） |
| R5 | 方案 A：滚动定位排除收藏组副本 |
| R6 | 先不同步：三处文档同步清单与口径保留（§2 R6），执行时机后定 |

仍待确认：知识沉淀——R1「受控模式批量提交读 props 过期值」是否按 `project-knowledge` 规范沉淀到 `agent-docs/knowledge/pitfalls/` 并登记 `INDEX.md`。
