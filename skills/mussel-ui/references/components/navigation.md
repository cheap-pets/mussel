# 导航与菜单组件 API

### MuSideMenu

侧边导航菜单，数据驱动（`items` 树形数组）。一级组内联展开/收起，二级及以下 hover 弹层级联下钻；`rail` 或 `collapsed` 收起态下全部层级改为弹层（面板带组标题栏）。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `items` | Array | `[]` | 菜单项树，结构见「menu items 数据结构」 |
| `rail` | Boolean | — | 图标列模式（恒收起，`collapsed` 失效） |
| `collapsed` | Boolean | — | 双向绑定收起态 |
| `active-item` | Object | — | 双向绑定激活项（传项对象：有 id 按 id 匹配、可跨数据刷新存活，无 id 按对象引用匹配；组对象与未命中项被忽略） |
| `favorites` | Array | — | 双向绑定收藏项 id 列表。**收藏功能默认开启**（未绑定时非受控内部维护）；无 id 项不出星标 |
| `accordion` | Boolean | — | 展开组时互斥收起同级组（含收藏内置组） |
| `auto-expand-top` | Boolean | — | 挂载及 `items` 变更时展开全部一级组 |
| `disabled` | Boolean | — | 整树禁用 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `item-click` | `item` | 任意项点击（组与叶子均触发）；叶子点击同时设置激活并收起弹层，一级组点击切换展开 |
| `favorite-toggle` | `item, favorited` | 星标切换 |

| 插槽 | 说明 |
|------|------|
| `header` | 头部区域，作用域参数 `collapsed` |
| `footer` | 底部区域，作用域参数 `collapsed`；仅非收起态渲染 |

> `active-item` 变更时自动展开所属一级组并滚动定位到激活行。收藏内置组（「我的收藏」，star 图标）固定出现在顶部，组内为收藏的叶子项。

```html
<mu-side-menu
  v-model:active-item="active"
  v-model:collapsed="collapsed"
  v-model:favorites="favorites"
  accordion
  style="height: 420px"
  :items="[
    { id: 'home', icon: 'grid', label: '首页' },
    { id: 'group', icon: 'folder', label: '项目管理', items: [
      { id: 'list', icon: 'file', label: '项目列表' }
    ] }
  ]"
  @item-click="onItemClick" />
```

> 组件自身不定高（宽度由 `--mu-side-menu_width` / `--mu-side-menu_collapsed-width` 控制为 240px / 40px）；高度由外层决定（flex 拉伸或显式 `height`），菜单体占余高内部滚动。

---

### MuMenu

横向导航菜单（顶部栏场景）。一级项放不下时自动折叠进末尾「更多」触发器（`dots` 图标）；组行按 `expand-trigger` 弹出下级面板，深层级联向右下钻；激活项落在被折叠子树内时「更多」触发器高亮。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `items` | Array | `[]` | 同 MuSideMenu |
| `active-item` | Object | — | 双向绑定激活项（匹配规则同 MuSideMenu） |
| `expand-trigger` | String | `click` | 组行展开触发：`click` \| `hover` |
| `expand-icon` | Boolean | `true` | 一级行是否显示展开箭头 |
| `disabled` | Boolean | — | 整树禁用 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `item-click` | `item` | 任意项点击（组与叶子均触发）；叶子点击同时设置激活并收起弹层 |

---

### menu items 数据结构

MuSideMenu / MuMenu 共用：

```javascript
{
  id: 'list',          // 可选；收藏、跨数据刷新的激活匹配依赖 id
  icon: 'file',        // 可选，图标名
  label: '项目列表',    // 文字
  disabled: false,     // 可选
  items: [ /* 子项，递归 */ ]  // 有 items 即为组
}
```

> 组件级 CSS 变量：侧栏宽度 `.mu-side-menu` 上 `--mu-side-menu_width` / `--mu-side-menu_collapsed-width`；行尺寸 `.mu-menu-item` 上 `--mu-menu-item_height` / `--mu-menu-item_indent` / `--mu-menu-item_gap`；弹层宽度上下限 `.mu-popup-menu` 上 `--mu-side-menu_popup-min-width` / `--mu-side-menu_popup-max-width`。均可按容器覆盖。

---

### MuDropdownPanel

独立下拉面板，作为容器使用，自行管理触发器。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `width` / `height` | String | — | 面板尺寸 |
| `trigger` | String | `click` | 触发方式：`click` \| `hover` |
| `dropdown-items` | Array | — | 列表项数据，结构见「dropdown-items 数据结构」 |
| `scrollbar` | Boolean | — | 是否渲染 Mussel 滚动条 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `show` / `hide` | — | 面板显示/隐藏 |
| `action` | `action` | 含 action 的下拉项点击 |
| `itemclick` | `item` | 任意下拉项点击 |

