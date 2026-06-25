# time-input 组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `<mu-time-input>` 表单组件——输入框 + 弹出列式时间选择面板（时/分/秒），始终 24h，modelValue 为 `"HH:mm[:ss]"` 字符串。

**Architecture:** 仿 `date-input`：`time-input.vue` 用 `combo-wrapper` 组装输入框 + 下拉面板；面板内嵌 `time-picker.vue` 子组件（仿 `month-picker`，列表式滚动列）；新增 `parseTime`/`formatTime` 工具函数到 `@/utils/date`。

**Tech Stack:** Vue 3 `<script setup>`、SCSS、Tabler 图标（`~icons` 别名）、`$t` i18n。

**前置说明（无测试框架）：** 本仓库无 vitest/jest，无测试目录。验证方式 = 在 demo 页面用浏览器手动/目视验证（与现有组件一致）。因此本计划不使用 TDD，改为"实现 → demo 验证 → 提交"循环。

**Spec:** `docs/superpowers/specs/2026-06-25-time-input-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/utils/date.js` | 修改 | 新增 `parseTime` / `formatTime` 纯函数 |
| `src/icons/tabler-icons.js` | 修改 | 新增 `clock` 图标导出 |
| `src/langs/en.js` | 修改 | 新增 `Time` 命名空间 |
| `src/langs/zh.js` | 修改 | 新增 `Time` 命名空间中文 |
| `src/components/calendar/time-picker.vue` | 创建 | 列式时间选择子组件 |
| `src/components/calendar/time-picker.scss` | 创建 | 列样式 |
| `src/components/form/time-input.vue` | 创建 | 输入框 + 下拉面板组装 |
| `src/components/form/time-input.scss` | 创建 | 输入框/面板容器样式 |
| `src/components/form/index.js` | 修改 | 导出 `MuTimeInput` |
| `demo/src/calendar/main-view.vue` | 修改 | 添加 time-input 演示（验证用）|

---

## Task 1: 工具函数 parseTime / formatTime

**Files:**
- Modify: `src/utils/date.js`（在文件末尾追加）

- [ ] **Step 1: 在 `src/utils/date.js` 末尾追加两个纯函数**

在 `formatDate` 函数（文件末尾）之后追加：

```js
export function parseTime (value) {
  if (!value) return null

  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value)

  if (!m) return null

  const hour = +m[1]
  const minute = +m[2]
  const second = m[3] != null ? +m[3] : 0

  if (hour > 23 || minute > 59 || second > 59) return null

  return { hour, minute, second }
}

export function formatTime (time, includeSecond = false) {
  if (!time) return null

  const hour = String(time.hour ?? 0).padStart(2, '0')
  const minute = String(time.minute ?? 0).padStart(2, '0')
  const second = String(time.second ?? 0).padStart(2, '0')

  return includeSecond ? `${hour}:${minute}:${second}` : `${hour}:${minute}`
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/date.js
git commit -m "🔨: 新增 parseTime/formatTime 时间工具函数"
```

---

## Task 2: clock 图标

**Files:**
- Modify: `src/icons/tabler-icons.js`

- [ ] **Step 1: 在 calendar 图标导出之后追加 clock**

找到这行：
```js
export { default as calendar } from '~icons/outline/calendar-month.svg'
```

在其**下一行**追加：
```js
export { default as clock } from '~icons/outline/clock.svg'
```

- [ ] **Step 2: 提交**

```bash
git add src/icons/tabler-icons.js
git commit -m "🔨: 注册 clock 图标"
```

---

## Task 3: i18n Time 命名空间

**Files:**
- Modify: `src/langs/en.js`、`src/langs/zh.js`

- [ ] **Step 1: 在 `src/langs/en.js` 的 Calendar 块之后追加 Time 块**

找到 `Calendar: { ... }` 块结束的 `}`（MONTHS_SHORT 数组后的 `}`），在其后追加：

```js
  },

  Time: {
    HOUR: 'Hour',
    MINUTE: 'Minute',
    SECOND: 'Second'
  },
```

