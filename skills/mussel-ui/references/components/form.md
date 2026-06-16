# 表单与输入组件 API

---

## MuForm

表单容器，支持声明式子组件和 `items` 数组驱动的数据模式。

| 属性 | 类型 | 说明 |
|------|------|------|
| `model` | Object | 表单数据对象，用于 `items` 模式下的双向绑定 |
| `items` | Array | 表单项定义数组（数据驱动模式），结构见下方 |
| `rules` | Object | 表单校验规则，key 为字段名，value 为规则定义 |
| `label-width` | String | 默认标签宽度（子 `MuFormField` 继承） |
| `label-align` | String | 默认标签对齐：`left` \| `top` \| `right` |

**rules 校验规则格式：**

| 格式 | 示例 | 说明 |
|------|------|------|
| 字符串 | `'required'` | 必填校验 |
| 函数 | `(value) => false` | 自定义校验，返回 `false` 或错误消息字符串 |
| 对象 | `{ required: true, message }` | 支持更多配置 |

**rules 对象属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `required` | Boolean | 是否必填 |
| `validator` | Function | 自定义校验函数 `(value, params) => false \| string` |
| `message` | String | 校验失败时的提示消息 |
| `requiredMessage` | String | 必填校验失败的提示消息（优先于 message） |

**方法（通过 ref 调用）：**

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `validate()` | — | `{ ok: true }` \| `{ errors }` | 校验全部字段 |
| `resetValidation()` | — | — | 清除所有校验错误状态 |

**items 数组支持的元素类型：**

| 类型 | 写法 | 说明 |
|------|------|------|
| 标题 | `'字符串'` | 渲染为表单分组标题 |
| 分隔线 | `'hr'` | 渲染为 `<hr>` |
| 换行 | `'->'` | 渲染为 `flex-break`，强制换行 |
| 子行 | `[...]` | 数组元素，渲染为一行 `mu-form-row` |
| 字段 | `{ prop, label, ... }` | 渲染为 `mu-form-field`，自动绑定 `model[prop]` |
| 自定义 | `{ is: '组件名', ... }` | 渲染为任意自定义组件 |

---

## MuFormRow

表单行容器，水平排列多个 `MuFormField`。支持 `items` 数组。

| 属性 | 类型 | 说明 |
|------|------|------|
| `items` | Array | 行内字段定义，支持标题、字段、自定义组件（不支持 `hr` / `->` / 子行） |

---

## MuFormField

表单字段，可自动渲染输入组件或通过 slot 自定义。

| 属性 | 类型 | 说明 |
|------|------|------|
| `prop` | String | 对应 `model` 中的字段名，用于双向绑定 |
| `input` | String\|Object | 输入组件配置（见下方说明） |
| `label` | String | 字段标签文字 |
| `label-width` | String | 覆盖 Form 的标签宽度 |
| `label-align` | String | 覆盖 Form 的标签对齐：`left` \| `top` \| `right` |
| `width` | String\|Number | 字段宽度 |
| `suffix` | String | 字段后缀文字（如单位） |
| `required` | Boolean | 是否必填（添加必填样式并参与表单校验） |
| `error` | String | 手动设置校验错误信息 |

**input 配置：**

- 字符串形式：直接指定输入类型，自动渲染对应组件
  ```javascript
  { prop: 'name', label: '姓名', input: 'text' }          // <mu-input>
  { prop: 'memo', label: '备注', input: 'memo' }          // <textarea class="mu-input">
  { prop: 'date', label: '日期', input: 'date' }          // <mu-date-input>
  { prop: 'month', label: '月份', input: 'month' }        // <mu-date-input type="month">
  { prop: 'year', label: '年份', input: 'year' }          // <mu-date-input type="year">
  { prop: 'type', label: '类型', input: 'select' }        // <mu-select>
  { prop: 'tags', label: '标签', input: 'multi-select' }  // <mu-multi-select>
  { prop: 'view', label: '视图', input: 'segmented' }     // <mu-segmented>
  { prop: 'opts', label: '选项', input: 'check-group' }   // <mu-check-group>
  { prop: 'mode', label: '模式', input: 'radio-group' }   // <mu-radio-group>
  ```
