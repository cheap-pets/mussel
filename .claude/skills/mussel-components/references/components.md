# components.md — MUSSEL 4 组件 API 速查

> 本文件供 SKILL.md 按需加载，包含完整属性表和用法说明。
> 目录：[1. 布局](#1-布局) · [2. 图标与徽章](#2-图标与徽章) · [3. 按钮](#3-按钮) · [4. 模态与抽屉](#4-模态与抽屉) · [5. 表单与输入](#5-表单与输入) · [6. 导航与下拉](#6-导航与下拉) · [7. 数据展示](#7-数据展示) · [8. 反馈](#8-反馈)

---

## 1. 布局

### MuHBox / MuVBox

水平 / 垂直方向的 Flex 布局容器。

> **推荐直接使用 class 形式**，语义等价且更轻量：
> ```html
> <div class="mu-h-box" />   <!-- 等同于 <mu-h-box /> -->
> <div class="mu-v-box" />   <!-- 等同于 <mu-v-box /> -->
> ```
> 详细 flex 属性配置参考 `layout.md`。

---

### MuGridBox / MuGridCell

网格布局容器与单元格。

> **推荐直接使用 class 形式**：
> ```html
> <div class="mu-grid-box">
>   <div class="mu-grid-cell">单元格</div>
> </div>
> ```

---

### MuFlexSplitter

Flex 容器内可拖拽调整尺寸的分隔条，**只能用于 flex 容器中**。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `size` | String | `full` | 尺寸：`full` \| `slim` \| `concealed` |
| `shape` | String | — | 形状：`line` \| `bubble` |
| `stripe` | Boolean | — | 是否显示装饰条纹（仅 `line` 形状有效） |
| `space-free` | Boolean | `false` | 是否不占用父容器空间 |
| `collapse-button` | Boolean | `false` | 是否显示收拢按钮 |
| `collapse-threshold` | Number | `200` | 收拢尺寸阈值（px） |
| `resizable` | Boolean | `true` | 是否可拖拽 |

```html
<div class="mu-h-box" style="height: 100%">
  <div class="flex-1 overflow-auto">左侧内容</div>
  <mu-flex-splitter collapse-button size="slim" />
  <div style="width: 300px">右侧面板</div>
</div>
```

---

### MuScrollBox

带非原生渲染滚动条的容器，由 `overflow` 样式控制滚动方向。

```html
<!-- 组件形式，默认自带 overflow: auto -->
<mu-scroll-box style="height: 400px">内容</mu-scroll-box>

<!-- 指令形式，为任意容器添加同款滚动条 -->
<div v-mu-scrollbar style="overflow: auto; height: 400px">内容</div>

<!-- 指令值为 false 时不渲染滚动条 -->
<div v-mu-scrollbar="false" style="overflow: auto">内容</div>
```

---

### MuTabs

多页签容器。

| 属性 | 类型 | 说明 |
|------|------|------|
| `active-tab` | String | 双向绑定，当前活动页签名称 |
| `tab-style` | String | `button` \| `small-button` \| `simple` \| `card` \| `border-card` |
| `tab-buttons` | Array | 手动指定页签按钮，默认由内部 `MuTabPanel` 自动生成 |
| `tab-position` | String | `top`（默认）\| `bottom` \| `left` \| `right` |
| `tab-bar-attrs` | Object | 传递给内置 `MuTabBar` 的额外属性 |

| 插槽 | 说明 |
|------|------|
| `tab-bar-prepend` | 页签按钮栏前置内容 |
| `tab-bar-append` | 页签按钮栏后置内容（常用于放置工具按钮） |

| 事件 | 参数 | 说明 |
|------|------|------|
| `button-click` | `name` | 页签按钮点击 |

```html
<mu-tabs v-model:active-tab="activeTab" tab-style="button">
  <template #tab-bar-append>
    <mu-tool-button icon="refresh" @click="reload" />
  </template>
  <mu-tab-panel name="list" caption="列表" icon="list">
    <!-- 列表内容 -->
  </mu-tab-panel>
  <mu-tab-panel name="detail" caption="详情" icon="detail" :disabled="!selectedId">
    <!-- 详情内容 -->
  </mu-tab-panel>
</mu-tabs>
```

---

### MuTabPanel

单个页签内容容器，**必须置于 MuTabs 中**。

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 页签唯一标识，必填 |
| `caption` | String | 页签按钮标题 |
| `icon` | String | 页签按钮图标 |
| `title` | String | 页签按钮 tooltip |
| `disabled` | Boolean | 是否禁用 |
| `tab-order` | Number | 手动排序（默认按 DOM 顺序） |

---

### MuTabBar

独立页签栏，不包含内容区，用于自定义页签 + 内容分离的布局。

| 属性 | 类型 | 说明 |
|------|------|------|
| `active-tab` | String | 双向绑定，当前活动页签 |
| `tab-style` | String | `button` \| `small-button` \| `simple` |
| `tab-buttons` | Array | 页签按钮数据 |
| `tab-position` | String | `top` \| `bottom` \| `left` \| `right` |

| 插槽 | 说明 |
|------|------|
| `prepend` | 前置内容 |
| `append` | 后置内容 |

---

### MuToolbar

具有特殊样式的工具栏容器（MuBar 的变体），常用于页面顶部操作区。

---

## 2. 图标与徽章

### MuIcon

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 已注册图标名，或以 `.` 开头的 icon-font class |
| `tag` | String | 渲染的 DOM 标签，默认 `span` |

**图标注册（应用入口处统一注册）：**
```javascript
import { install as installMussel, installIcons } from 'mussel'
import EditIcon from '@/assets/icons/edit.svg'

// 安装时注册
installMussel(app, {
  icons: {
    edit: EditIcon,           // SVG 文件
    bolt: 'icon icon-bolt'    // icon-font class
  }
})

// 或后续补充注册
installIcons({ refresh: RefreshIcon })
```

```html
<mu-icon icon="edit" />
<mu-icon icon=".icon icon-bolt" />
```

---

### MuBadge

徽章，用于状态标签或角标。

```html
<mu-badge primary>主要</mu-badge>
<mu-badge accent>强调</mu-badge>
<mu-badge success>成功</mu-badge>
<mu-badge warning>警告</mu-badge>
<mu-badge danger>危险</mu-badge>
```

---

## 3. 按钮

### MuButton

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `caption` | String | — | 按钮文字 |
| `icon` | String | — | 按钮图标 |
| `size` | String | `normal` | `small` \| `normal` \| `large` |
| `button-style` | String | `normal` | `normal` \| `outline` \| `text` \| `link` |
| `primary` | Boolean | — | 主色按钮 |
| `danger` | Boolean | — | 危险色按钮 |
| `accent` | Boolean | — | 强调色按钮 |
| `round` | Boolean | — | 左右圆弧形态 |
| `active` | Boolean | — | 选中状态 |
| `disabled` | Boolean | — | 禁用状态 |
| `type` | String | `button` | 原生 type 属性（`submit` \| `reset` \| `button`）|
| `x-color` | String | — | 自定义颜色（标准色值或 CSS 变量） |

```html
<mu-button primary caption="保存" icon="save" @click="save" />
<mu-button danger button-style="outline" caption="删除" @click="remove" />
<mu-button button-style="text" caption="取消" @click="cancel" />
```

---

### MuButtonGroup

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | String | 覆盖内部所有按钮的尺寸 |
| `button-style` | String | `normal` \| `outline` |
| `primary` / `danger` / `accent` | Boolean | 设置整组按钮颜色 |
| `round` | Boolean | 圆弧形态 |
| `disabled` | Boolean | 禁用整组 |

```html
<mu-button-group button-style="outline" size="small">
  <mu-button icon="copy" caption="复制" />
  <mu-button icon="cut" caption="剪切" />
  <mu-button icon="paste" caption="粘贴" />
</mu-button-group>
```

---

### MuToolButton

仅图标的工具栏快捷按钮，**不支持文字标题**。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标，必填 |
| `toggle` | Boolean | 开关模式：按下后切换选中状态 |
| `active` | Boolean | 双向绑定选中状态 |
| `size` | String | `small` \| `normal` \| `large` |
| `animation` | String | 动画效果 |

```html
<!-- 工具栏中使用 -->
<mu-tool-button icon="refresh" @click="reload" />
<mu-tool-button icon="filter" toggle v-model:active="filterVisible" />
```

---

## 4. 模态与抽屉

### MuDialog

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `title` | String | — | 对话框标题 |
| `icon` | String\|Object | — | 标题图标 |
| `width` | String\|Number | — | 窗口宽度 |
| `height` | String\|Number | — | 窗口高度 |
| `buttons` | Array | — | 底部操作按钮，结构见下方 |
| `easy-hide` | Boolean | — | 点击遮罩或 ESC 关闭 |
| `close-button` | Boolean | `true` | 显示右上角关闭按钮 |
| `maximize-button` | Boolean | — | 显示最大化按钮 |
| `lazy` | Boolean | — | 首次打开时才渲染内容 |
| `keep-position` | Boolean | — | 再次打开时保留上次位置 |
| `mask-class` | — | — | 遮罩 class |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `value, action, trigger` | 可见状态变更（可通过 action 判断关闭原因） |
| `button-click` | `button` | 底部按钮点击 |
| `show` / `hide` | — | 显示/隐藏时触发 |

| 插槽 | 说明 |
|------|------|
| `header` | 完全自定义头部 |
| `header-prepend` / `header-append` | 头部前/后置内容 |
| `footer` | 完全自定义底部 |
| `footer-prepend` / `footer-append` | 底部前/后置内容 |

**buttons 结构：**
```javascript
buttons: [
  { caption: '确定', primary: true, action: 'ok' },
  { caption: '取消', action: 'cancel' }
]
```

```html
<mu-dialog
  v-model:visible="visible"
  title="编辑用户"
  width="560px"
  :buttons="[{ caption: '保存', primary: true, action: 'save' }, { caption: '取消' }]"
  easy-hide
  @button-click="onButton"
  @update:visible="onVisibleChange"
>
  <mu-form label-width="80px">
    <!-- 表单内容 -->
  </mu-form>
</mu-dialog>
```

---

### MuDrawer

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `position` | String | `bottom` | `top` \| `right` \| `bottom` \| `left` |
| `width` | String\|Number | — | 宽度（left/right 时有效） |
| `height` | String\|Number | — | 高度（top/bottom 时有效） |
| `easy-hide` | Boolean | — | 点击遮罩或 ESC 关闭 |
| `mask` | Boolean | `true` | 是否显示遮罩 |
| `border-radius` | Boolean | — | 是否圆角 |
| `teleport` | Boolean | `true` | 渲染到页面根容器 |

| 事件 | 说明 |
|------|------|
| `update:visible` | 可见状态变更 |
| `show` / `hide` | 显示/隐藏 |

```html
<mu-drawer v-model:visible="drawerVisible" position="right" width="400px" easy-hide>
  <div class="mu-v-box" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">详情</div>
    <mu-scroll-box class="flex-1 p-2x">内容区域</mu-scroll-box>
  </div>
</mu-drawer>
```

---

## 5. 表单与输入

### MuForm

表单容器，支持声明式子组件和 `items` 数组驱动的数据模式。

| 属性 | 类型 | 说明 |
|------|------|------|
| `model` | Object | 表单数据对象，用于 `items` 模式下的双向绑定 |
| `items` | Array | 表单项定义数组（数据驱动模式），结构见下方 |
| `label-width` | String | 默认标签宽度（子 `MuFormField` 继承） |
| `label-align` | String | 默认标签对齐：`left` \| `top` \| `right` |

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

### MuFormRow

表单行容器，水平排列多个 `MuFormField`。支持 `items` 数组。

| 属性 | 类型 | 说明 |
|------|------|------|
| `items` | Array | 行内字段定义，支持标题、字段、自定义组件（不支持 `hr` / `->` / 子行） |

---

### MuFormField

表单字段，可自动渲染输入组件或通过 slot 自定义。

| 属性 | 类型 | 说明 |
|------|------|------|
| `prop` | String | 对应 `model` 中的字段名，用于双向绑定 |
| `input` | String\|Object | 输入组件配置（见下方说明） |
| `label` | String | 字段标签文字 |
| `label-width` | String | 覆盖 Form 的标签宽度 |
| `label-align` | String | 覆盖 Form 的标签对齐 |
| `width` / `height` | String\|Number | 字段尺寸 |
| `suffix` | String | 字段后缀文字（如单位） |
| `required` | Boolean | 是否必填（添加必填样式） |
| `invalid` | Boolean | 是否校验失败（添加错误样式） |

**input 配置：**

- 字符串形式：直接指定输入类型，自动渲染对应组件
  ```javascript
  { prop: 'name', label: '姓名', input: 'text' }      // <mu-input>
  { prop: 'memo', label: '备注', input: 'memo' }      // <textarea class="mu-input">
  { prop: 'date', label: '日期', input: 'date' }      // <mu-date-input>
  { prop: 'month', label: '月份', input: 'month' }    // <mu-date-input type="month">
  { prop: 'type', label: '类型', input: 'select' }    // <mu-select>
  { prop: 'view', label: '视图', input: 'segmented' } // <mu-segmented>
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

**input 对象的完整字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | String | 输入类型：`text` \| `memo` \| `date` \| `month` \| `select` \| `multi-select` \| `check-group` \| `radio-group` \| `segmented` |
| `is` | String | 直接指定组件名（设置后 `type` 不生效） |
| `useModel` | Boolean | 是否通过 `v-model` 绑定 `form.model[prop]`（默认：`model` 和 `prop` 都存在时为 `true`） |
| 其他 | Any | 透传给输入组件的属性 |

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
<mu-form :model="form" :items="items" label-width="80px" label-align="left" />
```

```javascript
const form = ref({ name: '', phone: '', birthday: '', memo: '', role: '' })

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

### MuInput

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值 |
| `type` | String | `text` | 原生 input type |
| `placeholder` | String | — | 占位文本 |
| `clear-button` | Boolean | 全局配置 | 是否显示清除按钮 |
| `readonly` / `disabled` | Boolean | — | 只读 / 禁用 |
| `prefix` | String\|Object | — | 前置文本或按钮 |
| `suffix` | String\|Object | — | 后置文本或按钮 |
| `tabindex` | String | `-1` | Tab 聚焦顺序 |

| 事件 | 说明 |
|------|------|
| `update:modelValue` | 值变更 |
| `prefix-click` / `suffix-click` | 前/后置按钮点击 |

---

### MuSelect

单选下拉框，**不需要用户输入时优先使用**。

| 属性 | 类型 | 说明 |
|------|------|------|
| `options` | Array | 下拉选项列表 |
| `option-key` | String | 选项的 key 属性，默认 `value` |
| `value-mode` | String | `normal`（默认）\| `composite`（modelValue 为 `{label, value}`）|
| (其他) | — | 继承全部 `MuInput` 属性及 `MuDropdown` 的 `dropdown-` 前缀属性 |

**options 结构：** `[{ label: '管理员', value: 'admin' }]`

---

### MuComboBox

组合输入框，支持输入与单选。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `editable` | Boolean | `false` | 是否允许用户输入 |
| (其他) | — | — | 继承全部 `MuSelect` 属性 |

> 若无需用户输入，使用 `MuSelect`；设置 `editable` 后不支持选项 `label`，直接用 `value` 显示。

---

### MuMultiSelect

下拉多选框。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `max-tags` | Number | `2` | 最大显示已选标签数，超出合并省略 |
| `tag-shrink` | Boolean | `true` | 已选标签是否可缩小 |
| `tag-tooltip` | Boolean | `true` | 已选标签是否显示 tooltip |
| `disabled` / `readonly` | Boolean | — | 禁用 / 只读 |
| (其他) | — | — | 继承全部 `MuSelect` 属性 |

---

### MuDateInput

日期选择框。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `type` | String | `date` | `date`（选日期）\| `month`（选月份）|
| `format` | String | `yyyy-MM-dd` | 日期格式 |
| `valueType` | String | `date` | 返回值类型：`date` \| `string` \| `object` |
| (其他) | — | — | 继承 `MuInput` 属性（options 相关除外）|

---

### MuCheck

复选按钮。

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Boolean\|Array | 双向绑定值 |
| `value` | — | 当 modelValue 为数组时，此项在数组中的对应值 |
| `label` | String | 标签文字 |
| `disabled` | Boolean | 禁用状态 |

> 可单独使用（`v-model` 绑定 Boolean），也可放在 `<mu-check-group>` 内（`v-model` 绑定 Array）。

---

### MuCheckGroup

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

### MuRadio

单选按钮。

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | — | 双向绑定值 |
| `value` | — | 选项值，必填 |
| `label` | String | 标签文字 |
| `disabled` | Boolean | 禁用状态 |

> 可单独使用，也可放在 `<mu-radio-group>` 内。

---

### MuRadioGroup

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

### MuSegmented

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

### MuSwitch

开关。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `modelValue` | — | — | 双向绑定值 |
| `label` | String | — | 标签文字 |
| `active-label` | String | — | 打开状态文字 |
| `inactive-label` | String | — | 关闭状态文字 |
| `active-value` | — | `true` | 打开状态值 |
| `inactive-value` | — | `false` | 关闭状态值 |

---

**输入组件选型速查：**

| 场景 | 使用组件 |
|------|---------|
| 文本 / 数字 / 密码输入 | `MuInput` |
| 单选（不可输入） | `MuSelect` |
| 单选（可手动输入） | `MuComboBox`（设 `editable`）|
| 多选 | `MuMultiSelect` |
| 日期 / 月份 | `MuDateInput` |
| 复选框 | `MuCheck` |
| 复选框组 | `MuCheckGroup` |
| 单选框 | `MuRadio` |
| 单选框组 | `MuRadioGroup` |
| 分段控件 | `MuSegmented` |
| 开关 | `MuSwitch` |

---

## 6. 导航与下拉

### MuDropdownPanel

独立下拉面板，作为容器使用，自行管理触发器。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `width` / `height` | String | — | 面板尺寸 |
| `trigger` | String | `click` | 触发方式：`click` \| `hover` |
| `position` | String | `auto` | 弹出位置：`auto` \| `fixed` \| `top` \| `bottom` |
| `dropdown-items` | Array | — | 列表项数据 |
| `scrollbar` | Boolean | — | 是否渲染 Mussel 滚动条 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `show` / `hide` | — | 面板显示/隐藏 |
| `action` | `action` | 含 action 的下拉项点击 |
| `itemclick` | `item` | 任意下拉项点击 |

| 方法 | 说明 |
|------|------|
| `show()` / `hide()` | 程序控制显示/隐藏 |

---

### MuDropdown

下拉菜单 Mixin，为触发器元素附加下拉能力，属性均以 `dropdown-` 为前缀。

| 属性 | 类型 | 说明 |
|------|------|------|
| `dropdown-items` | Array | 下拉项列表 |
| `dropdown-width` / `dropdown-height` | String | 面板尺寸 |
| `dropdown-trigger` | String | `hover`（默认）\| `click` |
| `dropdown-position` | String | `auto` \| `fixed` \| `top` \| `bottom` |
| `dropdown-icon` | String | 下拉箭头图标，默认下箭头 |
| `dropdown-disabled` | Boolean | 禁用下拉 |
| `dropdown-attrs` | Object | 透传给面板的额外属性 |
| `dropdown-snap-to` | — | 面板吸附目标，默认组件根元素 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | `action` | 含 action 的下拉项点击 |
| `dropdown:itemclick` | `item` | 下拉项点击 |
| `dropdown:show` / `dropdown:hide` | — | 面板显示/隐藏 |

**dropdown-items 结构：**
```javascript
[
  { caption: '编辑', icon: 'edit', action: 'edit' },
  { caption: '删除', icon: 'delete', action: 'delete', danger: true },
  { type: 'divider' },  // 分隔线
  { caption: '导出', disabled: true }
]
```

---

### MuDropdownButton

带下拉菜单的按钮，支持分割形式。

| 属性 | 类型 | 说明 |
|------|------|------|
| `split-button` | Boolean | 是否分割按钮形式 |
| (其他) | — | 继承 `MuButton` + `MuDropdown` 全部属性 |

```html
<mu-dropdown-button
  caption="新建"
  primary
  split-button
  :dropdown-items="[
    { caption: '从模板创建', action: 'from-template' },
    { caption: '导入文件',   action: 'import' }
  ]"
  @click="onCreate"
  @action="onDropdownAction"
