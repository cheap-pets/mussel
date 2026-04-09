---
name: mussel-components
description: 使用 mussel Vue 3 组件库进行前端页面开发。在用户需要使用 mussel 构建页面、组件或界面时触发，包括但不限于：创建表单、数据表格、对话框、下拉菜单、树形控件、列表、布局、使用 mussel 样式系统、暗色模式切换等。当用户提到 mussel、mu-button、mu-table、mu-form、mu-dialog 等 mussel 组件名，或需要 Vue 组件库开发指导时，应使用此 skill。
---

# Mussel 前端开发指南

Mussel 是一个 Vue 3 组件库，使用 Composition API + `<script setup>` 语法。本 skill 指导如何使用 mussel 的组件和样式系统构建前端页面。

## 核心原则

1. **使用 Composition API + `<script setup>`**：所有组件代码使用 Vue 3 的 `<script setup>` 语法
2. **组件通过 `install(app)` 全局注册**：无需逐个导入组件，调用一次即可使用所有组件
3. **布局优先使用 CSS 原子类 + `mu-box`**：Mussel 4 的布局系统基于 CSS，而非组件嵌套
4. **通过 CSS 变量实现主题定制**：所有颜色、间距、字号等均通过 CSS 变量控制
5. **暗色模式通过 `.mu-dark` class 切换**：在根元素上切换该 class 即可

## 项目初始化

```javascript
import { createApp } from 'vue'
import { install } from 'mussel'

const app = createApp(App)

install(app).mount('#app')
```

install 时可传入选项：
```javascript
install(app, {
  root: '#app',           // 根元素选择器
  darkMode: false,        // 是否默认暗色模式
  colors: { /* 自定义颜色 */ },
  icons: { /* 注册图标 */ },
  locale: 'zh-CN',
  localeResources: {}
})
```

## 组件总览

Mussel 组件分为 8 大类：

| 分类 | 组件 |
|------|------|
| **布局** | MuHBox, MuVBox, MuGridBox, MuGridCell, MuFlexSplitter, MuScrollBox, MuTabs, MuTabBar, MuTabPanel, MuToolbar |
| **图标/图形** | MuIcon, MuSvgStripe, MuBadge |
| **按钮** | MuButton, MuButtonGroup, MuToolButton |
| **模态窗口** | MuDialog, MuDrawer |
| **表单/输入** | MuForm, MuFormRow, MuFormField, MuInput, MuInputGroup, MuSelect, MuComboBox, MuMultiSelect, MuDateInput, MuCheck, MuRadio, MuSwitch |
| **导航** | MuDropdownPanel, MuDropdown, MuDropdownButton, MuContextMenu |
| **数据展示** | MuList, MuListItem, MuListDivider, MuTree, MuTags, MuCalendar, MuTable |
| **反馈** | MessageBox, Notifier, MuStatusBox |

## 按需查阅参考文档

根据任务需要，读取对应的参考文件获取完整的 API 文档：

- **组件 API（props、events、slots、示例）** → 读取 `references/components.md`
- **CSS 变量与原子类** → 读取 `references/styles.md`
- **mu-box 盒模型属性** → 读取 `references/box.md`
- **Flex 布局属性** → 读取 `references/flex-layout.md`
- **Grid 布局属性** → 读取 `references/grid-layout.md`

不需要一次性全部读取，根据当前任务涉及的组件和样式按需查阅。

## 常见开发模式

### 布局模式

**页面整体布局**（全屏固定）：
```vue
<mu-v-box position="fixed fit" padding="1x">
  <mu-toolbar><!-- 顶部栏 --></mu-toolbar>
  <mu-h-box flex="1" padding="1x">
    <div class="mu-v-box" flex="0" width="240"><!-- 侧边栏 --></div>
    <mu-flex-splitter />
    <div flex="1"><!-- 主内容区 --></div>
  </mu-h-box>
</mu-v-box>
```

**mu-box 属性布局**（适合简单场景）：
```html
<div class="mu-box" layout="flex" position="absolute fit" margin="1x">
  <div class="mu-box" border margin="1x" width="350">Cell 1</div>
  <div class="mu-box" border margin="1x" flex="1">Cell 2</div>
</div>
```

### 表单模式

```vue
<mu-form border="primary" label-width="80px" label-align="right">
  <mu-form-field label="用户名" flex="1 auto">
    <mu-input v-model="form.username" />
  </mu-form-field>
  <mu-form-row>
    <mu-form-field flex="1" label="手机号">
      <mu-input v-model="form.phone" />
    </mu-form-field>
    <mu-form-field flex="1" label="邮箱">
      <mu-input v-model="form.email" />
    </mu-form-field>
  </mu-form-row>
  <mu-form-field label="角色">
    <mu-select v-model="form.role" :options="roleOptions" />
  </mu-form-field>
</mu-form>
```

### 数据表格模式

```vue
<mu-table
  :columns="columns"
  :records="records"
  key-field="id"
  striped
  hover-mode="cross"
  gridlines="column"
  placeholder="-"
  @cell-click="onCellClick"
  @cell-item-click="onCellItemClick" />
```

