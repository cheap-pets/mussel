# MUSSEL 4 - 组件

该文档为组件开发快速参考，请结合示例代码进行使用



## 1 - 布局



### MuHBox

水平方向的 Flex 布局容器

> [!NOTE]
>
> 建议直接使用 <div class="mu-h-box" />。
>
> 详情参看 box.md 与 flex-layout.md 中的属性配置说明。



### MuVBox

垂直方向的 Flex 布局容器

> [!NOTE]
>
> 建议直接使用 <div class="mu-v-box" />。
>
> 详情参看 box.md 与 flex-layout.md 中的属性配置说明。




### MuGridBox

网格布局容器

> [!NOTE]
>
> 建议直接使用 <div class="mu-grid-box" />。
> 
> 详情参看 box.md 与 grid-layout.md 中的属性配置说明。




### MuGridCell

网格布局单元格容器

> [!NOTE]
>
> 建议直接使用 <div class="mu-grid-cell" />。
>
> 详情参看 box.md 与 grid-layout.md 中的属性配置说明。



### MuFlexSplitter

Flex 布局子元素分隔条，可拖拽调整元素尺寸。

| 属性名称           | 类型    | 说明                                                 |
| ------------------ | ------- | ---------------------------------------------------- |
| size               | String  | 尺寸选项：full - 默认；slim - 细；concealed - 隐蔽   |
| shape              | String  | 形状：line - 线条；bubble - 气泡                     |
| stripe             | Boolean | 是否显示装饰条纹，仅线条形状适用                     |
| space-free         | Boolean | 是否不占用父容器空间，默认 false                     |
| collapse-button    | Boolean | 是否显示收拢按钮，默认 false                         |
| collapse-threshold | Number  | 收拢尺寸阈值， px 单位，默认 200                     |
| resizable          | Boolean | 当为 false 时，不可拖拽调整尺寸，默认 true           |

> [!NOTE]
>
> 仅能用于 Flex 容器中，包括但不限于 MuHBox 和 MuVBox。



### MuScrollBox

带非原生渲染滚动条的容器

示例：

```vue
<template>
  <mu-scroll-box />
	<div v-mu-scrollbar style="overflow: auto" />
  <div v-mu-scrollbar="false" style="overflow: auto" />
</template>
```

> [!NOTE]
>
> 由 overflow (-x / -y) 样式控制滚动条的显示，使用组件时默认自带 overflow: auto 样式。
>
> 亦可使用 v-mu-scrollbar 指令为容器元素增加同款滚动条，指令绑定参数为 false 时将不渲染滚动条。



### MuTabs

多页签容器

| 属性名称      | 类型   | 说明                                        |
| ------------- | ------ | ------------------------------------------- |
| active-tab    | String | 双向绑定属性，用于指定活动标签页的名称      |
| tab-style     | String | button、small-button、simple、card、border-card |
| tab-buttons   | Array  | 页签按钮，默认按内部 tab-panel 组件自动生成 |
| tab-position  | String | top、bottom、left、right                    |
| tab-bar-attrs | Object | 绑定到内置 MuTabBar 的各种属性              |



| 插槽名称        | 说明                 |
| --------------- | -------------------- |
| tab-bar-prepend | 页签按钮栏的前置内容 |
| tab-bar-append  | 页签按钮栏的后置内容 |



| 事件        | 参数   | 说明           |
| ----------- | ------ | -------------- |
| button-click | name   | 页签按钮点击时 |



### MuTabBar

独立使用的页签栏

| 属性名称   | 类型   | 说明                                   |
| ---------- | ------ | -------------------------------------- |
| active-tab | String | 双向绑定属性，用于指定活动标签页的名称 |
| tab-style  | String | button、small-button、simple           |
| tab-buttons | Array  | 页签按钮                               |
| tab-position | String | top、bottom、left、right               |



| 插槽名称 | 说明     |
| -------- | -------- |
| prepend  | 前置内容 |
| append   | 后置内容 |



| 事件        | 参数 | 说明           |
| ----------- | ---- | -------------- |
| button-click | name | 页签按钮点击时 |



### MuTabPanel

单个页签内容容器，必须放置于 MuTabs 中

| 属性名称  | 类型    | 说明                                             |
| --------- | ------- | ------------------------------------------------ |
| name      | String  | 页签名称，在 Tabs 内唯一，用于标识当前选中标签页 |
| icon      | String  | 对应页签栏按钮的图标                             |
| caption   | String  | 对应页签栏按钮的标题                             |
| title     | String  | 对应页签栏按钮的 tooltip 标题                    |
| disabled  | Boolean | 对应页签的禁用状态                               |
| tab-order | Number  | 手动指定的页签顺序，默认值为 null                |



### MuToolbar

工具栏，具有特殊样式的 MuBar



## 2 - 图标、图形、徽章



### MuIcon

图标，支持 svg 和 icon-font class。



图标建议在使用前进行集中注册，这样便于管理应用中所用到的图标。

