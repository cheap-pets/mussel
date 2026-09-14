# 网格布局 MuGridBox / MuGridCell

CSS Grid 布局容器与单元格。MuGridBox 固定渲染 `.grid`，通过 `columns` / `rows` 自动生成网格模板；MuGridCell 通过 6 个 props 计算输出 `grid-column` / `grid-row` 两个样式属性（列、行规则相同）。

::: info 推荐直接使用原子类
`<div class="grid">` + 原生 `grid-template-*` 内联样式即可覆盖绝大多数场景，无需组件。组件适合需要参数化计算跨度（如布局设计器动态生成 span）的场景。
:::

## 基础用法

<div class="mu-demo">
  <mu-grid-box :columns="6" :rows="2" style="width: 100%; height: 140px;">
    <mu-grid-cell :col-span="2" :row-span="2" style="background: var(--mu-primary-faint); padding: 8px;">宽 2 高 2</mu-grid-cell>
    <mu-grid-cell style="background: var(--mu-bg-fill); padding: 8px;">默认占 1 格</mu-grid-cell>
    <mu-grid-cell :col-span="3" style="background: var(--mu-bg-fill); padding: 8px;">宽 3</mu-grid-cell>
  </mu-grid-box>
</div>

```html
<mu-grid-box :columns="6" :rows="6">
  <mu-grid-cell :col-span="2" :row-span="3">宽 2 高 3</mu-grid-cell>
  <mu-grid-cell>默认占 1 格</mu-grid-cell>
</mu-grid-box>

<!-- 原子类形式（等价，推荐） -->
<div class="grid" style="grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr)">
  <div style="grid-column: span 2; grid-row: span 3">宽 2 高 3</div>
  <div>默认占 1 格</div>
</div>
```

## 跨度组合规则（以列为例，行同理）

| 属性组合 | 输出 `grid-column` |
|---------|-------------------|
| 仅 `col-start="2"` | `2` |
| 仅 `col-span="3"` | `span 3` |
| 仅 `col-end="4"` | `auto / 5`（内部 `+1` 转为网格线） |
| `col-start="2"` + `col-span="3"` | `2 / span 3` |
| `col-start="1"` + `col-end="3"` | `1 / 3` |

<div class="mu-demo">
  <mu-grid-box :columns="6" :rows="1" style="width: 100%; height: 56px;">
    <mu-grid-cell :col-start="1" :col-end="3" style="background: var(--mu-primary-faint); padding: 8px;">start 1 / end 3</mu-grid-cell>
    <mu-grid-cell :col-start="4" :col-span="3" style="background: var(--mu-success-faint); padding: 8px;">start 4 / span 3</mu-grid-cell>
  </mu-grid-box>
</div>

```html
<mu-grid-box :columns="6" :rows="1">
  <mu-grid-cell :col-start="1" :col-end="3">start 1 / end 3</mu-grid-cell>
  <mu-grid-cell :col-start="4" :col-span="3">start 4 / span 3</mu-grid-cell>
</mu-grid-box>
```

::: warning
`col-end` / `row-end` 是**末轨道号（含端点）**，内部 `+1` 转为网格线；与 `col-span` 同设时 **span 优先**。
:::

## `'auto'` 模板

`columns` / `rows` 传 `'auto'` 时生成 `grid-auto-columns/rows: 1fr`，子项按内容自动分布：

<div class="mu-demo">
  <mu-grid-box columns="auto" rows="auto" style="width: 100%; height: 56px;">
    <mu-grid-cell style="background: var(--mu-bg-fill); padding: 8px;">A</mu-grid-cell>
    <mu-grid-cell style="background: var(--mu-bg-fill); padding: 8px;">B</mu-grid-cell>
    <mu-grid-cell style="background: var(--mu-bg-fill); padding: 8px;">C</mu-grid-cell>
  </mu-grid-box>
</div>

```html
<mu-grid-box columns="auto" rows="auto">...</mu-grid-box>
```

## API

### MuGridBox

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `columns` | String \| Number | — | 列数：数字生成 `grid-template-columns: repeat(n, 1fr)`；`'auto'` 生成 `grid-auto-columns: 1fr` |
| `rows` | String \| Number | — | 行数：数字生成 `grid-template-rows: repeat(n, 1fr)`；`'auto'` 生成 `grid-auto-rows: 1fr` |

### MuGridCell

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `col-start` | Number | — | 起始网格线，输出 `grid-column` 的 start |
| `col-span` | Number | — | 跨度轨道数；与 `col-end` 同设时 **span 优先** |
| `col-end` | Number | — | **末轨道号（含端点）**，内部 `+1` 转为网格线 |
| `row-start` | Number | — | 起始网格线，输出 `grid-row` 的 start |
| `row-span` | Number | — | 跨度轨道数；与 `row-end` 同设时 **span 优先** |
| `row-end` | Number | — | **末轨道号（含端点）**，内部 `+1` 转为网格线 |

> 三者均未设置时不输出该属性（单元格默认占 1 格）。
