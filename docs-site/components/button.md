<script setup>
  import { ref } from 'vue'

  const toggleActive = ref(true)
</script>

# 按钮 MuButton

按钮用于触发一个即时操作。支持四种视觉风格（`button-style`）与四种语义色（`color`）的组合，并提供开关模式（`toggle`）、圆弧形态（`pill`）、三档尺寸（`size`）等形态控制。

文字通过 `caption` 属性设置（也可使用 default 插槽覆盖），图标通过 `icon` 属性设置。

## 基础用法

<div class="mu-demo">
  <mu-button caption="普通按钮" />
  <mu-button color="primary" caption="主色按钮" />
  <mu-button color="secondary" caption="次要按钮" />
  <mu-button color="danger" caption="危险按钮" />
</div>

```html
<mu-button caption="保存" />
<mu-button color="primary" caption="保存" />
<mu-button color="danger" caption="删除" />
```

## 颜色 `color`

`color` 推荐取值：`normal`（默认）/ `primary` / `secondary` / `danger`。

::: warning 废弃属性
`primary` / `secondary` / `danger` 布尔属性已废弃，统一用 `color` 替代：`<mu-button primary>` → `<mu-button color="primary">`。
:::

## 风格 `button-style`

四种风格与任意 `color` 组合使用：

- **normal**（默认）：实心填充
- **outline**：描边
- **text**：纯文字，无背景边框
- **link**：链接样式（与 `pill` 互斥）

<div class="mu-demo">
  <mu-button caption="NORMAL" />
  <mu-button button-style="outline" caption="OUTLINE" />
  <mu-button button-style="text" caption="TEXT" />
  <mu-button button-style="link" caption="LINK" />
</div>

<div class="mu-demo">
  <mu-button color="primary" button-style="outline" caption="PRIMARY" />
  <mu-button color="danger" button-style="outline" caption="DANGER" />
  <mu-button color="primary" button-style="text" caption="TEXT" />
  <mu-button color="danger" button-style="link" caption="LINK" />
</div>

```html
<mu-button button-style="outline" caption="OUTLINE" />
<mu-button color="primary" button-style="outline" caption="PRIMARY" />
<mu-button color="danger" button-style="link" caption="LINK" />
```

## 状态 `active` / `disabled`

`active` 设置选中态（深色背景），`disabled` 设置禁用态。

<div class="mu-demo">
  <mu-button caption="NORMAL" />
  <mu-button active caption="ACTIVE" />
  <mu-button disabled caption="DISABLED" />
  <mu-button color="primary" active caption="ACTIVE" />
  <mu-button color="primary" disabled caption="DISABLED" />
</div>

```html
<mu-button active caption="ACTIVE" />
<mu-button color="primary" disabled caption="DISABLED" />
```

## 开关模式 `toggle`

设置 `toggle` 后按钮变为开关：点击切换 `active` 状态，需配合 `v-model:active` 双向绑定。适合工具栏中的「按下生效」类操作（如筛选开关）。

<div class="mu-demo">
  <mu-button toggle v-model:active="toggleActive" caption="开关按钮" />
  <span class="text-subtle">active = {{ toggleActive }}</span>
</div>

```html
<mu-button toggle v-model:active="filterVisible" caption="筛选" />
<mu-icon-button toggle v-model:active="filterVisible" icon="filter" />
```

## 尺寸 `size` 与圆弧 `pill`

`size` 支持 `small` / `normal`（默认）/ `large`；`pill` 设置左右圆弧（胶囊）形态，`button-style="link"` 时不生效。

<div class="mu-demo">
  <mu-button size="small" caption="SMALL" />
  <mu-button caption="NORMAL" />
  <mu-button size="large" caption="LARGE" />
  <mu-button size="small" color="primary" pill caption="SMALL" />
  <mu-button size="large" color="primary" pill caption="LARGE" />
</div>

```html
<mu-button size="small" caption="取消" />
<mu-button size="large" color="primary" pill caption="确定" />
```

> 按钮置于 `MuToolbar` 内时，未显式设置 `size` / `button-style` 会继承工具栏的 `tool-size` / `default-button-style`（见 [MuToolbar](/components/toolbar)）。

## 图标与插槽

`icon` 设置前置图标，可带动画后缀（如 `loading`）。default 插槽可完全覆盖按钮内容。

<div class="mu-demo">
  <mu-button icon="edit" caption="编辑" />
  <mu-button icon="delete" color="danger" caption="删除" />
  <mu-button icon="loading" caption="加载中" disabled />
  <mu-button color="primary">
    <mu-icon icon="check" /> <span>自定义内容</span>
  </mu-button>
</div>

```html
<mu-button icon="edit" caption="编辑" />
<mu-button icon="loading" caption="加载中" disabled />

<!-- 插槽覆盖内容 -->
<mu-button color="primary">
  <mu-icon icon="check" /> <span>自定义内容</span>
</mu-button>
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `caption` | String | — | 按钮文字 |
| `icon` | String | — | 按钮图标 |
| `size` | String | — | `small` \| `normal` \| `large`；未设置时等效 `normal`，置于 `MuToolbar` 内时继承 `tool-size` |
| `button-style` | String | — | `normal` \| `outline` \| `text` \| `link`；未设置时等效 `normal`，置于 `MuToolbar` 内时继承 `default-button-style` |
| `color` | String | — | `'normal'` \| `'primary'` \| `'secondary'` \| `'danger'`，推荐使用；未设置时等效 `normal` |
| `primary` / `secondary` / `danger` | Boolean | — | 已废弃，用 `color` 替代 |
| `pill` | Boolean | — | 左右圆弧形态；`button-style="link"` 时不生效（互斥） |
| `toggle` | Boolean | — | 开关模式：开启后点击切换 `active`，需配合 `v-model:active` |
| `active` | Boolean | — | 选中状态（`toggle` 开启时双向绑定） |
| `disabled` | Boolean | — | 禁用状态 |

| 插槽 | 说明 |
|------|------|
| `default` | 覆盖按钮内容（缺省渲染 icon + caption） |