注册代码示例：

``` javascript
import { install as installMussel, installIcons } from 'mussel'

import MySvgIcon from 'path/name/icon.svg'

const myApp = createApp()

// 在安装 mussel 时注册
installMussel(myApp, {
  icons: {
    icon1: MySvgIcon, // svg data
    icon2: 'icon icon-bolt' // icon-font class
  }
})

// 或在其他时候注册
installIcons({
  icon1: MySvgIcon, // svg data
  icon2: 'icon icon-bolt' // icon-font class
})
```



| 属性名称 | 类型   | 说明                                                  |
| -------- | ------ | ----------------------------------------------------- |
| icon     | String | 已注册的 icon 名称，或者以 "." 开头的 icon-font class |
| tag      | String | 渲染的图标 dom 的 tagName，默认是 span                |



### MuSvgStripe

一个 svg 画的装饰条纹，例如可用于作为拖拽条装饰



### MuBadge

徽章，可用作标签或角标显示

```vue
<template>
	<mu-badge primary|accent|success|warning|danger>{{ caption }}</mu-badge>
</template>
```



## 3 - 按钮、按钮组



### MuButton

各种形态的按钮

| 属性名称     | 类型    | 说明                                              |
| ------------ | ------- | ------------------------------------------------- |
| type         | String  | HTML INPUT 元素 type 属性，默认为 "button"        |
| caption      | String  | 按钮标题                                          |
| icon         | String  | 按钮图标                                          |
| size         | String  | 按钮尺寸：small \| normal \| large                |
| button-style | String  | 按钮风格：normal \| outline \| text \| link       |
| round        | Boolean | 左右圆弧形态                                      |
| active       | Boolean | 选中状态                                          |
| disabled     | Boolean | 禁用状态                                          |
| primary      | Boolean | 主色按钮                                          |
| danger       | Boolean | 危险色按钮                                        |
| accent       | Boolean | 强调色按钮                                        |
| x-color      | String  | 指定特殊的按钮颜色，值可为标准颜色值或 CSS 变量值 |



### MuButtonGroup

按钮组。按钮组的某些外观设置将覆盖其中按钮的设置。

| 属性名称     | 类型    | 说明                                         |
| ------------ | ------- | -------------------------------------------- |
| round        | Boolean | 左右圆弧形态                                 |
| disabled     | Boolean | 禁用状态，若为 true，其内部 Button 全部禁用  |
| size         | String  | 同 MuButton，将覆盖内部 Button 属性          |
| button-style | String  | 按钮风格：normal \| outline                  |
| primary      | Boolean | 默认按钮颜色为主色                           |
| danger       | Boolean | 默认按钮颜色为危险色                         |
| accent       | Boolean | 默认按钮颜色为强调色                         |
| x-color      | String  | 指定特殊的默认按钮颜色                       |



### MuToolButton

用在快速工具栏或列表项中的快捷按钮，仅支持图标，不包含文字标题。

| 属性名称 | 类型    | 说明                                                    |
| -------- | ------- | ------------------------------------------------------- |
| icon     | String  | 按钮图标                                                |
| toggle   | Boolean | 是否开关按钮，若为 true，按下后将会选中或取消选中该按钮 |
| active   | Boolean | 双向绑定属性，表示选中状态                              |
| size     | String  | 按钮尺寸：small \| normal \| large                      |
| animation | String  | 动画效果                                                |



## 4 - 模态窗口、抽屉



### MuDialog

模态对话框

| 属性名称               | 类型              | 说明                                        |
| ---------------------- | ----------------- | ------------------------------------------- |
| visible                | Boolean           | 可见状态                                    |
| width                  | String \| Number  | 窗口宽度                                    |
| height                 | String \| Number  | 窗口高度                                    |
| title                  | String            | 对话框标题                                  |
| icon                   | String \| Object  | 对话框图标                                  |
| close-button           | Boolean           | 是否显示右上角关闭按钮，默认为 true         |
| z-index                | String            | 窗口元素的垂直堆叠顺序                      |
| mask-class             |                   | 遮罩元素 class                              |
| mask-attrs             | Object            | 遮罩元素绑定属性                            |
| easy-hide              | Boolean           | 是否允许快速关闭（点击遮罩、按下 ESC 等）   |
| lazy                   | Boolean           | 为 true 时，仅当第一次打开时渲染对话框内容  |
| keep-position          | Boolean           | 窗口再次打开时，是否使用上次关闭时的位置    |
| buttons                | Array             | 对话框底部的操作按钮                        |
| maximize-button        | Boolean           | 是否显示最大化按钮                          |
| maximize-to-fullscreen | Boolean           | 最大化时是否全屏显示                        |



| 事件           | 参数                                                         | 说明                                   |
| -------------- | ------------------------------------------------------------ | -------------------------------------- |
| update:visible | value - 变更值, <br />action - 触发事件, <br />trigger - 触发元素 | 可在事件中判断触发原因，进行表单检查等 |
| show           |                                                              |                                        |
| hide           |                                                              |                                        |
| button-click   | button                                                       | 按钮点击时触发                          |



