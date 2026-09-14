<script setup>
  import { ref } from 'vue'

  const keyword = ref('')
</script>

# 工具栏 MuToolbar

工具栏容器，自带 Flex 布局（`display: flex` + `align-items: center` + `gap`），常用于页面顶部操作区、列表过滤区。与 [MuBar](/components/bar) 共享基础条形样式，但**无固定高度**。

## 基础用法

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-toolbar class="bg-fill" style="padding: 4px 8px;">
    <mu-input v-model="keyword" placeholder="搜索" prefix=":icon=search" style="width: 200px;" />
    <mu-flex-space />
    <mu-button color="primary" caption="新建" icon="plus" />
    <mu-icon-button icon="refresh" />
  </mu-toolbar>
</div>

```html
<mu-toolbar>
  <mu-input placeholder="搜索" prefix=":icon=search" />
  <mu-flex-space />
  <mu-button color="primary" caption="新建" icon="plus" />
  <mu-icon-button icon="refresh" />
</mu-toolbar>
```

## 尺寸注入 `tool-size`

`tool-size`（`small` | `normal`）通过 provide 注入内部子组件：`MuButton` / `MuIconButton` 按此尺寸渲染；`MuInput` 仅消费 `toolSize` 自动缩小。子组件显式传入对应属性时优先使用自身设置。

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-toolbar tool-size="small" class="bg-fill" style="padding: 4px 8px;">
    <mu-button caption="自动继承小尺寸" />
    <mu-input placeholder="自动小尺寸输入框" style="width: 180px;" />
    <mu-flex-space />
    <mu-button caption="显式 large" size="large" />
  </mu-toolbar>
</div>

```html
<mu-toolbar tool-size="small">
  <mu-button caption="自动继承小尺寸" />
  <mu-input placeholder="自动小尺寸输入框" />
  <!-- 显式设置优先 -->
  <mu-button caption="显式 large" size="large" />
</mu-toolbar>
```

## 默认按钮风格 `default-button-style`

为工具栏内**未显式设置** `button-style` 的按钮设置默认风格（`normal` / `outline` / `text` / `link`）：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-toolbar default-button-style="text" class="bg-fill" style="padding: 4px 8px;">
    <mu-button caption="列表" />
    <mu-button caption="看板" />
    <mu-button caption="图表" />
    <mu-flex-space />
    <mu-button caption="设置" button-style="outline" />
  </mu-toolbar>
</div>

```html
<mu-toolbar default-button-style="text">
  <mu-button caption="列表" />   <!-- 自动 text 风格 -->
  <mu-button caption="设置" button-style="outline" />  <!-- 显式设置优先 -->
</mu-toolbar>
```

::: info 例外
按钮位于 `mu-button-group` 内时，完全不消费工具栏注入的 `tool-size` / `default-button-style`，由 button-group 的 props 接管。
:::

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `tool-size` | String | 工具栏尺寸：`small` \| `normal`；内部 `MuInput`、`MuButton` 等组件按此尺寸渲染 |
| `default-button-style` | String | 内部按钮默认风格：`normal` \| `outline` \| `text` \| `link` |

> [MuPagination](/components/pagination) 根元素带 `mu-toolbar` class，自身注入 `toolSize`（可继承外层 MuToolbar 或由 `size` prop 指定），是等价的条形容器。
