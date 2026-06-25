# 布局组件 API

> **组件与原子类的对应关系**：
> MuHBox / MuVBox 内部由 flex 原子类驱动，MuGridBox 由 `.grid` + `grid-template-*` 驱动。
> 下表 Props 列即等价的原子类，简单布局可直接用原子类，复杂参数化布局用组件更省字符。完整原子类清单见 `styles.md` 第 2 节。

### MuFlexBox（基类）

**内部组件，无法直接使用**，Flex 布局容器，MuHBox / MuVBox 基类。方向由子类通过组件选项 `direction` 静态指定（`'row'` / `'col'`），不再作为可传 prop。

| 属性 | 类型 | 默认 | 取值 | 等价原子类 |
|------|------|------|------|-----------|
| `inline` | Boolean | `false` | — | `.inline-flex`（默认 `.flex`） |
| `gap` | String | — | `none` \| `half` \| `1x` \| `2x` \| `3x` \| `4x` | `.gap-{n}x` / `.gap-half` / `.gap-none` |
| `align-items` | String | — | `center` \| `start` \| `end` \| `baseline` \| `stretch` \| `flex-start` \| `flex-end` | `.items-{value}` |
| `justify-content` | String | — | `start` \| `end` \| `left` \| `right` \| `baseline` \| `center` \| `stretch` \| `flex-start` \| `flex-end` \| `space-around` \| `space-between` \| `space-evenly` | `.justify-{value}` |
| `flex-wrap` | Boolean\|String | — | `true` \| `nowrap` \| `wrap` \| `wrap-reverse` | `.flex-wrap` / `.flex-nowrap` |
| `flex-center` | Boolean | — | — | `.flex-center`（同时设 `items-center; justify-center`，**优先级高于 align/justify**） |
| `flex-reverse` | Boolean | — | 仅对 `row` / `col` 方向生效 | 翻转为 `flex-row-reverse` / `flex-col-reverse` |

---

### MuHBox / MuVBox

水平 / 垂直方向的 Flex 布局容器，继承 MuFlexBox 全部 props。方向固定且不可更改：

- **MuHBox**：方向固定为 `'row'`（`.flex-row`），配合 `flex-reverse` 可得到 `flex-row-reverse`
- **MuVBox**：方向固定为 `'col'`（`.flex-col`），配合 `flex-reverse` 可得到 `flex-col-reverse`

> 简单场景推荐直接用原子类，省去组件标签：
> ```html
> <!-- 等价写法 -->
> <mu-h-box gap="2x" align-items="center"><slot/></mu-h-box>
> <div class="flex flex-row gap-2x items-center"><slot/></div>
> ```

```html
<!-- 组件形式 -->
<mu-h-box gap="2x" align-items="center" justify-content="space-between">
  <span>标题</span>
  <mu-button caption="操作" />
</mu-h-box>

<!-- 原子类形式（等价） -->
<div class="flex flex-row gap-2x items-center justify-space-between">
  <span>标题</span>
  <mu-button caption="操作" />
</div>
```

---

### MuGridBox / MuGridCell

CSS Grid 布局容器与单元格。MuGridBox 固定渲染 `.grid`，通过 `rows` / `columns` 自动生成 `repeat(n, 1fr)` 模板。

> **推荐直接使用原子类**：`<div class="grid">` + 原生 `grid-template-*` 内联样式，无需组件。

**MuGridBox 属性：**

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `columns` | Number | — | 列数，自动生成 `grid-template-columns: repeat(n, 1fr)`；非数字值忽略 |
| `rows` | Number | — | 行数，自动生成 `grid-template-rows: repeat(n, 1fr)`；非数字值忽略 |

**MuGridCell 属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `col-start` | Number | `grid-column-start` |
| `col-span` | Number | `grid-column-span` |
| `col-end` | Number | `grid-column-end` |
| `row-start` | Number | `grid-row-start` |
| `row-span` | Number | `grid-row-span` |
| `row-end` | Number | `grid-row-end` |