| 插槽名称         | 说明                   |
| ---------------- | ---------------------- |
| header           | 自定义头部内容         |
| header-prepend   | 头部前置内容           |
| header-append    | 头部后置内容           |
| footer           | 自定义底部内容         |
| footer-prepend   | 底部前置内容           |
| footer-append    | 底部后置内容           |



### MuDrawer

可从四周浮出的抽屉面板

| 属性名称      | 类型             | 说明                                           |
| ------------- | ---------------- | ---------------------------------------------- |
| visible       | Boolean          | 可见状态                                       |
| width         | String \| Number | 窗口宽度                                       |
| height        | String \| Number | 窗口高度                                       |
| teleport      | Boolean          | 默认 true，是否渲染到指定的页面根容器 DOM 中。 |
| easy-hide     | Boolean          | 是否允许快速关闭（点击遮罩、按下 ESC 等）      |
| mask          | Boolean          | 是否显示遮罩，默认 true                        |
| mask-class    |                  | 遮罩元素 class                                 |
| mask-attrs    | Object           | 遮罩元素绑定属性                               |
| position      | String           | 浮出位置，默认 bottom。top \| right \| bottom \| left |
| border-radius | Boolean          | 是否为圆角                                     |
| z-index       | String           | 窗口元素的垂直堆叠顺序                         |




| 事件           | 参数                                                         | 说明                                   |
| -------------- | ------------------------------------------------------------ | -------------------------------------- |
| update:visible | value - 变更值, <br />action - 触发事件, <br />trigger - 触发元素 | 可在事件中判断触发原因，进行表单检查等 |
| show           |                                                              |                                        |
| hide           |                                                              |                                        |



## 5 - 表单和输入组件



### MuForm

表单容器，支持声明式子组件和 `items` 数组驱动的数据模式。

| 属性名称    | 类型   | 说明                                         |
| ----------- | ------ | -------------------------------------------- |
| model       | Object | 表单数据对象，用于 `items` 模式下的双向绑定  |
| items       | Array  | 表单项定义数组（数据驱动模式），结构见下方   |
| rules       | Object | 表单校验规则，key 为字段名，value 为规则定义 |
| label-width | String | 默认标签宽度（子 MuFormField 继承）          |
| label-align | String | 默认标签对齐：left \| top \| right           |

**items 数组支持的元素类型：**

| 类型     | 写法                  | 说明                                        |
| -------- | --------------------- | ------------------------------------------- |
| 标题     | `'字符串'`            | 渲染为表单分组标题                          |
| 分隔线   | `'hr'`                | 渲染为 `<hr>`                               |
| 换行     | `'->'`                | 渲染为 `flex-break`，强制换行               |
| 子行     | `[...]`               | 数组元素，渲染为一行 MuFormRow              |
| 字段     | `{ prop, label, ... }` | 渲染为 MuFormField，自动绑定 `model[prop]` |
| 自定义   | `{ is: '组件名', ... }` | 渲染为任意自定义组件                      |

**rules 校验规则格式：**

| 格式       | 示例                           | 说明                                           |
| ---------- | ------------------------------ | ---------------------------------------------- |
| 字符串     | `'required'`                  | 必填校验                                       |
| 函数       | `(value) => false`            | 自定义校验，返回 `false` 或错误消息字符串      |
| 对象       | `{ required: true, message }` | 支持更多配置，见下方                           |

**rules 对象属性：**

| 属性    | 类型     | 说明                                                 |
| ------- | -------- | ---------------------------------------------------- |
| required | Boolean | 是否必填                                             |
| validator | Function | 自定义校验函数 `(value, params) => false \| string` |
| message | String   | 校验失败时的提示消息                                 |
| requiredMessage | String | 必填校验失败的提示消息（优先于 message）      |

**方法：**

| 方法             | 参数 | 说明                                                         |
| ---------------- | ---- | ------------------------------------------------------------ |
| validate()       | —    | 校验全部字段，返回 `{ ok: true }` 或 `{ errors }`            |
| resetValidation() | —   | 清除所有校验错误状态                                         |

**数据驱动用法示例：**

```javascript
const form = ref({ name: '', phone: '', birthday: '', role: '' })

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
  ]
]
```

```html
<mu-form ref="formRef" :model="form" :items="items" :rules="rules" label-width="80px" />
<mu-button @click="formRef.validate()" />
```



### MuFormRow

表单行容器，水平排列多个 MuFormField。支持 `items` 数组。

| 属性名称 | 类型  | 说明                                                       |
| -------- | ----- | ---------------------------------------------------------- |
| items    | Array | 行内字段定义，支持标题、字段、自定义组件（不支持 hr / -> / 子行） |



### MuFormField

