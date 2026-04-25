# Mussel 3 → Mussel 4 迁移规则

所有已知 API 变更的完整参考。升级过程中以此文件为权威依据。

---

## 目录

1. [组件替换](#1-组件替换)
2. [属性重命名](#2-属性重命名)
3. [事件重命名](#3-事件重命名)
4. [CSS 变量重命名](#4-css-变量重命名)
5. [CSS 类变更](#5-css-类变更)
6. [图标变更](#6-图标变更)
7. [全局配置变更](#7-全局配置变更)
8. [结构变更](#8-结构变更)
9. [新增组件](#9-新增组件)
10. [Box 布局系统迁移](#10-box-布局系统迁移)

---

## 1. 组件替换

### MuEditor → MuInput

| Mussel 3 | Mussel 4 |
|----------|----------|
| `<mu-editor>` | `<mu-input>` |
| `class="mu-editor"` | `class="mu-input"` |
| `:clear-button="true"` | `clearable="true"` |
| `solid`（布尔属性） | `input-style="solid"` |
| `underline`（布尔属性） | `input-style="underline"` |
| `round`（布尔属性） | 无直接对应 |
| 通过 `<template #prefix>` / `<template #suffix>` 插槽添加前后缀 | `prefix=":icon=search"` / `suffix=":icon=search"` 属性 |
| `width="100%"` | `style="width: 100%;"` |

```html
<!-- 升级前 -->
<mu-editor v-model="value" :clear-button="true" solid width="100%">
  <template #suffix><mu-icon icon="search" /></template>
</mu-editor>

<!-- 升级后 -->
<mu-input v-model="value" clearable input-style="solid" style="width: 100%;" suffix=":icon=search" />
```

### MuOption → 已移除

`<mu-option>` 已移除。选项现在通过 Select/ComboBox 的 `options` 数组属性配置。

```html
<!-- 升级前 -->
<mu-select v-model="val">
  <mu-option value="a" label="A" />
  <mu-option value="b" label="B" />
</mu-select>

<!-- 升级后 -->
<mu-select v-model="val" :options="[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]" />
```

### MuTabsButtons → 已移除

Mussel 3 的 `<mu-tabs-buttons>` 已移除。标签按钮现在由 `<mu-tabs>` 内的 `<mu-tab-panel>` 自动生成。

### MuTreeView / MuTreeNode / MuTreeNodes → MuTree

三个组件统一由 `<mu-tree>` 替代。

```html
<!-- 升级前 -->
<mu-tree-view>
  <mu-tree-node ... />
  <mu-tree-nodes>
    <mu-tree-node ... />
  </mu-tree-nodes>
</mu-tree-view>

<!-- 升级后 -->
<mu-tree :data="treeData" :props="treeProps" @node-click="onNodeClick" />
```

### MuDropdownItem / MuDropdownCheckItem / MuDropdownRadioItem → 已移除

三个组件统一由 MuDropdown/MuDropdownPanel 的 `dropdown-items` 数组属性替代。

```html
<!-- 升级前 -->
<mu-dropdown>
  <mu-button>菜单</mu-button>
  <template #dropdown>
    <mu-dropdown-item caption="选项1" />
    <mu-dropdown-check-item caption="勾选1" />
  </template>
</mu-dropdown>

<!-- 升级后 -->
<mu-dropdown :dropdown-items="[
  { caption: '选项1', action: 'opt1' },
  { caption: '勾选1', type: 'check', value: 'check1' }
]">
  <mu-button>菜单</mu-button>
</mu-dropdown>
```

---

## 2. 属性重命名

### MuDialog

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `mask-action="none"` | `:easy-hide="false"` | |
| `mask-action="hide"` | `:easy-hide="true"` | |
| `:moveable="false"` | `:keep-position="true"` | 逻辑取反 |
| `render-to-body` | _(已移除，自动处理)_ | |

### MuComboBox

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `:clear-button="true"` | `clearable="true"` | |
| `class="mu-box"` | _(移除该 class)_ | |
| `width="100%"` | `style="width: 100%;"` | |
| `label`（属性） | `prefix` / `suffix` | |

### MuDropdown

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `dropdown-align` | `dropdown-position` | 值：auto / fixed / top / bottom |
| `sticky-target` | `dropdown-snap-to` | 默认：组件根元素 |
| `reserve-icon-place` | _(已移除)_ | |

### MuDropdownPanel

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `items` | `dropdown-items` | |
| `align` | `position` | |
| `sticky-target` | _(已移除)_ | |

### MuDropdownButton

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `trigger-action="click"` | `dropdown-trigger="click"` | |

### MuTabs

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `:tab-bar-params` | `tab-bar-attrs` | |

### MuForm / MuFormField

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `class="mu-box"` | _(移除该 class)_ | `.mu-box` 不再有样式，改用原子类 |
| `margin="2x"` | `class="m-2x"` | 改为原子类 |
| `padding="8px"` | `style="padding: 8px;"` | 转为内联样式 |

### MuCheck

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `class="mu-box"` | _(移除该 class)_ | |
| `:disabled="false"` | `:disabled="!editable || null"` | `false` 不生效，需用 null |

### MuBadge

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `secondary` | `accent` | |

### MuIcon

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `reverse` | _(已移除)_ | |

### width 属性

仍支持 `width` 属性的组件：**form、dialog、tabs**。
其他所有组件（包括 box）：`width="100%"` → `style="width: 100%;"`。

---

## 3. 事件重命名

| 组件 | Mussel 3 | Mussel 4 |
|------|----------|----------|
| MuTabs | `@tab-click` | `@button-click` |
| MuTabs | `@tab-change` | `@update:active-tab` |
| MuComboBox | `@update:model-value` | `@update:model-value`（相同，但需验证用法） |

### MuDialog 事件变更

```js
// Mussel 4：新的事件签名
function onDialogVisibleChange (value, trigger) {
  // trigger 可以是：'CANCEL'、'$MASK'、'$X' 或按钮名称
  if (trigger === 'CANCEL') doSomething()
  visible.value = value  // 必须手动赋值才能关闭
}
```

### MuInput 事件

| Mussel 3（MuEditor） | Mussel 4（MuInput） |
|----------------------|---------------------|
| _(无专用事件)_ | `@prefix-click` |
| _(无专用事件)_ | `@suffix-click` |

---

## 4. CSS 变量重命名

### 文本颜色

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-text-color-normal` | `--mu-text-color-normal`（不变） |
| `--mu-text-color-reversed` | `#fff`（直接使用颜色值） |
| `--mu-text-color-weak` | `--mu-text-color-muted` |
| `--mu-text-color-placeholder` | _(已移除)_ |
| _(无)_ | `--mu-text-color-strong`（新增） |
| _(无)_ | `--mu-text-color-subtle`（新增） |
| _(无)_ | `--mu-text-color-soft`（新增） |

### 背景颜色

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-background-normal` | `--mu-bg-normal` |
| `--mu-background-hover` | `--mu-bg-translucent-gray` |
| `--mu-background-strong` | `--mu-bg-strong` |
| `--mu-background-disabled` | `--mu-bg-disabled` |

### 边框颜色

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-border-color` | `--mu-border-color-normal` |
| `--mu-divider-color` | `--mu-border-color-soft` |

### 其他变量

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-gray-dark` | `--mu-text-color-normal` |
| `--mu-primary-color-shadow` | `--mu-bg-translucent-primary` |
| `--mu-unit-spacing-size` | `--mu-base-spacing` |
| `--mu-editor-text-color` | `--mu-text-color-clear` |
| `--mu-mask-background` | `--mu-bg-mask` |

### Editor 专用变量（已移除）

以下变量在 Mussel 4 中不再存在：
- `--mu-editor-background` → 使用 `--mu-bg-normal`
- `--mu-editor-background-solid` → 已移除
- `--mu-editor-background-readonly` → 已移除
- `--mu-editor-border-color` → 已移除
- `--mu-editor-label-background` → 已移除

### 颜色变体变更

Mussel 3 中每个基本色有 `dark`、`light`、`shadow` 变体（如 `--mu-red-dark`）。在 Mussel 4 中**全部移除**。

Mussel 4 新增：
- `-translucent` 变体（10% 透明度）：`--mu-red-translucent`
- `-faint` 变体（极浅色）：`--mu-primary-faint`
- 扩展色等级色：`--mu-primary-color-0` ~ `--mu-primary-color-9`

### 灰度色阶

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-gray-0` ~ `--mu-gray-9`（10 级） | `--mu-gray-0` ~ `--mu-gray-19`（20 级） |

0-9 级保持不变，10-19 级为新增。

---

## 5. CSS 类变更

### 废弃的背景类

以下类在 Mussel 4 中**已移除**，需替换为内联样式：

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-bg-transparent"` | `style="background: transparent"` |
| `class="mu-bg-white"` | `style="background: white"` |
| `class="mu-bg-black"` | `style="background: black"` |
| `class="mu-bg-x-color"` | `style="background-color: var(--mu-xxx)"` |

### Editor 类名重命名

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-editor"` | `class="mu-input"` |

### 文本颜色类重命名

| Mussel 3 | Mussel 4 |
|----------|----------|
| `.mu-text-color-weak` | `.mu-text-color-muted` |
| _(无)_ | `.mu-text-color-strong`（新增） |
| _(无)_ | `.mu-text-color-subtle`（新增） |
| _(无)_ | `.mu-text-color-soft`（新增） |

### 新增原子类（Mussel 4）

Mussel 4 新增了完整的原子类系统。主要类别：

**布局**：`.flex`、`.flex-row`、`.flex-col`、`.flex-1`、`.items-center`、`.justify-between`、`.gap-{n}x`

**间距**：`.p-{n}x`、`.m-{n}x`、`.px-{n}x`、`.mx-{n}x`（n: 1-4）

**边框**：`.border`、`.border-2`、`.border-primary`、`.border-danger`、`.border-dashed`

**文本**：`.text-strong`、`.text-muted`、`.text-primary`、`.text-ellipsis`、`.line-clamp`

---

## 6. 图标变更

| Mussel 3 | Mussel 4 |
|----------|----------|
| `icon="dropdown"` | `icon="chevronDown"` |

---

## 7. 全局配置变更

### 插件注册

```js
// Mussel 3
app.use(pluginMussel, { icons, theme: { ... } })

// Mussel 4（API 形式相同，但主题配置项有变化）
app.use(pluginMussel, {
  icons,
  theme: {
    commonFontSize: '12px',
    textColorNormal: 'var(--mu-gray-8)',
    borderColor: '#ebecf0',
    dividerColor: '#ebecf0',
    primary: '#008CD6',
    danger: '#f57a79',
    success: '#00b25a',
    warning: '#f4af61',
    primaryColorDark: '#006db0',
    primaryColorLight: '#24a7e3'
  },
  tree: {
    expandIcons: { expanded: 'tree-expanded', collapsed: 'tree-collapsed' },
    nodeIcons: { leaf: 'tree-leaf', folder: 'tree-folder', folderOpen: 'tree-folder-open' }
  }
})
```

### CSS 兼容性垫片

在应用根样式中添加以下映射，使旧变量名继续生效：

```css
.mu-root {
  --mu-mask-background: var(--mu-bg-mask);
  --mu-divider-color: var(--mu-divider-color);
  --mu-background-hover: var(--mu-bg-translucent-gray);
  --mu-unit-spacing-size: var(--mu-base-spacing);
  --mu-list-item-hover-background: var(--mu-bg-translucent-gray);
  --mu-text-color-weak: var(--mu-text-color-muted);
  --mu-button-border-color-normal: var(--mu-border-color);
  --mu-background-normal: var(--mu-bg-normal);
  --mu-primary-color-shadow: var(--mu-bg-translucent-primary);
}
```

---

## 8. 结构变更

### MuDialog Body

```html
<!-- 升级前：MuDialog 有 <mu-dialog-body> 包裹层 -->
<mu-dialog :visible.sync="visible">
  <mu-dialog-body>内容</mu-dialog-body>
</mu-dialog>

<!-- 升级后：内容直接放入，给根节点添加 padding -->
<mu-dialog v-model:visible="visible">
  <div style="padding: 16px;">内容</div>
</mu-dialog>
```

### MuDialog 按钮

```js
// 升级前：对象数组
buttons: [{ caption: '确定', primary: true }, { caption: '取消', action: 'close' }]

// 升级后：支持字符串简写
buttons: ['#OK', '#CANCEL']
// 或混合使用
buttons: ['#OK', '#CANCEL', { caption: '自定义', primary: true }]
```

### MuComboBox 多选

```html
<!-- 升级前：单选和多选共用一个组件 -->
<mu-combo-box :multiple="true" ... />

<!-- 升级后：多选使用专用组件 -->
<mu-multi-select :options="options" v-model="values" clearable />
```

### MuTree（替代 TreeView/TreeNode/TreeNodes）

```html
<!-- 升级后：数据驱动方式 -->
<mu-tree
  :data="treeData"
  :props="{ label: 'name', children: 'children' }"
  :checkbox="true"
  :cascaded-check="true"
  @node-click="onNodeClick"
  @node-check-change="onCheckChange"
/>
```

---

## 9. 新增组件

Mussel 4 新增了以下组件，可用于替代手工实现：

| 组件 | 用途 |
|------|------|
| MuInput | 替代 MuEditor |
| MuSelect | 下拉单选框 |
| MuMultiSelect | 下拉多选框（带标签显示） |
| MuDateInput | 日期/月份选择器 |
| MuTable | 数据表格，支持多种列类型（text、check、bool、enum、date、link、tag 等） |
| MuList | 列表容器，支持滚动条 |
| MuTree | 统一的树组件 |
| MuTags | 标签组，支持展开/收起 |
| MuCalendar | 月历组件 |
| MuDrawer | 抽屉面板（上/右/下/左） |
| MuContextMenu | 右键上下文菜单 |
| MuFlexSplitter | 可拖拽的 Flex 分隔条 |
| MuToolButton | 仅图标的快捷操作按钮 |
| MuInputGroup | 输入框分组 |
| MuToolbar | 工具栏组件 |
| MuSvgStripe | SVG 装饰条纹 |

---

## 10. Box 布局系统迁移

Mussel 4 移除了 `.mu-box` 的所有 CSS 属性选择器样式，简化了布局组件。所有原本通过 `class="mu-box"` + HTML 属性实现的布局、间距、边框、尺寸等，现在需改用原子类或内联样式。

### 10.1 移除项

| 移除项 | 说明 |
|--------|------|
| `<mu-box>` 组件 | 已删除，不再可用 |
| `class="mu-box"` CSS 类 | 无对应样式定义，仅是一个无意义的 class 名 |
| `.mu-box` 上的属性选择器样式 | 所有 `margin=`、`padding=`、`border`、`width=`、`height=`、`position=`、`layout=`、`flex=`、`align-items=`、`justify-content=`、`gap=`、`overflow=`、`content-center`、`flex-wrap`、`inline`、`reverse` 等属性选择器均已失效 |
| `class="mu-h-box"` / `class="mu-v-box"` 作为纯 CSS 类 | 不再具有 `display: flex` / `display: flex; flex-direction: column` 的效果 |
| `class="mu-space"` | 改为 `class="flex-spacer"` |
| `class="mu-divider"` | 改为 `class="flex-divider"` |
| `class="mu-flex-item"` | 无对应样式 |

### 10.2 组件变更

| 组件 | Mussel 3 渲染 | Mussel 4 渲染 | 迁移方式 |
|------|---------------|---------------|----------|
| `<mu-h-box>` | `<div class="mu-h-box">` | `<div class="flex">` | 改为 `<div class="flex ...">` |
| `<mu-v-box>` | `<div class="mu-v-box">` | `<div class="flex flex-col">` | 改为 `<div class="flex flex-col ...">` |
| `<mu-grid-box>` | `<div class="mu-grid-box">` + 属性选择器 | `<div class="grid">` + 内联 style | **保留组件**，但 `width`/`height`/`padding` 等属性需改用 `style` 或原子类 |
| `<mu-grid-cell>` | `<div>` + 属性选择器 | `<div>` + 内联 style | **保留组件**，通过 `:col-start`/`:col-end`/`:row-start`/`:row-end` props 传值 |

### 10.3 属性选择器 → 原子类 / 内联样式 完整映射

#### 布局

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `layout="flex"` | `class="flex"` | |
| `layout="grid"` | `class="grid"` | |
| `class="mu-h-box"` | `class="flex"` | |
| `class="mu-v-box"` | `class="flex flex-col"` | |
| `class="mu-h-box"` (组件) | `<div class="flex ...">` | 替换为 div |
| `class="mu-v-box"` (组件) | `<div class="flex flex-col ...">` | 替换为 div |
| `content-center` | `class="flex-center"` | 同时设置 align-items: center 和 justify-content: center |
| `flex-wrap` | `class="flex-wrap"` | 注意：旧版还额外设置 `align-items: flex-start`，如需保留需加上 `class="items-start"` |
| `inline` | `class="inline-flex"` | |
| `reverse`（在 h-box 上） | `class="flex-row-reverse"` | |
| `reverse`（在 v-box 上） | `class="flex-col-reverse"` | |

#### Flex 子项

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `flex="1"` | `class="flex-1"` | |
| `flex="0"` | `class="flex-none"` | |
| `flex="auto"` | `class="flex-auto"` | |
| `flex="2"` ~ `flex="12"` | `style="flex: 2"` ~ `style="flex: 12"` | 无对应原子类 |
| `flex="1 auto"` | `class="flex-1"` + `style="flex-basis: auto"` | |

#### 对齐

| Mussel 3 | Mussel 4 |
|----------|----------|
| `align-items="center"` | `class="items-center"` |
| `align-items="start"` | `class="items-start"` |
| `align-items="end"` | `class="items-end"` |
| `align-items="stretch"` | `class="items-stretch"` |
| `align-items="baseline"` | `class="items-baseline"` |
| `align-self="stretch"` | `class="self-stretch"` |
| `align-self="center"` | `class="self-center"` |
| `justify-content="center"` | `class="justify-center"` |
| `justify-content="space-between"` | `class="justify-space-between"` |
| `justify-content="space-around"` | `class="justify-space-around"` |
| `justify-content="end"` | `class="justify-end"` |

#### 间距

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `padding="1x"` ~ `padding="4x"` | `class="p-1x"` ~ `class="p-4x"` | |
| `padding="0"` | `style="padding: 0"` | |
| `padding-x="1x"` ~ `padding-x="4x"` | `class="px-1x"` ~ `class="px-4x"` | |
| `padding-y="1x"` ~ `padding-y="4x"` | `class="py-1x"` ~ `class="py-4x"` | |
| `padding-top="1x"` | `class="pt-1x"` | |
| `padding-right="1x"` | `class="pr-1x"` | |
| `padding-bottom="1x"` | `class="pb-1x"` | |
| `padding-left="1x"` | `class="pl-1x"` | |
| `margin="1x"` ~ `margin="4x"` | `class="m-1x"` ~ `class="m-4x"` | |
| `margin="0"` | `style="margin: 0"` | |
| `margin="auto"` | `class="m-auto"` | |
| `margin-x="1x"` ~ `margin-x="4x"` | `class="mx-1x"` ~ `class="mx-4x"` | |
| `margin-y="1x"` ~ `margin-y="4x"` | `class="my-1x"` ~ `class="my-4x"` | |
| `margin-top="1x"` | `class="mt-1x"` | |
| `margin-top="auto"` | `class="mt-auto"` | |
| `margin-left="auto"` | `class="ml-auto"` | |
| `margin-right="auto"` | `class="mr-auto"` | |

#### Gap

| Mussel 3 | Mussel 4 |
|----------|----------|
| `gap="1x"` | `class="gap-1x"` |
| `gap="2x"` | `class="gap-2x"` |
| `gap="3x"` | `class="gap-3x"` |
| `gap="4x"` | `class="gap-4x"` |

#### 边框

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `border`（布尔属性） | `class="border"` | 1px solid |
| `border-right` | `class="border-r"` | |
| `border-left` | `class="border-l"` | |
| `border-top` | `class="border-t"` | |
| `border-bottom` | `class="border-b"` | |
| `border-x` | `class="border-x"` | 左右 |
| `border-y` | `class="border-y"` | 上下 |
| `border="dashed"` | `class="border border-dashed"` | |
| `border="dotted"` | `class="border border-dotted"` | |
| `border="primary"` | `class="border border-primary"` | |
| `border="danger"` | `class="border border-danger"` | |
| `border="muted"` | `class="border border-soft"` | muted → soft |
| `border-radius` | `class="border-r4"` 或 `class="border-r8"` | |
| `border-radius="window"` | 无原子类，需 `style` | |

#### 尺寸

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `width="100%"` | `style="width: 100%"` | |
| `width="400"` | `style="width: 400px"` | |
| `height="270"` | `style="height: 270px"` | |
| `width="auto"` | `style="width: auto"` | |
| `height="auto"` | `style="height: auto"` | |
| `overflow="auto"` | `class="overflow-auto"` | |
| `overflow="hidden"` | `class="overflow-hidden"` | |

#### 定位

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `position="fixed"` | `class="fixed"` | |
| `position="absolute"` | `class="absolute"` | |
| `position="relative"` | `class="relative"` | |
| `position="fixed" fit` | `class="fixed"` + `style="inset: 0"` | |
| `position="fixed" bottom left` | `class="fixed"` + `style="bottom: 0; left: 0"` | |
| `position="fixed" fit bottom` | `class="fixed"` + `style="top: auto; inset-inline: 0; bottom: 0"` | |

#### 背景色

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-box mu-bg-normal"` | `class="bg-normal"` |
| `class="mu-box mu-bg-strong"` | `class="bg-strong"` |

#### 辅助元素

`mu-space` 已重命名为 `flex-spacer`，`mu-divider` 已重命名为 `flex-divider`。尺寸变体改用属性选择器。

**flex-spacer（原 mu-space）：**

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `<div class="mu-space" />` | `<div class="flex-spacer" />` | flex: 1 1 0 |
| `<div class="mu-space" space="1x" />` | `<div class="flex-spacer" space="1x" />` | 等间距变体 1x ~ 4x |
| `<div class="mu-space" space="100%" />` | `<div class="flex-break" />` | 强制换行 |

**flex-divider（原 mu-divider）：**

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `<div class="mu-divider" />` | `<div class="flex-divider" />` | 默认 2px |
| `<div class="mu-divider" thin />` | `<div class="flex-divider" line-width="1" />` | 1px 细分隔线 |
| 像素值变体 | `class="flex-divider" line-width="{n}"` | 1 ~ 4px |

### 10.4 升级示例

#### 简单页面容器

```html
<!-- 升级前 -->
<div class="mu-box mu-bg-normal" width="100%" layout="flex" flex-wrap gap="2x" padding="2x">

<!-- 升级后 -->
<div class="bg-normal flex flex-wrap items-start gap-2x p-2x" style="width: 100%">
```

注意：旧版 `flex-wrap` 还会设置 `align-items: flex-start`，如需保留此行为需加上 `items-start`。

#### 固定定位全屏布局

```html
<!-- 升级前 -->
<mu-v-box position="fixed fit" padding="1x">
  <mu-toolbar>...</mu-toolbar>
  <mu-h-box flex="1">
    <div class="mu-box mu-v-box" flex="0" width="240" border-right>
      ...
    </div>
    <div class="mu-box mu-v-box" flex="1">
      ...
    </div>
  </mu-h-box>
</mu-v-box>

<!-- 升级后 -->
<div class="flex flex-col fixed p-1x" style="inset: 0;">
  <mu-toolbar>...</mu-toolbar>
  <div class="flex flex-1">
    <div class="flex flex-col flex-none border-r" style="width: 240px">
      ...
    </div>
    <div class="flex flex-col flex-1">
      ...
    </div>
  </div>
</div>
```

#### Tabs 页签栏内的分隔符和弹性占位

```html
<!-- 升级前 -->
<template #tab-bar-prepend>
  <label class="mu-label">Customized Tab Bar</label>
  <div class="mu-space" />
  <div class="mu-divider" />
</template>
<template #tab-bar-append>
  <div class="mu-divider" />
  <div class="mu-space" />
  <mu-dropdown-button class="mu-box" caption="artist" :dropdown-items="artists" />
</template>

<!-- 升级后 -->
<template #tab-bar-prepend>
  <label class="mu-label">Customized Tab Bar</label>
  <div class="flex-spacer" />
  <div class="flex-divider" />
</template>
<template #tab-bar-append>
  <div class="flex-divider" />
  <div class="flex-spacer" />
  <mu-dropdown-button caption="artist" :dropdown-items="artists" />
</template>
```

#### Grid 布局（保留组件，调整属性传递方式）

```html
<!-- 升级前 -->
<mu-grid-box width="480" height="270" padding="1x" :columns="7" :rows="5">
  <mu-grid-cell :col-start="1" :col-end="2" :row-start="1" :row-end="2" margin="1x">
    1
  </mu-grid-cell>
</mu-grid-box>

<!-- 升级后：保留组件，width/height/padding 改用 style 或原子类 -->
<mu-grid-box
  class="p-1x"
  style="width: 480px; height: 270px;"
  :columns="7" :rows="5">
  <mu-grid-cell
    :col-start="1" :col-end="2" :row-start="1" :row-end="2"
    class="m-1x">
    1
  </mu-grid-cell>
</mu-grid-box>
```

### 10.5 升级检查清单

对每个涉及 `mu-box` 的文件，逐一检查：

- [ ] `class="mu-box"` → 移除，合并到其他 class 中
- [ ] `class="mu-h-box"` / `class="mu-v-box"`（非组件用法）→ `class="flex"` / `class="flex flex-col"`
- [ ] `<mu-h-box>` / `<mu-v-box>` 组件 → `<div class="flex ...">` / `<div class="flex flex-col ...">`
- [ ] `<mu-box>` 组件 → `<div>` + 合并 class
- [ ] `layout="flex"` / `layout="grid"` → `class="flex"` / `class="grid"`
- [ ] `flex="N"` → `class="flex-N"` / `class="flex-none"` / `class="flex-auto"`
- [ ] `padding=` / `margin=` 系列 → 原子类（`p-*x`、`m-*x`、`px-*x`、`mx-*x` 等）
- [ ] `gap="Nx"` → `class="gap-Nx"`
- [ ] `align-items=` / `align-self=` / `justify-content=` → 原子类（`items-*`、`self-*`、`justify-*`）
- [ ] `border` / `border-right` 等 → `class="border"` / `class="border-r"` 等
- [ ] `position="fixed fit"` → `class="fixed"` + `style="inset: 0"`
- [ ] `width=` / `height=` → `style="width: ..."` / `style="height: ..."`
- [ ] `overflow=` → `class="overflow-*"`
- [ ] `content-center` → `class="flex-center"`
- [ ] `class="mu-space"` → `class="flex-spacer"`（`space="Nx"` 保留为属性选择器）
- [ ] `class="mu-divider"` → `class="flex-divider"`（`thin` 改为 `line-width="1"`）
- [ ] `class="mu-box mu-bg-normal"` → `class="bg-normal"`
- [ ] `<mu-grid-box>` 上非 props 的属性（`width`、`height`、`padding`）→ `style` 或原子类
- [ ] `<mu-grid-cell>` 上的 `margin=` → `class="m-*x"`
