<script setup>
  import { ref } from 'vue'

  const radioValue = ref('2')
  const groupValue = ref('b')

  const groupOptions = [
    { label: 'Radio X', value: 'a' },
    { label: 'Radio Y', value: 'b' },
    { label: 'Radio Z', value: 'c', disabled: true }
  ]
</script>

# 单选 MuRadio / MuRadioGroup

单选按钮与单选按钮组。`MuRadio` 可单独使用，也可放在 `<mu-radio-group>` 内统一管理（`v-model` 为当前选中项的 `value`）。

## 单独使用

<div class="mu-demo">
  <mu-radio v-model="radioValue" value="1" label="Radio 1" />
  <mu-radio v-model="radioValue" value="2" label="Radio 2" />
  <mu-radio v-model="radioValue" value="3" label="Radio 3（禁用）" disabled />
  <span class="text-subtle">{{ radioValue }}</span>
</div>

```html
<mu-radio v-model="selected" value="1" label="Radio 1" />
<mu-radio v-model="selected" value="2" label="Radio 2" />
```

## MuRadioGroup

支持 `options` 属性和默认 slot 两种用法：

<div class="mu-demo mu-demo-col">
  <mu-radio-group v-model="groupValue" :options="groupOptions" />
  <mu-radio-group v-model="groupValue">
    <mu-radio value="a" label="Radio A" />
    <mu-radio value="b" label="Radio B" />
    <mu-radio value="c" label="Radio C（禁用）" disabled />
  </mu-radio-group>
</div>

```html
<!-- options 属性 -->
<mu-radio-group v-model="selected" :options="options" />

<!-- slot 用法 -->
<mu-radio-group v-model="selected">
  <mu-radio value="a" label="Radio A" />
  <mu-radio value="b" label="Radio B" />
</mu-radio-group>
```

## 在表单中使用

通过 `MuFormField` 的 `input: 'radio-group'` 数据驱动渲染：

```javascript
{
  prop: 'color',
  label: '颜色',
  input: {
    type: 'radio-group',
    options: [
      { value: '深空灰色', label: '深空灰' },
      { value: '银色', label: '银色' }
    ]
  }
}
```

## API

### MuRadio

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | — | 双向绑定值 |
| `value` | — | 选项值，必填 |
| `label` | String | 标签文字 |
| `disabled` | Boolean | 禁用状态 |

### MuRadioGroup

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | — | 双向绑定值（当前选中项 value） |
| `options` | Array | 选项数组 `[{ value, label, disabled? }]` |
| `disabled` | Boolean | 禁用整组 |