/>
```

---

### MuContextMenu

右键上下文菜单。

| 属性 | 类型 | 说明 |
|------|------|------|
| `menus` | Array | 菜单项列表，结构同 `dropdown-items` |

事件与方法同 `MuDropdownPanel`。

```html
<template>
  <mu-context-menu ref="ctxMenu" :menus="menuItems" @action="onAction" />
  <div @contextmenu.prevent="ctxMenu.show($event)">右键此区域</div>
</template>

<script setup>
const ctxMenu = shallowRef()
</script>
```

---

## 7. 数据展示

### MuList

| 属性 | 类型 | 说明 |
|------|------|------|
| `items` | Array | 列表项数据 |
| `scrollbar` | Boolean | 是否显示 Mussel 滚动条 |
| `itemClass` | String | 列表项 class |
| `itemTagName` | String | 列表项标签：`a`（默认）\| `div` |

| 事件 | 参数 | 说明 |
|------|------|------|
| `item-click` | `item` | 列表项点击 |

---

### MuListItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 图标 |
| `label` | String | 标题文字 |
| `tag` | String | 渲染标签：`div`（默认）\| `a` |

### MuListDivider

列表分隔项，无属性。

---

### MuTree

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | Array | 树节点数据 |
| `props` | Object | 节点数据属性映射 |
| `buttons` | Array | 节点工具按钮 |
| `checkbox` | Boolean | 是否显示勾选框 |
| `cascaded-check` | Boolean | 是否级联勾选 |
| `checked-nodes-keys` | Set | 已勾选节点 key 集合 |
| `auto-expand-level` | Number | 自动展开层级数 |
| `active-node` | Object\|Number\|String | 当前选中节点 |
| `node-icons` | Boolean\|Object | 是否显示节点图标及自定义图标 |
| `expand-icons` | Boolean\|Object | 是否显示展开图标及自定义 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-click` | `node` | 节点点击（不含展开按钮） |
| `node-expand` / `node-collapse` | `node` | 展开/收拢（可用于懒加载）|
| `node-button-click` | `node, button` | 节点工具按钮点击 |
| `node-check-change` | `node, checked` | 勾选状态变更 |

