# components.md — MUSSEL 4 组件 API 速查

> 本文件供 SKILL.md 按需加载，包含完整属性表和用法说明。
> 目录：[1. 布局](#1-布局) · [2. 图标与徽章](#2-图标与徽章) · [3. 按钮](#3-按钮) · [4. 导航与下拉](#4-导航与下拉) · [5. 数据展示](#5-数据展示) · [6. 反馈](#6-反馈)

> **独立文件：** 模态与抽屉 → `dialog.md` · 表单与输入 → `form.md` · 表格 → `table.md`

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

> **推荐直接使用原子类**：`<div class="grid">` + 原生 CSS Grid 属性，无需组件。

**MuGridBox 属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `columns` | Number | 列数（自动生成 `repeat(n, 1fr)`) |
| `rows` | Number | 行数（自动生成 `repeat(n, 1fr)`) |

**MuGridCell 属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `col-start` | Number | 起始列 |
| `col-span` | Number | 跨列数 |
| `col-end` | Number | 结束列 |
| `row-start` | Number | 起始行 |
| `row-span` | Number | 跨行数 |
| `row-end` | Number | 结束行 |

```html
<mu-grid-box :columns="6" :rows="6">
  <mu-grid-cell :col-span="2" :row-span="3">宽 2 高 3</mu-grid-cell>
  <mu-grid-cell>默认</mu-grid-cell>
</mu-grid-box>
```

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

### MuSplitHBox / MuSplitVBox

可拖拽分割的弹性布局。HBox 水平排列，VBox 垂直排列。内部使用 `MuFlexSplitter` 实现拖拽。

`left` / `right`（HBox）和 `top` / `bottom`（VBox）插槽均为可选——省略后不渲染对应面板，因此可灵活组成**两区**或**三区**可拖动布局：

```html
<!-- 两区布局：仅 left + center -->
<mu-split-h-box left-width="240px" resizable="left">
  <template #left>导航</template>
  <template #center>主内容</template>
</mu-split-h-box>

<!-- 两区布局：仅 center + bottom -->
<mu-split-v-box bottom-height="200px" resizable="bottom">
  <template #center>主内容</template>
  <template #bottom>终端</template>
</mu-split-v-box>

<!-- 三区布局：完整 left + center + right -->
<mu-split-h-box left-width="200px" right-width="300px" resizable>
  <template #left>侧边栏</template>
  <template #center>主内容</template>
  <template #right>属性面板</template>
</mu-split-h-box>
```

**MuSplitHBox 属性：**

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `resizable` | Boolean \| String | — | 可拖拽面板：`true`（两侧）\| `'left'` \| `'right'` \| `false` |
| `splitter-size` | String | — | 分隔条尺寸：`normal` \| `slim` \| `hidden` |
| `splitter-shape` | String | — | 分隔条形状：`line` \| `bubble` |
| `dblclick` | String | `'reset'` | 双击分隔条行为：`reset`（重置到初始宽度）\| `none`（无响应） |
| `left-width` | String | `'33.3%'` | 左侧面板初始宽度 |
| `left-class` | String | — | 左侧面板 class |
| `left-style` | Object \| String | — | 左侧面板 style |
| `right-width` | String | `'33.3%'` | 右侧面板初始宽度 |
| `right-class` | String | — | 右侧面板 class |
| `right-style` | Object \| String | — | 右侧面板 style |
| `center-class` | String | — | 中间区域 class |
| `center-style` | Object \| String | — | 中间区域 style |

**MuSplitHBox 插槽：**

| 插槽 | 说明 |
|------|------|
| `left` | 左侧面板内容（有插槽时才渲染） |
| `center` | 中间内容区 |
| `right` | 右侧面板内容（有插槽时才渲染） |

```html
<mu-split-h-box
  left-width="200px"
  right-width="300px"
  resizable
  splitter-size="slim"
>
  <template #left>侧边栏</template>
  <template #center>主内容</template>
  <template #right>属性面板</template>
</mu-split-h-box>
```

