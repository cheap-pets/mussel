# 设计

## 方案概述

新增容器组件 `MuInspector`（`<mu-inspector>`）：接收扁平字段配置数组 `fields` 与当前选中对象 `value`，按内置类型注册表将每个字段映射为既有输入控件（`mu-input` / `mu-select` / `mu-switch` / `mu-color-input` / `mu-radio-group`），复用 `mu-form-field` 承担 label 布局，纵向流式渲染；字段可按 `group` 归组渲染组标题。值为空时渲染空状态（复用 `mu-status-box`）。变更走**受控模式**：任一字段更新时组件不改写 `props.value`，而是生成 `nextValue` 快照，emit `update:value`（配合 `v-model:value`）与 `change(name, value, nextValue)`，由宿主决定采纳方式。

架构取舍（对应探索报告未解问题 1–3，详见「被拒绝的备选」）：

- 不复用 MuForm `items` DSL，采用独立渲染循环——`change` 需要精确字段来源，MuForm 直写 model 拿不到；且 `INPUT_TYPES` 无 `switch`/`number`。
- `number` → `mu-input` + 原生 `type="number"`（`input.js:54-59` 透传），不新增 InputNumber 组件。
- 同时提供 `v-model:value`（`update:*` 惯例，table.vue:87-95 先例）与需求要求的 `change` 事件。

## 遵循约定与复用

提取自探索报告（`01-explore.md`「现有约定」「约束与风险」）：

- **命名**：内部名 `MusselInspector`（`defineOptions({ name })`，form-field.vue:31 先例）；注册名 `MuInspector`（注册按 `Mu` 前缀过滤，components/index.js:31）；模板 kebab-case `<mu-inspector>`。
- **目录与注册**：新目录 `src/components/inspector/`（vue + scss + index.js），以命名导出模块挂载——`import * as InspectorComponents from './inspector'` + `_install(...)`，与 form 模块路径一致（先例：components/index.js:4 导入、:47 挂载）。
- **复用组件**（均已核实存在）：
  - `src/components/form/form-field.vue` — 直接 import（`<script setup>` 中 `MuFormField` 绑定可按 kebab-case `<mu-form-field>` 解析），承担 label 上下排布（`label-align="top"`，form-field.scss:45-52）；其 `inject('form', {})` 缺省为 `{}`，`form.model` 为假使 `control.vModel` 为 false、不渲染默认控件（走插槽），`form.rules?./errors?./setRequired?./setLabel?` 全部可选调用，可脱离 `mu-form` 单独使用（form-field.vue:45,64,83,91,101,107,112）。
  - `src/components/message/status-box.vue` — 空状态默认内容，模板按**全局注册标签** `<mu-status-box>` 使用（`message/index.js:11` 导出 `MuStatusBox`，由 `components/index.js:51` 的 `_install(MessageComponents)` 注册，同 `'mu-input'` 的字符串标签路径）。
  - 输入控件经**字符串标签**引用（`'mu-input'` 等），与 `INPUT_TYPES`（input-types.js）运行时解析方式一致。
- **type 注册表模式**：`INSPECTOR_FIELD_TYPES` 字符串 type → `{ is, attrs }`，未知 type 回落 `text`——沿用 `ColumnTypes`（column-types/index.js:7-25，`resolveColumnType` 未知回落 text）与 `INPUT_TYPES` 先例。
- **状态与变更**：控件绑定用 `:model-value` + `@update:model-value`（不用 `v-model` 直写），父同步用 `update:value` 命名事件（table.vue:87-95 先例）。库内（canvas-table 除外）无组件 emit `change`，本组件的 `change` 为需求（ref-inspector.md:51、验收标准 3）驱动的首例，签名保持需求定义。
- **disabled 下发**：`disabled || null` 写法（switch.vue:2 先例）；`disabled` 为控件级 prop（input.js:9-10）。
- **样式**：BEM + `mu-` 前缀（`.mu-inspector` / `.mu-inspector__group-title`）；scss 就近 import 于 `<script setup>` 首行（switch.vue:9 先例）；间距/高度/文字颜色一律 `--mu-*` 变量，暗色模式随 `.mu-dark` 变量覆盖自动生效，无需额外样式。
- **空值判定**：`isEmpty`（`@/utils/type`，type.js:60-74）。
- **demo**：`demo/src/<category>/<page>/`（main.js 调 `createVueApp`，common/app.js:20-24）+ 登记 `demo/src/catalog.js`；catalog 页面路径必须以分类前缀开头（vite.demo.config.js:66-68），新增页面须重启 `npm run demo:build`。
- **依赖边界**：仅 import `vue` 与库内 `@/utils/*`、`@/components/*`（external 仅 vue）。

