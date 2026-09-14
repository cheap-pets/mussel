# Vue 代码风格与规范

基于 `./src/**.vue` 实际代码整理，适用于本仓库（Vue 3 + `<script setup>` + Standard ESLint + BEM）。

---

## 1. 文件组织

### 1.1 目录与命名
- 组件文件统一 **kebab-case**：`search-input.vue`、`combo-wrapper.vue`、`date-table.vue`。
- 按组件类别分目录：`form/`、`layout/`、`dropdown/`、`modal/`、`table/`、`calendar/` 等。
- 每个组件由 3 类文件组成（按需）：
  - `xxx.vue` — SFC 主体（template + script setup）
  - `xxx.js` — 抽离的 props/emits/composable（如 `input.js`、`select.js`、`dropdown-wrapper.js`）
  - `xxx.scss` — 组件样式，在 `<script setup>` 顶部 `import './xxx.scss'`

### 1.2 样式
- 样式与组件同目录、同名，**不使用 `<style scoped>` 块**，改为独立 `.scss` 文件并 `import`（`pagination.vue` 是少有的内联 `<style>` 例外）。
- 命名遵循 **BEM**：
  - Block：`mu-button`、`mu-input`、`mu-dialog`
  - Element：`mu-dialog__header`、`mu-input__prefix`
  - Modifier：`mu-button--primary`、`mu-table--striped`、`mu-dialog--dragging`
  - 状态属性走自定义 attribute：`:disabled="..."`、`:active="..."`、`:invalid="..."`，由 CSS 用 `[disabled]`/`[active]` 选择器匹配。

---

## 2. `<script setup>` 结构

固定顺序（见 `input.vue`、`select.vue`、`dialog.vue`）：

```js
<script setup>
  // 1. 样式 import（如果有独立 scss）
  import './dialog.scss'

  // 2. 第三方库 import
  import { ref, computed, watch } from 'vue'
  import { debounce } from 'throttle-debounce'

  // 3. 内部工具/composable/常量 import（@/ 别名指向 src）
  import { resolveSize } from '@/utils/size'
  import { modalProps, modalEvents, useModal } from './modal'

  // 4. 本组件用到的子组件 import（PascalCase 命名变量）
  import ComboWrapper from './combo-wrapper.vue'

  // 5. defineOptions / defineModel / defineProps / defineEmits
  defineOptions({ name: 'MusselDialog', inheritAttrs: false })

  const props = defineProps({ ...modalProps, width: [String, Number] })
  const emit = defineEmits([...modalEvents, 'buttonClick'])

  // 6. 组合式函数调用，解构响应式状态
  const { ready, container, modalVisible } = useModal(props, emit)

  // 7. 本地 ref / reactive / computed
  const maximized = ref(false)
  const size = computed(() => ({ ... }))

  // 8. 方法定义（用 function 关键字）
  function onDragStart (event) { ... }

  // 9. 生命周期 / watch / provide / defineExpose
  watch(() => props.visible, v => { ... })
  defineExpose({ hide, dialogEl })
</script>
```

要点：
- **缩进 2 空格**，`<script setup>` 内部再缩进一级（`baseIndent: 1`，见 `.eslintrc`）。
- 组件 name 统一 `defineOptions({ name: 'MusselXxx' })`，PascalCase 前缀 `Mussel`。
- **不使用 TypeScript**（`<script setup>` 无 `lang="ts"`），类型靠 props 的 `type` 字段和运行时校验表达。

---

## 3. Props / Emits / Model

### 3.1 复用抽离
跨组件共享或较长的 props/emits 抽到同名 `.js` 文件，通过展开复用：

```js
// input.js
export const inputProps = { invalid: Boolean, readonly: Boolean, ... }
export const inputEmits = ['input', 'focus', 'blur', ...]
export function useInput (model, props, emit) { ... }
```

```js
// input.vue
const props = defineProps({ ...inputProps, type: String, modelValue: null })
const emit = defineEmits([...inputEmits, 'update:modelValue'])
```

