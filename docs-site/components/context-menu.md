<script setup>
  import { ref } from 'vue'

  const contextMenu = ref()

  const menus = [
    { is: '-', label: '文件' },
    { label: '打开', action: 'open' },
    { label: '下载', action: 'download' },
    '-',
    { label: '重命名', action: 'rename' },
    { label: '删除', icon: 'delete', action: 'delete' }
  ]

  function onContextMenu (event) {
    contextMenu.value.show(event)
  }

  function onAction (action) {
    console.log('menu action:', action)
  }
</script>

# 右键菜单 MuContextMenu

右键上下文菜单。事件与 `hide` / `visible` 同 [MuDropdownPanel](/components/dropdown-panel)；差异：`show(event)` 接收 `contextmenu` 事件对象，按 `pageX`/`pageY` 定位并阻止默认菜单。

`menus` 数据结构同 `dropdown-items`（见 [MuDropdownItem](/components/dropdown-item)）。

## 基础用法

```html
<template>
  <mu-context-menu ref="ctxMenu" :menus="menuItems" @action="onAction" />
  <div @contextmenu.prevent="ctxMenu.show($event)">右键此区域</div>
</template>

<script setup>
  import { ref } from 'vue'

  const ctxMenu = ref()
</script>
```

<div class="mu-demo" style="height: 140px; align-items: center; justify-content: center;">
  <mu-context-menu ref="contextMenu" :menus="menus" @action="onAction" />
  <span
    class="text-subtle cursor-pointer select-none"
    style="border: 1px dashed var(--mu-border-color-normal); border-radius: 8px; padding: 24px 56px;"
    @contextmenu.prevent="onContextMenu">
    右键此区域
  </span>
</div>

```html
<mu-context-menu ref="contextMenu" :menus="menus" @action="onAction" />
```

```javascript
const menus = [
  { is: '-', label: '文件' },
  { label: '打开', action: 'open' },
  '-',
  { label: '删除', icon: 'delete', action: 'delete' }
]

function onContextMenu (event) {
  contextMenu.value.show(event)
}
```

::: info
仅 `default` 插槽（自定义菜单内容，缺省渲染 `menus`）；不支持 `header` / `items` / `footer`。
:::

## 常见模式

表格行右键菜单——把行事件接到菜单：

```html
<mu-table :records="records" :columns="columns" @cell-click="..." />
<mu-context-menu ref="rowMenu" :menus="rowMenus" @action="onRowAction" />

<!-- 行模板内 -->
<div @contextmenu.prevent="rowMenu.show($event)">...</div>
```

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `menus` | Array | 菜单项列表，结构同 `dropdown-items` |

| 事件 | 参数 | 说明 |
|------|------|------|
| `show` / `hide` | — | 菜单显示/隐藏 |
| `action` | `action` | 含 action 的菜单项点击 |
| `itemclick` | `item` | 任意菜单项点击 |

| 方法 / 状态 | 说明 |
|------|------|
| `show(event)` | 接收 `contextmenu` 事件对象，按 `pageX`/`pageY` 定位并阻止默认菜单 |
| `hide()` | 隐藏菜单 |
| `visible` | 当前显示状态 |
