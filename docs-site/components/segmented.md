<script setup>
  import { ref } from 'vue'

  const view = ref('list')
  const period = ref('周')
</script>

# 分段控件 MuSegmented

分段控件，在多个互斥选项间切换，带滑块动画。适合视图模式切换、时间范围切换等 2~5 个互斥选项的场景。

## 基础用法

`options` 支持 `[{ value, label, icon?, disabled? }]` 或简单值数组两种形式：

<div class="mu-demo mu-demo-col">
  <mu-segmented v-model="view" :options="[
    { value: 'list', label: '列表', icon: 'list' },
    { value: 'grid', label: '网格', icon: 'grid' },
    { value: 'table', label: '表格', icon: 'table' }
  ]" />
  <mu-segmented v-model="period" :options="['日', '周', '月', '年']" />
</div>

```html
<!-- 对象选项 -->
<mu-segmented v-model="view" :options="[
  { value: 'list', label: '列表', icon: 'list' },
  { value: 'grid', label: '网格', icon: 'grid' },
  { value: 'table', label: '表格', icon: 'table' }
]" />

<!-- 简单值形式 -->
<mu-segmented v-model="period" :options="['日', '周', '月', '年']" />
```

## 图标位置 `icon-position`

`left`（默认，图标在文字左侧）/ `top`（图标在文字上方，常用于大号切换）：

<div class="mu-demo">
  <mu-segmented v-model="view" icon-position="top" :options="[
    { value: 'list', label: '列表', icon: 'list' },
    { value: 'grid', label: '网格', icon: 'grid' }
  ]" />
  <mu-segmented v-model="view" disabled :options="[
    { value: 'list', label: '禁用整组' },
    { value: 'grid', label: '选项 B' }
  ]" />
</div>

```html
<mu-segmented v-model="view" icon-position="top" :options="viewOptions" />
```

## 自定义选项内容

default 插槽作用域暴露 `{ option }`（含 value / label / icon / disabled）：

```html
<mu-segmented v-model="view" :options="options">
  <template #default="{ option }">
    <mu-icon :icon="option.icon" />
    <span>{{ option.label }}</span>
  </template>
</mu-segmented>
```

## 在表单中使用

通过 `MuFormField` 的 `input: 'segmented'` 数据驱动渲染：

```javascript
{
  prop: 'os',
  label: '操作系统',
  input: {
    type: 'segmented',
    options: [
      { label: 'macOS', value: 'macOS' },
      { label: 'linux', value: 'linux' },
      { label: 'windows', value: 'windows' }
    ]
  }
}
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值（当前选中项 value） |
| `options` | Array | — | 选项数组，支持 `[{ value, label, icon?, disabled? }]` 或简单值 `[1, 2, 3]` |
| `disabled` | Boolean | — | 禁用整组（禁用后所有选项不可选） |
| `icon-position` | String | `left` | 图标位置：`left`（图标在文字左侧）\| `top`（图标在文字上方） |

| 插槽 | 说明 |
|------|------|
| `default` | 选项内容模板，作用域参数 `{ option }`（含 value/label/icon/disabled） |