### 3.2 类型表达
- 简单类型直接构造器：`disabled: Boolean`、`title: String`、`records: { type: Array, default: () => [] }`。
- 多类型用数组：`width: [String, Number]`、`modelValue: { type: [Date, String, Object, Array] }`。
- 任意类型用 `null`：`modelValue: null`、`headerClass: null`。
- 枚举值用 `validator`：
  ```js
  size: {
    type: String,
    validator: v => ['small', 'normal', 'large'].includes(v)
  }
  ```

### 3.3 v-model
- 优先用宏 `defineModel()` / `defineModel('activeTab', { type: String })`（见 `combo-wrapper.vue`、`tabs.vue`、`button.vue`）。
- 需要接入表单校验时走 `useFieldModel(props, 'modelValue', emit)`（见 `input.vue`、`select.vue`、`check-group.vue`），返回包装后的 `model` ref。
- 兼容 `update:xxx` 事件名一律 **kebab-case**：`'update:modelValue'`、`'update:header-checked'`、`'update:selected-record-key'`。

---

## 4. Template 规范

### 4.1 指令顺序与格式
- 单行短标签可写一行：`<input v-model="model" v-bind="inputAttrs" v-on="inputEvents">`。
- 多属性标签 **每行一个属性**，闭括号 `>` 不换行（`.eslintrc` 里 `html-closing-bracket-newline: never`）：
  ```html
  <button
    type="button"
    :class="['mu-button', colorClass, extraClass]"
    :active="active || null"
    :disabled="isDisabled">
  ```
- 属性**不垂直对齐**（`alignAttributesVertically: false`）。
- `v-if` / `v-for` / `v-bind` / `v-on` / `@click` 顺序遵循 Vue 推荐指令顺序。

### 4.2 布尔属性
统一用 `expr || null` 模式输出，避免渲染 `"false"` 字符串：
```html
:disabled="props.disabled || null"
:active="active || null"
:readonly="props.readonly || null"
```

### 4.3 动态组件 / 列表渲染
用 `<component :is="el.is" v-for="el in items" :key="el.key" v-bind="el.bindings" />` 把数据驱动渲染抽象成统一结构（`select.vue`、`dialog.vue`、`form.vue` 都是这个套路）。

### 4.4 事件
- 模板内事件 **kebab-case**：`@cell-click`、`@sizechange`（自定义事件名连写）、`@dropdown:show`（带命名空间）。
- emit 的事件名在 JS 里用 **camelCase 字符串**：`emit('cellClick', ...)`、`emit('buttonClick', ...)`。

---

## 5. 响应式与函数风格

### 5.1 ref 选择
- DOM 元素引用一律 `shallowRef()`：`const dialogEl = shallowRef()`、`const wrapEl = shallowRef()`。
- 普通响应式状态用 `ref()`。
- 多字段聚合对象用 `reactive()`（如 `form.vue` 里的 `form = reactive({...})`、`table.vue` 的 `hoverStyle = reactive({...})`）。
- 需要避免深层响应的临时上下文用 `shallowReactive({})`（见 `dropdown-panel.vue` 的 `ctx`）。

### 5.2 函数声明
- **方法用 `function` 关键字**（可被 hoist，便于在文件中按逻辑分组）：
  ```js
  function onDragStart (event) { ... }
  function correctPosition () { ... }
  ```
- **回调/防抖/节流用箭头函数**赋值给 const：
  ```js
  const onScroll = throttle(16, () => { ... }, { noLeading: true })
  const debounceCorrectPosition = debounce(300, correctPosition)
  ```

### 5.3 computed
- 简单派生：`const isEmpty = computed(() => !props.records?.length)`。
- 需要可写时显式 get/set：
  ```js
  const value = computed({
    get () { return toString(model.value, props.format) },
    set (v) { model.value = v }
  })
  ```

### 5.4 生命周期与清理
- 监听 window/document 的事件**必须在 `onBeforeUnmount` 清理**（见 `dialog.vue`、`splitter.vue`、`table.vue`）。
- throttle/debounce 的实例在卸载时调 `.cancel()`：
  ```js
  onBeforeUnmount(() => {
    onResize.cancel()
    onScroll.cancel()
  })
  ```

---

## 6. 组件通信