| 插槽 | 说明 |
|------|------|
| `default` | 节点内容模板，作用域参数为 `node` |
| `buttons` | 节点工具按钮模板，作用域参数为 `node` |

---

### MuTags

标签组。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `tags` | Array | — | 标签数据 |
| `max` | Number | — | 最大显示数量，超出合并省略 |
| `removable` | Boolean | — | 是否可删除 |
| `expandable` | Boolean | — | 是否可下拉展开所有标签 |
| `tooltip` | Boolean | `true` | 标签是否显示 tooltip |
| `dropdown-snap-to` | — | 父节点 | 下拉面板吸附目标 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `tag-remove` | `tag` | 点击删除按钮 |

---

### MuCalendar

月历，用于页面内嵌日期展示与选择。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `model-value` | Date\|String\|Object\|Array | — | 双向绑定日期值 |
| `format` | String | `yyyy-MM-dd` | String 类型下的格式 |
| `value-type` | String | `date` | 返回类型：`date` \| `string` \| `object` |

---

### MuTable

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `records` | Array | — | 数据列表 |
| `columns` | Array | — | 列配置，结构见下方 |
| `key-field` | String | — | 唯一标识字段名 |
| `striped` | Boolean | — | 斑马纹 |
| `hover-mode` | String | — | `none` \| `row` \| `column` \| `cross` \| `cell` |
| `gridlines` | String | — | `none` \| `all` \| `row` \| `column` |
| `selected-record` | Object | — | 当前选中记录（双向绑定）|
| `selected-record-key` | String\|Number | — | 当前选中记录 key（双向绑定）|
| `order-by` | String | — | 排序字段，格式 `field:asc` / `field:desc` |
| `records-offset` | Number | — | 记录偏移量（影响行号显示）|
| `fixed-left-columns` | Number | — | 固定左侧列数 |
| `placeholder` | String | — | 空单元格占位文本 |
| `table-width` | String | `fit-content` | 表格宽度 |
| `table-min-width` | String | `100%` | 表格最小宽度 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `header-click` | `column` | 表头点击 |
| `cell-click` | `{ record, recordIndex, column }` | 单元格点击 |
| `cell-item-click` | `{ record, column, link/tag }` | 单元格内链接/标签点击 |
| `update:selected-record` | `record` | 选中记录变更 |
| `update:selected-record-key` | `key` | 选中 key 变更 |
| `update:cell-value` | `{ record, column, value }` | 单元格值变更（check 列）|