## 改动清单（含新增或修改的测试文件）

无测试框架（package.json:10-17 无 test 脚本，AGENTS.md「无测试框架」），demo 页面即验证载体，不新增测试文件。

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/inspector/field-types.js` | 新增：`INSPECTOR_FIELD_TYPES` 注册表 + `resolveFieldControl(field)` | type → 控件映射，注册表模式（ColumnTypes 先例） |
| `src/components/inspector/inspector.vue` | 新增：`MusselInspector` 主组件 | 核心渲染 / 分组 / 空状态 / change 派发 |
| `src/components/inspector/inspector.scss` | 新增：面板与组标题样式 | BEM + `--mu-*` 变量 |
| `src/components/inspector/index.js` | 新增：`export { default as MuInspector } from './inspector.vue'` | 命名导出挂载（form/index.js 先例） |
| `src/components/index.js` | 修改：`import * as InspectorComponents from './inspector'`，在 `_install(FormComponents)` 后追加 `_install(InspectorComponents)` | 统一注册 |
| `demo/src/inspector/inspector/main.js` | 新增：`createVueApp(MainView)` | demo 页入口 |
| `demo/src/inspector/inspector/main-view.vue` | 新增：演示页（基础含 defaultValue / number 规整 / change 日志 / `v-model:value` 受控回写、分组含非相邻同名 group、空状态含 default 与 `empty-text` 覆盖、header 与 empty 插槽、全局与字段级禁用、回归） | 浏览器验证载体，覆盖测试计划全部行 |
| `demo/src/catalog.js` | 修改：form 分类之后新增 `inspector` 分类，登记页面 `inspector/inspector` | 构建期 input 枚举 + 站内导航 |

说明：派发指定 demo 目录为 `demo/src/inspector/`；按 catalog 路径规则（`<category>/<page>`），落为分类目录 `demo/src/inspector/` + 页面子目录 `inspector/`，完整路径 `demo/src/inspector/inspector/`，URL `http://localhost:3000/inspector/inspector/`。

## 接口 / 数据结构

### Props

```js
// inspector.vue（伪代码，仅签名）
defineOptions({ name: 'MusselInspector' })

const props = defineProps({
  // 当前选中数据对象；null / undefined / {} 均视为空，渲染空状态
  value: { type: Object, default: null },
  // 扁平字段配置数组，元素形状见下 InspectorField
  fields: { type: Array, default: () => [] },
  // 全局禁用：与 field.disabled 取或后下发到每个控件
  disabled: { type: Boolean, default: false },
  // 空状态文案（决策见「被拒绝的备选」第 5 条）
  emptyText: { type: String, default: '暂无选中对象' }
})
```

### Emits

```js
const emit = defineEmits(['update:value', 'change'])

// 单字段值更新时（组件不修改 props.value）：
//   value = normalize(rawValue)（如有）
//   nextValue = { ...(props.value || {}), [field.name]: value }
emit('update:value', nextValue)                    // 支持 v-model:value
emit('change', field.name, value, nextValue)       // 需求签名（ref-inspector.md:51）
```

受控语义：宿主须绑定 `v-model:value`（或在 `change` 中回写），否则输入不生效；与需求文档「生成 nextValue → 触发 change」机制一致。

### Slots

