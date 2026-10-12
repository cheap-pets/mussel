# Menu/SideMenu item 身份模型改造方案（id 可选 + 对象激活）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施并验证**（2026-10-12，§7 断言经 playwright 全部通过，两 demo 页零 console 错误；含审核修订项，见「修订」行） |
| 范围 | `src/components/side-menu/`：`menu-item.vue`、`side-menu.vue`、`menu.vue`、`popup-menu.vue`（仅 `:group` 绑定清理）、`tree.js`；demo 用例补充 |
| 不在范围 | 收藏功能（维持 id 强制）、弹层链行为（无改动）、三处文档同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`，实施确认后另行处理） |
| 前置提交 | `3b4d0f6`（行点击/收藏改 menu 上下文集中分派、`node` 统一改名 `item`、`showLayer` 签名规整）——本方案行号基于该提交后源码 |
| 依据 | 源码静态分析 + 设计讨论；参考 `tree` 组件身份匹配先例（`tree/tree-node.vue:143-146`、`tree/tree.js` `useKeyless`） |
| 修订 | 2026-10-12 审核反馈并入：补第二处门禁（§2、§4.3 第 1 项）、`group` prop 清理约束（§4.2 第 1 项）、匹配域不对称说明（§3.1）、`toRaw` import（§4.2 第 3 项）、§6 措辞与新增行、§7 断言 |

## 1. 目标

1. **`item.id` 从渲染门禁降为可选**：无 id 项可渲染、可点击（`itemClick` 正常发出）、可 hover 弹层、参与横向菜单溢出折叠测量。
2. **`activeItem` 支持 `Number | String | Object`**：id 按值匹配，对象按引用匹配（`toRaw` 归一，与 tree 组件 `activeNode` 同款语义）。
3. **仅收藏维持 id 强制**：星标按钮只对 `item.id != null` 的叶子显示。
4. 顺带清理：删 `menu-item.vue` 的 `:data-key` DOM 标记；滚动定位改查 `[active]` 属性。

## 2. 现状与问题

- **渲染门禁（两处同源，必须同批删除）**：
  - `menu-item.vue:80` `isInvalid = item.id == null && !item.isFavoriteGroup`，配合模板 `v-if`（第 3 行）与 dev 告警（114-120 行），无 id 项被整体丢弃；
  - `side-menu.vue:23` `(item.isFavoriteGroup || item.id != null) && item.items?.length && !isCollapsed` 是顶层组内联子面板的门禁。无 id 顶层组（带子项）即使行渲染，点击也只切换不可见展开态——只删前者得到「行可点、子项永不出现」的死行；只删后者则面板内子行仍被前者丢弃。
- **`data-key` 双消费者**：
  - `side-menu.vue:204` `scrollToKey` 用 `[data-key="..."]` 定位滚动目标；
  - `menu.vue:133-150` `measureRendered` 用 `el.dataset.key` 把行宽写入 `widthCache`（`Map<String(id), width>`），`computeCount`（161-163 行）按 `String(item.id)` 回查。
- **激活身份单域**：`activeItem` 模型类型 `[String, Number]`，`isActive`（`menu-item.vue:62-65`）、`walkTo`（`tree.js:4-15`）、`activePath`（`side-menu.vue:137-145` / `menu.vue:75-83`，`Set<id>`）全部按 id。
- **深层激活项滚动失效**：nav 内联行只有 level 0/1；level ≥2 的行在弹层里，而弹层 Teleport 到 `$mussel.rootElement`（`common/popup.js:61`），nav 内 `[data-key]` 查不到 → `scrollToKey` 静默返回。
- **内部键控方式混杂**：展开态 `WeakSet<对象>`（已是无 id 依赖）、宽度缓存 `Map<String(id)>`、滚动 `data-key` 属性。

## 3. 身份模型

### 3.1 双域谓词

「同一节点」判定：对象 target 按引用（`toRaw` 归一后），原始值 target（id）按值：

```js
// 语义与 tree/tree-node.vue:143-146 的 active 判定一致
sameItem(item, target) = toRaw(item) === toRaw(target) || (item.id != null && item.id === target)
```

- **匹配域不对称（有意）**：target 为对象时不回退 id 比较——两个「同 id 不同引用」的对象不判同节点（避免 JSON 往返拷贝被误判）；target 为原始值时 `toRaw(item) === target` 恒假，两域天然互斥。与 tree 一致（`tree/tree.js:84-87` 按 target 类型二选一）。
- 有 id 项：id 是可推导的键，无需任何存储结构；id 匹配可跨数据刷新存活（新对象、同 id → walkTo 按 id 重找路径）。
- 无 id 项：对象引用即身份（WeakSet/WeakMap 语义）。
- **toRaw 归一纪律**：仅消费方输入的比对对象需要归一（`activeItem` prop 可能是 reactive proxy）；组件内部流转的对象（`props.items` 一路传下来的引用）域内一致，无需归一。先例：`tree.js` `useKeyless` 的 `map.value.get(toRaw(node))`。

### 3.2 内部操作键控总表（改造后）

| 操作 | 键 | 现状 |
|---|---|---|
| 展开态 `expandedItems` | `WeakSet<对象>` | 已是（不变） |
| 宽度缓存 `widthCache` | `WeakMap<对象, width>` | `Map<String(id)>` → 改 |
| 行绑定 `rowMap` | `WeakMap<el, 对象>` | `data-key` 属性 → 改 |
| activePath | `WeakSet<祖先对象>` | `Set<id>` → 改 |
| 滚动定位 | DOM `[active]` 属性 | `[data-key]` → 改 |
| `isActive` / `walkTo` | 双域谓词 | 单域 id → 改 |

没有任何一处需要「统一 key 域」才能完成——这是否决内部 key 注册表的核心论据（见 §5.1）。

## 4. 技术方案

### 4.1 `tree.js`：`walkTo` 双域匹配

```js
import { toRaw } from 'vue'