表单字段，可自动渲染输入组件或通过 slot 自定义。

| 属性名称    | 类型             | 说明                                             |
| ----------- | ---------------- | ------------------------------------------------ |
| prop        | String           | 对应 model 中的字段名，用于双向绑定              |
| input       | String \| Object | 输入组件配置（见下方 input 配置说明）            |
| label       | String           | 字段标签文字                                     |
| label-width | String           | 覆盖 Form 的标签宽度                             |
| label-align | String           | 覆盖 Form 的标签对齐：left \| top \| right       |
| width        | String \| Number | 字段宽度                                     |
| suffix      | String           | 字段后缀文字（如单位）                           |
| required    | Boolean          | 是否必填（添加必填样式并参与表单校验）           |
| error       | String           | 手动设置校验错误信息                             |

**input 配置：**

字符串形式 — 直接指定输入类型，自动渲染对应组件：

| input 值        | 渲染组件             |
| --------------- | -------------------- |
| `'text'`        | mu-input             |
| `'memo'`        | textarea.mu-input    |
| `'date'`        | mu-date-input        |
| `'month'`       | mu-date-input(type=month) |
| `'select'`      | mu-select            |
| `'multi-select'` | mu-multi-select     |
| `'segmented'`   | mu-segmented         |
| `'check-group'` | mu-check-group       |
| `'radio-group'` | mu-radio-group       |

对象形式 — 完整控制组件、属性和绑定行为：

```javascript
{ prop: 'color', label: '颜色', input: {
  type: 'select',
  clearButton: false,
  options: [{ value: 'red', label: '红色' }]
}}
{ prop: 'features', label: '特性', input: {
  type: 'check-group',
  options: [{ value: 'wifi', label: 'Wi-Fi' }, { value: 'bt', label: '蓝牙' }]
}}
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



### MuInput

基本输入框

| 属性名称     | 类型             | 说明                                                         |
| ------------ | ---------------- | ------------------------------------------------------------ |
| modelValue   |                  | 输入的值双向绑定属性                                         |
| type         | String           | 原生 Input 元素的 type，默认为 text                          |
| placeholder  | String           | 占位文本                                                     |
| clear-button | Boolean          | 是否显示清除按钮，以全局选项 $mussel.options.input.clearButton 为默认值（缺省为 true） |
| invalid      | Boolean          | 校验失败样式                                                 |
| readonly     | Boolean          | 是否只读                                                     |
| disabled     | Boolean          | 是否禁用                                                     |
| prefix       | String \| Object | 前置文本或按钮                                               |
| suffix       | String \| Object | 后置文本或按钮                                               |
| tabindex     | String           | 元素 tab 聚焦顺序，默认为 -1                                 |



| 事件              | 参数  | 说明                   |
| ----------------- | ----- | ---------------------- |
| update:modelValue | value | 输入值变更事件         |
| prefix-click      |       | 当前置按钮被点击时触发 |
| suffix-click      |       | 当后置按钮被点击时触发 |

> [!NOTE]
>
> 当 MuInput 置于 MuFormField 内部时，表单校验错误状态会自动同步到输入组件的 invalid 样式，无需手动设置 invalid 属性。



### MuInputGroup

输入框组



### MuSelect

下拉单选框

| 属性名称   | 类型   | 说明                                                         |
| ---------- | ------ | ------------------------------------------------------------ |
| options    | Array  | 下拉选项列表                                                 |
| option-key | String | 下拉选项的 key 属性，默认为 'value'                          |
| value-mode | String | normal - 默认；composite - modelValue 结构为 { label, value } |
| (其他)     |        | 包含全部 MuInput 属性、MuDropdown 中 "dropdown-" 为前缀的属性 |



### MuComboBox

组合输入框，可支持输入与单选。

| 属性名称 | 类型    | 说明                           |
| -------- | ------- | ------------------------------ |
| editable | Boolean | 是否可由用户输入，默认为 false |
| (其他)   |         | 包含全部 MuSelect 属性         |

> [!NOTE]
>
> 若无需用户输入，建议使用 MuSelect。
>
> 若设置为可编辑，则不支持选项中的 label 属性，直接使用 value 属性进行显示。



### MuMultiSelect

下拉多选框

| 属性名称    | 类型        | 说明                                                         |
| ----------- | ----------- | ------------------------------------------------------------ |
| max-tags    | Number      | 最大显示已选项标签数量，默认为 2，超出部分将合并省略显示     |
| tag-shrink  | Boolean     | 已选标签是否可缩小，默认为 true                              |
| tag-tooltip | Boolean     | 已选标签是否显示标题文字 tooltip，默认为 true                |
| disabled    | Boolean     | 是否禁用                                                     |
| readonly    | Boolean     | 是否只读                                                     |
| (其他)      |             | 包含全部 MuSelect 属性                                       |



### MuDateInput

日期选择框，目前支持选择到日或月

| 属性名称  | 类型   | 说明                                                   |
| --------- | ------ | ------------------------------------------------------ |
| type      | String | date - 选择日期; month - 选择月份                      |
| format    | String | 日期格式，默认为 yyyy-MM-dd                            |
| valueType | String | 返回日期值的类型，可选 date (默认) \| string \| object |
| (其他)    |        | 包含其他 MuSelect 属性，options 相关属性除外           |



### MuCheck

复选按钮  -

| 属性名称   | 类型             | 说明                                               |
| ---------- | ---------------- | -------------------------------------------------- |
| modelValue | Boolean \| Array | 双向绑定的输入值                                   |
| value      |                  | 选项值（当输入值是数组时，该选项在数组中的对应值） |
| label      | String           | 标签文字                                           |
| disabled   | Boolean          | 禁用状态                                           |



### MuCheckGroup

复选按钮组，管理多个 MuCheck 的选中状态

| 属性名称   | 类型    | 说明                                                  |
| ---------- | ------- | ----------------------------------------------------- |
| modelValue | Array   | 双向绑定值（选中项 value 数组）                        |
| options    | Array   | 选项数组 `[{ value, label, disabled? }]`              |
| disabled   | Boolean | 禁用整组                                              |

```html
<!-- options 属性 -->
<mu-check-group v-model="checked" :options="options" />