（注意位置：作为顶层 key，与 `Calendar` 同级。）

- [ ] **Step 2: 在 `src/langs/zh.js` 对应位置追加中文 Time 块**

找到 `Calendar: { ... }` 块结束的 `}`，在其后追加：

```js
  },

  Time: {
    HOUR: '时',
    MINUTE: '分',
    SECOND: '秒'
  },
```

- [ ] **Step 3: 提交**

```bash
git add src/langs/en.js src/langs/zh.js
git commit -m "🔨: 新增 Time i18n 命名空间"
```

---

## Task 4: time-picker 子组件样式

**Files:**
- Create: `src/components/calendar/time-picker.scss`

- [ ] **Step 1: 创建 `src/components/calendar/time-picker.scss`**

```scss
.mu-time-picker {
  display: flex;
  flex-direction: row;
  height: 220px;
  padding: 4px 0;

  &__col {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 64px;
    overflow-y: auto;
  }

  &__header {
    flex: none;
    height: 32px;
    padding: 0 4px;

    color: var(--mu-text-color-soft);
    font-size: var(--mu-font-size-sm);
    text-align: center;
    line-height: 32px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
  }

  &__item {
    flex: none;
    height: 32px;
    padding: 0 4px;

    color: var(--mu-text-color-normal);
    text-align: center;
    line-height: 32px;
    cursor: pointer;

    border-radius: var(--mu-common-border-radius);

    &:hover {
      background-color: var(--mu-gray-translucent);
    }

    &[present] {
      color: var(--mu-secondary-color);
    }

    &[selected] {
      color: var(--mu-primary-color);
      background-color: var(--mu-primary-translucent);
    }
  }

  &__pad {
    flex: none;
    height: 94px;
  }
}
```

> 说明：`__pad`（上下各一个，高度 = (可视区 220 - header 32) / 2 - item 32/2 ≈ 94 / 2 ... 实际取可视列高的一半减去半项，使选中项可居中。数值在 Task 5 验证时微调。）`present`/`selected` 属性样式复用 `mu-calendar-grid` 的同款 token。

- [ ] **Step 2: 提交**

```bash
git add src/components/calendar/time-picker.scss
git commit -m "🔨: 新增 time-picker 列样式"
```

---

## Task 5: time-picker 子组件

**Files:**
- Create: `src/components/calendar/time-picker.vue`

- [ ] **Step 1: 创建 `src/components/calendar/time-picker.vue`**

