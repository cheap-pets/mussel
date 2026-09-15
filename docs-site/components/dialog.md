<script setup>
  import { ref } from 'vue'

  const visible = ref(false)
  const confirmVisible = ref(false)
  const maximizeVisible = ref(false)
  const panelDialogVisible = ref(false)
  const panelEl = ref()
</script>

# 对话框 MuDialog

模态对话框。默认通过 `<Teleport>` 挂载到全局根容器（`$mussel.rootElement`），遮罩 `position: fixed` 铺满视口。标题栏支持拖拽移动；窗口尺寸变化或拖拽结束时自动做越界校正，保持对话框完整可见。

## 基础用法

<div class="mu-demo">
  <mu-button color="primary" caption="打开对话框" @click="visible = true" />
</div>

<mu-dialog
  v-model:visible="visible"
  title="基础对话框"
  icon="info"
  dismissible
  width="560px"
  body-class="p-2x"
  :buttons="['-', 'Find', ' ', '#CANCEL', '#OK']"
  @button-click="btn => { if (btn.name !== 'Find') visible = false }">
  <template #body>
    <p>这是一个基础对话框。按住标题栏可拖拽移动；点击遮罩或按 ESC 可关闭（dismissible）。</p>
    <p class="text-subtle">底部按钮使用 <code>#</code> 预设（<code>#CANCEL</code> / <code>#OK</code>），自动套用主色、文本样式、关闭行为与多语言文案。</p>
  </template>
</mu-dialog>

```html
<mu-dialog
  v-model:visible="visible"
  title="编辑用户"
  icon="info"
  dismissible
  body-class="p-3x"
  :buttons="['-', 'Find', ' ', '#CANCEL', '#OK']"
  @button-click="onButtonClick">
  <template #body>
    <!-- 内容 -->
  </template>
</mu-dialog>
```

## 关闭方式 `dismissible`

`true`=遮罩与 ESC 均可关闭，`'esc'`=仅 ESC，`'mask'`=仅遮罩；**不设置则不自动关闭**（必须通过按钮或逻辑关闭）：

```html
<mu-dialog v-model:visible="visible" dismissible>...</mu-dialog>
<mu-dialog v-model:visible="visible" dismissible="esc">...</mu-dialog>
<mu-dialog v-model:visible="visible" dismissible="mask">...</mu-dialog>
```

## 底部按钮 `buttons`

`buttons` 数组每一项可以是字符串（快速定义）或对象（完整定义）：

| 写法 | 含义 |
|------|------|
| `'Find'` | 普通按钮，`name` 与 `caption` 均为该字符串 |
| `'#OK'` \| `'#CANCEL'` \| `'#YES'` \| `'#NO'` \| `'#ACCEPT'` \| `'#CLOSE'` | 内置预设，自动套用主色/文本样式/`action:'close'`/多语言文案 |
| `'#OK!'` \| `'#YES!'` | 同名预设的危险色（红色）变体 |
| `' '`（单个空格） | 弹性间距，把后续按钮推到右侧 |
| `'-'`（连字符） | 分隔线 |
| `{ name, caption, is, primary, danger, buttonStyle, action, icon, ... }` | 完整对象，可任意覆盖以上字段 |

::: warning
生成 dialog 按钮时**优先使用 `#` 预设**，避免手写 `{ caption: '确定', primary: true }` 这类重复对象——预设已统一主色/文本样式/关闭行为/多语言文案，且 `name` 固定、便于在 `@button-click` 中判断点击来源。自定义按钮建议显式设 `name`。
:::

<div class="mu-demo">
  <mu-button caption="危险确认示例" @click="confirmVisible = true" />
</div>

<mu-dialog
  v-model:visible="confirmVisible"
  title="删除确认"
  dismissible="esc"
  width="440px"
  body-class="p-2x"
  :buttons="[' ', '#CANCEL', '#OK!']">
  <template #body>确认删除该记录？删除后不可恢复。</template>
</mu-dialog>

```html
<mu-dialog v-model:visible="visible" title="删除确认" :buttons="[' ', '#CANCEL', '#OK!']">
  <template #body>确认删除该记录？删除后不可恢复。</template>
</mu-dialog>
```

`@button-click` 回调收到 `{ key, name, caption, action, ...attrs }`，按 `name` 判断点击来源（预设按钮 `name` 固定，如 `'OK'`、`'CANCEL'`）：

```javascript
function onButtonClick (button) {
  if (button.name === 'OK') {
    /* do something */
    visible.value = false
  }
}
```

## 最大化 `maximize-button`

<div class="mu-demo">
  <mu-button caption="可最大化对话框" @click="maximizeVisible = true" />
</div>

<mu-dialog
  v-model:visible="maximizeVisible"
  title="可最大化"
  dismissible
  width="520px"
  height="360px"
  maximize-button
  maximize-to-fullscreen
  body-class="p-2x"
  :buttons="['#CLOSE']">
  <template #body>点击标题栏右侧最大化按钮，可切换最大化 / 全屏。</template>
</mu-dialog>

```html
<mu-dialog
  v-model:visible="visible"
  title="可最大化"
  maximize-button
  maximize-to-fullscreen>
  <template #body>...</template>
</mu-dialog>
```

## 封装为独立组件

Dialog 通常封装成独立组件：内部维护 `visible`，对外只暴露 `show(data)`，由父组件以 `ref` 调用并传入状态。

