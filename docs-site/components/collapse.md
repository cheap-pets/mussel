<script setup>
  import { ref } from 'vue'

  const expandedIds = ref(['basic'])
</script>

# 折叠面板 MuCollapse / MuCollapseGroup

可折叠面板。`mu-collapse` 置于 `mu-collapse-group` 中由组统一管理展开状态，相邻子面板间自动渲染分隔线；独立使用时用 `v-model:expanded` 或 `default-expanded` 控制。

## 基础用法

`default-expand` 设初始展开（`first` \| `all`），面板以 `id` 标识：

<div class="mu-demo mu-demo-col" style="align-items: stretch; max-width: 480px;">
  <mu-collapse-group default-expand="first">
    <mu-collapse id="basic" title="基本信息">
      <p>面板内容，默认插槽支持多根元素。</p>
    </mu-collapse>
    <mu-collapse id="extra" title="附加信息">
      附加信息内容。
    </mu-collapse>
  </mu-collapse-group>
</div>

```html
<mu-collapse-group default-expand="first">
  <mu-collapse id="basic" title="基本信息">面板内容</mu-collapse>
  <mu-collapse id="extra" title="附加信息">附加信息内容</mu-collapse>
</mu-collapse-group>
```

## 手风琴 `accordion`

同时仅展开一个面板；组内多个展开时收敛为第一个：

<div class="mu-demo mu-demo-col" style="align-items: stretch; max-width: 480px;">
  <mu-collapse-group accordion default-expand="first">
    <mu-collapse id="x" title="面板 X">X 内容。</mu-collapse>
    <mu-collapse id="y" title="面板 Y">Y 内容。</mu-collapse>
    <mu-collapse id="z" title="面板 Z">Z 内容。</mu-collapse>
  </mu-collapse-group>
</div>

```html
<mu-collapse-group accordion default-expand="first">
  <mu-collapse id="x" title="面板 X">X 内容。</mu-collapse>
  <mu-collapse id="y" title="面板 Y">Y 内容。</mu-collapse>
</mu-collapse-group>
```

> `accordion` 下 `default-expand="all"` 回退为 `first` 并在 dev 环境警告。

## 受控展开 `v-model:expanded`

组上绑定展开中的面板 id 数组；未绑定时 `default-expand` 才生效：

<div class="mu-demo mu-demo-col" style="align-items: stretch; max-width: 480px;">
  <div class="flex items-center gap-half">
    <mu-button size="small" caption="只开 basic" @click="expandedIds = ['basic']" />
    <mu-button size="small" caption="全开" @click="expandedIds = ['basic', 'extra']" />
    <mu-button size="small" caption="全收" @click="expandedIds = []" />
    <span class="text-subtle">model = {{ expandedIds }}</span>
  </div>
  <mu-collapse-group v-model:expanded="expandedIds">
    <mu-collapse id="basic" title="基本信息">基本信息内容。</mu-collapse>
    <mu-collapse id="extra" title="附加信息">附加信息内容。</mu-collapse>
  </mu-collapse-group>
</div>

```html
<mu-collapse-group v-model:expanded="expandedIds">
  <mu-collapse id="basic" title="基本信息">基本信息内容。</mu-collapse>
  <mu-collapse id="extra" title="附加信息">附加信息内容。</mu-collapse>
</mu-collapse-group>
```

```javascript
const expandedIds = ref(['basic'])
```

## 独立使用与状态

脱离组独立使用时用 `v-model:expanded` / `default-expanded` 控制；`disabled` 禁用并强制收起，`:arrow="false"` 隐藏展开箭头：

```html
<mu-collapse v-model:expanded="open" title="独立面板">内容</mu-collapse>
<mu-collapse default-expanded title="默认展开">初始即展开</mu-collapse>
<mu-collapse disabled title="禁用面板">点击无效，渲染收拢态</mu-collapse>
<mu-collapse :arrow="false" title="无箭头面板">不渲染箭头</mu-collapse>
```

## 自定义头部

