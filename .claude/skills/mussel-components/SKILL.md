---
name: mussel-components
description: Mussel 4 组件库开发指南。在使用 Mussel UI 框架开发 Vue 应用时使用此 skill。帮助开发者快速查找组件 API、选择合适组件、了解组件用法和最佳实践。当用户询问 Mussel 组件、组件属性、表单、按钮、对话框、布局等相关问题时使用。
---

# Mussel 4 组件开发指南

 Mussel 是一个 Vue 3 组件库。本 skill 帮助你在使用 Mussel 组件时快速找到合适的组件、了解组件 API 并遵循最佳实践。

## 快速开始

### 组件选择指南

根据需求快速定位合适的组件：

| 需求 | 推荐组件 | 说明 |
|------|----------|------|
| 水平/垂直布局 | `MuHBox` / `MuVBox` | Flex 布局容器，建议直接使用 class：`mu-h-box` / `mu-v-box` |
| 网格布局 | `MuGridBox` / `MuGridCell` | 网格布局容器，建议使用 class |
| 按钮 | `MuButton` | 支持多种样式：normal、outline、text、link |
| 按钮组 | `MuButtonGroup` | 统一样式的按钮集合 |
| 工具栏按钮 | `MuToolButton` | 仅图标的快捷按钮 |
| 模态对话框 | `MuDialog` | 带遮罩的模态窗口，支持最大化 |
| 抽屉面板 | `MuDrawer` | 从四周浮出的面板 |
| 输入框 | `MuInput` | 基础文本输入，支持前缀/后缀 |
| 下拉单选 | `MuSelect` | 下拉选择框 |
| 下拉多选 | `MuMultiSelect` | 支持标签显示的多选框 |
| 组合输入 | `MuComboBox` | 可输入也可下拉选择的组合框 |
| 日期选择 | `MuDateInput` | 日期/月份选择器 |
| 复选框 | `MuCheck` | 复选按钮 |
| 单选框 | `MuRadio` | 单选按钮 |
| 开关 | `MuSwitch` | 切换开关 |
| 下拉菜单 | `MuDropdown` / `MuDropdownButton` | 下拉面板和按钮 |
| 上下文菜单 | `MuContextMenu` | 右键菜单 |
| 标签页 | `MuTabs` / `MuTabBar` / `MuTabPanel` | 多页签容器 |
| 列表 | `MuList` / `MuListItem` | 数据列表 |
| 树 | `MuTree` | 树形结构，支持勾选 |
| 标签组 | `MuTags` | 标签展示和操作 |
| 消息提示 | `MessageBox` | alert/confirm/error/warn 对话框 |
| 浮动通知 | `Notifier` | 通知消息 |

## 常用组件详解

以下是最常用的组件详细说明。如需查看其他组件，请参考 [完整组件文档](references/full-components.md)。

---

### 1. 布局组件

#### MuHBox / MuVBox

Flex 布局容器，用于水平或垂直排列子元素。

**推荐用法：** 直接使用 class 而非组件标签

```vue
<!-- 水平布局 -->
<div class="mu-h-box">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- 垂直布局 -->
<div class="mu-v-box">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**最佳实践：**
- 优先使用 class 方式，更轻量
- 用于表单行、工具栏等场景
- 配合 `gap`、`justify-content`、`align-items` 等 Flex 属性使用

---

### 2. 按钮组件

#### MuButton

各种形态的按钮。

**核心属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `caption` | String | 按钮标题 |
| `icon` | String | 按钮图标 |
| `size` | String | 尺寸：`small` \| `normal` \| `large` |
| `button-style` | String | 风格：`normal` \| `outline` \| `text` \| `link` |
| `primary` | Boolean | 主色按钮 |
| `danger` | Boolean | 危险色按钮 |
| `accent` | Boolean | 强调色按钮 |
| `disabled` | Boolean | 禁用状态 |
| `x-color` | String | 自定义颜色 |

**常用示例：**

```vue
<!-- 基础按钮 -->
<mu-button caption="确定" />

<!-- 主按钮 -->
<mu-button primary caption="提交" />

<!-- 危险操作 -->
<mu-button danger caption="删除" />

<!-- 图标按钮 -->
<mu-button icon="icon icon-save" caption="保存" />

<!-- 不同尺寸 -->
<mu-button size="small" caption="小" />
<mu-button size="normal" caption="中" />
<mu-button size="large" caption="大" />

