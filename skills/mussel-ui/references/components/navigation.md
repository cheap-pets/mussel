# 导航与菜单组件 API

### MuDropdownPanel

独立下拉面板，作为容器使用，自行管理触发器。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `width` / `height` | String | — | 面板尺寸 |
| `trigger` | String | `click` | 触发方式：`click` \| `hover` |
| `position` | String | `auto` | 弹出位置：`auto` \| `fixed` \| `top` \| `bottom` |
| `dropdown-items` | Array | — | 列表项数据 |
| `scrollbar` | Boolean | — | 是否渲染 Mussel 滚动条 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `show` / `hide` | — | 面板显示/隐藏 |
| `action` | `action` | 含 action 的下拉项点击 |
| `itemclick` | `item` | 任意下拉项点击 |

| 方法 | 说明 |
|------|------|
| `show()` / `hide()` | 程序控制显示/隐藏 |

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

---

### MuDropdown

下拉菜单 Mixin，为触发器元素附加下拉能力，属性均以 `dropdown-` 为前缀。

| 属性 | 类型 | 说明 |
|------|------|------|
| `dropdown-items` | Array | 下拉项列表 |
| `dropdown-width` / `dropdown-height` | String | 面板尺寸；`dropdown-width: 'anchor'` 表示与锚点元素同宽（MuSelect 默认即此值） |
| `dropdown-trigger` | String | `hover`（默认）\| `click` |
| `dropdown-position` | String | `auto` \| `fixed` \| `top` \| `bottom` |
| `dropdown-icon` | String | 下拉箭头图标，默认下箭头 |
| `dropdown-disabled` | Boolean | 禁用下拉 |
| `dropdown-attrs` | Object | 透传给面板的额外属性 |
| `dropdown-anchor` | — | 面板锚点目标，默认组件根元素 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | `action` | 含 action 的下拉项点击 |
| `dropdown:itemclick` | `item` | 下拉项点击 |
| `dropdown:show` / `dropdown:hide` | — | 面板显示/隐藏 |

**dropdown-items 结构：**（每项对象的字段即下方三个 Dropdown Item 组件的 prop）
```javascript
[
  { label: '编辑', icon: 'edit', action: 'edit' },
  { label: '删除', icon: 'delete', action: 'delete' },
  { is: '-' },  // 分隔线
  { label: '导出', disabled: true }
]
```

---

### MuDropdownItem

下拉面板内的基础菜单项，即上方 `dropdown-items` 数组对应的组件形式。点击后自动收起面板；若设置了 `action`，面板会额外向上触发 `action` 事件。既可走数据驱动（`dropdown-items`），也可在 `#dropdown` 插槽中手写。

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
| `menus` | Array | 菜单项列表，结构同 `dropdown-items` |

事件与方法同 `MuDropdownPanel`。

```html
<template>
  <mu-context-menu ref="ctxMenu" :menus="menuItems" @action="onAction" />
  <div @contextmenu.prevent="ctxMenu.show($event)">右键此区域</div>
</template>

<script setup>
const ctxMenu = shallowRef()
</script>
```