```html
<!-- 组件形式 -->
<mu-grid-box :columns="6" :rows="6">
  <mu-grid-cell :col-span="2" :row-span="3">宽 2 高 3</mu-grid-cell>
  <mu-grid-cell>默认占 1 格</mu-grid-cell>
</mu-grid-box>

<!-- 原子类形式（等价） -->
<div class="grid" style="grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr)">
  <div style="grid-column-span: 2; grid-row-span: 3">宽 2 高 3</div>
  <div>默认占 1 格</div>
</div>
```

---

### 分隔条（Splitter，内部组件）

**内部组件，不可直接使用**，`MuSplitHBox` / `MuSplitVBox` 面板之间的可拖拽分隔条。
分隔条的形态通过 split-box 的 `splitter-shape` 属性控制，形状取值：

| 取值 | 说明 |
|------|------|
| `hidden` | 默认。不占空间、无可见线，但仍可拖拽 |
| `normal` | 常规宽度的分隔线（4px） |
| `slim` | 细线（2px） |
| `pill` | 不占空间，hover/拖拽时浮现的胶囊把手 |

> 分隔条仅在对应面板**可调整尺寸**（`resizable` 包含该侧）且插槽存在时才渲染。拖拽时尺寸受面板 CSS `min-width` / `max-width`（或 height）约束。

---

### MuSplitHBox / MuSplitVBox

可拖拽分割的弹性布局。HBox 水平排列，VBox 垂直排列。面板间由内部 splitter（分隔条）实现拖拽，并可整体收拢（`collapsible`）。

`left` / `right`（HBox）和 `top` / `bottom`（VBox）插槽均为可选——省略后不渲染对应面板，因此可灵活组成**两区**或**三区**可拖动布局：

```html
<!-- 两区布局：仅 left + center -->
<mu-split-h-box left-width="240px" resizable="left">
  <template #left>导航</template>
  <template #center>主内容</template>
</mu-split-h-box>

<!-- 两区布局：仅 center + bottom -->
<mu-split-v-box bottom-height="200px" resizable="bottom">
  <template #center>主内容</template>
  <template #bottom>终端</template>
</mu-split-v-box>

<!-- 三区布局：完整 left + center + right -->
<mu-split-h-box left-width="200px" right-width="300px" resizable>
  <template #left>侧边栏</template>
  <template #center>主内容</template>
  <template #right>属性面板</template>
</mu-split-h-box>
```

**MuSplitHBox 属性：**

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `resizable` | Boolean \| String | — | 可拖拽面板：`true`（两侧）\| `'left'` \| `'right'` \| `false` |
| `collapsible` | Boolean \| String | — | 可收拢面板：`true`（两侧）\| `'left'` \| `'right'` \| `false`。拖动至该侧 `min-width` 一半以下即收拢为 0 宽（`display:none`），双击重置恢复 |
| `splitter-shape` | String | `'hidden'` | 分隔条形状：`hidden` \| `normal` \| `slim` \| `pill`（详见上方「分隔条」） |
| `dblclick` | String | `'reset'` | 双击分隔条行为：`reset`（重置到初始宽度）\| `none`（无响应） |
| `left-width` | String | `'33.3%'` | 左侧面板初始宽度 |
| `left-class` | String | — | 左侧面板 class |
| `left-style` | Object \| String | — | 左侧面板 style |
| `right-width` | String | `'33.3%'` | 右侧面板初始宽度 |
| `right-class` | String | — | 右侧面板 class |
| `right-style` | Object \| String | — | 右侧面板 style |
| `center-class` | String | — | 中间区域 class |
| `center-style` | Object \| String | — | 中间区域 style |

**MuSplitHBox 插槽：**

| 插槽 | 说明 |
|------|------|
| `left` | 左侧面板内容（有插槽时才渲染） |
| `center` | 中间内容区 |
| `right` | 右侧面板内容（有插槽时才渲染） |

