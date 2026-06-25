# time-input 组件设计

> 日期：2026-06-25
> 状态：待评审
> 目标版本：Mussel 4.0

## 1. 概述

新增 `<mu-time-input>` 表单组件：一个文本输入框，点击展开下拉时间选择面板（时/分/秒列式滚动选择）。与现有 `<mu-date-input>` 的交互模式对齐（输入框 + `combo-wrapper` 弹出），补齐库内"时间"维度的输入能力——目前库只有日期选择，无时间选择。

**核心约束**：始终 24 小时制；modelValue 始终为 24h 字符串 `"HH:mm[:ss]"`。

## 2. 需求决策记录

| 维度 | 决策 | 备注 |
|------|------|------|
| 交互模式 | 输入框 + 弹出时间面板（`combo-wrapper`）| 与 date-input/color-input 一致 |
| 时间单位 | 时 + 分 + 秒（秒可选）| 由 `type` 控制 |
| modelValue 类型 | 纯字符串 `HH:mm[:ss]` | 24h，与 HTML `<input type=time>` 一致 |
| 快捷按钮 | 无 | 不加"现在"/"清除" |
| `type` 默认 | `'minute'`（时+分）| 需秒时显式 `type="time"` |
| minuteStep/secondStep | 默认 5 | step 决定可选值集合 |
| step 语义 | 可选值 = step 倍数；外部不合规值不强制改写，面板向下吸附高亮 | 标准控件语义 |
| 12/24 小时制 | 放弃，始终 24h | YAGNI |

## 3. API 设计

### 3.1 `<mu-time-input>` Props

| Prop | 类型 | 默认 | 校验/说明 |
|------|------|------|----------|
| `modelValue` | `String` | — | `"HH:mm"` 或 `"HH:mm:ss"`，24h |
| `type` | `String` | `'minute'` | `'minute'`（时+分）/ `'time'`（时+分+秒），validator 限定二者 |
| `minuteStep` | `Number` | `5` | 分钟列可选值步长 |
| `secondStep` | `Number` | `5` | 秒列可选值步长 |
| `disabled` | `Boolean` | `false` | 同 `input` |
| `readonly` | `Boolean` | `false` | 同 `input` |
| `placeholder` | `String` | — | 输入框占位 |
| `dropdownClass` | `null` | — | 透传到下拉面板，对齐 date-input |

> 无 `format` prop —— 显示格式由 `type` 推导：`'minute'` → `HH:mm`，`'time'` → `HH:mm:ss`。

### 3.2 Events

| 事件 | 触发时机 |
|------|---------|
| `update:modelValue` | 点选确认 / 输入框合法 commit |
| `change` | 值实际变化时（同 color-input）|
| `dropdown:show` | 面板展开 |
| `dropdown:hide` | 面板收起 |

## 4. 数据流

```
modelValue (string "HH:mm[:ss]")
   │
   ├─ parseTime → 内部 { hour, minute, second }   ← 各列 v-model
   │                                       │
   │                                       └─ 任一列点选 → formatTime → emit update:modelValue
   │
   └─ 输入框显示：直接用 modelValue 字符串本身（字符串进字符串出）
```

- `useFieldModel(props, 'modelValue', emit)` 获取 `model`（同 date-input）。
- 三列各自维护选中值；任一变化即组装字符串并 `emit`。
- **输入框手动编辑**：复用 color-input 的暂存模式（`textInput` ref 暂存）—— blur / Enter 时校验合法（正则 + 范围），合法则 commit，非法则回滚到 modelValue。

## 5. 子组件 `<mu-time-picker>`

### 5.1 定位

放在 `src/components/calendar/time-picker.vue`，与 month-picker/year-picker 同目录（时间/日期"选择器"归类一致）；**不单独导出**到 `calendar/index.js`，作为 time-input 的内部子组件（与 month-picker 不导出一致）。

### 5.2 API

- `defineModel({ type: Object })` —— `{ hour, minute, second }`（hour 始终 24h，0-23）
- props: `type`（`'minute'`/`'time'`）、`minuteStep`、`secondStep`
- emit: `change` —— 任一列选中变化

### 5.3 列渲染规则

| 列 | 范围 | 项数 |
|----|------|------|
| 小时 | `0..23` | 24（固定全量，无 step）|
| 分钟 | `[0, minuteStep, 2*minuteStep, ...] < 60` | `Math.ceil(60 / minuteStep)` |
| 秒 | `[0, secondStep, 2*secondStep, ...] < 60` | `Math.ceil(60 / secondStep)`（仅 `type='time'` 渲染）|

### 5.4 选中/高亮规则（处理外部不合规值）

- **selected**：列项值等于 modelValue 对应单位时高亮。
- **外部不合规值**（如 modelValue 分钟为 7，而 step=5）：高亮**最接近且不大于**的合法项（向下吸附：7→5），**不改写 modelValue**。
- **present**（系统当前时间）：仅当当前分/秒恰为 step 倍数时才标记，否则不标（避免误标）。
- 滚动定位：打开面板时按上述高亮项定位各列 `scrollTop = index * itemHeight`。

### 5.5 列交互

- 点击列项 → 选值 → emit change（time-picker 内部 model 更新，time-input 监听 change 后决定是否 collapse，见 §6）。
- 滚动：朴素 `scrollTop` 定位，无平滑动画（与库内现有组件交互一致）。
- 键盘：首版**不**实现 ↑↓ 导航（YAGNI，与 month-picker 默认无键盘导航一致；后续可扩展）。

