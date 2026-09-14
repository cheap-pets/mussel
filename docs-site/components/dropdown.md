# 下拉 MuDropdown

下拉能力包裹组件（非 Mixin），为默认插槽内的触发器元素附加下拉面板，属性均以 `dropdown-` 为前缀。适合任意自定义触发器的场景；标准化按钮触发器可用 [MuDropdownButton](/components/dropdown-button)。

mu-dropdown 默认 **hover 触发、不显示箭头**；弹出位置自动计算（锚点下方优先、视口空间不足时翻转，横向自动避让溢出）。

## 基础用法

数据驱动（`dropdown-items`）或插槽写法（`#dropdown-items`）：

<div class="mu-demo">
  <mu-dropdown :dropdown-items="menuItems" @action="onAction">
    <mu-button>Hover Me</mu-button>
  </mu-dropdown>
  <mu-dropdown dropdown-trigger="click" :dropdown-items="menuItems" @action="onAction">
    <mu-button>Click Me</mu-button>
  </mu-dropdown>
  <mu-dropdown>
    <mu-icon-button icon="more" />
    <template #dropdown-items>
      <mu-dropdown-item label="编辑" icon="edit" action="edit" />
      <mu-dropdown-item label="删除" icon="delete" action="delete" />
    </template>
  </mu-dropdown>
</div>

```html
<!-- 数据驱动 -->
<mu-dropdown :dropdown-items="items" @action="onAction">
  <mu-button>Actions</mu-button>
</mu-dropdown>

<!-- 插槽写法（自定义菜单项优先 #dropdown-items，享受内置滚动容器） -->
<mu-dropdown>
  <mu-icon-button icon="more" />
  <template #dropdown-items>
    <mu-dropdown-item label="编辑" icon="edit" action="edit" />
    <mu-dropdown-item label="删除" icon="delete" action="delete" />
  </template>
</mu-dropdown>
```

## 触发方式 `dropdown-trigger`

`hover`（默认）/ `click`：

```html
<mu-dropdown dropdown-trigger="click" :dropdown-items="items">
  <mu-button>Click</mu-button>
</mu-dropdown>
```

## 箭头图标 `dropdown-icon`

mu-dropdown 默认不显示箭头；传 `true` 显示默认下箭头（`dropdownExpand`），传图标名自定义：

```html
<mu-dropdown dropdown-icon :dropdown-items="items">
  <mu-button>带箭头</mu-button>
</mu-dropdown>

<mu-dropdown dropdown-icon="folder" :dropdown-items="items">
  <mu-button>自定义箭头</mu-button>
</mu-dropdown>
```

## 面板尺寸与样式

`dropdown-width` / `dropdown-height` 控制面板尺寸；`dropdown-width: 'anchor'` 表示与锚点同宽（MuSelect 默认即此值）；`dropdown-class` / `dropdown-style` 附加样式：

```html
<mu-dropdown dropdown-width="300px" dropdown-class="my-panel" :dropdown-items="items">
  <mu-button>面板 300px</mu-button>
</mu-dropdown>
```

## 复用外部面板 `dropdown-panel`

传入已有的 `MuDropdownPanel` 实例，复用同一面板（多个触发器共享一个面板，如树节点操作菜单）：

```html
<mu-dropdown-panel ref="sharedPanel" :dropdown-items="menus" />

<mu-dropdown :dropdown-panel="sharedPanel">
  <mu-icon icon="dots" />
</mu-dropdown>
```

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 触发器内容，包裹任意元素作为下拉锚点 |
| `dropdown-header` / `dropdown-footer` | 下拉面板顶部 / 底部区域，仅 items 模式渲染 |
| `dropdown-items` | 自定义下拉项，渲染于面板内置滚动容器内；**自定义菜单项时优先使用** |
| `dropdown` | 完全自定义下拉面板整体内容（仅当需要非选项型内容时使用，如嵌入树、表格）；此模式下 `dropdown-header` / `dropdown-footer` 不渲染；与 `dropdown-items` 插槽同时提供时优先渲染 `dropdown-items` |

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `dropdown-items` | Array | 下拉项列表，结构见 [MuDropdownItem](/components/dropdown-item) |
| `dropdown-width` / `dropdown-height` | String | 面板尺寸；`dropdown-width: 'anchor'` 表示与锚点元素同宽 |
| `dropdown-trigger` | String | mu-dropdown 默认 `hover`（mu-dropdown-button 默认 `click`） |
| `dropdown-icon` | Boolean\|String | 下拉箭头图标；mu-dropdown 默认不显示，mu-dropdown-button 默认显示下箭头 |
| `dropdown-disabled` | Boolean | 禁用下拉 |
| `dropdown-anchor` | — | 面板锚点目标，默认组件根元素；特殊值 `'$parent'` 指向父节点元素 |
| `dropdown-class` / `dropdown-style` | String\|Object | 面板附加 class / style |
| `dropdown-scrollbar` | Boolean | 面板是否渲染 Mussel 滚动条；仅当使用 `#dropdown` 插槽时生效 |
| `dropdown-panel` | Object | 复用外部已有的 `MuDropdownPanel` 实例（传入组件实例），传入后不再渲染内部面板 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | `action` | 含 action 的下拉项点击 |
| `dropdown:itemclick` | `item` | 下拉项点击 |
| `dropdown:show` / `dropdown:hide` | — | 面板显示/隐藏 |
