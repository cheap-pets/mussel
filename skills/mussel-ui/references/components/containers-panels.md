# 容器与面板组件 API

### MuTabs

多页签容器。

| 属性 | 类型 | 说明 |
|------|------|------|
| `active-tab` | String | 双向绑定，当前活动页签名称 |
| `tab-style` | String | `button` \| `small-button` \| `simple` \| `card` \| `border-card` |
| `tab-buttons` | Array | 手动指定页签按钮，默认由内部 `MuTabPanel` 自动生成 |
| `tab-position` | String | `top`（默认）\| `bottom` \| `left` \| `right` |
| `tab-bar-attrs` | Object | 传递给内置 `MuTabBar` 的额外属性 |

| 插槽 | 说明 |
|------|------|
| `tab-bar-prepend` | 页签按钮栏前置内容 |
| `tab-bar-append` | 页签按钮栏后置内容（常用于放置工具按钮） |

| 事件 | 参数 | 说明 |
|------|------|------|
| `button-click` | `name` | 页签按钮点击 |

```html
<mu-tabs v-model:active-tab="activeTab" tab-style="button">
  <template #tab-bar-append>
    <mu-icon-button icon="refresh" @click="reload" />
  </template>
  <mu-tab-panel name="list" caption="列表" icon="list">
    <!-- 列表内容 -->
  </mu-tab-panel>
  <mu-tab-panel name="detail" caption="详情" icon="detail" :disabled="!selectedId">
    <!-- 详情内容 -->
  </mu-tab-panel>
</mu-tabs>
```

---

### MuTabPanel

单个页签内容容器，**必须置于 MuTabs 中**。

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 页签唯一标识，必填 |
| `caption` | String | 页签按钮标题 |
| `icon` | String | 页签按钮图标 |
| `title` | String | 页签按钮 tooltip |
| `disabled` | Boolean | 是否禁用 |
| `tab-order` | Number | 手动排序（默认按 DOM 顺序） |

---

### MuTabBar

独立页签栏，不包含内容区，用于自定义页签 + 内容分离的布局。

| 属性 | 类型 | 说明 |
|------|------|------|
| `active-tab` | String | 双向绑定，当前活动页签 |
| `tab-style` | String | `button` \| `small-button` \| `simple` |
| `tab-buttons` | Array | 页签按钮数据 |
| `tab-position` | String | `top` \| `bottom` \| `left` \| `right` |

| 插槽 | 说明 |
|------|------|
| `prepend` | 前置内容 |
| `append` | 后置内容 |

---

## 模态与抽屉

### MuDialog

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `title` | String | — | 对话框标题 |
| `icon` | String\|Object | — | 标题图标 |
| `width` | String\|Number | — | 窗口宽度 |
| `height` | String\|Number | — | 窗口高度 |
| `header` | `'auto'`\|Boolean | `'auto'` | 头部显隐。`'auto'` 时根据 title/icon/close-button/maximize-button/header slot 自动判断 |
| `footer` | `'auto'`\|Boolean | `'auto'` | 底部显隐。`'auto'` 时根据 buttons/footer slot 自动判断 |
| `body-class` | String | — | 传给 body 区域的 class，通常用于控制其布局方式、间距、背景等 |
| `body-style` | Object | — | 传给 body 区域的 style |
| `body-scrollbar` | Boolean | — | 为 body 区域启用滚动条（使用 `v-mu-scrollbar`） |
| `buttons` | Array | — | 底部操作按钮，结构见下方 |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩。不设置则不自动关闭 |
| `close-button` | Boolean | `true` | 显示右上角关闭按钮 |
| `maximize-button` | Boolean | — | 显示最大化按钮 |
| `maximize-to-fullscreen` | Boolean | — | 最大化时进入全屏模式 |
| `lazy` | Boolean | `true` | 首次打开时才渲染内容 |
| `keep-position` | Boolean | — | 再次打开时保留上次位置 |
| `dispose-on-hide` | Boolean | — | 隐藏时销毁内容 |
| `z-index` | String | — | 自定义层级 |
| `container` | String\|HTMLElement | — | 挂载容器。CSS 选择器字符串或 DOM 元素；不设则挂到全局根容器（`$mussel.rootElement`）。设为指定元素时遮罩自动改为 `position: absolute`，使弹窗相对该容器而非视口定位。详见下方「嵌入容器」 |
| `mask-class` | — | — | 遮罩 class |
| `mask-attrs` | Object | — | 透传给遮罩的额外属性 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `value, trigger` | 可见状态变更。仅关闭时触发（显示由外层 `v-model:visible` 驱动）；`trigger` 表示关闭来源：`'$X'`（右上角关闭按钮）/ `'$ESC'`（ESC 键）/ `'$MASK'`（遮罩点击）/ 按钮的 `name`（如 `'CANCEL'`、`'OK'`） |
| `button-click` | `button` | 底部按钮点击，payload 为对象 `{ key, name, caption, action, ...attrs }`；自定义按钮建议用 `name` 字段判断来源 |
| `show` / `hide` | — | 显示/隐藏动画完成后触发 |

