<script setup>
  import { ref } from 'vue'

  const range = ref({ startDate: new Date(2026, 0, 8), endDate: new Date(2026, 0, 20) })
  const rangeStr = ref({ startDate: '2026-02-01', endDate: '2026-02-10' })
</script>

# 日期区间 MuDateRangeInput

日期区间选择框。单个下拉日期面板，**两次点击确定区间**，适合筛选报表区间、活动起止日期等场景。

交互规则：

- 无开始日期时，点击记为**开始日期**
- 仅有开始日期时，点击早于开始日期的单元格**替换**开始日期；点击相同或更晚的单元格记为**结束日期**
- 已有完整区间时再次点击：清空区间，并以点击日期重新开始
- 选定开始日期后，悬停更晚的单元格会以浅色**预览候选区间**
- 「今天」按钮跳回当月，并按上述规则选中今天

## 基础用法

面板在选中结束日期后**不关闭**，可继续点击调整。

<div class="mu-demo">
  <mu-date-range-input v-model="range" prefix="日期范围" clearable />
</div>

```html
<mu-date-range-input v-model="range" prefix="日期范围" clearable />
```

## 输出类型 `value-type`

与 [MuDateInput](/components/date-input) 一致：默认输出 Date 对象；`value-type="string"` 时按 `value-format` 输出字符串。两侧皆空时 `modelValue` 为 `null`。

<div class="mu-demo">
  <mu-date-range-input
    v-model="rangeStr"
    value-type="string"
    prefix="字符串值"
    clearable />
  <span class="text-subtle">{{ JSON.stringify(rangeStr) }}</span>
</div>

```html
<mu-date-range-input
  v-model="range"
  value-type="string"
  value-format="yyyy-MM-dd" />
```

## 手动输入

输入框可直接输入 `开始日期 ~ 结束日期`（如 `2026-01-08 ~ 2026-01-20`），任一侧可留空：

```html
<mu-date-range-input v-model="range" />
<!-- 输入：2026-01-08 ~ 2026-01-20 -->
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | Object | — | 双向绑定值 `{ startDate, endDate }`；两侧类型由 `value-type` 控制，两侧皆空时为 `null` |
| `format` | String | `null` | 输入框显示格式；为 `null` 时默认 `yyyy-MM-dd` |
| `value-type` | String | `'date'` | 输出值类型：`'date'`（Date 对象）\| `'string'`（按 `value-format` 输出字符串） |
| `value-format` | String | `yyyy-MM-dd` | 仅 `value-type="string"` 时生效 |
| `week-starts-on` | Number | `0` | 每周起始日（0=周日 ~ 6=周六）；默认读全局 `calendar.weekStartsOn` 配置 |
| `min` / `max` | Date\|String | — | 最小 / 最大可选值 |
| `dropdown-class` | String | — | 下拉面板附加 class |
| (其他) | — | — | 透传 `MuInput` 属性及 `MuDropdown` 的 `dropdown-` 前缀属性 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | value | 值变更 |
| `dropdown:show` / `dropdown:hide` | — | 下拉面板展开 / 收起 |

> 配合 `clearable` 显示清空按钮；两侧皆空时 `modelValue` 为 `null`。
