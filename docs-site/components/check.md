<script setup>
  import { ref } from 'vue'

  const single = ref(true)
  const checked = ref(['3'])
  const groupChecked = ref(['b'])

  const groupOptions = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c', disabled: true }
  ]
</script>

# 复选 MuCheck / MuCheckGroup

复选按钮与复选按钮组。`MuCheck` 可单独使用（`v-model` 绑定 Boolean），也可放在 `<mu-check-group>` 内（`v-model` 绑定 Array，收集选中项的 `value`）。

## 单独使用

<div class="mu-demo">
  <mu-check v-model="single" label="Boolean 绑定" />
  <span class="text-subtle">{{ single }}</span>
</div>

```html
<mu-check v-model="checked" label="选项 A" />
```

## 数组多选

多个 `MuCheck` 绑定同一数组，用 `value` 标识各自选项：

<div class="mu-demo">
  <mu-check v-model="checked" label="选项 1" value="1" />
  <mu-check v-model="checked" label="选项 2" value="2" />
  <mu-check v-model="checked" label="选项 3" value="3" />
  <mu-check v-model="checked" label="禁用项" value="4" disabled />
  <span class="text-subtle">{{ checked }}</span>
</div>

```html
<mu-check v-model="checked" label="选项 1" value="1" />
<mu-check v-model="checked" label="选项 2" value="2" />
```

## MuCheckGroup

管理多个 `MuCheck` 的选中状态，支持 `options` 属性和默认 slot 两种用法：

<div class="mu-demo mu-demo-col">
  <mu-check-group v-model="groupChecked" :options="groupOptions" />
  <mu-check-group v-model="groupChecked">
    <mu-check value="a" label="Option A" />
    <mu-check value="b" label="Option B" />
    <mu-check value="c" label="Option C（禁用）" disabled />
  </mu-check-group>
</div>

```html
<!-- options 属性 -->
<mu-check-group v-model="checked" :options="options" />

<!-- slot 用法 -->
<mu-check-group v-model="checked">
  <mu-check value="a" label="选项 A" />
  <mu-check value="b" label="选项 B" />
</mu-check-group>
```

## 在表单中使用

通过 `MuFormField` 的 `input: 'check-group'` 数据驱动渲染：

```javascript
{
  prop: 'features',
  label: '特性',
  input: {
    type: 'check-group',
    options: [
      { value: 'touchbar', label: 'Touch Bar' },
      { value: 'wifi6', label: 'Wi-Fi 6E', disabled: true }
    ]
  }
}
```

## API

### MuCheck

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Boolean\|Array | 双向绑定值 |
| `value` | — | 当 modelValue 为数组时，此项在数组中的对应值 |
| `label` | String | 标签文字 |
| `disabled` | Boolean | 禁用状态 |

### MuCheckGroup

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Array | 双向绑定值（选中项 value 数组） |
| `options` | Array | 选项数组 `[{ value, label, disabled? }]` |
| `disabled` | Boolean | 禁用整组 |