- 对象形式：完整控制组件、属性和绑定行为
  ```javascript
  { prop: 'color', label: '颜色', input: {
    type: 'select',
    clearButton: false,
    options: [{ value: 'red', label: '红色' }]
  }}
  { prop: 'desc', label: '描述', input: { type: 'memo', style: 'height: 200px' }}
  ```

**声明式用法：**

```html
<mu-form label-width="100px" label-align="right">
  <mu-form-row>
    <mu-form-field label="姓名">
      <mu-input v-model="form.name" />
    </mu-form-field>
    <mu-form-field label="手机号">
      <mu-input v-model="form.phone" type="tel" />
    </mu-form-field>
  </mu-form-row>
</mu-form>
```

**数据驱动用法：**

```html
<mu-form ref="formRef" :model="form" :items="items" :rules="rules" label-width="80px" label-align="left" />
<mu-button color="primary" @click="formRef.validate()">提交</mu-button>
```

```javascript
const form = ref({ name: '', phone: '', birthday: '', memo: '', role: '' })

const rules = {
  name: 'required',
  phone: 'required',
  role: { required: true, message: '请选择角色' }
}

const items = [
  '基本信息',
  { prop: 'name', label: '姓名', width: 1 / 2, required: true },
  { prop: 'phone', label: '手机号', width: 1 / 2 },
  'hr',
  [
    { prop: 'birthday', label: '生日', input: 'date' },
    { prop: 'role', label: '角色', input: {
      type: 'select',
      options: [{ value: 'admin', label: '管理员' }, { value: 'user', label: '用户' }]
    }}
  ],
  { prop: 'memo', label: '备注', input: { type: 'memo', style: 'height: 120px' } }
]
```

---

## MuInput

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值 |
| `type` | String | `text` | 原生 input type |
| `placeholder` | String | — | 占位文本 |
| `clearable` | Boolean | 全局配置 | 是否显示清除按钮 |
| `invalid` | Boolean | — | 校验失败样式 |
| `readonly` / `disabled` | Boolean | — | 只读 / 禁用 |
| `prefix` | String\|Object | — | 前置文本或按钮 |
| `suffix` | String\|Object | — | 后置文本或按钮 |
| `tabindex` | String | `-1` | Tab 聚焦顺序 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | value | 值变更 |
| `input` | Event | 原生 input 事件 |
| `focus` | Event | 获焦 |
| `blur` | Event | 失焦 |
| `click` | Event | 点击 |
| `keydown` | Event | 键盘按下 |
| `enter` | — | 回车键（keyCode 13） |
| `esc` | — | ESC 键（keyCode 27） |
| `prefix-click` | — | 前置按钮点击 |
| `suffix-click` | — | 后置按钮点击 |

> 当输入组件置于 `MuFormField` 内部时，表单校验错误状态会自动同步到输入组件的 `invalid` 样式，无需手动设置。输入值变更时也会自动触发该字段的校验。

---

## MuSearchInput

带防抖与默认搜索图标的输入框，常作为列表/表格或下拉选项的过滤搜索框。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `debounce-delay` | Number | `500` | 值变更后触发 `update:modelValue` 的防抖延迟（毫秒） |
| `prefix` | String\|Object | `':icon=search'` | 默认渲染搜索图标（覆盖 MuInput 默认值） |
| `clearable` | Boolean | `true` | 默认显示清除按钮（覆盖 MuInput 默认值） |
| (其他) | — | — | 继承全部 `MuInput` 属性与事件 |

> 内部维护 `localValue` 以保证输入即时显示；`update:modelValue` 仅在用户停止输入 `debounce-delay` 毫秒后才触发（且仅当值确实变化时）。其余事件（`input`、`focus`、`blur`、`enter` 等）即时触发。点击清除按钮会把值置为空字符串 `''`。

---

## MuSelect

单选下拉框，**不需要用户输入时优先使用**。

