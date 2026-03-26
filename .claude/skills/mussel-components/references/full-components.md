# Mussel 4 完整组件参考

本文档包含 Mussel 4 所有组件的详细 API 说明。

---

## 目录

- [导航组件](#导航组件)
  - [MuDropdownPanel](#MuDropdownPanel)
  - [MuDropdown](#MuDropdown)
  - [MuDropdownButton](#MuDropdownButton)
  - [MuContextMenu](#MuContextMenu)
- [数据展示组件](#数据展示组件)
  - [MuList](#MuList)
  - [MuListItem](#MuListItem)
  - [MuListDivider](#MuListDivider)
  - [MuTree](#MuTree)
  - [MuTags](#MuTags)
  - [MuCalendar](#MuCalendar)
- [高级布局组件](#高级布局组件)
  - [MuFlexSplitter](#MuFlexSplitter)
  - [MuScrollBox](#MuScrollBox)
- [其他组件](#其他组件)
  - [MuIcon](#MuIcon)
  - [MuSvgStripe](#MuSvgStripe)
  - [MuBadge](#MuBadge)
  - [MuToolbar](#MuToolbar)
  - [MuStatusBox](#MuStatusBox)

---

## 导航组件

### MuDropdownPanel

下拉面板，可独立使用或作为其他组件的下拉内容。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `width` | String | 面板宽度 |
| `height` | String | 面板高度 |
| `scrollbar` | Boolean | 是否渲染 mussel 滚动条 |
| `trigger` | String | 触发方式：`hover` \| `click`，默认 `click` |
| `position` | String | 弹出位置：`auto` \| `fixed` \| `top` \| `bottom` |
| `dropdown-items` | Array | 列表项数据 |

**事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `show` | - | 面板弹出时 |
| `hide` | - | 面板关闭时 |
| `action` | action | 包含 action 的下拉项点击时 |
| `itemclick` | item | 下拉项点击时 |

**方法：**

| 方法 | 参数 | 说明 |
|------|------|------|
| `show()` | - | 弹出面板 |
| `hide()` | - | 关闭面板 |

**示例：**

```vue
<template>
  <mu-dropdown-panel
    ref="dropdown"
    :dropdown-items="items"
    @itemclick="handleItemClick"
  />
</template>

<script setup>
const items = [
  { label: '选项1', value: '1' },
  { label: '选项2', value: '2' }
]
</script>
```

---

### MuDropdown

下拉菜单，为按钮等元素添加下拉功能。

**属性（dropdown- 前缀）：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `dropdown-class` | String | 下拉面板 class |
| `dropdown-style` | Object | 下拉面板样式 |
| `dropdown-attrs` | Object | 下拉面板绑定属性 |
| `dropdown-panel` | Object | 指定外部下拉面板（用于复用） |
| `dropdown-width` | String | 下拉面板宽度 |
| `dropdown-height` | String | 下拉面板高度 |
| `dropdown-icon` | String | 下拉按钮图标，默认下箭头 |
| `dropdown-disabled` | Boolean | 下拉面板禁用状态 |
| `dropdown-scrollbar` | Boolean | 是否渲染 Mussel 滚动条 |
| `dropdown-items` | Array | 下拉项列表 |
| `dropdown-trigger` | String | 触发方式：`click` \| `hover` |
| `dropdown-position` | String | 位置：`auto` \| `fixed` \| `top` \| `bottom` |

**事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `dropdown:action` | action | 包含 action 的下拉项点击 |
| `dropdown:itemclick` | item | 下拉项点击 |
| `dropdown:show` | - | 下拉面板弹出 |
| `dropdown:hide` | - | 下拉面板关闭 |

**示例：**

```vue
<mu-button>
  操作
  <template #dropdown>
    <mu-dropdown :dropdown-items="items" />
  </template>
</mu-button>
```

---

### MuDropdownButton

带下拉菜单的按钮，支持分割按钮形式。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `split-button` | Boolean | 是否显示为分割按钮 |

**说明：** 继承所有 MuButton 和 MuDropdown 的属性（带 dropdown- 前缀）

**示例：**

```vue
<!-- 普通下拉按钮 -->
<mu-dropdown-button
  caption="操作"
  :dropdown-items="items"
/>

<!-- 分割按钮 -->
<mu-dropdown-button
  split-button
  caption="保存"
  :dropdown-items="saveOptions"
  @click="handleSave"
/>
```

---

### MuContextMenu

上下文菜单，右键触发。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `menus` | Array | 菜单项列表 |

**事件与方法：** 同 MuDropdownPanel

**示例：**

```vue
<template>
  <mu-context-menu ref="contextMenu" :menus="menus" @action="onAction" />
  <div @contextmenu.prevent="contextMenu.show">
    右键点击此区域
  </div>
</template>

<script setup>
import { shallowRef } from 'vue'

const contextMenu = shallowRef()

const menus = [
  { label: '复制', value: 'copy' },
  { label: '粘贴', value: 'paste' },
  { type: 'divider' },
  { label: '删除', value: 'delete', danger: true }
]

const onAction = (action) => {
  console.log('执行操作:', action)
}
</script>
```

---

## 数据展示组件

### MuList

列表容器。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `scrollbar` | Boolean | 是否显示滚动条 |
| `items` | Array | 列表项数据 |
| `itemClass` | String | 列表项 class |
| `itemTagName` | String | 列表项标签名，默认 `a`，可选 `a` \| `div` |

**事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `item-click` | item | 列表项点击时 |

---

### MuListItem

列表项。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 图标 |
| `label` | String | 标题 |
| `tag` | String | 渲染标签名，默认 `div`，可选 `a` \| `div` |

---

### MuListDivider

列表分隔项。

---

### MuTree

树形组件。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | Array | 树节点数据 |
| `props` | Object | 树节点数据属性定义 `{ label, children, key, ... }` |
| `buttons` | Array | 树节点工具按钮 |
| `checkbox` | Boolean | 是否显示节点勾选框 |
| `cascaded-check` | Boolean | 是否级联勾选 |
| `checked-nodes-keys` | Set | 已选节点唯一标识集合 |
| `auto-expand-level` | Number | 自动展开层级数 |
| `active-node` | Object/Number/String | 当前选中节点 |
| `node-icons` | Boolean/Object | 是否显示节点图标 & 自定义图标 |
| `expand-icons` | Boolean/Object | 是否显示展开状态图标 & 自定义展开图标 |

**事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-click` | node | 节点点击（不含展开按钮和工具按钮） |
| `node-expand` | node | 节点展开（可用于懒加载） |
| `node-collapse` | node | 节点收拢 |
| `node-button-click` | node, button | 节点工具按钮点击 |
| `node-check-change` | node, checked | 节点勾选状态改变 |

**插槽：**

| 插槽 | 说明 |
|------|------|
| `default` | 树节点模板，作用域参数 `node` |
| `buttons` | 树节点工具模板，作用域参数 `node` |

**示例：**

```vue
<template>
  <mu-tree
    :data="treeData"
    :props="{ label: 'name', children: 'children' }"
    checkbox
    cascaded-check
    v-model:checked-nodes-keys="checkedKeys"
    @node-click="handleNodeClick"
  />
</template>

<script setup>
import { ref } from 'vue'

const checkedKeys = ref(new Set())

const treeData = [
  {
    name: '父节点1',
    children: [
      { name: '子节点1-1' },
      { name: '子节点1-2' }
    ]
  }
]
</script>
```

---

### MuTags

标签组。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `tags` | Array | 标签数据 |
| `max` | Number | 最大显示标签个数 |
| `removable` | Boolean | 是否可删除 |
| `expandable` | Boolean | 是否可下拉展开显示所有 |
| `tooltip` | Boolean | 是否显示标题 tooltip，默认 `true` |
| `dropdown-snap-to` | - | 下拉面板吸附目标 |

**事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `tag-remove` | tag | 点击删除按钮时 |

---

### MuCalendar

月历。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `model-value` | Date/String/Object/Array | 双向绑定的日期值 |
| `format` | String | String 类型下的日期格式，默认 `yyyy-MM-dd` |
| `value-type` | String | 返回值类型：`date` \| `string` \| `object` |

---

## 高级布局组件

### MuFlexSplitter

Flex 布局子元素分隔条，可拖拽调整元素尺寸。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | String | 尺寸：`full`(默认) \| `slim`(细) \| `concealed`(隐蔽) |
| `shape` | String | 形状：`line`(线条) \| `bubble`(气泡) |
| `stripe` | Boolean | 是否显示装饰条纹（仅线条适用） |
| `space-free` | Boolean | 是否不占用父容器空间，默认 `false` |
| `collapse-button` | Boolean | 是否显示收拢按钮 |
| `collapse-threshold` | Number | 收拢尺寸阈值（px），默认 `200` |
| `resizable` | Boolean | 是否可拖拽调整，默认 `true` |

**说明：** 仅能用于 Flex 容器中

**示例：**

```vue
<div class="mu-h-box">
  <div style="width: 200px">左侧</div>
  <mu-flex-splitter shape="line" stripe />
  <div style="flex: 1">右侧</div>
</div>
```

---

### MuScrollBox

带非原生滚动条的容器。

**使用方式：**

```vue
<!-- 组件方式 -->
<mu-scroll-box>
  内容...
</mu-scroll-box>

<!-- 指令方式 -->
<div v-mu-scrollbar style="overflow: auto">
  内容...
</div>

<!-- 禁用滚动条 -->
<div v-mu-scrollbar="false" style="overflow: auto">
  内容...
</div>
```

**说明：** 由 `overflow` 样式控制滚动条显示

---

## 其他组件

### MuIcon

图标组件。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 已注册图标名 或 `.` 开头的 icon-font class |
| `tag` | String | 渲染的 tagName，默认 `span` |

**说明：** 图标需提前注册，见主文档"常见问题"部分

---

### MuSvgStripe

SVG 装饰条纹，常用于拖拽条等场景。

---

### MuBadge

徽章，用作标签或角标。

**示例：**

```vue
<mu-badge primary>{{ text }}</mu-badge>
<mu-badge accent>{{ text }}</mu-badge>
<mu-badge success>{{ text }}</mu-badge>
<mu-badge warning>{{ text }}</mu-badge>
<mu-badge danger>{{ text }}</mu-badge>
```

---

### MuToolbar

工具栏，特殊样式的 MuBar。

---

### MuStatusBox

状态显示面板。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 状态图标 |
| `title` | String | 状态标题 |
| `message` | String | 消息内容 |
| `width` | String/Number | 宽度 |
| `height` | String/Number | 高度 |

**插槽：**

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容 |
| `icon` | 自定义图标内容 |

---

## 组件事件命名规范

- 普通事件：使用小写连字符，如 `item-click`
- 命名空间事件：使用冒号分隔，如 `dropdown:show`
- v-model 事件：使用 `update:propName` 格式，如 `update:visible`
