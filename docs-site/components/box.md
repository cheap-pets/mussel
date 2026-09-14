# 弹性容器 MuHBox / MuVBox

水平 / 垂直方向的 Flex 布局容器，内部由 flex 原子类驱动：

- **MuHBox**：方向固定为 `row`（水平排列）
- **MuVBox**：方向固定为 `col`（垂直排列）

方向由组件名固定、不可通过属性更改；配合 `flex-reverse` 可得到反向排列。

Props 与原子类一一对应（如 `gap="2x"` 等价 `.gap-2x`）。**简单场景推荐直接用原子类**，省去组件标签；参数化的布局（如整组对齐设置）用组件更省字符。

## 基础用法

<div class="mu-demo mu-demo-col">
  <mu-h-box gap="2x" align-items="center" justify-content="space-between" style="width: 100%; padding: 12px; background: var(--mu-bg-fill);">
    <span>标题</span>
    <mu-button color="primary" caption="操作" />
  </mu-h-box>
  <div class="flex flex-row gap-2x items-center justify-between" style="width: 100%; padding: 12px; background: var(--mu-bg-fill);">
    <span>原子类等价写法</span>
    <mu-button color="primary" caption="操作" />
  </div>
</div>

```html
<!-- 组件形式 -->
<mu-h-box gap="2x" align-items="center" justify-content="space-between">
  <span>标题</span>
  <mu-button color="primary" caption="操作" />
</mu-h-box>

<!-- 原子类形式（等价） -->
<div class="flex flex-row gap-2x items-center justify-between">
  <span>标题</span>
  <mu-button color="primary" caption="操作" />
</div>
```

## 间距 `gap`

`gap` 取基准间距的倍数：`none` / `half`(4px) / `1x`(8px) / `2x`(16px) / `3x`(24px) / `4x`(32px)。

<div class="mu-demo">
  <mu-v-box gap="half" style="padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="gap=half" />
    <mu-button size="small" caption="gap=half" />
  </mu-v-box>
  <mu-v-box gap="2x" style="padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="gap=2x" />
    <mu-button size="small" caption="gap=2x" />
  </mu-v-box>
  <mu-h-box gap="3x" style="padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="gap=3x" />
    <mu-button size="small" caption="gap=3x" />
  </mu-h-box>
</div>

```html
<mu-v-box gap="half">...</mu-v-box>
<mu-h-box gap="3x">...</mu-h-box>
```

## 对齐 `align-items` / `justify-content`

取值与 CSS 原生值一致（省略 `flex-` 前缀，如 `center` / `start` / `end` / `space-between`）。

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-h-box align-items="start" gap="1x" style="height: 72px; padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="align-items=start" />
    <mu-button size="large" caption="大按钮" />
  </mu-h-box>
  <mu-h-box align-items="center" justify-content="center" gap="1x" style="height: 72px; padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="水平垂直居中" />
  </mu-h-box>
</div>

```html
<mu-h-box align-items="start" gap="1x">...</mu-h-box>
<mu-h-box align-items="center" justify-content="center">...</mu-h-box>
```

> `flex-center` 是 `align-items="center"` + `justify-content="center"` 的快捷方式，**优先级高于**单独的 align/justify 属性。

## 反向排列 `flex-reverse`

<div class="mu-demo">
  <mu-h-box flex-reverse gap="1x" style="padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="A" />
    <mu-button size="small" caption="B" />
    <mu-button size="small" caption="C" />
  </mu-h-box>
</div>

```html
<!-- 等价 .flex-row-reverse -->
<mu-h-box flex-reverse>...</mu-h-box>
```

## 换行 `flex-wrap`

<div class="mu-demo">
  <mu-h-box flex-wrap gap="1x" style="width: 260px; padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="1" />
    <mu-button size="small" caption="2" />
    <mu-button size="small" caption="3" />
    <mu-button size="small" caption="4" />
    <mu-button size="small" caption="5" />
  </mu-h-box>
</div>

```html
<mu-h-box flex-wrap gap="1x">...</mu-h-box>
```

## API（MuFlexBox 基类）

| 属性 | 类型 | 默认 | 取值 | 等价原子类 |
|------|------|------|------|-----------|
| `inline` | Boolean | `false` | — | `.inline-flex`（默认 `.flex`） |
| `gap` | String | — | `none` \| `half` \| `1x` \| `2x` \| `3x` \| `4x` | `.gap-{n}x` / `.gap-half` / `.gap-none` |
| `align-items` | String | — | `center` \| `start` \| `end` \| `baseline` \| `stretch` \| `flex-start` \| `flex-end` | `.items-{value}` |
| `justify-content` | String | — | `start` \| `end` \| `left` \| `right` \| `baseline` \| `center` \| `stretch` \| `flex-start` \| `flex-end` \| `space-around` \| `space-between` \| `space-evenly` | `.justify-{value}` |
| `flex-wrap` | Boolean\|String | — | `true` \| `nowrap` \| `wrap` \| `wrap-reverse` | `.flex-wrap` / `.flex-nowrap` |
| `flex-center` | Boolean | — | — | `.flex-center`（同时设 `items-center; justify-center`，**优先级高于 align/justify**） |
| `flex-reverse` | Boolean | — | 仅对 `row` / `col` 方向生效 | 翻转为 `flex-row-reverse` / `flex-col-reverse` |