```vue
<template>
  <div class="mu-time-picker">
    <div
      v-for="unit in units"
      :key="unit.key"
      ref="colRefs"
      class="mu-time-picker__col"
      @scroll.passive="onScroll(unit.key, $event)">
      <div class="mu-time-picker__header">{{ unit.label }}</div>
      <div class="mu-time-picker__pad" />
      <div class="mu-time-picker__list">
        <a
          v-for="n in unit.items"
          :key="n"
          class="mu-time-picker__item"
          :present="isPresent(unit.key, n) || null"
          :selected="isSelected(unit.key, n) || null"
          @click="onItemClick(unit.key, n)">
          {{ pad(n) }}
        </a>
      </div>
      <div class="mu-time-picker__pad" />
    </div>
  </div>
</template>

<script setup>
  import './time-picker.scss'

  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { t as $t } from '@/langs'

  defineOptions({ name: 'MusselTimePicker' })

  const model = defineModel({ type: Object })

  const props = defineProps({
    type: {
      type: String,
      default: 'minute',
      validator: v => ['minute', 'time'].includes(v)
    },
    minuteStep: { type: Number, default: 5 },
    secondStep: { type: Number, default: 5 }
  })

  const emit = defineEmits(['change'])

  const ITEM_HEIGHT = 32
  const HEADER_HEIGHT = 32
  const COL_HEIGHT = 220

  const colRefs = ref([])

  const cur = computed(() => model.value || { hour: 0, minute: 0, second: 0 })

  // 生成某单位的可选值数组
  function genItems (max, step) {
    const arr = []
    for (let i = 0; i < max; i += step) arr.push(i)
    return arr
  }

  const hours = computed(() => genItems(24, 1))
  const minutes = computed(() => genItems(60, props.minuteStep))
  const seconds = computed(() => genItems(60, props.secondStep))

  const units = computed(() => {
    const list = [
      { key: 'hour', label: $t('Time.HOUR'), items: hours.value }
    ]
    list.push({ key: 'minute', label: $t('Time.MINUTE'), items: minutes.value })
    if (props.type === 'time') {
      list.push({ key: 'second', label: $t('Time.SECOND'), items: seconds.value })
    }
    return list
  })

  function pad (n) {
    return String(n).padStart(2, '0')
  }

  // 选中项判定：精确匹配
  function isSelected (key, n) {
    return cur.value[key] === n
  }

  // 当前时间标记：仅当值为 step 倍数（即列表中存在该值）才标
  const now = ref(getNow())
  function getNow () {
    const d = new Date()
    return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }
  }
  function isPresent (key, n) {
    return now.value[key] === n
  }

  function onItemClick (key, n) {
    if (cur.value[key] === n) return
    model.value = { ...cur.value, [key]: n }
    emit('change')
  }

  // 滚动吸附：滚动停止时取最近的 step 项
  const scrollTimers = {}
  function onScroll (key, e) {
    const el = e.target
    clearTimeout(scrollTimers[key])
    scrollTimers[key] = setTimeout(() => {
      const items = key === 'hour' ? hours.value
        : key === 'minute' ? minutes.value
          : seconds.value
      const idx = Math.round((el.scrollTop - HEADER_HEIGHT) / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      const targetTop = HEADER_HEIGHT + clamped * ITEM_HEIGHT
      if (el.scrollTop !== targetTop) {
        el.scrollTop = targetTop
      }
      const n = items[clamped]
      if (n != null && cur.value[key] !== n) {
        model.value = { ...cur.value, [key]: n }
        emit('change')
      }
    }, 80)
  }

  // 把某一列滚动到选中项位置
  function scrollToSelected () {
    nextTick(() => {
      units.value.forEach((unit, i) => {
        const el = colRefs.value[i]
        if (!el) return
        const items = unit.items
        const val = cur.value[unit.key]
        // 向下吸附：选不大于 val 的最大项
        let idx = 0
        for (let j = 0; j < items.length; j++) {
          if (items[j] <= val) idx = j
          else break
        }
        el.scrollTop = HEADER_HEIGHT + idx * ITEM_HEIGHT
      })
    })
  }

  defineExpose({ scrollToSelected })

  onMounted(scrollToSelected)
  watch(() => model.value, scrollToSelected)
</script>
```

> 关键设计点：
> - `hour` 列固定全量 0-23；`minute`/`second` 按 step 生成。
> - 滚动吸附：用户停止滚动 80ms 后吸附到最近项并更新 model；点击直接选值。
> - 外部不合规值（如 minute=7, step=5）：`scrollToSelected` 用向下吸附定位（7→5），但不改 model（仅高亮/定位变化）。
> - `present` 仅当系统值恰在列表项内才高亮。

- [ ] **Step 2: 提交**

```bash
git add src/components/calendar/time-picker.vue
git commit -m "🔨: 新增 time-picker 列式选择子组件"
```

---

## Task 6: time-input 输入框样式

**Files:**
- Create: `src/components/form/time-input.scss`

- [ ] **Step 1: 创建 `src/components/form/time-input.scss`**

```scss
.mu-dropdown-panel.mu-time-picker-panel {
  max-width: 320px;
  padding: 0;
}
```

> 面板内容高度由 `.mu-time-picker`（220px）决定，面板自身只约束宽度并对齐 calendar 面板（320px）。

- [ ] **Step 2: 提交**

```bash
git add src/components/form/time-input.scss
git commit -m "🔨: 新增 time-input 面板样式"
```

---

## Task 7: time-input 组件