### 6.1 provide / inject
- 父组件 `provide('xxx', { ... })` 暴露上下文，key 用 **camelCase 字符串**：`'form'`、`'table'`、`'tree'`、`'buttonGroup'`、`'checkGroup'`。
- 子组件 `inject('xxx', defaultValue)`，默认值给空对象 `{}` 避免 undefined 报错：
  ```js
  const form = inject('form', {})
  const group = inject('buttonGroup', null)
  ```

### 6.2 defineExpose
需要被父组件通过 ref 调用的方法/状态显式导出：
```js
defineExpose({
  dropdownVisible,
  expand,
  collapse,
  hide
})
```

### 6.3 inheritAttrs
根节点不是单一容器或需要把 `$attrs` 透传到内层时，关掉继承：
```js
defineOptions({ name: 'MusselDialog', inheritAttrs: false })
// 模板里手动 v-bind="$attrs"
```

---

## 7. 路径与导入

- **`@/` 指向 `src/`**，工具类走绝对路径：`import { isString } from '@/utils/type'`、`import { t as $t } from '@/langs'`。
- 同目录文件走相对路径：`import { useInput } from './input'`、`import ComboWrapper from './combo-wrapper.vue'`。
- 引入子组件用 **PascalCase 变量名**：`import DateTable from './date-table.vue'`。
- 引入扩展名：vue 文件保留 `.vue`，js 文件**省略扩展名**（`./input` 而非 `./input.js`），少量历史代码带 `.js`（如 `'../../utils/compatible.js'`），新代码倾向省略。

---

## 8. ESLint 关键规则（`.eslintrc`）

继承 `standard` + `plugin:vue/vue3-recommended`，关键覆盖项：

| 规则 | 值 | 含义 |
|---|---|---|
| `vue/html-indent` | 2 空格，不对齐属性 | 模板缩进 |
| `vue/script-indent` | 2 空格，`baseIndent: 1` | `<script setup>` 内多缩进一级 |
| `vue/html-closing-bracket-newline` | `never` | 闭括号不换行 |
| `vue/max-attributes-per-line` | 关闭 | 允许单行多属性 |
| `vue/multi-word-component-names` | 关闭 | 允许单词组件名（`input.vue`、`tree.vue`） |
| `no-shadow` / `no-shadow-restricted-names` | error | 禁止变量遮蔽 |
| `complexity` | warn 10 | 圈复杂度上限 |
| `max-len` | warn 120 | 行宽，忽略 url/string/comment/template |
| `indent` (in `*.vue`) | off | 由 `vue/script-indent` 接管 |

字符串：**双引号**、**无分号**、**模板字符串优先于字符串拼接**（见 `dialog.vue` 的 `` `${maxTop}px` ``）。

---

## 9. 何时不用 `<script setup>`

极少数纯展示/继承型组件仍用 Options API（`flex-box.vue`、`h-box.vue`）：
- `h-box.vue` 通过 `extends: FlexBox` 复用父组件，setup 语法不直接支持 extends，所以保留 Options API。
- 这类组件 props 简单、无响应式逻辑，Options API 更直观。

新组件应一律用 `<script setup>`。

---

## 10. 一份模板（新组件照抄）

```vue
<template>
  <div
    class="mu-foo"
    :class="{ 'mu-foo--disabled': disabled }"
    :disabled="disabled || null"
    @click="onClick">
    <slot>
      <span>{{ label }}</span>
    </slot>
  </div>
</template>

<script setup>
  import './foo.scss'

  import { ref, computed } from 'vue'

  import { fooProps, useFoo } from './foo'

  defineOptions({ name: 'MusselFoo' })

  const props = defineProps({
    ...fooProps,
    label: String,
    disabled: Boolean,
    modelValue: null
  })

  const emit = defineEmits(['update:modelValue', 'change'])

  const { model } = useFieldModel(props, 'modelValue', emit)
  const { internalState } = useFoo(model, props)

  const cls = computed(() => ({
    'mu-foo--active': internalState.value
  }))

  function onClick (event) {
    emit('change', event)
  }

  defineExpose({ focus: () => {} })
</script>
```