| 插槽 | 说明 |
|------|------|
| `header` | 头部附加内容（插入在标题与系统按钮之间） |
| `body` | 主体内容（推荐使用） |
| `default` | 主体内容（兼容旧版，`body` slot 存在时忽略） |
| `footer` | 底部附加内容（插入在按钮之前） |

**方法（通过 ref 调用）：**

| 方法 / 属性 | 类型 | 说明 |
|------|------|------|
| `hide()` | Function | 关闭对话框。等价于把 `visible` 设为 `false`，封装组件对外暴露该方法即可让父组件通过 ref 关闭，无需再暴露 `visible` |
| `maskEl` | Element | 遮罩层 DOM（`.mu-modal-mask`） |
| `dialogEl` | Element | 对话框 DOM（`.mu-dialog`） |

**buttons 写法（字符串快速定义 / 对象完整定义）：**

`buttons` 数组每一项既可以是字符串（快速定义），也可以是对象（完整定义）。字符串会按字面量解析：

| 写法 | 含义 |
|------|------|
| `'Find'` | 普通按钮，`name` 与 `caption` 均为该字符串 |
| `'#OK'` \| `'#CANCEL'` \| `'#YES'` \| `'#NO'` \| `'#ACCEPT'` | 内置预设，自动套用主色/文本样式/`action:'close'`/多语言文案 |
| `'#OK!'` \| `'#YES!'` | 同名预设的危险色（红色）变体 |
| `' '`（单个空格） | 弹性间距，把后续按钮推到右侧 |
| `'-'`（连字符） | 分隔线 |
| `{ name, caption, primary, buttonStyle, action, icon, ... }` | 完整对象，可任意覆盖以上字段 |

> `@button-click` 回调收到 `{ name, caption, action, ... }`。**自定义按钮建议显式设 `name`**，再用它判断点击来源——预设按钮的 `name` 固定（如 `'OK'`、`'CANCEL'`）；纯字符串按钮的 `name` 即字符串本身，只要文案稳定也可用，但一旦需要让 `name` 与 `caption` 解耦就必须用对象形式。

**用法示例：封装为独立组件，通过 `show(data)` 显示**

Dialog 通常封装成独立组件：内部维护 `visible`，对外只暴露 `show(data)`，由父组件以 `ref` 调用并传入状态。

`my-dialog.vue`：

```vue
<template>
  <mu-dialog
    ref="dialogRef"
    v-model:visible="visible"
    class="my-dialog"
    title="编辑用户"
    dismissible
    keep-position
    body-class="p-3x"
    :buttons="['-', 'Find', ' ', '#CANCEL', '#OK']"
    @button-click="onButtonClick">
    <mu-form label-width="80px">
      <!-- 表单内容，使用 data -->
    </mu-form>
  </mu-dialog>
</template>

<script setup>
  import { ref } from 'vue'

  const visible = ref(false)
  const data = ref(null)

  function show (value) {
    data.value = value
    visible.value = true
  }

  function onButtonClick (button) {
    // 用 name 判断点击来源
    if (button.name === 'Find') {
      // 自定义按钮：对象形式时 name 来自 { name }，字符串形式时即字符串本身
    } else if (button.name === 'OK') {
      // 预设按钮：'#OK' 的 name 固定为 'OK'
      visible.value = false
    }
  }

  defineExpose({ show })
</script>

<style>
  /* mu-dialog 仅有 width/height 属性，无 min/max 属性；
     覆盖最大/最小尺寸需通过 class（透传到 .mu-dialog 根元素）在样式中设置。 */
  .my-dialog {
    width: 800px;
    min-width: 640px;
    max-width: 90%;
    height: 600px;
    min-height: 480px;
    max-height: 90%;
  }
</style>
```

