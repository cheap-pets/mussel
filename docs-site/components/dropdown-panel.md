<script setup>
  import { ref } from 'vue'

  const panelRef = ref()
  const anchorRef = ref()

  function showPanel () {
    panelRef.value?.show({ anchor: anchorRef.value })
  }

  function hidePanel () {
    panelRef.value?.hide()
  }
</script>

# 下拉面板 MuDropdownPanel

独立下拉面板，作为容器使用、自行管理触发器——区别于 [MuDropdown](/components/dropdown)（自动包裹触发器），适合程序化控制显隐、多个触发器共享一个面板的场景。

弹出位置恒为自动计算（锚点下方优先、视口空间不足时翻转到上方，横向自动避让溢出），暂不支持手动指定。

## 程序控制显隐

`show({ anchor })` **必须传锚点元素**（用于定位），`width` / `height` / `trigger` 可选覆盖：

<div class="mu-demo">
  <mu-button caption="显示面板" @click="showPanel" />
  <mu-button ref="anchorRef" caption="以我锚定" @click="showPanel" />
  <mu-button caption="隐藏" @click="hidePanel" />
  <mu-dropdown-panel ref="panelRef" :dropdown-items="menuItems" @action="onAction" />
</div>

```html
<template>
  <mu-button ref="anchorRef" caption="以我锚定" @click="showPanel" />
  <mu-dropdown-panel ref="panelRef" :dropdown-items="menus" @action="onAction" />
</template>

<script setup>
  import { ref } from 'vue'

  const panelRef = ref()

  function showPanel (anchorEl) {
    panelRef.value.show({ anchor: anchorEl })   // 必须传 anchor
    // panelRef.value.show({ anchor: anchorEl, width: '300px', trigger: 'hover' })
  }
</script>
```

## 数据驱动与插槽

| 插槽 | 说明 |
|------|------|
| `default` | 完全自定义面板内容（仅当需要非列表型内容时使用），提供时不再渲染 `dropdown-items` 列表，`header` / `footer` 插槽同样不渲染 |
| `items` | 自定义列表项，渲染于面板内置滚动容器内（限高 `--mu-list-item-height` × 8）；**自定义项内容时优先使用** |
| `header` / `footer` | 面板顶部 / 底部区域，仅 items 模式渲染 |

```html
<mu-dropdown-panel :dropdown-items="menus" />

<!-- 自定义列表项 -->
<mu-dropdown-panel>
  <template #items>
    <mu-dropdown-item label="编辑" icon="edit" action="edit" />
    <mu-dropdown-item label="删除" icon="delete" action="delete" />
  </template>
</mu-dropdown-panel>
```

## 复用为共享面板

一个面板实例可被多个 [MuDropdown](/components/dropdown)（经 `dropdown-panel` prop）复用：

```html
<mu-dropdown-panel ref="sharedPanel" :dropdown-items="menus" />

<mu-dropdown v-for="node in nodes" :key="node.id" :dropdown-panel="sharedPanel">
  <mu-icon icon="more" />
</mu-dropdown>
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `width` / `height` | String | — | 面板尺寸 |
| `trigger` | String | `click` | 触发方式：`click` \| `hover` |
| `dropdown-items` | Array | — | 列表项数据，结构见 [MuDropdownItem](/components/dropdown-item) |
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
| `delayHide()` | 延迟隐藏（`trigger: 'hover'` 时 300ms，供 hover 场景手动调用） |
| `updatePosition()` | 重新计算并更新面板位置（锚点尺寸/位置变化后调用） |
| `visible` | 当前显示状态（ref） |