```vue
<!-- my-dialog.vue -->
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
    <template #body>
      <mu-form label-width="80px">
        <!-- 表单内容，使用 data -->
      </mu-form>
    </template>
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
    if (button.name === 'OK') {
      visible.value = false
    }
  }

  defineExpose({ show })
</script>

<style>
  /* mu-dialog 无 min/max 属性，最小/最大尺寸需通过 class（透传到 .mu-dialog）覆盖；
     resizable 拖拽同样受这些 computed min/max 约束（支持 px 与 %） */
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

```vue
<!-- 父组件 -->
<template>
  <mu-button caption="编辑" @click="open" />
  <my-dialog ref="dialogRef" />
</template>

<script setup>
  import { shallowRef } from 'vue'

  import MyDialog from './my-dialog.vue'

  const dialogRef = shallowRef()

  function open () {
    dialogRef.value?.show({ id: 1, name: 'Tom' })
  }
</script>
```

## 嵌入容器 `container`

设置 `container` 后，弹窗被 Teleport 到该元素内，遮罩自动改为 `position: absolute`，相对该容器定位、铺满该容器——适用于「在某面板内弹出」的场景。

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <div ref="panelEl" class="mu-demo-panel" style="position: relative; height: 200px;">
    <div style="padding: 12px;">
      <mu-button caption="面板内打开" @click="panelDialogVisible = true" />
    </div>
    <mu-dialog
      v-model:visible="panelDialogVisible"
      title="面板内对话框"
      :container="panelEl"
      dismissible
      width="320px"
      height="140px"
      body-class="p-2x">
      <template #body>此对话框相对父级面板定位。</template>
    </mu-dialog>
  </div>
</div>

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
    <template #body>...</template>
  </mu-dialog>
</div>
```

::: warning
- 容器元素需 `position: relative`（或 `absolute`/`fixed`），否则 `absolute` 定位的遮罩会参照更外层的定位祖先，遮罩位置会偏
- 若页面处于浏览器全屏且 `container` 在全屏元素内，则会在全屏元素内渲染
- `container` 在弹窗**显示时**（及首次挂载）解析一次目标，运行期改变容器需重新打开才生效
:::

## 插槽

| 插槽 | 说明 |
|------|------|
| `header` | 头部附加内容（插入在标题与系统按钮之间） |
| `body` | 主体内容（推荐使用） |
| `default` | 主体内容（兼容旧版，`body` slot 存在时忽略） |
| `footer` | 底部附加内容（插入在按钮之前） |

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `title` | String\|Object | — | 对话框标题 |
| `icon` | String\|Object | — | 标题图标 |
| `width` / `height` | String\|Number | — | 窗口宽度 / 高度 |
| `header` / `footer` | `'auto'`\|Boolean | `'auto'` | 头部 / 底部显隐。`'auto'` 时根据 title/close-button/buttons/slot 自动判断 |
| `header-class` / `footer-class` | String | — | 头部 / 底部区域附加 class |
| `body-class` | String | — | body 区域 class，通常用于控制其布局方式、间距、背景等 |
| `body-style` | Object | — | body 区域 style |
| `body-scrollbar` | Boolean | — | 为 body 区域启用滚动条（使用 `v-mu-scrollbar`） |
| `buttons` | Array | — | 底部操作按钮，见上方「buttons 写法」 |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩；不设置则不自动关闭 |
| `close-button` | Boolean | `true` | 显示右上角关闭按钮 |
| `maximize-button` | Boolean | — | 显示最大化按钮 |
| `maximize-to-fullscreen` | Boolean | — | 最大化时进入全屏模式 |
| `resizable` | Boolean | — | 开启边缘拖拽调整大小（四边 + 四角共 8 个手柄）。最小/最大尺寸遵循 CSS 约束（`min-width`/`max-width` 等，支持 px 与 %） |
| `lazy` | Boolean | `true` | 首次打开时才渲染内容 |
| `keep-position` | Boolean | — | 再次打开时保留上次位置与尺寸（含拖拽、调整大小后的值） |
| `dispose-on-hide` | Boolean | — | 隐藏时销毁内容 |
| `z-index` | String | — | 自定义层级 |
| `container` | String\|HTMLElement | — | 挂载容器。CSS 选择器字符串或 DOM 元素；设为指定元素时遮罩自动改为 `position: absolute` |
| `mask-class` | — | — | 遮罩 class |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `value, trigger` | 可见状态变更。仅关闭时触发；`trigger` 表示关闭来源：`'$X'`（右上角关闭按钮）/ `'$ESC'`（ESC）/ `'$MASK'`（遮罩）/ 按钮的 `name` |
| `button-click` | `button` | 底部按钮点击，payload 为 `{ key, name, caption, action, ...attrs }` |
| `show` / `hide` | — | 显示/隐藏动画完成后触发 |

**方法（通过 ref 调用）：**

| 方法 / 属性 | 类型 | 说明 |
|------|------|------|
| `hide()` | Function | 关闭对话框。等价于把 `visible` 设为 `false`，封装组件对外暴露该方法即可让父组件通过 ref 关闭 |
| `maskEl` | Element | 遮罩层 DOM（`.mu-modal-mask`） |
| `dialogEl` | Element | 对话框 DOM（`.mu-dialog`） |