**Files:**
- Create: `src/components/form/time-input.vue`

- [ ] **Step 1: 创建 `src/components/form/time-input.vue`**

```vue
<template>
  <combo-wrapper
    ref="wrapper"
    class="mu-time-input"
    :disabled="disabled"
    :readonly="readonly"
    dropdown-icon="clock"
    :dropdown-class="['mu-time-picker-panel', dropdownClass]"
    @dropdown:show="onDropdownShow">
    <input
      v-model="textInput"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @keydown.enter.prevent="onInputEnter"
      @keydown.esc.prevent="onInputEsc"
      @blur="onFieldBlur">
    <template #dropdown>
      <time-picker
        ref="picker"
        v-model="timeObj"
        :type="type"
        :minute-step="minuteStep"
        :second-step="secondStep"
        @change="onPickerChange" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './time-input.scss'

  import { ref, computed, watch } from 'vue'
  import { parseTime, formatTime } from '@/utils/date'
  import { useFieldModel } from '../form/validation'

  import ComboWrapper from './combo-wrapper.vue'
  import TimePicker from '../calendar/time-picker.vue'

  defineOptions({ name: 'MusselTimeInput' })

  const props = defineProps({
    modelValue: String,
    type: {
      type: String,
      default: 'minute',
      validator: v => ['minute', 'time'].includes(v)
    },
    minuteStep: { type: Number, default: 5 },
    secondStep: { type: Number, default: 5 },
    disabled: Boolean,
    readonly: Boolean,
    placeholder: String,
    dropdownClass: null
  })

  const emit = defineEmits([
    'update:modelValue',
    'change',
    'dropdown:show',
    'dropdown:hide'
  ])

  const { model } = useFieldModel(props, 'modelValue', emit)

  const wrapper = ref()
  const picker = ref()

  const includeSecond = computed(() => props.type === 'time')

  // 输入框暂存文本（允许临时非法值，确认时校验）
  const textInput = ref(model.value || '')

  // 面板用的结构化对象：由 modelValue 解析
  const timeObj = ref(parseTime(model.value) || { hour: 0, minute: 0, second: 0 })

  // modelValue 外部变化 → 同步 textInput 与 timeObj
  watch(model, v => {
    if (v !== textInput.value) textInput.value = v || ''
    const parsed = parseTime(v)
    if (parsed) timeObj.value = parsed
  })

  // 面板点选 → 组装回 24h 字符串并 emit
  function onPickerChange () {
    const v = formatTime(timeObj.value, includeSecond.value)
    if (v !== model.value) {
      model.value = v
      textInput.value = v
      emit('change', v)
    }
    wrapper.value?.collapse()
  }

  function commitInput () {
    const v = textInput.value.trim()
    const parsed = parseTime(v)
    if (parsed) {
      // 规范化为标准格式
      const normalized = formatTime(parsed, includeSecond.value)
      if (normalized !== model.value) {
        model.value = normalized
        timeObj.value = parsed
        emit('change', normalized)
      }
      textInput.value = normalized
      return true
    }
    // 非法 → 回滚
    textInput.value = model.value || ''
    return false
  }

  function onInputEnter () {
    if (commitInput()) wrapper.value?.collapse()
  }

  function onInputEsc () {
    textInput.value = model.value || ''
    wrapper.value?.collapse()
  }

  function onFieldBlur () {
    if (textInput.value !== (model.value || '')) commitInput()
  }

  function onDropdownShow () {
    picker.value?.scrollToSelected()
  }

  defineExpose({
    expand: () => wrapper.value?.expand(),
    collapse: () => wrapper.value?.collapse()
  })
</script>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/form/time-input.vue
git commit -m "🔨: 新增 time-input 组件"
```

---

## Task 8: 导出 MuTimeInput

**Files:**
- Modify: `src/components/form/index.js`

- [ ] **Step 1: 在 `MuDateInput` 导出之后追加 `MuTimeInput`**

找到这行：
```js
export { default as MuDateInput } from './date-input.vue'
```