| 插槽 | 说明 |
|---|---|
| `header` | 面板顶部操作栏；`$slots.header` 存在时才渲染容器 |
| `empty` | 自定义空状态；默认渲染 `<mu-status-box :message="emptyText" />` |

### InspectorField（字段项形状，纯 JS 以 JSDoc 注释表述于 field-types.js）

```js
/**
 * @property {string}  name            必填，对应 value 的键（假定唯一，重复属使用错误）
 * @property {string}  label           必填，展示标签
 * @property {string}  type            text|number|select|switch|color|radio；缺省/未知回落 text
 * @property {*}       defaultValue    value[name] === undefined 时的回显值（严格 undefined，null 不回落）
 * @property {string}  placeholder     提示文案，仅 text/number/color/select 下发
 * @property {string}  group           分组标题；相同 group 且相邻的字段归入同组
 * @property {boolean} disabled        字段级禁用
 * @property {Array}   options         select/radio 选项，元素 { label, value }；
 *                                     select 场景 value 建议 string|number（select.js:20-33 以 value 作对象键）
 * @property {Object}  componentProps  额外参数，最后合入控件 attrs（可覆盖 placeholder/options/默认 attrs）
 */
```

### 类型注册表 `field-types.js`

```js
// '\.\d+'（小数点后至少一位）：排除 '1.'——`\.\d*` 会匹配 '1.' 并被 Number() 转成 1，
// 使小数点在 type:'text' 受控回写下被吃掉，'1.5' 永远输不出来（见风险 number 条）
const NUMERIC_PATTERN = /^[-+]?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?$/

export const INSPECTOR_FIELD_TYPES = {
  text:   { is: 'mu-input',        acceptsPlaceholder: true },
  number: {
    is: 'mu-input',
    attrs: { type: 'number' },                 // 原生透传（input.vue:21 声明 type prop + input.js:54-59 落到 <input>）
    acceptsPlaceholder: true,
    // '' / null → null；完整数值 → Number；其余（'-'、'1.' 等未完成输入）原样保留字符串
    normalize: v => (
      v === '' || v == null
        ? null
        : NUMERIC_PATTERN.test(String(v)) ? Number(v) : v
    )
  },
  select: { is: 'mu-select',       acceptsPlaceholder: true },
  switch: { is: 'mu-switch' },                 // activeValue/inactiveValue 默认 true/false（switch.vue:24-25）
  color:  { is: 'mu-color-input',  acceptsPlaceholder: true },
  radio:  { is: 'mu-radio-group' }
}

// 返回 { is, attrs, normalize? }；未知 type 回落 text（ColumnTypes 先例）
export function resolveFieldControl (field) {
  const def = INSPECTOR_FIELD_TYPES[field.type] || INSPECTOR_FIELD_TYPES.text
  const attrs = { ...def.attrs }
  if (def.acceptsPlaceholder && field.placeholder != null) attrs.placeholder = field.placeholder
  if (field.options) attrs.options = field.options
  Object.assign(attrs, field.componentProps)   // componentProps 最后合入，可覆盖
  return { is: def.is, attrs, normalize: def.normalize }
}
```

### 模板结构（伪代码）

```html
<div class="mu-inspector">
  <div v-if="$slots.header" class="mu-inspector__header"><slot name="header" /></div>

  <div v-if="isEmptyValue" class="mu-inspector__empty">
    <slot name="empty"><mu-status-box :message="emptyText" /></slot>
  </div>

  <template v-else>
    <template v-for="group in groups" :key="group.key">
      <div v-if="group.title" class="mu-inspector__group-title">{{ group.title }}</div>
      <mu-form-field v-for="field in group.fields" :key="field.name"
        :label="field.label" label-align="top">
        <component
          :is="resolveFieldControl(field).is"
          v-bind="resolveFieldControl(field).attrs"
          :model-value="fieldValue(field)"
          :disabled="disabled || field.disabled || null"
          @update:model-value="v => onFieldInput(field, v)" />
      </mu-form-field>
    </template>
  </template>
</div>
```