#### Column 配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `field` | String | 数据字段名 |
| `caption` | String | 列标题 |
| `type` | String | 列类型（见下表）|
| `width` / `minWidth` / `maxWidth` | String\|Number | 列宽 |
| `align` | String | `left` \| `center` \| `right` |
| `sortable` | Boolean | 是否可排序 |
| `text` | String\|Function | 单元格显示文本（可覆盖默认值）|
| `value` | String\|Function | 单元格值（可覆盖 field）|
| `title` | String\|Function | 单元格 title |
| `class` / `style` | String\|Function | 单元格 class / 样式 |
| `headerClass` / `headerStyle` | String\|Function | 表头 class / 样式 |
| `multiline` | Boolean | 多行文本（`text` 类型）|
| `lineClamp` | Number\|Function | 行数限制（`text` 类型）|
| `mappings` | Object | 值映射（`enum` / `bool` 类型）|
| `format` | String | 日期格式（`date` / `datetime` 类型）|
| `formatOption` | Object | 格式化选项（`number` / `currency` 类型）|
| `links` | Function | 链接生成函数（`link` 类型），返回链接数组 |
| `linkOption` | Object | `{ max, class, style, danger, disabled }` |
| `tags` | Function | 标签生成函数（`tag` 类型），返回标签数组 |
| `tagOption` | Object | `{ max, class, style, pill, flat, color }` |
| `disabled` | Function | 禁用函数（`check` 类型）|
| `headerCheckbox` | Boolean | 显示头部全选框（`check` 类型）|