<!-- slot 用法 -->
<mu-check-group v-model="checked">
  <mu-check value="a" label="选项 A" />
  <mu-check value="b" label="选项 B" />
</mu-check-group>
```



### MuRadio

单选按钮

| 属性名称   | 类型    | 说明             |
| ---------- | ------- | ---------------- |
| modelValue |         | 双向绑定的输入值 |
| value      |         | 选项值，必填     |
| label      | String  | 标签文字         |
| disabled   | Boolean | 禁用状态         |



### MuRadioGroup

单选按钮组，管理多个 MuRadio 的选中状态

| 属性名称   | 类型    | 说明                                              |
| ---------- | ------- | ------------------------------------------------- |
| modelValue |         | 双向绑定值（当前选中项 value）                     |
| options    | Array   | 选项数组 `[{ value, label, disabled? }]`           |
| disabled   | Boolean | 禁用整组                                          |

```html
<!-- options 属性 -->
<mu-radio-group v-model="selected" :options="options" />

<!-- slot 用法 -->
<mu-radio-group v-model="selected">
  <mu-radio value="x" label="Radio X" />
  <mu-radio value="y" label="Radio Y" />
</mu-radio-group>
```



### MuSegmented

分段控件，在多个互斥选项间切换，带滑块动画

| 属性名称      | 类型    | 默认   | 说明                                                              |
| ------------- | ------- | ------ | ----------------------------------------------------------------- |
| modelValue    |         |        | 双向绑定值（当前选中项 value）                                    |
| options       | Array   |        | 选项数组 `[{ value, label, icon?, disabled? }]` 或简单值 `[1,2,3]` |
| disabled      | Boolean |        | 禁用整组                                                          |
| icon-position | String  | `left` | 图标位置：`left`（文字左侧）\| `top`（文字上方）                  |

```html
<mu-segmented v-model="viewMode" :options="[
  { value: 'list', label: '列表', icon: 'list' },
  { value: 'grid', label: '网格', icon: 'grid' }
]" />