### 关键逻辑（伪代码）

```js
const isEmptyValue = computed(() => isEmpty(props.value))          // isEmpty: @/utils/type

// 分组：相邻且 group 值相同的字段归为一组；无 group 的字段归入 title 为 null 的组
// key 必须带字段下标：同名 group 在 fields 中不相邻时会产生多个组，仅用 title 作 key 会重复
const groups = computed(() => {
  const result = []
  let current = null
  props.fields.forEach((field, index) => {
    const title = field.group || null
    if (!current || current.title !== title) {
      current = { title, key: `${index}:${title ?? '__none__'}`, fields: [] }
      result.push(current)
    }
    current.fields.push(field)
  })
  return result
})

// 回显：value[name] === undefined 时回落 defaultValue（ref-inspector.md 行为规范 1，严格 undefined）
function fieldValue (field) {
  const v = props.value?.[field.name]
  return v === undefined ? field.defaultValue : v
}

function onFieldInput (field, rawValue) {
  const { normalize } = resolveFieldControl(field)
  const value = normalize ? normalize(rawValue) : rawValue
  const nextValue = { ...(props.value || {}), [field.name]: value }
  emit('update:value', nextValue)
  emit('change', field.name, value, nextValue)
}
```

### 样式要点（inspector.scss，伪代码）

```scss
.mu-inspector {
  display: flex;                       // 纵向流式（ref 5.3 Vertical Form Layout）
  flex-direction: column;
  width: 100%;
  padding: var(--mu-base-spacing);     // 与 .mu-form 一致（form.scss:7）

  &__header {
    padding: var(--mu-half-spacing) 0 var(--mu-base-spacing);
    border-bottom: 1px solid var(--mu-border-color-soft);
    margin-bottom: var(--mu-base-spacing);
  }

  &__group-title {                     // 参照 .mu-form__title（form.scss:23-36）
    margin-top: var(--mu-base-spacing);
    padding: 0 var(--mu-base-spacing);
    font-weight: 600;
    line-height: var(--mu-control-height-normal);
    color: var(--mu-text-color-strong);

    // 首组无多余间距（form.scss:32-36 同法）；header 插槽渲染时组标题不是 :first-child，需并列处理
    &:first-child,
    .mu-inspector__header + & {
      margin-top: 0;
    }
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--mu-base-spacing) * 2) var(--mu-base-spacing);
    color: var(--mu-text-color-subtle);
  }
}
```

## 被拒绝的备选

1. **复用 MuForm `items` DSL 渲染**（把 fields 编译为 items 传入 `mu-form`）——拒绝。理由：(a) `change` 需精确字段来源，MuForm 经 `v-model="form.model[prop]"` 直写外部对象（form-field.vue:12），inspector 只能深度 watch 全量 diff，拿不到字段名；(b) `INPUT_TYPES` 无 `switch`、无 `number`（input-types.js:1-17），switch 需逐字段写 `input: { is }` 逃生，defaultValue 回显也无从表达；(c) 全局 disabled 两个方案都须 inspector 自行下发（MuForm/MuFormField 无 disabled，探索报告已证实），复用不省事。独立渲染仍复用 `mu-form-field` 与全部输入控件，复用度损失仅限 items 编排层。
2. **直接改写 `props.value[field.name]`**（MuForm 直写模式，不绑定 v-model 也能工作）——拒绝。与需求「生成 nextValue 快照输出、由外层采纳」的机制相悖，且可视化搭建场景（撤销栈/受控状态机）要求宿主持有唯一数据源；受控模式 + `update:value` 与 mu-table `update:*` 先例一致。代价：未绑定 `v-model:value` 时输入不生效，已在接口文档注明。
3. **新增 InputNumber 组件承接 `number` 类型**——拒绝（未解问题 1 裁量）。mussel 无对应组件，`mu-input` 已透传原生 `type="number"`（input.js:54-59）；新增组件扩大改动面且超出验收范围。数值规整由注册表 `normalize` 承担（`'' → null`、完整数值 `Number()`、未完成输入保留字符串）。
4. **支持面板级 `readonly`**（ref-inspector.md 行为规范 2.2 提及）——拒绝。其 Props 表（3.1）与验收标准 3 均只要求禁用；mussel 表单容器亦无 readonly 先例。字段级如需只读可经 `componentProps.readonly` 透传给支持 readonly 的控件（mu-input / mu-color-input）。
5. **emptyText 默认值接 i18n（`t('Inspector.EMPTY')`，zh/en 各加键）**——拒绝（未解问题 4 裁量，mussel 惯例内的取舍）。依据：(a) 设计范围限定为 `src/components/inspector/` + `src/components/index.js` + demo，`src/langs/*.js` 不在范围；(b) `t()` 未命中键时返回路径本身（langs/index.js:27 `value ?? path`），无键调用会显示 `Inspector.EMPTY`；(c) prop + `#empty` 插槽已提供完整覆盖能力（en 场景传 prop 或用插槽）。遗留为未解问题 1。
6. **扩展更多类型（date/segmented/multi-select/memo 等）**——拒绝。超出验收标准 3 列举的核心六类；注册表 + `componentProps`（如 `componentProps: { is: ... }` 不可行，但 `type` 缺省 text 且 componentProps 可覆盖 attrs）已留扩展点，后续加类型只需改 `field-types.js` 一处。