```html
<mu-split-h-box
  left-width="200px"
  right-width="300px"
  resizable
  collapsible
  splitter-shape="pill"
>
  <template #left>侧边栏</template>
  <template #center>主内容</template>
  <template #right>属性面板</template>
</mu-split-h-box>
```

**MuSplitVBox 属性：**

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `resizable` | Boolean \| String | — | 可拖拽面板：`true`（上下）\| `'top'` \| `'bottom'` \| `false` |
| `collapsible` | Boolean \| String | — | 可收拢面板：`true`（上下）\| `'top'` \| `'bottom'` \| `false`。拖动至该侧 `min-height` 一半以下即收拢为 0 高（`display:none`），双击重置恢复 |
| `splitter-shape` | String | `'hidden'` | 分隔条形状：`hidden` \| `normal` \| `slim` \| `pill`（详见上方「分隔条」） |
| `dblclick` | String | `'reset'` | 双击分隔条行为：`reset`（重置到初始高度）\| `none`（无响应） |
| `top-height` | String | `'33.3%'` | 顶部面板初始高度 |
| `top-class` | String | — | 顶部面板 class |
| `top-style` | Object \| String | — | 顶部面板 style |
| `bottom-height` | String | `'33.3%'` | 底部面板初始高度 |
| `bottom-class` | String | — | 底部面板 class |
| `bottom-style` | Object \| String | — | 底部面板 style |
| `center-class` | String | — | 中间区域 class |
| `center-style` | Object \| String | — | 中间区域 style |

**MuSplitVBox 插槽：**

| 插槽 | 说明 |
|------|------|
| `top` | 顶部面板内容（有插槽时才渲染） |
| `center` | 中间内容区 |
| `bottom` | 底部面板内容（有插槽时才渲染） |

```html
<mu-split-v-box
  top-height="40px"
  bottom-height="200px"
  resizable="bottom"
>
  <template #top>工具栏</template>
  <template #center>主内容</template>
  <template #bottom>日志面板</template>
</mu-split-v-box>
```

> **提示：** 双击分隔条可重置面板尺寸到初始值。

---

### MuScrollBox

带非原生渲染滚动条的容器，由 `overflow` 样式控制滚动方向。

```html
<!-- 组件形式，默认自带 overflow: auto -->
<mu-scroll-box style="height: 400px">内容</mu-scroll-box>

<!-- 指令形式，为任意容器添加同款滚动条 -->
<div v-mu-scrollbar style="overflow: auto; height: 400px">内容</div>

<!-- 指令值为 false 时不渲染滚动条 -->
<div v-mu-scrollbar="false" style="overflow: auto">内容</div>
```

---

### MuToolbar

工具栏容器，自带 Flex 布局（`display: flex` + `align-items: center` + `gap`），常用于页面顶部操作区。与 `MuBar` 共享基础条形样式，但无固定高度。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `size` | String | `normal` | 工具栏尺寸：`small` \| `normal`（默认）\| `large`；内部按钮按此尺寸渲染，内部 `MuInput` 继承尺寸（根元素带 `mu-toolbar--small` / `mu-toolbar--large` class） |
| `button-style` | String | `text` | 内部按钮默认风格：`normal` \| `outline` \| `text` \| `link` |

> `MuToolbar` 通过 `provide('toolbar', ...)` 向内部子组件注入 `size` 与 `button-style`：
> - `MuButton` / `MuIconButton`：继承 `size`（设置尺寸）和 `button-style`（作为未显式设置时的默认风格）；
> - `MuInput`：仅继承 `size`（缩小尺寸）。
>
> 子组件显式传入对应属性时优先使用自身设置。
> 另注：`MuPagination` 自身复用 `toolbarProps` / `useToolbar`，它本身就是一个工具栏容器（根元素带 `mu-toolbar` class），向其内部按钮提供 `size` / `button-style`；**它不是 `MuToolbar` 的注入消费者**，而是独立的等价容器。