列配置示例：
```javascript
const columns = [
  { type: 'rec_no' },
  { type: 'check', field: 'checked', headerCheckbox: true },
  { field: 'name', caption: '姓名', type: 'text', sortable: true },
  { field: 'amount', caption: '金额', type: 'currency', align: 'right' },
  { field: 'status', caption: '状态', type: 'bool', mappings: { true: '启用', false: '停用' } },
  { field: 'created', caption: '创建时间', type: 'date' },
  { caption: '操作', type: 'link', align: 'center',
    links: (rec) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]
```

### 对话框模式

```vue
<mu-dialog
  v-model:visible="visible"
  title="编辑信息"
  width="600"
  easy-hide>
  <mu-form label-width="60px">
    <mu-form-field label="名称">
      <mu-input v-model="form.name" />
    </mu-form-field>
  </mu-form>
  <template #footer>
    <mu-button caption="取消" @click="visible = false" />
    <mu-button primary caption="确认" @click="onSave" />
  </template>
</mu-dialog>
```

### 下拉菜单模式

```vue
<mu-dropdown
  dropdown-trigger="click"
  :dropdown-items="menuItems"
  @action="onAction">
  <mu-button caption="操作" />
</mu-dropdown>
```

menuItems 格式：
```javascript
const menuItems = [
  { label: '编辑', icon: 'edit', action: 'edit' },
  { label: '删除', icon: 'trash', action: 'delete', danger: true },
  '-',  // 分隔线
  { is: '-', label: '分组标题' },  // 分组标题
  { label: '导出', action: 'export' }
]
```

### 消息提示

```javascript
import { inject } from 'vue'

const { messageBox } = inject('$mussel')

// 弹窗
messageBox.alert('操作成功')
messageBox.confirm('确认删除？').then(btn => { /* btn === 'ok' */ })
messageBox.error('出错了')
messageBox.warn('请注意')

// 浮动通知
messageBox.notify({
  title: '提示',
  message: '保存成功',
  type: 'success'  // alert | success | warn | error
})
```

### 暗色模式

```javascript
function toggleDarkMode (enabled) {
  const root = document.querySelector('.mu-root') || document.body
  root.classList.toggle('mu-dark', enabled)
}
```

### 图标注册与使用

```javascript
import { installIcons } from 'mussel'
import MyIcon from './icons/my-icon.svg'

installIcons({
  'my-icon': MyIcon,       // SVG 数据
  'bolt': '.ti.ti-bolt'    // icon-font class
})
```

```vue
<mu-icon icon="my-icon" />
<mu-button icon="bolt" caption="闪电" />
```

## 样式速查

### 常用 CSS 变量

```css
/* 文本色 */
var(--mu-text-color-strong)   /* 正文/输入 */
var(--mu-text-color-normal)   /* 标题/名称 */
var(--mu-text-color-subtle)   /* 次要信息 */
var(--mu-text-color-muted)    /* 禁用文字 */

/* 背景色 */
var(--mu-bg-normal)           /* 默认背景 */
var(--mu-bg-strong)           /* 导航/工具栏 */
var(--mu-bg-header)           /* 头部区域 */
var(--mu-bg-footer)           /* 尾部区域 */
var(--mu-bg-stripe)           /* 交替行 */

/* 功能色 */
var(--mu-primary-color)       /* 主色 */
var(--mu-success-color)       /* 成功 */
var(--mu-warning-color)       /* 警告 */
var(--mu-danger-color)        /* 危险 */
var(--mu-secondary-color)     /* 次要色 */

/* 边框色 */
var(--mu-border-color-strong) /* 深边框 */
var(--mu-border-color-normal) /* 正常边框 */
var(--mu-border-color-soft)   /* 分隔线 */
```

### 常用原子类

注意：原子类以 class 形式使用，**不能**用于 inline style，也**不能**作为裸属性写在元素上。`2x`、`1x` 等是 mussel 原子类特有的单位，CSS 本身不认识，所以 `style="gap: 2x"` 是无效的，`<div gap-1x>` 也是无效的，必须写成 `class="gap-2x"`。

```css
/* 间距 (1x=8px, 2x=16px, 3x=24px, 4x=32px) — 只能用 class，不能用 style */
.p-1x .px-2x .py-1x .pt-1x .pr-1x .pb-1x .pl-1x
.m-1x .mx-auto .my-2x .mt-1x .mr-1x .mb-1x .ml-1x

/* Flex */
.flex .flex-row .flex-col .flex-1 .flex-none .flex-wrap
.justify-center .justify-end .items-center .gap-1x .gap-2x

/* 显示 */
.hidden .block .inline-block .contents

/* 文本 */
.text-strong .text-normal .text-subtle .text-muted
.text-primary .text-success .text-danger .text-warning
.text-left .text-center .text-right
.text-ellipsis .line-clamp  /* line-clamp 通过 --line-clamp 变量控制行数 */

/* 边框 */
.border .border-soft .border-strong .border-primary .border-danger
.border-t .border-b .border-x .border-y
.border-dashed .border-dotted

/* 溢出 */
.overflow-auto .overflow-hidden
```
