<script setup>
  import { ref } from 'vue'

  const form = ref({
    name: '',
    phone: '',
    color: 'red',
    type: 'a'
  })
</script>

# 表单字段 MuFormField

表单字段容器：提供标签、必填标记、宽度、后缀与错误信息展示。字段内可放置任意输入组件（slot 自定义），或通过 `input` 配置自动渲染。

置于 [MuForm](/components/form) 内时，字段继承 Form 的 `label-width` / `label-align`，并参与表单校验：输入值变更自动触发校验，错误状态自动同步到内部输入组件的 `invalid` 样式。

## 声明式用法

```html
<mu-form label-width="80px" label-align="right">
  <mu-form-field label="姓名">
    <mu-input v-model="form.name" />
  </mu-form-field>
</mu-form>
```

## input 配置自动渲染

`input` 为字符串时按类型自动渲染对应组件；为对象时完整控制组件与属性。

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-form :model="form" label-width="80px" label-align="left" style="max-width: 560px;">
    <mu-form-row>
      <mu-form-field prop="name" label="文本" :input="{ type: 'text', placeholder: 'text' }" />
      <mu-form-field prop="color" label="颜色" input="color" />
    </mu-form-row>
    <mu-form-row>
      <mu-form-field prop="type" label="类型" :input="{
        type: 'select',
        options: [{ value: 'a', label: '类型 A' }, { value: 'b', label: '类型 B' }]
      }" />
      <mu-form-field prop="phone" label="手机号" input="text" required />
    </mu-form-row>
  </mu-form>
</div>

```html
<mu-form :model="form" label-width="80px">
  <!-- 对象形式：完整控制 -->
  <mu-form-field prop="name" label="文本" :input="{ type: 'text', placeholder: 'text' }" />

  <!-- 字符串形式：按类型自动渲染 -->
  <mu-form-field prop="color" label="颜色" input="color" />
  <mu-form-field prop="type" label="类型" :input="{
    type: 'select',
    clearButton: false,
    options: [{ value: 'a', label: '类型 A' }, { value: 'b', label: '类型 B' }]
  }" />
</mu-form>
```

**input 字符串类型对照：**

| 类型 | 渲染组件 |
|------|---------|
| `'text'` | `<mu-input>` |
| `'memo'` | `<textarea class="mu-input">` |
| `'date'` / `'week'` / `'month'` / `'quarter'` / `'year'` | `<mu-date-input type="...">` |
| `'date-range'` | `<mu-date-range-input>` |
| `'time'` | `<mu-time-input>` |
| `'color'` | `<mu-color-input>` |
| `'select'` | `<mu-select>` |
| `'multi-select'` | `<mu-multi-select>` |
| `'segmented'` | `<mu-segmented>` |
| `'check-group'` | `<mu-check-group>` |
| `'radio-group'` | `<mu-radio-group>` |

## 宽度与换行

`:width`（Number 为比例，如 `1/2`；String 为具体值）控制字段宽度；字段设置 `width: 1/2` 后自动两列排布，`'->'`（items 模式）或 `<mu-flex-break />` 强制换行：

```html
<mu-form :items="[
  { prop: 'a', label: 'A', width: 1 / 2 },
  { prop: 'b', label: 'B', width: 1 / 2 },
  '->',
  { prop: 'c', label: 'C', width: 1 / 3 }
]" />
```

## 错误状态 `error`

- 字符串：显示错误文案 + 错误样式
- `true`：仅显示错误样式，不显示文案

```html
<mu-form-field label="手机号" error="手机号格式不正确">
  <mu-input v-model="form.phone" type="tel" />
</mu-form-field>

<!-- 仅错误样式 -->
<mu-form-field label="备注" error>
  <mu-input v-model="form.memo" />
</mu-form-field>
```

> 在 `MuForm` 内通过 `rules` 校验时无需手动设置 `error`，校验状态自动同步。

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `prop` | String | 对应 `model` 中的字段名，用于双向绑定 |
| `input` | String\|Object | 输入组件配置（见上方「input 配置自动渲染」） |
| `label` | String | 字段标签文字 |
| `label-width` | String | 覆盖 Form 的标签宽度 |
| `label-align` | String | 覆盖 Form 的标签对齐：`left` \| `top` \| `right` |
| `width` | String\|Number | 字段宽度（Number 为比例） |
| `suffix` | String | 字段后缀文字（如单位） |
| `required` | Boolean | 是否必填（添加必填样式并参与表单校验） |
| `error` | Boolean\|String | 手动设置校验错误：字符串显示错误文案，`true` 仅显示错误样式不显示文案 |