## 风险与回滚

- **回滚**：全部为新增文件，仅两处既有文件小改（`src/components/index.js` 注册、`demo/src/catalog.js` 登记）；回滚 = 删除 `src/components/inspector/`、`demo/src/inspector/` 两目录并还原上述两文件，无既有行为影响。
- **字符串标签解析依赖全局注册**：`'mu-input'` 等需宿主安装 mussel（demo / 文档站均满足）；按需解构引入且未 install 的场景无法解析——与 `INPUT_TYPES` 既有模式风险一致，非新增风险。
- **受控模式心智**：忘记绑定 `v-model:value` 时面板输入不更新，属预期行为，demo 与接口注释需明示。
- **number 原生输入的部分状态丢失**：`<input type="number">` 在输入 `-`、`1.` 等未完成数值时 `value` 返回空串（浏览器行为，非组件代码），受控回写会把中间态清成空，小数与负数无法在 `type="number"` 下逐字符输入。若某字段需要小数/负数，传 `componentProps: { type: 'text' }`（`type` 是 mu-input 已声明的 prop，input.vue:21，可被 componentProps 覆盖），此时注册表 `normalize` 对未完成数值保留字符串、完整数值转 number。此项不覆盖整数以外的自动化验收（见测试计划 number 行）。
- **number 大数/前导零**：由原生 input 与 `Number()` 决定（`'007'` → `7`、超出安全整数丢精度），不做额外处理。
- **mu-select 的 placeholder / disabled 依赖 attrs 透传**：select.vue 只声明 `selectProps`（select.js:4-11），未声明 `placeholder` 与 `disabled`，二者经 fallthrough 落到 combo-wrapper（其 props 展开 `inputProps`，input.js:7-21）；这是全局/字段级禁用在 select 上生效的唯一路径，行为依赖既有实现细节，低风险，改动 select.vue 时需回归。
- **radio 禁用只到容器层**：`mu-radio-group` 把 `disabled` 渲染为容器属性，组内 `mu-radio` 由 CSS `pointer-events: none` 拦截鼠标（check.scss:35-40），原生 `<input>` 未设 `disabled`，键盘 Tab + 方向键仍可切换。属库既有行为，inspector 只透传 `disabled`，不新增修复；若需彻底禁用需改 `radio-group.vue`，超出本设计范围。
- **暗色模式**：全部经 `--mu-*` 变量，`.mu-dark` 覆盖自动生效，无专门样式。
- **demo 新页面须重启**：`buildInputs()` 在配置加载期枚举 catalog 并生成 input（`vite.demo.config.js:60-106`，input 于 L108 固化），验证前重启 `npm run demo:build`。