// 树根到目标项的路径（含目标，沿分组深入）；
// target 为对象按引用匹配（toRaw 归一），为 id 按值匹配，未命中为空数组
export function walkTo (target, items) {
  for (const item of items || []) {
    if (
      toRaw(item) === toRaw(target) ||
      (item.id != null && item.id === target)
    ) return [item]

    if (item.items?.length) {
      const sub = walkTo(target, item.items)
      if (sub.length) return [item, ...sub]
    }
  }

  return []
}
```

- `item === target` 在 target 为原始值（id）时恒 false，`item.id === target` 在 target 为对象时恒 false，两域天然互斥。
- `item.id != null` 守卫防 `undefined === undefined` 误命中。

### 4.2 `menu-item.vue`

1. **删 `:data-key`**（模板第 5 行）——两个消费者分别由 §4.3、§4.4 接管。删后 `group` prop（45 行声明，唯一消费点即第 5 行）失去用途：与两处父级绑定 `side-menu.vue:31 :group="item"`、`popup-menu.vue:18 :group="group"` 一并删除，**三者必须同批**——只删 prop 声明而留下绑定，`group` 会透传成根 div 的属性（值 `[object Object]`），命中 `menu-item.scss:43 &[group] { background: none }`（同特异性、书写在 `&[active]` 之后），把全部行的激活底色抹掉。注意与根 div 自身第 8 行 `:group="isGroup || null"`（样式用同名属性）不是一回事，后者保留。
2. **删 `isInvalid`**：computed（80 行）、模板 `v-if`（第 3 行）、dev 告警（114-120 行）、`isDev` import 一并删除。
3. **`isActive` 双域**（62-65 行）；`import`（36 行）补 `toRaw`：

```js
const isActive = computed(() => {
  const active = activeItem.value

  return (!isGroup.value && (
    toRaw(props.item) === toRaw(active) ||
    (props.item.id != null && props.item.id === active)
  )) || activePath.value.has(props.item)
})
```

   `item.id != null` 守卫是本方案最大的坑：现状 `item.id === activeItem.value` 在两者都 undefined 时恒真——删掉渲染门禁后**所有无 id 叶子全亮**。
4. **`activePath.has(props.item)`**：配合 §4.3/§4.4 的 WeakSet 化，由 id 成员检查改对象成员检查。
5. **`showFavoriteBtn` 加 `props.item.id != null`**（83-86 行）：否则无 id 行星标可点，`toggleFavorited` 会把 `undefined` 混进 favorites 数组。

### 4.3 `side-menu.vue`

1. **删顶层组面板门禁**（模板 23 行）：`(item.isFavoriteGroup || item.id != null) && item.items?.length && !isCollapsed` → `item.items?.length && !isCollapsed`。与 §4.2 第 2 项（menu-item 门禁）同源，必须同批删除（见 §2）；`item.isFavoriteGroup ||` 前缀随之冗余（面板本就要求 `items?.length`），一并去掉。
2. **`scrollToKey` → `scrollToActive`**（201-210 行）：

```js
// 「最后一个 active 行」= 最深可见激活链末端：level 0/1 激活叶子为其自身，
// level ≥2 激活项为其最深可见祖先（内联组头）。DOM 顺序约定：收藏组渲染在
// topItems 最前，其副本行非 last，命中恒为原始位置
function scrollToActive () {
  const el = [...rootEl.value?.querySelectorAll('.mu-menu-item[active]') ?? []]
    .at(-1)

  if (!el?.getBoundingClientRect().height) return

  if (el.scrollIntoViewIfNeeded) el.scrollIntoViewIfNeeded()
  else el.scrollIntoView({ block: 'nearest' })
}
```

   `syncActive` 内 `scrollToKey(activeItem.value)` 调用点（228 行）同步改为 `scrollToActive()`；`key == null` 早退由空列表自然替代。`CSS.escape` 使用随旧实现一并消失。
3. **`activePath` 改 WeakSet**（136-145 行）：

```js
const activePath = computed(() => {
  if (activeItem.value == null) return new WeakSet()

  const path = walkTo(activeItem.value, props.items)

  return path.at(-1)?.items?.length
    ? new WeakSet()
    : new WeakSet(path.slice(0, -1))
})
```

   组激活目标（`path.at(-1)` 有子项）维持空集语义不变。成员为 walkTo 路径上的真实对象，menu-item 侧拿到的 `props.item` 是同一批引用，域内一致无需 toRaw。
4. **`activeItem` 模型类型扩展**（73 行）：`[String, Number, Object]`。
5. **点击赋值**（`onItemClick`，167 行）：`activeItem.value = item.id ?? item`——有 id 回填 id（可序列化、跨刷新存活，向后兼容），无 id 回填对象引用。

### 4.4 `menu.vue`

1. **双 WeakMap 替代 `data-key` 宽度关联**：

```js
// 渲染期绑定：行元素 → item 对象（函数 ref 闭包配对，重排重放仍正确；
// 卸载回调 instance 为 null，WeakMap 条目随 GC 自回收免清理）
const rowMap = new WeakMap()