父组件调用：

```vue
<template>
  <mu-button caption="编辑" @click="open" />
  <my-dialog ref="dialogRef" />
</template>

<script setup>
  import { ref } from 'vue'
  import MyDialog from './my-dialog.vue'

  const dialogRef = ref()

  function open () {
    dialogRef.value?.show({ id: 1, name: 'Tom' })
  }
</script>
```

---

### MuDrawer

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `position` | String | `bottom` | `top` \| `right` \| `bottom` \| `left` |
| `width` | String\|Number | — | 宽度（left/right 时有效） |
| `height` | String\|Number | — | 高度（top/bottom 时有效） |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩。不设置则不自动关闭 |
| `mask` | Boolean | `true` | 是否显示遮罩 |
| `rounded` | Boolean | — | 是否圆角 |
| `teleport` | Boolean | `true` | 渲染到页面根容器 |
| `container` | String\|HTMLElement | — | 挂载容器。CSS 选择器字符串或 DOM 元素；不设则挂到全局根容器（`$mussel.rootElement`）。设为指定元素时遮罩自动改为 `position: absolute`，使抽屉相对该容器而非视口定位。详见下方「嵌入容器」 |
| `dispose-on-hide` | Boolean | — | 隐藏时销毁内容 |
| `lazy` | Boolean | `true` | 首次打开时才渲染内容 |
| `mask-class` | — | — | 遮罩 class |
| `mask-attrs` | Object | — | 透传给遮罩的额外属性 |

| 事件 | 说明 |
|------|------|
| `update:visible` | 可见状态变更 |
| `show` / `hide` | 显示/隐藏 |

```html
<mu-drawer v-model:visible="drawerVisible" position="right" width="400px" dismissible>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">详情</div>
    <mu-scroll-box class="flex-1 p-2x">内容区域</mu-scroll-box>
  </div>
</mu-drawer>
```

#### 嵌入容器（`container`）

MuDialog 和 MuDrawer 默认通过 `<Teleport>` 挂载到全局根容器（`$mussel.rootElement`，通常是 `<body>`），遮罩为 `position: fixed`，铺满整个视口。

设置 `container` 后，弹窗会被 Teleport 到该元素内，并自动切换遮罩为 `position: absolute`，于是遮罩与弹窗都**相对该容器定位、铺满该容器**，而不是整个视口。适用于「在某面板内弹出」的场景（如 IDE 右侧面板内的设置抽屉、卡片内的确认对话框）。

| 取值 | 行为 |
|------|------|
| 不设（默认） | Teleport 到 `$mussel.rootElement`，遮罩 `position: fixed` 铺满视口 |
| CSS 选择器字符串 | 首个匹配元素（`document.querySelector`）作为容器 |
| HTMLElement | 该元素作为容器 |

**注意**：
- 容器元素需 `position: relative`（或 `absolute`/`fixed`），否则 `absolute` 定位的遮罩会参照更外层的定位祖先，遮罩位置会偏。
- 若页面处于浏览器全屏（`document.fullscreenElement`）且 `container` 在全屏元素内，则会在全屏元素内渲染（全屏元素若脱离 DOM 树，Teleport 目标也会随之消失）。
- `container` 变更不会实时跟随：在弹窗**显示时**（及首次挂载）解析一次目标，运行期改变容器需重新打开才生效。

```html
<!-- 容器需设为定位元素 -->
<div ref="panelEl" style="position: relative; width: 600px; height: 400px">
  <mu-button caption="面板内打开" @click="dialogVisible = true" />
  <!-- dialog 仅铺满 panelEl，而非整个视口 -->
  <mu-dialog
    v-model:visible="dialogVisible"
    title="面板内对话框"
    :container="panelEl"
    dismissible>
    此对话框相对父级面板定位。
  </mu-dialog>
</div>
```