## 测试计划

验收标准 1（设计齐备一致）：`人工` — 评审/交叉审改核对本文档各节相互引用一致。

验收标准 2（引用真实存在）：`命令`

```bash
ls src/components/form/form-field.vue src/components/message/status-box.vue src/utils/type.js
grep -n "INPUT_TYPES" src/components/form/input-types.js
grep -n "export { default as MuStatusBox }" src/components/message/index.js
grep -n "key.startsWith('Mu')" src/components/index.js
grep -n "isEmpty" src/utils/type.js
```

验收标准 3（核心功能）：`浏览器` — 重启 `npm run demo:build` 后访问 `http://localhost:3000/inspector/inspector/`，逐节核对（DOM 文本/属性断言，必要时截图）：

| 功能 | 检查方式 |
|---|---|
| fields 映射渲染 | 基础用法节：六类字段各渲染出对应控件（DOM 中存在 `input[type=number]`、`.mu-select`、`.mu-switch`、`.mu-color-input`、`.mu-radio-group`、label 文本齐全） |
| 分组 | 分组节：组标题文本出现于 `.mu-inspector__group-title`，顺序与 fields 定义一致；无 group 字段无标题。另需一节验证相邻语义：同名 group 的字段被无 group 字段隔开时渲染为两个同名组标题（与 InspectorField JSDoc「相同 group 且相邻」一致），宿主应保持同组字段相邻 |
| 值回显 | 各控件初值 = 演示 value 对象对应键；defaultValue 节：同一 value 对象保留一个非缺省键、另一字段缺键（`null` / `{}` 会先命中空状态，defaultValue 无从观察），缺键字段显示 defaultValue |
| change 事件 | 修改任一字段（点击/输入）后，页面 change 日志显示 `name`、新值与合并后的完整对象（含 value 中未改字段；仅靠 defaultValue 回显的键不会出现在 nextValue，符合 ref 5.2 的 `{ ...value, [name]: v }`）。color 字段需回车 / 失焦 / 点色块才提交（color-input.vue:73-100），单纯输入不触发 |
| 受控回写 | 修改字段后控件显示新值且 `v-model:value` 宿主数据同步更新（证明 `update:value` 生效）；再改另一字段时首个字段的新值仍在 nextValue 中 |
| 空状态 | 置 value 为 null / `{}`：显示 `暂无选中对象`；传 `empty-text` 的自定义文案生效；`#empty` 插槽节显示自定义内容 |
| 全局禁用 | 断言各控件收到 disabled：`input[disabled]`（text/number/select/color）、`.mu-switch[disabled]`、`.mu-radio-group[disabled]`；可交互性：点击 switch 无变化、input 不可聚焦输入、select 不展开。注意 mu-radio-group 的禁用是容器属性 + `pointer-events: none`（check.scss:35-40），组内原生 radio 未设 `disabled` 属性，键盘仍可能切换（库既有行为，见风险） |
| 字段级禁用 | 指定字段 disabled：仅该控件禁用（同上断言方式），其余可交互 |
| header 插槽 | header 节显示插槽内容；未传插槽的示例无 `.mu-inspector__header` 节点 |
| number 规整 | number 字段输入整数后 change 日志中值为 number 类型；清空后为 null。小数/负数不在自动验收内（`type="number"` 下中间态丢失，见风险与回滚） |
| 暗色模式 | demo 页主题切换后无硬编码颜色残留（人工/截图抽查组标题与空状态） |

验收标准 4（API 符合惯例）：`人工` 对照「遵循约定与复用」核对命名/事件/插槽/props 风格；`浏览器` — demo 代码以 `<mu-inspector v-model:value="..." @change="...">` kebab-case 使用且工作正常，DOM 类名 `mu-inspector`/`mu-inspector__group-title` 符合 BEM。

构建验证：`命令` — `npm run build` 通过（dev + prod 两遍，验证编译与打包）。

## 实施步骤