**MuSplitVBox 属性：**

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `resizable` | Boolean \| String | — | 可拖拽面板：`true`（上下）\| `'top'` \| `'bottom'` \| `false` |
| `splitter-size` | String | — | 分隔条尺寸：`normal` \| `slim` \| `hidden` |
| `splitter-shape` | String | — | 分隔条形状：`line` \| `bubble` |
| `dblclick` | String | `'reset'` | 双击分隔条行为：`reset`（重置到初始高度）\| `none`（无响应） |
| `top-height` | String | `'33.3%'` | 顶部面板初始高度 |
| `top-class` | String | — | 顶部面板 class |
| `top-style` | Object \| String | — | 顶部面板 style |
| `bottom-height` | String | `'33.3%'` | 底部面板初始高度 |
| `bottom-class` | String | — | 底部面板 class |
| `bottom-style` | Object \| String | — | 底部面板 style |
| `center-class` | String | — | 中间区域 class |
| `center-style` | Object \| String | — | 中间区域 style |

**MuSplitVBox 插槽：**

| 插槽 | 说明 |
|------|------|
| `top` | 顶部面板内容（有插槽时才渲染） |
| `center` | 中间内容区 |
| `bottom` | 底部面板内容（有插槽时才渲染） |

```html
<mu-split-v-box
  top-height="40px"
  bottom-height="200px"
  resizable="bottom"
>
  <template #top>工具栏</template>
  <template #center>主内容</template>
  <template #bottom>日志面板</template>
</mu-split-v-box>
```

> **提示：** 双击分隔条可重置面板尺寸到初始值。

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

徽章，用于状态标签或角标。无 `defineProps`，颜色变体通过 HTML attribute（非 prop）控制，直接写在标签上即可。

| Attribute | 颜色 |
|-----------|------|
| （无） | 默认灰色（`--mu-gray`） |
| `primary` | 主色 |
| `secondary` | 次要色 |
| `success` | 成功色 |
| `warning` | 警告色 |
| `danger` | 危险色 |

> 空内容时渲染为小圆点（`8px`），背景自动使用 `--mu-danger-color`。

```html
<mu-badge primary>主要</mu-badge>
<mu-badge success>已完成</mu-badge>
<mu-badge danger>异常</mu-badge>
<mu-badge />               <!-- 小红点 -->
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
| `color` | String | `'normal'` | `'normal'` \| `'primary'` \| `'secondary'` \| `'danger'`，推荐使用 |
| `primary` | Boolean | — | 主色按钮（已废弃，用 `color="primary"`） |
| `danger` | Boolean | — | 危险色按钮（已废弃，用 `color="danger"`） |
| `secondary` | Boolean | — | 次要色按钮（已废弃，用 `color="secondary"`） |
| `pill` | Boolean | — | 左右圆弧形态 |
| `active` | Boolean | — | 选中状态 |
| `disabled` | Boolean | — | 禁用状态 |

```html
<mu-button color="primary" caption="保存" icon="save" @click="save" />
<mu-button color="danger" button-style="outline" caption="删除" @click="remove" />
<mu-button button-style="text" caption="取消" @click="cancel" />
```

---

### MuButtonGroup

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | String | 覆盖内部所有按钮的尺寸 |
| `button-style` | String | `normal` \| `outline` |
| `primary` / `danger` / `secondary` | Boolean | 设置整组按钮颜色 |
| `pill` | Boolean | 圆弧形态 |
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

## 4. 导航与下拉

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

带下拉菜单的按钮，支持分割形式。自身仅定义 `icon`/`caption`/`splitButton` 三个 prop，其他 MuButton 属性（如 `color`、`button-style`、`size`、`disabled`）通过 `$attrs` 透传。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标 |
| `caption` | String | 按钮文字 |
| `split-button` | Boolean | 是否分割按钮形式 |
| (透传) | — | MuButton 属性（`color`、`button-style`、`size` 等）+ MuDropdown 属性 |

```html
<mu-dropdown-button
  caption="新建"
  color="primary"
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

## 5. 数据展示

> 表格组件 MuTable 的完整 API 见 `references/table.md`

### MuList

> ⚠️ MuList 为内部组件，未全局注册。需局部 import 使用：
> ```javascript
> import { MuList } from 'mussel/components/list'
> ```

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
| `range` | Boolean | — | 范围选择模式 |
| `min` | Date\|String | — | 最小可选日期 |
| `max` | Date\|String | — | 最大可选日期 |

---

## 6. 反馈

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
  <mu-button color="primary" caption="重新加载" @click="reload" />
</mu-status-box>
```