<!-- 简单值形式 -->
<mu-segmented v-model="period" :options="['日', '周', '月', '年']" />
```



### MuSwitch

开关

| 属性名称       | 类型   | 说明                     |
| -------------- | ------ | ------------------------ |
| modelValue     |        | 双向绑定的输入值         |
| label          | String | 标签文字                 |
| active-label   | String | 打开状态的标签文字       |
| inactive-label | String | 关闭状态的标签文字       |
| active-value   |        | 打开状态值，默认为 true  |
| inactive-value |        | 关闭状态值，默认为 false |



## 6 - 导航



### MuDropdownPanel

下拉面板

| 属性名称       | 类型    | 说明                                     |
| -------------- | ------- | ---------------------------------------- |
| width          | String  | 面板宽度                                 |
| height         | String  | 面板高度                                 |
| scrollbar      | Boolean | 是否渲染 mussel 滚动条                   |
| trigger        | String  | 显示触发方式，默认 click：hover \| click |
| position       | String  | 弹出位置：auto \| fixed \| top \| bottom |
| dropdown-items | Array   | 列表项                                   |



| 事件      | 参数                         | 说明                         |
| --------- | ---------------------------- | ---------------------------- |
| show      |                              | 面板弹出时触发               |
| hide      |                              | 面板关闭时触发               |
| action    | action - 下拉项定义的 action | 包含 action 的下拉项点击触发 |
| itemclick | item - 下拉项属性            | 下拉项点击触发               |



| 方法 | 参数 | 说明     |
| ---- | ---- | -------- |
| show |      | 弹出面板 |
| hide |      | 关闭面板 |



### MuDropdown

下拉菜单

| 属性名称           | 类型    | 说明                                             |
| ------------------ | ------- | ------------------------------------------------ |
| dropdown-class     |         | 下拉面板 class                                   |
| dropdown-style     |         | 下拉面板样式                                     |
| dropdown-snap-to   |         | 下拉面板吸附目标，默认为组件根元素               |
| dropdown-panel     | Object  | 指定外部下拉面板，用于重复使用                   |
| dropdown-attrs     | Object  | 下拉面板绑定属性                                 |
| dropdown-width     | String  | 下拉面板宽度                                     |
| dropdown-height    | String  | 下拉面板宽度                                     |
| dropdown-icon      | String  | 下拉按钮图标，默认为下箭头                       |
| dropdown-disabled  | Boolean | 下拉面板禁用状态                                 |
| dropdown-scrollbar | Boolean | 下拉面板是否渲染 Mussel 滚动条                   |
| dropdown-items     | Array   | 下拉项列表                                       |
| dropdown-trigger   | String  | 下拉面板弹出触发方式，默认 hover：click \| hover |
| dropdown-position  | String  | 下拉面板弹出位置：auto \| fixed \| top \| bottom |



| 事件               | 参数                         | 说明                         |
| ------------------ | ---------------------------- | ---------------------------- |
| action             | action - 下拉项定义的 action | 包含 action 的下拉项点击触发 |
| dropdown:itemclick | Item - 下拉项属性            | 下拉项点击触发               |
| dropdown:show      |                              | 下拉面板弹出时触发           |
| dropdown:hide      |                              | 下拉面板关闭时触发           |



### MuDropdownButton

带下拉菜单的按钮，支持分割按钮形式

| 属性名称               | 类型    | 说明               |
| ---------------------- | ------- | ------------------ |
| split-button           | Boolean | 是否显示为分割按钮 |
| (其他 MuButton 属性)   |         |                    |
| (其他 MuDropdown 属性) |         |                    |



### MuContextMenu

上下文菜单，在需要的地方弹出。

示例：

```vue
<template>
	<mu-context-menu ref="contextMenu" :menus="menuItems" @action="onMenuAction"/>
  <div @contextmenu="contextMenu.show" />
</template>
<script setup>
  const contextMenu = shallowRef()
  
  function onMenuAction (action) {
    // do something
  }