| 方法 / 状态 | 说明 |
|------|------|
| `show({ anchor, width, height, trigger })` | 程序控制显示。**必须传 `anchor`**（锚点元素，用于定位；无参调用会抛错），`width`/`height`/`trigger` 可选覆盖 |
| `hide()` | 程序控制隐藏 |
| `delayHide()` | 延迟隐藏（供 hover 场景手动调用，给鼠标移向面板留出时间） |
| `updatePosition()` | 重新计算并更新面板位置（锚点尺寸/位置变化后调用） |
| `visible` | 当前显示状态（ref） |

| 插槽 | 说明 |
|------|------|
| `default` | 完全自定义面板内容（仅当需要非列表型内容时使用），提供时不再渲染 `dropdown-items` 列表，`header` / `footer` 插槽同样不渲染 |
| `items` | 自定义列表项，渲染于面板内置滚动容器内（限高 `--mu-list-item-height` × 8）；**自定义项内容时优先使用** |
| `header` / `footer` | 面板顶部 / 底部区域，仅 items 模式渲染 |

> 弹出位置自动计算，暂不支持手动指定。

---

### MuDropdownButton

带下拉菜单的按钮，支持分割形式。自身仅定义 `icon`/`caption`/`splitButton` 三个 prop，其他 MuButton 属性（如 `color`、`button-style`、`size`、`disabled`）通过 `$attrs` 透传，下拉能力（`dropdown-items`/`dropdown-trigger` 等）继承自 MuDropdown。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标 |
| `caption` | String | 按钮文字 |
| `split-button` | Boolean | 是否分割按钮形式 |
| (透传) | — | MuButton 属性（`color`、`button-style`、`size` 等）+ MuDropdown 属性 |

```html
<mu-dropdown-button
  caption="新建"
  color="primary"
  split-button
  :dropdown-items="[
    { label: '从模板创建', action: 'from-template' },
    { label: '导入文件',   action: 'import' }
  ]"
  @click="onCreate"
  @action="onDropdownAction"
/>
```

| 插槽 | 说明 |
|------|------|
| `default` | 覆盖按钮内容（缺省渲染 icon + caption） |
| `dropdown-header` / `dropdown-footer` | 下拉面板顶部 / 底部区域，仅 items 模式渲染 |
| `dropdown-items` | 自定义下拉项，渲染于面板内置滚动容器内；**自定义菜单项时优先使用** |
| `dropdown` | 完全自定义下拉面板整体内容（仅当需要非选项型内容时使用），此模式下 `dropdown-header` / `dropdown-footer` 不渲染；与 `dropdown-items` 插槽同时提供时优先渲染 `dropdown-items` |

---

### MuDropdown

下拉能力包裹组件（非 Mixin），为触发器元素附加下拉，属性均以 `dropdown-` 为前缀。

| 属性 | 类型 | 说明 |
|------|------|------|
| `dropdown-items` | Array | 下拉项列表，结构见「dropdown-items 数据结构」 |
| `dropdown-width` / `dropdown-height` | String | 面板尺寸；`dropdown-width: 'anchor'` 表示与锚点元素同宽（MuSelect 默认即此值） |
| `dropdown-trigger` | String | mu-dropdown 默认 `hover`（mu-dropdown-button 默认 `click`） |
| `dropdown-icon` | Boolean\|String | 下拉箭头图标；mu-dropdown **默认不显示**箭头（未设置），mu-dropdown-button 默认显示下箭头（`'dropdownExpand'`）；传图标名自定义 |
| `dropdown-disabled` | Boolean | 禁用下拉 |
| `dropdown-anchor` | — | 面板锚点目标，默认组件根元素；特殊值 `'$parent'` 指向父节点元素 |
| `dropdown-class` | String | 面板附加 class |
| `dropdown-style` | String\|Object | 面板附加 style |
| `dropdown-scrollbar` | Boolean | 面板是否渲染 Mussel 滚动条；仅当使用 `#dropdown` 插槽时生效，items 模式下由面板内置滚动容器接管 |
| `dropdown-panel` | Object | 复用外部已有的 `MuDropdownPanel` 实例（传入组件实例），传入后不再渲染内部面板 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | `action` | 含 action 的下拉项点击 |
| `dropdown:itemclick` | `item` | 下拉项点击 |
| `dropdown:show` / `dropdown:hide` | — | 面板显示/隐藏 |

| 插槽 | 说明 |
|------|------|
| `default` | 触发器内容，包裹任意元素作为下拉锚点 |
| `dropdown-header` / `dropdown-footer` | 下拉面板顶部 / 底部区域，仅 items 模式渲染 |
| `dropdown-items` | 自定义下拉项，渲染于面板内置滚动容器内；**自定义菜单项时优先使用** |
| `dropdown` | 完全自定义下拉面板整体内容（仅当需要非选项型内容时使用，如嵌入树、表格），此模式下 `dropdown-header` / `dropdown-footer` 不渲染；与 `dropdown-items` 插槽同时提供时优先渲染 `dropdown-items` |

