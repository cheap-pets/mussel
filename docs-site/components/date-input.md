<script setup>
  import { ref } from 'vue'

  const date = ref(null)
  const dateStr = ref('2026-01-15')
</script>

# 日期选择 MuDateInput

日期选择框。点击展开下拉日期面板，面板含工具栏（标题、今天/本周/本月/本季/本年快捷按钮、上下翻页）与对应选择网格。

`type` 支持 5 种选择粒度：`date`（默认）/ `week` / `month` / `quarter` / `year`。

## 基础用法

`type="date"` 默认显示日期网格；点击标题按钮可在「日期网格 ↔ 月份网格」间切换（月份网格内可切换十年区间），用于快速跨月/跨年跳转。选中日期即提交并关闭。

<div class="mu-demo">
  <mu-date-input v-model="date" prefix="日期" placeholder="选择日期" />
</div>

```html
<mu-date-input v-model="date" placeholder="选择日期" />
```

## 选择粒度 `type`

`week` 与 `date` 同走月份网格，选中后提交所在周；`month` / `quarter` / `year` 直接进入对应网格。

<div class="mu-demo mu-demo-col">
  <div class="mu-demo-row">
    <mu-date-input v-model="date" type="week" prefix="周" />
    <mu-date-input v-model="date" type="month" prefix="月份" />
  </div>
  <div class="mu-demo-row">
    <mu-date-input v-model="date" type="quarter" prefix="季度" />
    <mu-date-input v-model="date" type="year" prefix="年份" />
  </div>
</div>

```html
<mu-date-input v-model="date" type="week" prefix="周选择" />
<mu-date-input v-model="date" type="month" prefix="月份选择" />
<mu-date-input v-model="date" type="quarter" prefix="季度选择" />
<mu-date-input v-model="date" type="year" prefix="年份选择" />
```

> 「今天/本周/本月/本季/本年」按钮跳回当前并提交，文案随当前视图变化；顶部上下翻页按钮仅在日期/周网格视图出现。

## 输出类型 `value-type` 与格式

- `value-type="date"`（默认）：输出 Date 对象
- `value-type="string"`：按 `value-format` 输出字符串
- `format`：控制输入框**显示**格式，为 `null` 时按 `type` 取默认值（`yyyy-MM-dd` / `yyyy-Www` / `yyyy-MM` / `yyyy-Qq` / `yyyy`）

<div class="mu-demo">
  <mu-date-input v-model="dateStr" value-type="string" value-format="yyyy-MM-dd" prefix="字符串值" />
  <mu-input :model-value="dateStr" readonly prefix="绑定值" style="width: 160px;" />
</div>

```html
<!-- 输出 Date 对象（默认） -->
<mu-date-input v-model="date" />

<!-- 输出字符串 -->
<mu-date-input
  v-model="dateStr"
  value-type="string"
  value-format="yyyy-MM-dd" />

<!-- 自定义显示格式 -->
<mu-date-input v-model="date" format="yyyy/MM/dd" />
```

## 可选范围 `min` / `max`

超出范围的日期置灰不可选：

<div class="mu-demo">
  <mu-date-input v-model="date" min="2026-01-05" max="2026-06-30" prefix="限制范围" />
</div>

```html
<mu-date-input v-model="date" min="2026-01-05" max="2026-06-30" />
```

## 每周起始日 `week-starts-on`

`0`（周日，默认）~ `6`（周六）；未设置时读全局 `calendar.weekStartsOn` 配置（经 `install` 的 componentOptions 传入）。

```html
<mu-date-input v-model="date" :week-starts-on="1" />
```

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | value | 值变更 |
| `dropdown:show` / `dropdown:hide` | — | 下拉面板展开 / 收起 |
| (其他) | — | 透传 `MuInput` 事件（`focus`/`blur`/`enter`/`esc` 等） |

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | Date\|String | — | 双向绑定值；输出形态由 `value-type` 控制 |
| `type` | String | `date` | `date`（选日期）\| `week`（选周）\| `month`（选月份）\| `quarter`（选季度）\| `year`（选年份） |
| `format` | String | `null` | 输入框显示格式；为 `null` 时按 `type` 取默认值 |
| `value-type` | String | `'date'` | 输出值类型：`'date'`（Date 对象）\| `'string'`（按 `value-format` 输出字符串） |
| `value-format` | String | `yyyy-MM-dd` | 仅 `value-type="string"` 时生效的输出格式 |
| `week-starts-on` | Number | `0` | 每周起始日（0=周日 ~ 6=周六）；默认读全局 `calendar.weekStartsOn` 配置 |
| `min` / `max` | Date\|String | — | 最小 / 最大可选值 |
| `dropdown-class` | String | — | 下拉面板附加 class |
| (其他) | — | — | 透传 `MuInput` 属性（`placeholder`/`clearable`/`size`/`prefix`/`suffix`/`disabled`/`readonly` 等）及 `MuDropdown` 的 `dropdown-` 前缀属性 |