#### 列类型（type）

| 类型 | 说明 | 默认对齐 | 默认宽度 |
|------|------|---------|---------|
| `text` | 文本 | left | — |
| `rec_no` | 自动行号 | center | 50px |
| `check` | 复选勾选 | center | 50px |
| `bool` | 布尔（是/否），配合 `mappings` | center | — |
| `enum` | 枚举值映射，配合 `mappings` | center | — |
| `date` | 日期格式化 | right | — |
| `datetime` | 日期时间格式化 | right | — |
| `number` | 数字格式化 | right | — |
| `currency` | 货币格式化 | right | — |
| `link` | 链接，配合 `links` 函数 | left | — |
| `tag` | 标签，配合 `tags` 函数 | left | — |
| `img` / `image` | 图片缩略图 | left | — |

**完整示例：**
```vue
<template>
  <mu-table
    :records="records"
    :columns="columns"
    key-field="id"
    striped
    hover-mode="row"
    v-model:selected-record-key="selectedKey"
    @cell-item-click="onItemClick"
  />
</template>

<script setup>
const selectedKey = ref(null)
const columns = [
  { type: 'rec_no' },
  { type: 'check', field: 'checked', headerCheckbox: true },
  { field: 'name',    caption: '姓名',   type: 'text', sortable: true },
  { field: 'amount',  caption: '金额',   type: 'currency' },
  { field: 'status',  caption: '状态',   type: 'enum',
    mappings: {
      active:   { text: '启用', class: 'mu-tag--success' },
      inactive: { text: '停用', class: 'mu-tag--danger' }
    }
  },
  { field: 'created', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
  { field: 'actions', caption: '操作',   type: 'link',
    linkOption: { max: 3 },
    links: (record) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]
</script>
```

