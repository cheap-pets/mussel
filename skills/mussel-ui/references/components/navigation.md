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

**dropdown-items 结构：**
```javascript
[
  { caption: '编辑', icon: 'edit', action: 'edit' },
  { caption: '删除', icon: 'delete', action: 'delete', danger: true },
  { type: 'divider' },  // 分隔线
  { caption: '导出', disabled: true }
]
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
