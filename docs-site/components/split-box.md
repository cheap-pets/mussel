<script setup>
  import { ref } from 'vue'

  const shape = ref('pill')
</script>

# 分割容器 MuSplitHBox / MuSplitVBox

可拖拽分割的弹性布局。HBox 水平排列（`left` / `center` / `right` 三区），VBox 垂直排列（`top` / `center` / `bottom` 三区）。面板间由内部分隔条（Splitter，内部组件）实现拖拽，并可整体收拢（`collapsible`）。

左右（或上下）插槽均为可选——省略后不渲染对应面板，可灵活组成**两区**或**三区**布局。

## 基础用法（三区 + 可拖拽 + 可收拢）

拖动分隔条调整面板；拖至面板 `min-width` 一半以下即收拢为 0 宽；**双击分隔条重置**到初始尺寸。

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <div class="mu-demo-row">
    <label class="text-subtle">分隔条形状：</label>
    <mu-select v-model="shape" :options="['hidden', 'normal', 'slim', 'pill']" style="width: 120px;" />
  </div>
  <div class="mu-demo-panel" style="height: 420px;">
    <mu-split-h-box
      style="height: 100%;"
      resizable
      collapsible
      :splitter-shape="shape"
      left-width="30%"
      left-class="mu-bg-strong"
      right-width="25%"
      right-class="mu-bg-strong">
      <template #left>
        <div class="flex flex-center" style="height: 100%;">左侧面板</div>
      </template>
      <template #center>
        <div class="flex flex-center" style="height: 100%;">主内容</div>
      </template>
      <template #right>
        <div class="flex flex-center" style="height: 100%;">属性面板</div>
      </template>
    </mu-split-h-box>
  </div>
</div>

```html
<!-- 需要显式高度：父容器给定高度，Split 容器 height: 100% -->
<div style="height: 600px">
  <mu-split-h-box
    style="height: 100%;"
    left-width="200px"
    right-width="300px"
    resizable
    collapsible
    splitter-shape="pill">
    <template #left>侧边栏</template>
    <template #center>主内容</template>
    <template #right>属性面板</template>
  </mu-split-h-box>
</div>
```

## 两区布局

省略一侧插槽即得两区布局：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <div class="mu-demo-panel" style="height: 320px;">
    <mu-split-v-box style="height: 100%;" bottom-height="40%" resizable="bottom">
      <template #center>
        <div class="flex flex-center" style="height: 100%;">主内容</div>
      </template>
      <template #bottom>
        <div class="flex flex-center" style="height: 100%; background: var(--mu-bg-strong);">底部面板</div>
      </template>
    </mu-split-v-box>
  </div>
</div>

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
```

## 嵌套布局

Split 容器可以任意嵌套组合出复杂的工作台布局：

```html
<div class="flex flex-col" style="height: 100vh">
  <mu-split-h-box style="flex: 1;" left-width="220px" right-width="300px" resizable collapsible>
    <template #left>文件树</template>
    <template #center>
      <mu-split-v-box style="height: 100%;" bottom-height="200px" resizable="bottom">
        <template #center>编辑器</template>
        <template #bottom>终端</template>
      </mu-split-v-box>
    </template>
    <template #right>属性面板</template>
  </mu-split-h-box>
</div>
```

::: warning 高度塌陷
Split 容器默认高度为自动（由内容撑开），**必须显式设置高度**才能形成可拖拽的面板区域：外层容器给定固定高度或 flex 拉伸，Split 容器自身设 `height: 100%`（或 `flex: 1`）。否则面板高度塌陷，分隔条不可见。
:::

## 分隔条形状 `splitter-shape`

| 取值 | 说明 |
|------|------|
| `hidden` | 默认。不占空间、无可见线，但仍可拖拽 |
| `normal` | 常规宽度的分隔线（4px） |
| `slim` | 细线（2px） |
| `pill` | 不占空间，hover/拖拽时浮现的胶囊把手 |

> 分隔条仅在对应面板**可调整尺寸**（`resizable` 包含该侧）且插槽存在时才渲染。拖拽时尺寸受面板 CSS `min-width` / `max-width`（或 height）约束——如 `left-style="min-width: 300px"` 可设置拖拽下限。

## API

### MuSplitHBox

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `resizable` | Boolean \| String | — | 可拖拽面板：`true`（两侧）\| `'left'` \| `'right'` \| `false` |
| `collapsible` | Boolean \| String | — | 可收拢面板；侧别值仅决定收拢后哪侧面板应用 `display:none`（`'left'` → 左面板、`'right'` → 右面板、`true` → 两侧） |
| `splitter-shape` | String | `'hidden'` | 分隔条形状：`hidden` \| `normal` \| `slim` \| `pill` |
| `dblclick` | String | `'reset'` | 双击分隔条行为：`reset`（重置到初始宽度）\| `none`（无响应） |
| `left-width` | String | `'33.3%'` | 左侧面板初始宽度 |
| `right-width` | String | `'33.3%'` | 右侧面板初始宽度 |
| `left-class` / `left-style` | — | — | 左侧面板 class / style |
| `right-class` / `right-style` | — | — | 右侧面板 class / style |
| `center-class` / `center-style` | — | — | 中间区域 class / style |

| 插槽 | 说明 |
|------|------|
| `left` / `right` | 左右面板内容（有插槽时才渲染） |
| `center` | 中间内容区 |

### MuSplitVBox

属性与 `MuSplitHBox` 对应：`resizable` 取 `true` \| `'top'` \| `'bottom'`；`top-height` / `bottom-height` 默认 `'33.3%'`；插槽为 `top` / `center` / `bottom`。

> 全局配置：`$mussel.options.splitter.*` 可定制分隔条行为（经 `install` 的 componentOptions 传入）。