```html
<!-- 触发器 + 自定义菜单项（优先 #dropdown-items，享受内置滚动容器） -->
<mu-dropdown>
  <mu-icon-button icon="more" />
  <template #dropdown-items>
    <mu-dropdown-item label="编辑" icon="edit" action="edit" />
    <mu-dropdown-item label="删除" icon="delete" action="delete" />
  </template>
</mu-dropdown>
```

---

### dropdown-items 数据结构

`dropdown-items`（MuDropdownPanel / MuDropdown / MuDropdownButton）与 `menus`（MuContextMenu）共用的下拉项数组定义：

```javascript
[
  { label: '编辑', icon: 'edit', action: 'edit' },
  { label: '删除', icon: 'delete', action: 'delete' },
  { is: '-' },  // 分隔线
  { is: 'check', label: '全选', value: 'all' },  // 简写，等价 is: 'mu-dropdown-check-item'
  { label: '导出', disabled: true }
]
```

- 对象项的各字段即项组件的 prop（默认 `MuDropdownItem`，即下方三个 Dropdown Item 组件），透传给渲染出的项组件
- `is`：覆写默认项组件，支持简写：`'-'`（分隔线）、`'item'`、`'check'`（勾选项）、`'radio'`（单选项）；也可写完整组件名（如 `{ is: 'mu-dropdown-check-item', value: 'x' }`）
- `'-'`：纯字符串项的分隔线快捷方式，其余纯字符串项视为 `{ label: 字符串 }`

---

### MuDropdownItem

下拉面板内的基础菜单项，即上方 `dropdown-items` 数组对应的组件形式。点击后自动收起面板；若设置了 `action`，面板会额外向上触发 `action` 事件。既可走数据驱动（`dropdown-items`），也可在 `#dropdown-items` 插槽中手写（优先）；`#dropdown` 插槽仅用于完全接管面板的场景。

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | String | 项文字 |
| `icon` | String | 前置图标 |
| `action` | — | 点击触发的动作标识，由父级面板向上 emit `action` |
| `disabled` | Boolean | 是否禁用 |

```html
<!-- 数据写法 -->
:dropdown-items="[{ label: '编辑', icon: 'edit', action: 'edit' }]"
<!-- 插槽写法（等价） -->
<mu-dropdown-item label="编辑" icon="edit" action="edit" />
```

---

### MuDropdownCheckItem

带勾选框的下拉项，用于多选场景。

| 属性 | 类型 | 说明 |
|------|------|------|
| `v-model` | Boolean \| Array | 选中状态；多选时绑定数组（结合 `value` 标识当前项） |
| `value` | — | 当前项标识，多选模式下被收集进 `v-model` 数组 |
| `label` | String | 项文字；未设置时回退显示 `value` |
| `icon` | String | 前置图标 |
| `action` | — | 点击触发的动作标识 |
| `disabled` | Boolean | 是否禁用 |

```html
<!-- 多选：用数组收集各勾选项的 value -->
<mu-dropdown-check-item v-model="checked" value="apple" label="苹果" />
<mu-dropdown-check-item v-model="checked" value="banana" label="香蕉" />
```

---

### MuDropdownRadioItem

带单选框的下拉项，用于多选一场景。

| 属性 | 类型 | 说明 |
|------|------|------|
| `v-model` | — | 当前选中值，与被选中项的 `value` 匹配 |
| `value` | — | 当前项标识，**必填** |
| `label` | String | 项文字；未设置时回退显示 `value` |
| `icon` | String | 前置图标 |
| `action` | — | 点击触发的动作标识 |
| `disabled` | Boolean | 是否禁用 |

```html
<mu-dropdown-radio-item v-model="picked" value="a" label="选项 A" />
<mu-dropdown-radio-item v-model="picked" value="b" label="选项 B" />
```

---

### MuContextMenu

右键上下文菜单。

| 属性 | 类型 | 说明 |
|------|------|------|
| `menus` | Array | 菜单项列表，结构见「dropdown-items 数据结构」 |

事件（`show` / `hide` / `action` / `itemclick`）与 `hide` / `visible` 同 `MuDropdownPanel`；差异：`show(event)` 接收 `contextmenu` 事件对象，按 `pageX`/`pageY` 定位并阻止默认菜单（非 MuDropdownPanel 的 `{ anchor }` 形式）。仅 `default` 插槽（自定义菜单内容，缺省渲染 `menus`）；不支持 `header` / `items` / `footer`。

```html
<template>
  <mu-context-menu ref="ctxMenu" :menus="menuItems" @action="onAction" />
  <div @contextmenu.prevent="ctxMenu.show($event)">右键此区域</div>
</template>

<script setup>
const ctxMenu = shallowRef()
</script>
```
