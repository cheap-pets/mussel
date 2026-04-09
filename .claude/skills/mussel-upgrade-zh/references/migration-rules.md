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
| _(无 class)_ | `class="mu-box"` | 必须添加，否则 width/margin/padding 不生效 |
| `margin="2x"` | `style="margin: 16px;"` | 转为内联样式 |
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

仍支持 `width` 属性的组件：**box、form、dialog、tabs**。
其他所有组件：`width="100%"` → `style="width: 100%;"`。

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