| 属性 | 类型 | 说明 |
|------|------|------|
| `options` | Array | 下拉选项列表 |
| `option-key` | String | 选项的 key 属性，默认 `value` |
| `value-mode` | String | `normal`（默认）\| `composite`（modelValue 为 `{label, value}`）|
| `dropdown-scrollbar` | Boolean | 是否渲染下拉面板自定义滚动条，默认 `false`（关闭后由内部容器负责滚动） |
| (其他) | — | 继承全部 `MuInput` 属性及 `MuDropdown` 的 `dropdown-` 前缀属性 |

**options 结构：** `[{ label: '管理员', value: 'admin' }]`

**带过滤搜索框的下拉列表：** 不使用 `options`，而是通过 `#dropdown` 插槽自定义下拉内容，配合 `MuSearchInput`（输入过滤）+ `MuScrollBox`（滚动容器）+ `MuOption`（选项）实现可搜索列表。

```html
<mu-select
  v-model="selectedItem"
  placeholder="search & select"
  dropdown-class="combo-search-panel flex flex-col gap-half">
  <template #dropdown>
    <mu-search-input
      v-model="searchKey"
      class="flex-none"
      input-style="solid"
      style="width: 100%;" />
    <mu-scroll-box class="flex-1">
      <mu-option
        v-for="el in filteredItems"
        :key="el"
        :value="el" />
    </mu-scroll-box>
  </template>
</mu-select>
```

```javascript
const searchKey = ref('')
const selectedItem = ref()
const items = new Array(50).fill(0).map((el, idx) => `items${idx}`)
const filteredItems = computed(() =>
  items.filter(item => !searchKey.value || item.includes(searchKey.value))
)
```

```css
.combo-search-panel {
  width: 300px;
  max-height: 240px;
}
```

> `dropdown-scrollbar` 默认为 `false`，下拉面板不渲染自定义滚动条，由内部的 `MuScrollBox` 负责滚动；通过 `dropdown-class` 控制面板宽度与最大高度，并用 flex 布局（`mu-search-input` 固定高度 + `mu-scroll-box` 自适应）让搜索框始终置顶。如需 Mussel 自定义滚动条，设置 `:dropdown-scrollbar="true"`。

---

## MuOption

下拉选项，**必须置于 `MuSelect` / `MuMultiSelect` / `MuComboBox` 的 `#dropdown` 插槽内**。作为 `#dropdown` 插槽自定义下拉内容时的选项单元，点击即向父级 select 提交选中并（单选时）关闭面板。

| 属性 | 类型 | 说明 |
|------|------|------|
| `value` | — | 选项值，必填（选中匹配的依据） |
| `label` | String | 显示文字，缺省时回退到 `value` |
| `icon` | String | 选项前置图标 |
| (其他) | — | 继承 `MuDropdownItem` 属性 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义选项内容，作用域插槽暴露 `{ selected }`（是否处于选中态，Boolean） |

> - 多选模式（父级为 `MuMultiSelect`）下，默认内容会在选中项前显示 `check` 图标；单选模式不显示。
> - 组件在 `mounted` 时向父级 select 注册自身、`unmounted` 时注销，因此必须作为上述 select 组件的子节点使用。
> - 当 `MuSelect` 通过 `options` 属性渲染时，内部会自动生成 `MuOption`，无需手动编写。

---

## MuComboBox

组合输入框，支持输入与单选。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `editable` | Boolean | `false` | 是否允许用户输入 |
| (其他) | — | — | 继承全部 `MuSelect` 属性 |

> 若无需用户输入，使用 `MuSelect`；设置 `editable` 后不支持选项 `label`，直接用 `value` 显示。

---

## MuMultiSelect

下拉多选框。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `max-tags` | Number | `2` | 最大显示已选标签数，超出合并省略 |
| `tag-shrink` | Boolean | `true` | 已选标签是否可缩小 |
| `tag-tooltip` | Boolean | `true` | 已选标签是否显示 tooltip |
| `disabled` / `readonly` | Boolean | — | 禁用 / 只读 |
| (其他) | — | — | 继承全部 `MuSelect` 属性 |

---

## MuDateInput

