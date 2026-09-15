<script setup>
  import { ref } from 'vue'

  const drawerVisible = ref(false)
  const drawerPosition = ref('right')
  const maskVisible = ref(true)
  const rounded = ref(true)

  function openDrawer (position) {
    drawerPosition.value = position
    drawerVisible.value = true
  }
</script>

# 抽屉 MuDrawer

抽屉面板，从屏幕四边滑出，默认通过 `<Teleport>` 挂载到全局根容器（`$mussel.rootElement`）。适合详情面板、设置面板、临时操作区等非模态强打断的场景。

## 基础用法

`position` 支持 `top` / `right` / `bottom` / `left`，默认 `bottom`；`width`（left/right 时有效）、`height`（top/bottom 时有效）控制面板尺寸。

<div class="mu-demo">
  <mu-button caption="Top" @click="openDrawer('top')" />
  <mu-button caption="Left" @click="openDrawer('left')" />
  <mu-button caption="Right" @click="openDrawer('right')" />
  <mu-button caption="Bottom" @click="openDrawer('bottom')" />
</div>

<mu-drawer
  v-model:visible="drawerVisible"
  :position="drawerPosition"
  width="50%"
  rounded
  dismissible>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">
      I am a {{ drawerPosition }} drawer.
    </div>
    <mu-scroll-box class="flex-1 p-2x">
      <p>抽屉内容区域。</p>
    </mu-scroll-box>
  </div>
</mu-drawer>

```html
<mu-drawer v-model:visible="drawerVisible" position="right" width="400px" dismissible>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">详情</div>
    <mu-scroll-box class="flex-1 p-2x">内容区域</mu-scroll-box>
  </div>
</mu-drawer>
```

## 遮罩与圆角 `mask` / `rounded`

`mask` 控制是否显示遮罩（默认 `true`）；`rounded` 设置面板圆角：

```html
<mu-drawer v-model:visible="visible" position="right" :mask="false" rounded>
  无遮罩抽屉（可与页面交互）
</mu-drawer>
```

## 嵌入容器 `container`

与 [MuDialog](/components/dialog) 相同：设置 `container` 后抽屉相对该容器定位、铺满该容器（容器需为定位元素），适合面板内滑出的场景：

```html
<div ref="panelEl" style="position: relative; height: 400px">
  <mu-drawer
    v-model:visible="visible"
    position="right"
    width="200px"
    :container="panelEl"
    dismissible>
    面板内抽屉
  </mu-drawer>
</div>
```

## 内容布局建议

抽屉本体无内边距，推荐内部用 flex 结构组织（固定头部 + 可滚动内容）：

```html
<mu-drawer v-model:visible="visible" position="right" width="400px" dismissible>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">固定头部</div>
    <mu-scroll-box class="flex-1 p-2x">可滚动内容</mu-scroll-box>
    <div class="flex-none border-t border-soft p-1x">固定底部操作区</div>
  </div>
</mu-drawer>
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `position` | String | `bottom` | `top` \| `right` \| `bottom` \| `left` |
| `width` / `height` | String\|Number | — | 宽度（left/right 时有效）/ 高度（top/bottom 时有效） |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩；不设置则不自动关闭 |
| `mask` | Boolean | `true` | 是否显示遮罩 |
| `rounded` | Boolean | — | 是否圆角 |
| `teleport` | Boolean | `true` | 渲染到页面根容器 |
| `z-index` | String | — | 自定义层级 |
| `container` | String\|HTMLElement | — | 挂载容器。CSS 选择器字符串或 DOM 元素；设为指定元素时遮罩自动改为 `position: absolute` |
| `dispose-on-hide` | Boolean | — | 隐藏时销毁内容 |
| `lazy` | Boolean | `true` | 首次打开时才渲染内容 |
| `mask-class` | — | — | 遮罩 class |

| 事件 | 说明 |
|------|------|
| `update:visible` | 可见状态变更 |
| `show` / `hide` | 显示/隐藏 |