<!-- 不同风格 -->
<mu-button button-style="normal" caption="普通" />
<mu-button button-style="outline" caption="边框" />
<mu-button button-style="text" caption="文字" />
```

**最佳实践：**
- 表单提交使用 `primary` 按钮
- 删除等危险操作使用 `danger` 按钮
- 取消操作使用 `button-style="text"` 或默认按钮
- 工具栏优先使用 `MuToolButton`

---

### 3. 表单组件

#### MuInput

基础输入框。

**核心属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | - | v-model 双向绑定 |
| `type` | String | 原生 input type，默认 `text` |
| `placeholder` | String | 占位文本 |
| `clear-button` | Boolean | 显示清除按钮，默认受全局选项控制 |
| `prefix` | String/Object | 前缀文本或按钮 |
| `suffix` | String/Object | 后缀文本或按钮 |
| `disabled` | Boolean | 禁用状态 |
| `readonly` | Boolean | 只读状态 |

**常用示例：**

```vue
<!-- 基础输入 -->
<mu-input v-model="username" placeholder="请输入用户名" />

<!-- 带前后缀 -->
<mu-input v-model="price" prefix="¥" suffix="元" />

<!-- 密码输入 -->
<mu-input v-model="password" type="password" />

<!-- 只读 -->
<mu-input v-model="readonlyValue" readonly />

<!-- 禁用 -->
<mu-input v-model="disabledValue" disabled />
```

---

#### MuSelect

下拉单选框。

**核心属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `options` | Array | 选项数组 `[{ value, label }]` |
| `option-key` | String | 选项的 key 属性名，默认 `value` |
| `modelValue` | - | v-model 绑定值 |

**示例：**

```vue
<script setup>
import { ref } from 'vue'

const selected = ref('')

const options = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'orange', label: '橙子' }
]
</script>

<template>
  <mu-select v-model="selected" :options="options" />
</template>
```

---

#### MuCheck / MuRadio

复选框和单选框。

**示例：**

```vue
<!-- 复选框 - 单个 -->
<mu-check v-model="agreed">我同意协议</mu-check>

<!-- 复选框 - 数组组 -->
<mu-check v-model="fruits" value="apple">苹果</mu-check>
<mu-check v-model="fruits" value="banana">香蕉</mu-check>

<!-- 单选框 -->
<mu-radio v-model="gender" value="male">男</mu-radio>
<mu-radio v-model="gender" value="female">女</mu-radio>
```

---

### 4. 模态窗口组件

#### MuDialog

模态对话框。

**核心属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `visible` | Boolean | 显示/隐藏（v-model:visible） |
| `title` | String | 对话框标题 |
| `width` | String/Number | 宽度 |
| `height` | String/Number | 高度 |
| `easy-hide` | Boolean | 点击遮罩/ESC 关闭 |
| `buttons` | Array | 底部按钮配置 |
| `lazy` | Boolean | 懒渲染，首次打开时渲染 |

**核心事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | value, action, trigger | 关闭事件，可判断触发原因 |
| `button-click` | button | 按钮点击 |

**示例：**

```vue
<script setup>
import { ref } from 'vue'

const visible = ref(false)

const open = () => { visible.value = true }

const handleClose = (value, action, trigger) => {
  console.log('触发原因:', trigger) // 'mask', 'esc', 'close-button', 'button'
}
</script>

<template>
  <mu-button @click="open" caption="打开对话框" />

  <mu-dialog
    v-model:visible="visible"
    title="提示"
    width="500px"
    :easy-hide="true"
    @update:visible="handleClose"
  >
    <p>对话框内容</p>

    <template #footer>
      <mu-button caption="取消" @click="visible = false" />
      <mu-button primary caption="确定" />
    </template>
  </mu-dialog>
</template>
```

**最佳实践：**
- 使用 `v-model:visible` 控制显示状态
- 表单对话框使用 `@update:visible` 检查是否因点击遮罩关闭
- 复杂对话框使用 `lazy` 属性优化性能

---

#### MuDrawer

从四周浮出的抽屉面板。

**核心属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `visible` | Boolean | 显示/隐藏 |
| `position` | String | 位置：`top` \| `right` \| `bottom` \| `left` |
| `width` | String/Number | 宽度（left/right） |
| `height` | String/Number | 高度（top/bottom） |
| `mask` | Boolean | 是否显示遮罩，默认 true |
| `easy-hide` | Boolean | 快速关闭 |

**示例：**

```vue
<mu-drawer
  v-model:visible="drawerVisible"
  position="right"
  width="300px"
>
  <p>抽屉内容</p>
</mu-drawer>
```

---

### 5. 反馈组件

#### MessageBox

消息提示对话框（程序化调用）。

```vue
<script setup>
import { inject } from 'vue'

const { messageBox } = inject('$mussel')

// 警告对话框
const showAlert = async () => {
  const btn = await messageBox.alert('操作成功！')
  console.log('点击了:', btn)
}

// 确认对话框
const showConfirm = async () => {
  const btn = await messageBox.confirm('确定要删除吗？')
  if (btn === 'ok') {
    // 用户点击了确定
  }
}

// 错误提示
const showError = () => {
  messageBox.error('操作失败，请重试')
}

// 警告提示
const showWarn = () => {
  messageBox.warn('请注意数据可能丢失')
}
</script>
```

#### Notifier

浮动消息通知。

```vue
<script setup>
import { inject } from 'vue'