function onRowRef (instance, item) {
  if (instance?.$el) rowMap.set(instance.$el, item)
}
```

```html
<menu-item
  v-for="(item, index) in visibleItems"
  :key="item.id ?? index"
  :ref="el => onRowRef(el, item)"
  ... />
```

```js
// 宽度缓存：item 对象 → 宽度。折叠行 el 已卸载，宽度靠对象键存续
const widthCache = new WeakMap()

function measureRendered () {
  let drifted = false

  for (const el of barEl.value.children) {
    const item = rowMap.get(el)
    if (!item) continue // more 触发器等非行元素，自然跳过

    const width = el.getBoundingClientRect().width
    const cached = widthCache.get(item)

    if (cached != null && Math.abs(cached - width) > 0.5) drifted = true

    widthCache.set(item, width)
  }

  return drifted
}
```

   - `computeCount`（161-163 行）：`widthCache.get(item)`，删 `String()` 转换与 `item.id == null ? 0` 守卫。守卫删除的前提正是 §4.2 的门禁删除——无 id 项现在会渲染、可测量；若只删守卫不删门禁（或反之）都会错位。
   - `watch(() => props.items)`（259-262 行）：删 `widthCache.clear()`（WeakMap 无 clear，且旧对象条目随 GC 自回收），保留 `fullMeasure()`。
   - **为什么是两张表**：`rowMap` 解决「行 → 对象」关联（渲染期绑定），`widthCache` 解决「对象 → 宽度」存续（折叠行 el 不在）。单表 `WeakMap<el, ...>` 会让折叠行宽度随 el 卸载丢失，而 `computeCount` 恰要查折叠行。
2. **`activePath` 改 WeakSet**（74-83 行）：同 §4.3。
3. **`activeItem` 模型类型扩展**（57 行）与**点击赋值**（255 行）：同 §4.3。

### 4.5 不改项

- 展开态 `expandedItems` WeakSet、弹层链（el 锚定）、`overflowActive`（`walkTo` 双域化后对象 key 自然可用）、`syncActive`/`resetItemsStatus` 路径逻辑、v-for `:key="item.id ?? index"`（index 兜底；无 id 行重排时实例复用，`menu-item` 近乎无状态——label 溢出 hover 时复测——可接受）。

## 5. 备选方案与不采纳理由

### 5.1 内部 key 注册表（曾评估）

初始化/items 变化时为每项生成内部 key，`WeakMap<item, key>` 维护，id 相同或引用相同视为同节点不重复生成，内部操作全按 key。**不采纳**：

1. **不增值**：有 id 项的 key 由 id 派生（可推导，无需存储）；无 id 项的 key 是挂在对象上的计数器——功能上完全等价于直接拿对象当键。§3.2 表中没有任何操作需要统一 key 域。
2. **时序缺陷**：`watch(() => props.items)` 只响应数组身份变化，原地 `push/splice` 不触发，初始化式生成不完整；改惰性 on-miss 生成才正确，那初始化遍历就冗余了。
3. **代理坑没省**：WeakMap/WeakSet 区分 reactive proxy 与 raw，注册表照样要 `toRaw` 归一，纪律与双域匹配完全相同。
4. 多出 `keyOf` 间接层 + 两张查找结构（id→key Map + 对象→key WeakMap）+ 外部不可读的合成键，调试更难。

另：tree 组件实际没有「生成内部 key」的实现，其做法正是本方案采用的「双域匹配 + toRaw」+「keyless WeakMap」（`tree/tree-node.vue:143-146`、`tree/tree.js:34-54`）。

### 5.2 `activeItem` 彻底对象化（Level 2）

模型只收对象、全链引用匹配。**不采纳**：API 破坏性；数据重建（新对象）后激活态丢失且无法外部补偿（id 才能跨刷新锚定）；收藏无法序列化持久化。双域方案保留了 id 域的全部兼容性，对象域按需取用。

### 5.3 `measureRendered` 位置配对

`visibleItems` 过滤 invalid 后按 index 对齐 `barEl.children[i]`。**不采纳**：引入「`__bar` 内只能按序渲染行」的隐性约定，插入任何非行元素（分隔线/装饰）即错位；函数 ref 闭包配对无此假设，且 `rowMap.get` 不到即跳过，与现状 `data-key == null → continue` 的免疫性等价。

## 6. 行为变化清单（对外）

| 场景 | 现状 | 改后 |
|---|---|---|
| 无 id 项 | 不渲染（dev 告警） | 渲染、可点击、可 hover 弹层、参与折叠；不可被 id 激活（点击与对象 v-model 均可激活），不可收藏（无星标） |
| 无 id 顶层组（带子项） | 行不渲染，子面板被 `side-menu.vue:23` 门禁拦死 | 行渲染、可展开、level 1 子项可见可点 |
| `v-model:active-item` 传对象 | 不匹配 | 引用匹配（toRaw 归一），可激活任意项（含无 id） |
| 点击回填 | 恒 `item.id` | `item.id ?? item`（有 id 行为不变） |
| level ≥2 激活项滚动 | 不滚（nav 内查不到 data-key） | 滚到最深可见祖先（内联组头行） |
| rail 折叠态激活滚动 | 不滚 | 滚到激活 top 行图标 |
| 收藏副本与滚动 | data-key 为 null 不命中 | `[active]` 双命中但非 last，命中恒为原位置（依赖收藏组渲染在前的 DOM 顺序约定，见 §4.3 注释） |
| 数据刷新（新对象同 id） | id 激活存活 | 不变（id 域）；**对象激活丢失，需消费方重设——对象激活的语义边界，文档须写明** |
| 弹层内行的激活高亮 | 按 id | 双域（对象激活的弹层行也高亮，顺带收益） |

同 id 双对象（数据错误）：id 域命中 walkTo 顺序第一个，与现状 `querySelector` 首个命中等价，不劣化。

## 7. 验证断言

demo 补充（`demo/src/side-menu/`、`demo/src/menu/`）：

1. **渲染门禁删除（两处）**：含无 id 叶子 + 无 id 组（带子项）的数据，行均渲染；无 id 顶层组点击可展开、level 1 子项可见（§4.3 第 1 项）；点击无 id 叶子 `itemClick` 触发、无崩溃。
2. **对象激活**：`activeItem` 绑对象 → 目标行 `[active]`、祖先组头 `[active]`；弹层内（level 2）该行也高亮。
3. **id 激活回归**：既有 id 用法（受控/非受控、auto-expand、accordion、滚动定位）全部不变。
4. **undefined 全亮坑**：不设 activeItem 时无 id 叶子不亮。
5. **收藏守卫**：无 id 行无星标；有 id 行收藏/取消正常，favorites 数组无 undefined。
6. **横向折叠**：含无 id 项的 items 折叠数计算正确（缩小视口触发 more），more 面板内无 id 行可用。
7. **滚动**：深层激活项滚到最深可见组头；rail 态滚到激活 top 行；激活项同时被收藏时落点为原始行/最深内联祖先而非收藏副本（`.at(-1)` 顺序约定的兜底；demo 用例 4 的 `active4='report-weekly'` + `favorites4` 天然覆盖「深层 + 收藏」场景）。

## 8. 实施顺序

1. `tree.js` walkTo 双域 + toRaw
2. `menu-item.vue`：删 `:data-key`（含 `group` prop 与 `side-menu`/`popup-menu` 两处父绑定，三者同批）、删 `isInvalid`/告警、`isActive` 双域（补 `toRaw` import）、`activePath.has(item)`、星标 id 守卫
3. `side-menu.vue`：删顶层组面板门禁（23 行，与步骤 2 同批）、`scrollToActive`、activePath WeakSet、模型类型、点击赋值
4. `menu.vue`：rowMap/widthCache 双 WeakMap、activePath WeakSet、模型类型、点击赋值
5. demo 用例 + playwright 按 §7 断言验证
6. 文档三处同步（实施确认后）