## 6. `<mu-time-input>` 组装

采用 color-input 模式（不给 combo-wrapper 传顶层 v-model，自定义 input slot 接管输入）：

```vue
<combo-wrapper
  ref="wrapper"
  class="mu-time-input"
  dropdown-icon="clock"            <!-- 图标待确认，见 §10 -->
  :dropdown-class="[dropdownClass, 'mu-time-picker-panel']"
  @dropdown:show="onDropdownShow">
  <!-- 自定义 input slot，接管输入与暂存 -->
  <input
    v-model="textModel"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    @keydown.enter.prevent="onInputEnter"
    @keydown.esc.prevent="onInputEsc"
    @blur="onFieldBlur">
  <template #dropdown>
    <time-picker
      v-model="timeObj"
      :type="type"
      :minute-step="minuteStep"
      :second-step="secondStep"
      @change="onPickerChange" />
  </template>
</combo-wrapper>
```

- `textModel`：输入框暂存文本（字符串进字符串出，初始 = modelValue）。仅在输入框 `input` 元素上双向绑定，不传给 combo-wrapper 顶层 model。
- `timeObj`：由 `parseTime(modelValue)` 派生；点选后 `formatTime` 回写 modelValue，同时同步 `textModel`。
- `onDropdownShow`：触发 time-picker 把列滚动到当前选中位。
- **collapse 时机**：`onPickerChange` 后 collapse（与 date-input 的 selectDate 一致——选完即关）。秒列存在时同样选完即关（保持简单；如需"逐列选择"后续再加）。

## 7. 工具函数（`@/utils/date.js`）

新增两个纯函数，与现有 `toString`/`toObject`/`equals` 并列：

```js
// "HH:mm[:ss]" → { hour, minute, second }；非法/空返回 null
export function parseTime (value) { ... }

// { hour, minute, second } → "HH:mm" 或 "HH:mm:ss"；由 includeSecond 控制
export function formatTime (time, includeSecond) { ... }
```

- `parseTime`：正则 `/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/`，校验范围（时 0-23，分/秒 0-59）。
- `formatTime`：补零（`String(n).padStart(2, '0')`），缺省 `second` 视作 0。
- **不**复用现有 `toString`（那个面向 Date 对象，时间场景过重）；独立纯函数更清晰、易测。

## 8. 文件清单

### 新增（4 个）

| 文件 | 作用 |
|------|------|
| `src/components/calendar/time-picker.vue` | 列式选择子组件（仿 month-picker）|
| `src/components/calendar/time-picker.scss` | 列样式 |
| `src/components/form/time-input.vue` | 输入框 + 弹出面板组装（仿 date-input）|
| `src/components/form/time-input.scss` | 输入框/面板容器样式 |

### 修改（4 个）

| 文件 | 改动 |
|------|------|
| `src/utils/date.js` | 新增 `parseTime`、`formatTime` |
| `src/langs/en.js` | 新增 `Time` 命名空间（HOUR/MINUTE/SECOND 列头文案）|
| `src/langs/zh.js` | 同步新增 `Time` 命名空间中文 |
| `src/components/form/index.js` | 新增 `export { default as MuTimeInput } from './time-input.vue'`（紧接 MuDateInput 后）|

### 复用

`combo-wrapper.vue`、`useFieldModel`、`@/utils/date`。

## 9. 样式与 Token

- 面板背景、间距、圆角：用 `--mu-*` 变量与原子类（`gap-*`、`p-*`、`bg-strong` 等，与 date-input 面板一致）—— 写时查 `references/styles.md`，不凭记忆。
- 列项选中态：复用 month-picker 的 `selected`/`present` 属性约定（CSS 已在 calendar 通用样式里定义）。
- 面板宽度对齐 `mu-calendar`（`max-width: 320px`），高度随列数自适应。
- 新样式全部挂在 `.mu-time-picker` / `.mu-time-input` / `.mu-time-picker-panel` 下，不污染全局。

## 10. 图标

- 输入框右侧下拉触发图标：`clock`（待实现时在已注册图标集中确认名称；若无 clock 则用最接近的时钟类图标，并在安装文档登记）。
- date-input 用 `calendar`，time-input 用 `clock` 保持语义对称。

## 11. i18n

新增 `Time` 命名空间（列头三语）：

```js
Time: {
  HOUR: 'Hour',     // 时
  MINUTE: 'Minute', // 分
  SECOND: 'Second'  // 秒
}
```

（中文对应：时 / 分 / 秒。）

## 12. 自检清单（对照 references/principles.md）

- [ ] 仅用 `mu-*` token / 原子类，不写裸 CSS 值
- [ ] 不覆盖库内全局样式，新样式挂在组件根 class 下
- [ ] i18n 走 `$t`，无硬编码中英文
- [ ] `<script setup>` + `defineOptions({ name: 'MusselXxx' })`
- [ ] modelValue/props/events 命名对齐库内既有组件

## 13. 不做的事（YAGNI）

- 12/24 小时制切换（始终 24h）
- 范围选择 / `disabled-hours` 等过滤
- 面板快捷按钮（现在/清除）
- 键盘 ↑↓ 列内导航
- 平滑滚动动画
- format prop（由 type 推导）