`#header` 插槽覆盖整个标题栏（含标题与箭头），作用域提供 `{ expanded, disabled, toggle }`，提供后 `title` 与 `#header-prepend` / `#header-append` 不再渲染。默认点击标题栏即切换；`expand-trigger="custom"` 时头部点击不切换，由内容自行调用 `toggle`：

<!-- 作用域插槽演示，SSR 不兼容，需 ClientOnly -->
<ClientOnly>
  <div class="mu-demo mu-demo-col" style="align-items: stretch; max-width: 480px;">
    <mu-collapse title="被替换的 title">
      <template #header="{ expanded }">
        <span class="text-subtle">{{ expanded ? '▼' : '▶' }}</span>
        <span>自定义 Header（点击整个标题栏切换）</span>
      </template>
      展示型自定义头部，切换交给容器点击。
    </mu-collapse>
    <mu-collapse expand-trigger="custom">
      <template #header="{ expanded, toggle }">
        <span>自定义按钮控制</span>
        <mu-button size="small" :caption="expanded ? '收起' : '展开'" style="margin-left: auto;" @click.stop="toggle" />
      </template>
      头部区域点击不折叠，仅按钮生效。
    </mu-collapse>
    <mu-collapse title="带前后缀的面板">
      <template #header-prepend="{ expanded }">
        <span class="text-subtle">{{ expanded ? 'on' : 'off' }}</span>
      </template>
      <template #header-append>
        <span class="text-subtle">append</span>
      </template>
      内容。
    </mu-collapse>
  </div>
</ClientOnly>

```html
<mu-collapse title="被替换的 title">
  <template #header="{ expanded }">
    <span>{{ expanded ? '▼' : '▶' }}</span>
    <span>自定义 Header（点击整个标题栏切换）</span>
  </template>
  内容。
</mu-collapse>

<mu-collapse expand-trigger="custom">
  <template #header="{ expanded, toggle }">
    <span>自定义按钮控制</span>
    <mu-button size="small" :caption="expanded ? '收起' : '展开'" @click.stop="toggle" />
  </template>
  头部区域点击不折叠，仅按钮生效。
</mu-collapse>
```

## API

### MuCollapse

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `expanded` | Boolean | — | 双向绑定展开状态（独立使用时；组内由 MuCollapseGroup 的 `expanded` 数组管理） |
| `id` | String \| Number | 自动生成 | 组内唯一标识；外部绑定组 `expanded` 数组时需显式设置（`default-expand` 用自动生成 id 即可） |
| `title` | String | — | 标题文字；未提供 `header` 插槽时渲染 |
| `disabled` | Boolean | — | 禁用（组或自身任一禁用即生效，禁用时强制收起） |
| `default-expanded` | Boolean | — | 非受控默认展开（仅独立使用且未绑定 `expanded` 时生效） |
| `arrow` | Boolean | `true` | 标题右侧展开箭头 |
| `expand-trigger` | String | `header` | `header`（点标题栏切换）\| `custom`（自行调用作用域 `toggle`） |

| 插槽 | 作用域 / 说明 |
|------|------|
| `default` | 面板内容 |
| `header` | 覆盖整个标题栏（含标题与箭头）：`{ expanded, disabled, toggle }`；提供后 `title` 与 `header-prepend` / `header-append` 不再渲染 |
| `header-prepend` / `header-append` | 标题前后附加：`{ expanded, disabled, toggle }` |

| 事件 | 参数 | 说明 |
|------|------|------|
| `header-click` | — | 标题栏点击（`expand-trigger="custom"` 时需自行调用作用域 `toggle`） |

### MuCollapseGroup

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `expanded` | Array | `[]` | 双向绑定展开中的面板 id 数组；未绑定时 `default-expand` 才生效 |
| `accordion` | Boolean | — | 手风琴，同时仅展开一个 |
| `disabled` | Boolean | — | 禁用全部子面板 |
| `default-expand` | String | — | `first` \| `all`；accordion 下 `all` 回退 `first` 并 dev 警告 |