日期选择框。下拉面板含工具栏（标题、本月/本年按钮、上下翻页）与对应选择网格。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `type` | String | `date` | `date`（选日期）\| `month`（选月份）\| `year`（选年份） |
| `format` | String | `yyyy-MM-dd` | 日期格式 |
| `valueType` | String | `date` | 返回值类型：`date` \| `string` \| `object` |
| `dropdown-class` | String | — | 下拉面板附加 class |
| (其他) | — | — | 继承 `MuInput` 属性（options 相关除外）|

> - `type="date"`：标题按钮可切换到月份/年份选择网格（标题显示 `年 ~ 年+9` 的十年区间），用于快速跨年跳转。
> - `type="year"`：直接进入年份选择网格（每屏 10 年，左右翻页切换十年区间），选中即提交并关闭。
> - `type="month"`：月份选择网格，含十年区间内年份切换 + 12 月份格。
> - 翻页按钮：日期模式翻月，月份/年份模式翻十年区间；「本月/本年」按钮跳回当前。

---

## MuCheck

复选按钮。

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Boolean\|Array | 双向绑定值 |
| `value` | — | 当 modelValue 为数组时，此项在数组中的对应值 |
| `label` | String | 标签文字 |
| `disabled` | Boolean | 禁用状态 |

> 可单独使用（`v-model` 绑定 Boolean），也可放在 `<mu-check-group>` 内（`v-model` 绑定 Array）。

---

## MuCheckGroup

复选按钮组，管理多个 `MuCheck` 的选中状态。

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Array | 双向绑定值（选中项 value 数组） |
| `options` | Array | 选项数组 `[{ value, label, disabled? }]` |
| `disabled` | Boolean | 禁用整组 |

支持 `options` 属性和默认 slot 两种用法：

```html
<!-- options 属性 -->
<mu-check-group v-model="checked" :options="options" />

<!-- slot 用法 -->
<mu-check-group v-model="checked">
  <mu-check value="a" label="选项 A" />
  <mu-check value="b" label="选项 B" />
</mu-check-group>
```

---

## MuRadio

单选按钮。

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | — | 双向绑定值 |
| `value` | — | 选项值，必填 |
| `label` | String | 标签文字 |
| `disabled` | Boolean | 禁用状态 |

> 可单独使用，也可放在 `<mu-radio-group>` 内。

---

## MuRadioGroup

单选按钮组，管理多个 `MuRadio` 的选中状态。

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | — | 双向绑定值（当前选中项 value） |
| `options` | Array | 选项数组 `[{ value, label, disabled? }]` |
| `disabled` | Boolean | 禁用整组 |

支持 `options` 属性和默认 slot 两种用法：

```html
<!-- options 属性 -->
<mu-radio-group v-model="selected" :options="options" />

<!-- slot 用法 -->
<mu-radio-group v-model="selected">
  <mu-radio value="x" label="Radio X" />
  <mu-radio value="y" label="Radio Y" />
</mu-radio-group>
```

---

## MuSegmented

分段控件，在多个互斥选项间切换，带滑块动画。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值（当前选中项 value） |
| `options` | Array | — | 选项数组，支持 `[{ value, label, icon?, disabled? }]` 或简单值 `[1, 2, 3]` |
| `disabled` | Boolean | — | 禁用整组 |
| `icon-position` | String | `left` | 图标位置：`left`（图标在文字左侧）\| `top`（图标在文字上方） |

```html
<mu-segmented v-model="viewMode" :options="[
  { value: 'list', label: '列表', icon: 'list' },
  { value: 'grid', label: '网格', icon: 'grid' },
  { value: 'table', label: '表格', icon: 'table' }
]" />

<!-- 简单值形式 -->
<mu-segmented v-model="period" :options="['日', '周', '月', '年']" />

<!-- 图标在上方 -->
<mu-segmented v-model="view" icon-position="top" :options="viewOptions" />
```

---

## MuSwitch

开关。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值 |
| `label` | String | — | 标签文字 |
| `icon` | String | — | 图标（两侧均显示） |
| `active-icon` | String | — | 激活态图标 |
| `inactive-icon` | String | — | 非激活态图标 |
| `active-label` | String | — | 打开状态文字 |
| `inactive-label` | String | — | 关闭状态文字 |
| `active-value` | — | `true` | 打开状态值 |
| `inactive-value` | — | `false` | 关闭状态值 |
