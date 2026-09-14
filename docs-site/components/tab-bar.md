<script setup>
  import { ref } from 'vue'

  const activeTab = ref('data')

  const buttons = [
    { name: 'data', caption: '数据' },
    { name: 'chart', caption: '图表' },
    { name: 'report', caption: '报告', disabled: true }
  ]
</script>

# 页签栏 MuTabBar

独立页签栏，**不包含内容区**，用于自定义页签 + 内容分离的布局——如页签栏固定在工具栏中、内容区按页签独立排布等 MuTabs 无法覆盖的场景。

按钮区基于 `MuScrollArea` 实现：溢出时自动显示位移按钮（×2）与列表下拉按钮（点击列表项切换页签），活动页签变化时自动滚入可视区。

## 基础用法

`tab-buttons` 数组定义页签按钮（`{ name, caption, disabled? }`）：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <div class="flex items-center gap-2x">
    <mu-tab-bar v-model:active-tab="activeTab" :tab-buttons="buttons" />
    <span class="text-subtle">当前：{{ activeTab }}</span>
  </div>
  <div class="border border-soft p-2x">
    <p v-if="activeTab === 'data'">数据视图内容</p>
    <p v-if="activeTab === 'chart'">图表视图内容</p>
  </div>
</div>

```html
<mu-tab-bar v-model:active-tab="activeTab" :tab-buttons="buttons" />

<!-- 内容区自行切换 -->
<div v-if="activeTab === 'data'">...</div>
<div v-if="activeTab === 'chart'">...</div>
```

```javascript
const buttons = [
  { name: 'data', caption: '数据' },
  { name: 'chart', caption: '图表' },
  { name: 'report', caption: '报告', disabled: true }
]
```

## 风格与位置

`tab-style` / `tab-position` 取值同 [MuTabs](/components/tabs)；`#prepend` / `#append` 插槽在页签栏前后插入内容：

```html
<mu-tab-bar
  v-model:active-tab="activeTab"
  :tab-buttons="buttons"
  tab-style="lined-simple">
  <template #prepend>
    <mu-icon icon="list" />
  </template>
  <template #append>
    <mu-icon-button icon="plus" size="small" />
  </template>
</mu-tab-bar>
```

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `active-tab` | String | 双向绑定，当前活动页签 |
| `tab-buttons` | Array | 页签按钮数据（`{ name, caption, disabled? }`） |
| `tab-style` | String | `button`（默认）\| `small-button` \| `simple` \| `lined-simple` \| `card` |
| `tab-position` | String | `top`（默认）\| `bottom` \| `left` \| `right` |

| 插槽 | 说明 |
|------|------|
| `prepend` / `append` | 页签栏前置 / 后置内容 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `tab-click` | `name` | 页签按钮点击 |