1. **G1-a** 新建 `src/components/inspector/field-types.js`：注册表 + `resolveFieldControl`。完成判据：文件存在，导出 `INSPECTOR_FIELD_TYPES` 六类映射与 `resolveFieldControl`（由步骤 3 的 node 导入检查验证）。文件集合：`field-types.js`。依赖：无。
2. **G1-b**（与 G1-a 并行）新建 `src/components/inspector/inspector.scss`：面板/标题/空状态样式，全 `--mu-*` 变量。完成判据：文件存在，无硬编码颜色/间距；`stylelint src/components/inspector/inspector.scss` 无报错（stylelint 为全局安装的 `/usr/local/bin/stylelint`，不在 devDependencies，不要用 `npx`）。文件集合：`inspector.scss`。依赖：无。
3. 新建 `src/components/inspector/inspector.vue`（依赖 G1-a/G1-b：import 两者；`<script setup>` 首行须 `import './inspector.scss'`，与 switch.vue:9 一致，漏掉不报错但样式不打包）+ `src/components/inspector/index.js`。完成判据：`node -e "import('./src/components/inspector/field-types.js').then(m => console.log(Object.keys(m)))"` 输出含 `INSPECTOR_FIELD_TYPES` 与 `resolveFieldControl`（前提：`field-types.js` 保持无依赖常量 + 函数；若引入 `@/` 别名依赖，node 无法解析，完成判据改为步骤 5 的 `npm run build`）。注意：此时组件尚未被 `src/components/index.js` 引用，`vite build` 的构建图不含 `inspector.vue`，不能作为编译验证；SFC / SCSS 编译由步骤 5 的 `npm run build` 验证。文件集合：`inspector.vue`、`index.js`。依赖：1、2。
4. 新建 demo 页 `demo/src/inspector/inspector/main.js` + `main-view.vue`（依赖 3：组件已可引用）。完成判据：页面含测试计划所列全部演示节（结构核对；该页面在步骤 5 登记 catalog 后才进入 demo 构建图，编译验证在步骤 6）。文件集合：demo 两文件。依赖：3。
5. **集成步骤**：`src/components/index.js` 追加 import + `_install(InspectorComponents)`；`demo/src/catalog.js` 在 form 分类（L45-95，其后为 data 分类）之后插入 inspector 分类（含 `category / title / desc`）及页面登记（`path: 'inspector/inspector'` + `title` + `desc`，`title` 缺失时面包屑回退为路径，demo-page.vue:54）。完成判据：`grep -n "InspectorComponents" src/components/index.js` 有输出；catalog 含 `inspector/inspector`；`npm run build` 通过（`inspector.vue` / `inspector.scss` 自此进入构建图，编译与打包错误在此暴露）。文件集合：两注册/登记文件（共享文件，串行执行）。依赖：3、4。
6. 验证：重启 `npm run demo:build`（demo 页在步骤 5 登记后才进入 demo 构建图，其编译错误在此暴露），浏览器按测试计划逐项验收；`npm run build` 通过。完成判据：测试计划表格全绿、构建无错误。依赖：5。

## 未解问题

1. **emptyText i18n 遗留**：默认值为中文硬编码（取舍见「被拒绝的备选」5）。后续若接入，需在设计范围中追加 `src/langs/zh.js` / `en.js` 的 `Inspector.EMPTY` 键并将默认值改为 `() => t('Inspector.EMPTY')`。
2. **文档更新遗留**：按项目约定（实现完成经用户确认后才更新文档），本轮改动清单不含 `skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/` 的文档同步；实施验收后需另行派发。
3. **catalog 分类位置**：新增 `inspector` 单页分类置于 form 之后，属作者裁量；若审核认为应并入 form 分类（`demo/src/form/inspector/`），改动清单步骤 4/5 需相应调整路径。
4. **canvas-table 空状态参考**：维持不参考限制（派发约束），空状态交互设计（图标/尺寸/居中）仅基于 `mu-status-box` 既有能力；如需对齐 canvas-table 的空状态视觉，须用户解除限制后修订。
