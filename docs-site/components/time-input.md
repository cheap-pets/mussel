<script setup>
  import { ref } from 'vue'

  const time = ref('09:30:00')
  const timeShort = ref('09:30')
</script>

# 时间选择 MuTimeInput

时间选择框。点击展开下拉面板，内部为「时 / 分 / 秒」三列滚动选择器（始终 24 小时制），底部「确定」按钮提交并关闭。`modelValue` 为 `"HH:mm[:ss]"` 形态的时间字符串。

::: info
输入框本身不可编辑，时间仅通过下拉面板选择；在面板内滚动或点击数字选中后，点击底部「确定」按钮提交并关闭面板。
:::

## 基础用法

<div class="mu-demo">
  <mu-time-input v-model="time" placeholder="时分秒" prefix="时间" />
</div>

```html
<mu-time-input v-model="time" placeholder="选择时间" />
```

## 格式与精度 `format`

`format` 同时控制显示与输出，支持 `HH`/`mm`/`ss` 占位符。设为 `'HH:mm'` 即隐藏秒列：

<div class="mu-demo">
  <mu-time-input v-model="timeShort" format="HH:mm" prefix="时分" />
  <span class="text-subtle">绑定值：{{ timeShort }}</span>
</div>

```html
<!-- 时分选择（隐藏秒） -->
<mu-time-input v-model="time" format="HH:mm" />
```

## 列步进 `minute-step` / `second-step`

列项默认按步进 5（0、5、10…55）生成；取值 `0` | `1` | `5` | `10` | `15` | `30`，`0` 时该列固定为 `00`。需要精确到每一分钟/秒时设为 `1`。

<div class="mu-demo">
  <mu-time-input v-model="time" :second-step="15" prefix="秒步进 15" />
  <mu-time-input v-model="time" :minute-step="0" :second-step="0" format="HH:mm" prefix="仅小时" />
</div>

```html
<!-- 秒按 15 分步进 -->
<mu-time-input v-model="time" :second-step="15" />

<!-- 时分选择器，秒固定为 00 -->
<mu-time-input v-model="time" format="HH:mm" :second-step="0" />

<!-- 仅选择小时 -->
<mu-time-input v-model="time" :minute-step="0" :second-step="0" format="HH:mm" />
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | String | — | 双向绑定值，时间字符串（按 `format` 显示与输出） |
| `format` | String | `HH:mm:ss` | 输入框显示与输出格式，支持 `HH`/`mm`/`ss` 占位符 |
| `minute-step` | Number | `5` | 分钟列步进：`0` \| `1` \| `5` \| `10` \| `15` \| `30`；`0` 时分钟固定为 `00` |
| `second-step` | Number | `5` | 秒列步进，取值同 `minute-step` |
| `dropdown-class` | String | — | 下拉面板附加 class |
| (其他) | — | — | 透传 `MuInput` 属性及 `MuDropdown` 的 `dropdown-` 前缀属性 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | value | 值变更 |
| `dropdown:show` / `dropdown:hide` | — | 下拉面板展开 / 收起 |
