<script setup>
  import { ref } from 'vue'

  const color = ref('#1C7ED6')
</script>

# 颜色选择 MuColorInput

颜色选择框。前置显示当前色块，右侧为可输入的 HEX 文本框；展开下拉面板显示 Mussel 内置色板——12 个基础色组（red / pink / grape / violet / indigo / blue / cyan / teal / green / lime / yellow / orange，各 10 级色阶）+ 1 组灰阶，共 130 色，点击色格即选中。

`modelValue` 为 HEX 字符串（如 `'#1C7ED6'`）。

## 基础用法

<div class="mu-demo">
  <mu-color-input v-model="color" placeholder="选择颜色" />
  <span class="text-subtle">当前值：{{ color || '（空）' }}</span>
</div>

```html
<mu-color-input v-model="color" placeholder="选择颜色" />
```

::: info
- 内置色板由 `colors` 对象派生，随主题色配置动态变化
- HEX 输入框默认大写显示，允许临时非法值，仅在**回车、失焦、ESC（回滚）**时规范化提交
- 前置色块点击展开下拉面板
:::

## 在表单中使用

通过 `MuFormField` 的 `input: 'color'` 数据驱动渲染：

```html
<mu-form :model="form" :items="[
  { prop: 'themeColor', label: '主题色', input: 'color' }
]" />
```

## 禁用与只读

<div class="mu-demo">
  <mu-color-input value="#37B24D" disabled />
  <mu-color-input value="#F59F00" readonly />
</div>

```html
<mu-color-input value="#37B24D" disabled />
<mu-color-input value="#F59F00" readonly />
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | String | — | 双向绑定值，HEX 字符串（`#RGB` 或 `#RRGGBB`，内部规范化为大写 `#RRGGBB`） |
| `placeholder` | String | — | 占位文本 |
| `dropdown-class` | String | — | 下拉面板附加 class |
| `disabled` / `readonly` | Boolean | — | 禁用 / 只读（透传给内部输入框与色块） |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | hex | 值变更（HEX 字符串） |
| `dropdown:show` / `dropdown:hide` | — | 下拉面板展开 / 收起 |