</script>
```



| 属性名称 | 类型  | 说明         |
| -------- | ----- | ------------ |
| menus    | Array | 菜单项列表项 |

事件与方法同 MuDropdownPanel



## 7 - 数据



### MuList

列表

| 属性名称     | 类型    | 说明                                    |
| ------------ | ------- | --------------------------------------- |
| scrollbar    | Boolean | 是否显示滚动条                          |
| items        | Array   | 列表项数据                              |
| itemClass    | String  | 列表项 class                            |
| itemTagName  | String  | 列表项标签名，默认 a，可选 a \| div     |



| 事件        | 参数 | 说明         |
| ----------- | ---- | ------------ |
| item-click  | item | 列表项点击时 |



### MuListItem

列表项，用于数据显示或导航，默认外观包含一个图标加标题

| 属性名称 | 类型   | 说明                                      |
| -------- | ------ | ----------------------------------------- |
| icon     | String | 注册的图标名称或者 icon-font class         |
| label    | String | 标题                                      |
| tag      | String | 渲染元素的标签名，默认是 div，可选 a \| div |



### MuListDivider

列表分隔项



### MuTree

树

| 属性说明           | 类型                       | 说明                                      |
| ------------------ | -------------------------- | ----------------------------------------- |
| data               | Array                      | 树节点数据                                |
| props              | Object                     | 树节点数据属性定义                        |
| buttons            | Array                      | 树节点工具按钮                            |
| checkbox           | Boolean                    | 是否显示节点勾选框                        |
| cascaded-check     | Boolean                    | 是否级联勾选                              |
| checked-nodes-keys | Set                        | 已选节点（多）唯一标识                    |
| auto-expand-level  | Number                     | 自动展开层级数                            |
| active-node        | Object \| Number \| String | 当前选中节点                              |
| node-icons         | Boolean \| Object          | 是否显示节点图标 & 自定义图标             |
| expand-icons       | Boolean \| Object          | 是否显示节点展开状态图标 & 自定义展开图标 |



| 事件              | 参数          | 说明                                           |
| ----------------- | ------------- | ---------------------------------------------- |
| node-click        | node          | 节点点击时触发，不含展开按钮和节点工具按钮点击 |
| node-expand       | node          | 节点展开时触发，可用于子节点懒加载             |
| node-collapse     | node          | 节点收拢时触发                                 |
| node-button-click | node, button  | 节点工具按钮点击时触发                         |
| node-check-change | node, checked | 节点勾选状态改变时触发                         |



| 插槽名称 | 说明                              |
| -------- | --------------------------------- |
| default  | 树节点模板，作用域参数为 node     |
| buttons  | 树节点工具模板，作用域参数为 node |



### MuTags

标签组

| 属性名称         | 类型    | 说明                                         |
| ---------------- | ------- | -------------------------------------------- |
| tags             | Array   | 标签数据                                     |
| max              | Number  | 最大显示标签个数                             |
| removable        | Boolean | 是否可删除                                   |
| expandable       | Boolean | 是否可下拉展开显示所有标签项                 |
| tooltip          | Boolean | 是否显示标签标题 tooltip，默认 true          |
| dropdown-snap-to |         | 下拉面板吸附目标，默认为当前组件根元素父节点 |



| 事件       | 参数 | 说明                   |
| ---------- | ---- | ---------------------- |
| tag-remove | tag  | 点击标签删除按钮时触发 |



### MuCalendar

月历

| 属性名称     | 类型                              | 说明                                                 |
| ------------ | --------------------------------- | ---------------------------------------------------- |
| model-value  | Date \| String \| Object \| Array | 双向绑定的日期值                                     |
| format       | String                            | String 类型下的日期格式，默认为 yyyy-MM-dd           |
| value-type   | String                            | 返回日期值的类型，可选 date (默认) \| string \| object |



### MuTable

数据表格，支持多种列类型和交互功能。

| 属性名称            | 类型             | 说明                                        |
| ------------------- | ---------------- | ------------------------------------------- |
| records             | Array            | 数据记录列表                                |
| columns             | Array            | 列配置列表（详见下文 Column 配置）          |
| recordsOffset       | Number           | 记录偏移量，用于计算行号                    |
| keyField            | String           | 记录唯一标识字段名                          |
| fixedLeftColumns    | Number           | 固定左侧列数                                |
| orderBy             | String           | 排序字段，格式 "field:asc" 或 "field:desc"  |
| striped             | Boolean          | 是否显示斑马纹                              |
| placeholder         | String           | 空单元格占位文本                            |
| selectedRecord      | Object           | 当前选中记录                                |
| selectedRecordKey   | String \| Number | 当前选中记录的 key                          |
| hoverMode           | String           | 悬停模式：none \| row \| column \| cross \| cell |
| gridlines           | String           | 网格线：none \| all \| row \| column        |
| tableWidth          | String           | 表格宽度，默认 fit-content                  |
| tableMinWidth       | String           | 表格最小宽度，默认 100%                     |
| headerChecked       | Object           | 复选列头部勾选状态 { field: boolean }       |



| 事件                  | 参数                               | 说明                       |
| --------------------- | ---------------------------------- | -------------------------- |
| header-click          | column                             | 表头点击                   |
| cell-click            | { record, recordIndex, column }    | 单元格点击                 |
| cell-item-click       | { record, column, link/tag }       | 单元格内项目点击（链接/标签） |
| update:header-checked | column, value                      | 复选头部状态变更           |
| update:cell-value     | { record, column, value }          | 单元格值变更               |
| update:selected-record | record                             | 选中记录变更               |
| update:selected-record-key | key                          | 选中记录 key 变更          |



#### Column 配置

表格列配置对象，支持以下属性：

| 属性名称     | 类型                | 说明                                       |
| ------------ | ------------------- | ------------------------------------------ |
| field        | String              | 数据字段名                                 |
| caption      | String              | 列标题                                     |
| type         | String              | 列类型（见下文 Column Types）              |
| width        | String \| Number    | 列宽                                       |
| minWidth     | String \| Number    | 最小列宽                                   |
| maxWidth     | String \| Number    | 最大列宽                                   |
| align        | String              | 对齐方式：left \| center \| right          |
| sortable     | Boolean             | 是否可排序                                 |
| headerClass  | String \| Function  | 表头 class                                 |
| headerStyle  | String \| Function  | 表头样式                                   |
| class        | String \| Function  | 单元格 class                               |
| style        | String \| Function  | 单元格样式                                 |
| text         | String \| Function  | 单元格显示文本（可覆盖默认值）             |
| value        | String \| Function  | 单元格值（可覆盖 field）                   |
| title        | String \| Function  | 单元格 title                               |
| multiline    | Boolean             | 多行文本（text 类型）                      |
| lineClamp    | Number \| Function  | 文本行数限制（text 类型）                  |
| mappings     | Object              | 值映射 { value: text \| { text, class, style } }（enum/bool 类型） |
| formatter    | Function            | 格式化函数（date/datetime/number/currency 类型） |
| format       | String              | 格式化字符串（date/datetime 类型）         |
| formatOption | Object              | 格式化选项（number/currency 类型）         |
| locale/locales | String            | 区域设置（number/currency 类型）           |
| links        | Function            | 链接生成函数（link 类型）                  |
| linkOption   | Object              | 链接选项 { max, class, style, danger, disabled }（link 类型） |
| tags         | Function            | 标签生成函数（tag 类型）                   |
| tagOption    | Object              | 标签选项 { max, class, style, pill, flat, color }（tag 类型） |
| disabled     | Function            | 禁用函数（check 类型）                     |
| headerCheckbox | Boolean            | 是否显示头部全选勾选框（check 类型）       |



#### Column Types

表格支持以下列类型：

| 类型    | 说明                | 默认对齐 | 默认宽度 |
| ------- | ------------------- | -------- | -------- |
| text    | 文本列              | left     | -        |
| rec_no  | 行号列              | center   | 50px     |
| check   | 复选勾选列          | center   | 50px     |
| bool    | 布尔值（是/否）     | center   | -        |
| enum    | 枚举值映射          | center   | -        |
| date    | 日期                | right    | -        |
| datetime | 日期时间            | right    | -        |
| number  | 数字                | right    | -        |
| currency | 货币                | right    | -        |
| link    | 链接                | left     | -        |
| tag     | 标签                | left     | -        |
| img/image | 图片               | left     | -        |

**列类型详细说明：**

- **text**：文本列，支持 `multiline` 多行显示和 `lineClamp` 行数限制
- **rec_no**：自动显示行号，从 `recordsOffset + 1` 开始
- **check**：复选列，支持单个勾选和头部全选，通过 `update:cell-value` 事件获取变更
- **bool**：布尔值，通过 `mappings` 配置显示文本，默认 `{ true: '是', false: '否' }`
- **enum**：枚举值映射，通过 `mappings` 配置值与显示文本的对应关系
- **date/datetime**：日期格式化，通过 `format` 指定格式，默认 `yyyy-MM-dd` / `yyyy-MM-dd hh:mm`
- **number/currency**：数字格式化，使用 `Intl.NumberFormat`，支持 `formatOption` 配置
- **link**：链接列，通过 `links` 函数生成链接数组，支持 `max` 限制显示数量
- **tag**：标签列，通过 `tags` 函数生成标签数组，支持 `max` 限制显示数量
- **img/image**：图片列，显示图片缩略图

**示例：**

```vue
<template>
  <mu-table
    :records="records"
    :columns="columns"
    key-field="id"
    v-model:selected-record-key="selectedKey"
    @cell-click="onCellClick"
    @cell-item-click="onLinkClick"
  />