---

## 8. 反馈

### MessageBox

命令式消息对话框，通过 `inject('$mussel')` 调用。

```javascript
const { messageBox } = inject('$mussel')

messageBox.alert('操作完成')
messageBox.confirm('确认删除该记录？').then(btn => {
  if (btn === 'ok') doDelete()
})
messageBox.error('服务器异常，请稍后重试')
messageBox.warn('此操作不可撤销，请确认')
```

---

### Notifier

浮动通知，通过 `inject('$mussel')` 调用。

```javascript
const { messageBox } = inject('$mussel')

messageBox.notify({
  title: '保存成功',
  message: '记录已更新',
  type: 'success'   // alert | success | warn | error
})
```

---

### MuStatusBox

状态占位面板，用于空状态、加载失败、无权限等场景。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 状态图标 |
| `title` | String | 状态标题 |
| `message` | String | 补充说明 |
| `width` / `height` | String\|Number | 尺寸 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（如操作按钮） |
| `icon` | 自定义图标（图片形式） |

```html
<!-- 空状态 -->
<mu-status-box icon="empty" title="暂无数据" message="请调整筛选条件后重试">
  <mu-button button-style="outline" caption="重置筛选" @click="resetFilter" />
</mu-status-box>

<!-- 加载失败 -->
<mu-status-box icon="error" title="加载失败" message="请检查网络后重试">
  <mu-button primary caption="重新加载" @click="reload" />
</mu-status-box>
```