const { notifier } = inject('$mussel')

notifier.notify({
  title: '操作成功',
  message: '数据已保存',
  type: 'success' // 'alert' | 'success' | 'warn' | 'error'
})
</script>
```

---

## 组件使用模式

### 表单布局模式

```vue
<template>
  <mu-form label-width="100px" label-align="right">
    <mu-form-row>
      <mu-form-field label="用户名：">
        <mu-input v-model="form.username" />
      </mu-form-field>
    </mu-form-row>

    <mu-form-row>
      <mu-form-field label="邮箱：">
        <mu-input v-model="form.email" type="email" />
      </mu-form-field>
    </mu-form-row>

    <mu-form-row>
      <mu-form-field label="性别：">
        <mu-radio v-model="form.gender" value="male">男</mu-radio>
        <mu-radio v-model="form.gender" value="female">女</mu-radio>
      </mu-form-field>
    </mu-form-row>

    <mu-form-row>
      <mu-form-field>
        <mu-button primary caption="提交" />
        <mu-button caption="取消" />
      </mu-form-field>
    </mu-form-row>
  </mu-form>
</template>
```

### 工具栏模式

```vue
<template>
  <div class="mu-h-box" style="gap: 8px; padding: 8px;">
    <mu-button primary icon="icon icon-save" caption="保存" />
    <mu-button caption="取消" />
    <div style="flex: 1"></div>
    <mu-tool-button icon="icon icon-settings" />
    <mu-tool-button icon="icon icon-refresh" />
  </div>
</template>
```

### 标签页模式

```vue
<template>
  <mu-tabs v-model:active-tab="activeTab" tab-style="border-card">
    <mu-tab-panel name="tab1" caption="首页" icon="icon icon-home">
      首页内容
    </mu-tab-panel>
    <mu-tab-panel name="tab2" caption="设置" icon="icon icon-settings">
      设置内容
    </mu-tab-panel>
    <mu-tab-panel name="tab3" caption="关于" icon="icon icon-info">
      关于内容
    </mu-tab-panel>
  </mu-tabs>
</template>

<script setup>
import { ref } from 'vue'
const activeTab = ref('tab1')
</script>
```

---

## 常见问题

### Q: 如何正确使用图标？

图标需要在安装 Mussel 时注册，推荐集中管理：

```javascript
import { install as installMussel, installIcons } from 'mussel'
import MySvgIcon from 'path/to/icon.svg'

const app = createApp()

// 方式1：安装时注册
installMussel(app, {
  icons: {
    'my-icon': MySvgIcon,      // SVG 数据
    'bolt': 'icon icon-bolt'   // icon-font class
  }
})

// 方式2：后续注册
installIcons({
  'another-icon': anotherSvgIcon
})
```

### Q: MuDialog 关闭事件如何区分触发原因？

使用 `@update:visible` 事件的第三个参数：

```vue
<mu-dialog
  v-model:visible="visible"
  @update:visible="(val, action, trigger) => {
    if (trigger === 'mask' || trigger === 'esc') {
      // 用户点击了遮罩或按了 ESC，可能需要检查表单
    }
  }"
>
```

### Q: 如何让下拉框支持用户输入？

使用 `MuComboBox` 并设置 `editable`：

```vue
<mu-combo-box
  v-model="value"
  :options="options"
  editable
/>
```

### Q: 表单验证怎么做？

Mussel 4 目前表单组件主要用于布局，验证需要配合其他方案（如 VeeValidate）。

---

## 更多组件

如需查看以下组件的详细信息，请读取 [完整组件文档](references/full-components.md)：

- **导航组件**：MuDropdownPanel、MuDropdown、MuDropdownButton、MuContextMenu
- **数据展示**：MuList、MuListItem、MuTree、MuTags、MuCalendar
- **高级布局**：MuFlexSplitter、MuScrollBox
- **其他**：MuSvgStripe、MuBadge、MuToolbar、MuStatusBox

---

## 使用建议

1. **优先使用 class 方式**：对于布局容器（MuHBox、MuVBox、MuGridBox），直接使用 class 更轻量
2. **图标集中管理**：在应用入口统一注册所有图标，便于维护
3. **响应式尺寸**：对话框、抽屉等组件的 width/height 可使用百分比或 `auto`
4. **事件命名**：注意组件事件命名规范，如下拉相关事件带 `dropdown:` 前缀
5. **全局配置**：通过 `$mussel.options` 配置全局行为，如 `input.clearButton`

---

## 开发时查找组件

当你需要使用某个组件但不确定 API 时，按以下步骤操作：

1. **先看本指南的常用组件** - 大部分日常需求已覆盖
2. **查看组件选择指南表** - 快速定位可能合适的组件
3. **读取完整组件文档** - 获取更详细的 API 信息
4. **查看项目中的示例代码** - 参考实际使用场景