</template>

<script setup>
import { ref } from 'vue'

const selectedKey = ref(null)

const records = [
  { id: 1, name: '张三', age: 25, active: true, role: 'admin', created: '2024-01-01' },
  { id: 2, name: '李四', age: 30, active: false, role: 'user', created: '2024-01-02' }
]

const columns = [
  { type: 'rec_no' },
  { type: 'check', field: 'checked', headerCheckbox: true },
  {
    field: 'name',
    caption: '姓名',
    type: 'text'
  },
  {
    field: 'age',
    caption: '年龄',
    type: 'number',
    align: 'right'
  },
  {
    field: 'active',
    caption: '状态',
    type: 'bool',
    mappings: {
      true: { text: '激活', class: 'mu-tag--success' },
      false: { text: '停用', class: 'mu-tag--danger' }
    }
  },
  {
    field: 'role',
    caption: '角色',
    type: 'enum',
    mappings: {
      admin: '管理员',
      user: '普通用户',
      default: '未知'
    }
  },
  {
    field: 'created',
    caption: '创建时间',
    type: 'date',
    format: 'yyyy-MM-dd'
  },
  {
    field: 'actions',
    caption: '操作',
    type: 'link',
    linkOption: { max: 3 },
    links: (record) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]

function onCellClick({ record, column }) {
  console.log('点击单元格:', record, column)
}

function onLinkClick({ record, link }) {
  console.log('点击链接:', record, link)
}
</script>
```





## 8 - 反馈



### MessageBox

消息提示对话框

示例：

```vue
<script setup>
	import { inject } from 'vue'
  
  const { messageBox } = inject('$mussel')
  
  messageBox.alert('Hello World').then(btn => console.log(btn))
  messageBox.confirm('Hello World').then(btn => console.log(btn))
  messageBox.error('Hello World').then(btn => console.log(btn))
  messageBox.warn('Hello World').then(btn => console.log(btn))
</script>
```



### Notifier

浮动消息提示

```vue
<script setup>
	import { inject } from 'vue'
  
  const { messageBox } = inject('$mussel')
  
  messageBox.notify({
    title: '提示标题',
    message: '提示消息内容',
    type: 'success' // alert | success | warn | error
  })
</script>
```

### MuStatusBox

状态显示面板

| 属性名称 | 类型              | 说明     |
| -------- | ----------------- | -------- |
| icon     | String            | 状态图标 |
| title    | String            | 状态标题 |
| message  | String            | 消息内容 |
| width    | String \| Number  | 宽度     |
| height   | String \| Number  | 高度     |



| 插槽名称 | 说明                   |
| -------- | ---------------------- |
| default  | 自定义内容             |
| icon     | 自定义图标（图片）内容 |