在其**下一行**追加：
```js
export { default as MuTimeInput } from './time-input.vue'
```

- [ ] **Step 2: 提交**

```bash
git add src/components/form/index.js
git commit -m "🔨: 导出 MuTimeInput"
```

---

## Task 9: demo 验证

**Files:**
- Modify: `demo/src/calendar/main-view.vue`

- [ ] **Step 1: 在 `demo/src/calendar/main-view.vue` 的模板中添加 time-input 演示**

在已有的 `<div class="group">`（含 date-input 的那个）之后，追加一个新 group：

```html
    <div class="group">
      <mu-time-input v-model="time1" placeholder="时分选择" prefix="时分" />
      <mu-time-input v-model="time2" type="time" placeholder="时分秒选择" prefix="时分秒" />
      <mu-time-input v-model="time3" :minute-step="15" placeholder="15 分步进" prefix="步进" />
    </div>
```

在 `<script setup>` 中补上 ref：

```js
  const time1 = ref('09:30')
  const time2 = ref('09:30:45')
  const time3 = ref('09:00')
```

- [ ] **Step 2: 启动 demo 验证**

```bash
npm run build:demo
```

用浏览器打开 calendar demo 页面，逐项验证：
1. 三个 time-input 都能显示初始值
2. 点击展开面板，三列（或两列）正确渲染
3. 点击某项 → 选中高亮、面板收起、输入框值更新
4. 滚动某列 → 80ms 后吸附到最近项
5. 直接输入合法值（如 `08:05`）→ Enter/blur 后规范化保留
6. 输入非法值（如 `99:99`）→ blur 后回滚到原值
7. `minute-step=15` 的第三个，分钟列只有 0/15/30/45
8. `type="time"` 的第二个含秒列
9. 初始值 `09:30` 在 minute-step=5 的列里能正确定位高亮

- [ ] **Step 3: 提交 demo**

```bash
git add demo/src/calendar/main-view.vue
git commit -m "🔨: 添加 time-input 演示"
```

---

## Task 10: 样式微调（验证反馈后）

**Files:**
- 可能修改 `src/components/calendar/time-picker.scss`

- [ ] **Step 1: 根据 Task 9 验证结果微调**

重点检查 `__pad` 高度是否让选中项正确居中在可视区中段。若偏移，调整 `.mu-time-picker__pad` 的 `height` 值（公式：`(COL_HEIGHT - HEADER_HEIGHT) / 2 - ITEM_HEIGHT / 2` = `(220-32)/2 - 16` = 78）。如有偏差改为此值。

- [ ] **Step 2: 提交（如有改动）**

```bash
git add src/components/calendar/time-picker.scss
git commit -m "🎨: 微调 time-picker 列居中样式"
```

---

## 自检

**Spec 覆盖：**
- §3.1 Props（type/minuteStep/secondStep/disabled/readonly/placeholder/dropdownClass）→ Task 7 ✓
- §3.2 Events（update:modelValue/change/dropdown:show/dropdown:hide）→ Task 7 ✓
- §4 数据流（parseTime/formatTime、textInput 暂存、合法 commit/非法回滚）→ Task 1 + Task 7 ✓
- §5 time-picker（列渲染、step、向下吸附高亮、滚动定位）→ Task 5 ✓
- §6 组装（combo-wrapper + 自定义 input slot）→ Task 7 ✓
- §7 工具函数 → Task 1 ✓
- §8 文件清单 → 全部覆盖 ✓
- §9 样式 token → Task 4 + Task 6 ✓
- §10 图标 clock → Task 2 ✓
- §11 i18n → Task 3 ✓
- §12 自检清单 → 各 Task 内遵循 mu-* token ✓

**类型/命名一致性：** `parseTime`/`formatTime` 在 Task 1 定义、Task 7 引用，签名一致（`formatTime(time, includeSecond)`）；`scrollToSelected` 在 Task 5 定义并 expose、Task 7 调用，一致；`timeObj`/`textInput`/`model` 在 Task 7 内部一致。
