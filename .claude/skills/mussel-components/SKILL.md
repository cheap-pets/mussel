---
name: mussel-components
description: 使用 MUSSEL 4 内部组件库和 UI 规范编写 Vue 界面代码。
  凡是涉及页面开发、组件使用、样式编写、布局、表单、弹窗、表格、列表、
  按钮、导航、下拉菜单等任何界面相关任务时，必须使用此 skill。
  修改已有界面代码、Code Review UI 代码是否合规时，同样必须使用此 skill。
  禁止使用裸 HTML 标签替代已有组件，禁止硬编码颜色值和 z-index 数字。
---

# MUSSEL 4 开发 Skill

## 硬性禁止（每次生成代码均适用，无例外）

1. **禁止硬编码颜色** — 不得出现 `#xxx`、`rgb()`、`hsl()`、`red` 等颜色名
2. **禁止手写 z-index 数字** — 只能使用 `--mu-z-index-*` 系列变量
3. **禁止非 8px 体系的间距** — 不得出现 `margin: 12px`、`padding: 6px` 等非基准倍数值
4. **禁止大段一次性 CSS** — 能用原子类解决的布局，不写 `style` 属性
5. **禁止自造颜色变量** — 不得声明未在规范中定义的 `--mu-*` 变量

> 完整规范细则与 Good/Bad 示例见 `references/principles.md`

---

## 工作流程

接到 UI 任务时，按以下顺序处理：

1. **识别组件** → 对照下方「组件地图」确认使用哪些组件
2. **查阅组件 API** → 读取 `references/components.md` 对应章节，**不要凭记忆猜测属性名**
3. **确认色彩 / 间距** → 涉及颜色或间距变量时，读取 `references/tokens.md`
4. **处理布局** → 需要布局时，读取 `references/layout.md`
5. **生成后自检** → 对照顶部「硬性禁止」逐条过一遍；完整 Checklist 见 `references/principles.md`

---

## 参考文件索引

| 场景 | 读取文件 |
|------|---------|
| 任何组件的完整属性 / 事件 / 插槽 / 示例 | `references/components.md` |
| 颜色、间距、阴影、层级、字体变量 | `references/tokens.md` |
| flex / padding / margin / border 原子类 | `references/layout.md` |
| 规范细则、Good/Bad 示例、自检 Checklist | `references/principles.md` |

---

## 组件地图

> 本节只列「选哪个组件」和「最易出错的点」。完整 API 见 `references/components.md`。

### 布局容器

| 需求 | 组件 / 用法 |
|------|------------|
| 水平排列 | `<div class="mu-h-box">` （优先于 `<mu-h-box>`）|
| 垂直排列 | `<div class="mu-v-box">` （优先于 `<mu-v-box>`）|
| 网格布局 | `<div class="mu-grid-box">` + `<div class="mu-grid-cell">` |
| 可拖拽分隔 | `<mu-flex-splitter>`，**只能放在 flex 容器内** |
| 自定义滚动条 | `<mu-scroll-box>` 或 `v-mu-scrollbar` 指令 |
| 页签切换 | `<mu-tabs>` + `<mu-tab-panel>`；独立页签栏用 `<mu-tab-bar>` |
| 工具栏 | `<mu-toolbar>` |

### 按钮

| 需求 | 组件 / 关键属性 |
|------|--------------|
| 常规按钮 | `<mu-button>`，主操作加 `primary`，危险操作加 `danger` |
| 按钮组 | `<mu-button-group>`，风格统一用 `button-style="outline"` |
| 纯图标按钮 | `<mu-tool-button>`，工具栏专用，不支持文字 |
| 带下拉的按钮 | `<mu-dropdown-button>`，分割形式加 `split-button` |

> `button-style` 可选：`normal` \| `outline` \| `text` \| `link`

### 输入组件

| 场景 | 组件 |
|------|------|
| 文本 / 数字 / 密码 | `MuInput` |
| 单选（不可输入） | `MuSelect` |
| 单选（可手动输入） | `MuComboBox`（加 `editable`）|
| 多选 | `MuMultiSelect` |
| 日期 / 月份 | `MuDateInput` |
| 复选框 | `MuCheck` |
| 单选框 | `MuRadio` |
| 开关 | `MuSwitch` |

> 表单：声明式 `<mu-form>` → `<mu-form-row>` → `<mu-form-field label="...">`
> 数据驱动：`<mu-form :model="form" :items="[...]" />`，item 类型：字符串标题、`'hr'` 分隔线、`'->'` 换行、数组子行、`{ prop, label, input }` 字段

### 模态 / 抽屉

| 需求 | 组件 / 易错点 |
|------|-------------|
| 对话框 | `<mu-dialog>`，底部按钮用 `:buttons` 数组配置，不要自己塞 slot |
| 抽屉 | `<mu-drawer>`，`position` 默认是 `bottom`，侧滑需显式写 `right` / `left` |

> `easy-hide` = 点击遮罩或 ESC 关闭，几乎所有场景都应加上

### 导航 / 菜单

| 需求 | 组件 |
|------|------|
| 为任意元素附加下拉菜单 | `<mu-dropdown>` 包裹触发器 |
| 独立下拉面板 | `<mu-dropdown-panel>` |
| 右键菜单 | `<mu-context-menu ref="ctx">` + `@contextmenu.prevent="ctx.show($event)"` |

> 菜单项数组：`[{ caption, icon, action }, { type: 'divider' }]`，点击通过 `@action` 统一处理

### 数据展示

| 需求 | 组件 / 易错点 |
|------|-------------|
| 表格 | `<mu-table>`，列类型丰富（text/enum/link/tag/check/date 等），先看 `components.md` 再配列 |
| 列表 | `<mu-list>` + `<mu-list-item>`，分隔线用 `<mu-list-divider>` |
| 树 | `<mu-tree>`，懒加载在 `@node-expand` 里处理 |
| 标签组 | `<mu-tags>`，可删除加 `removable`，超出省略用 `max` |
| 月历（内嵌） | `<mu-calendar>` |

### 图标 / 徽章

```html
<!-- 使用已注册名称 -->
<mu-icon icon="edit" />

<!-- 使用 icon-font（以 . 开头）-->
<mu-icon icon=".icon icon-bolt" />

<!-- 状态徽章 -->
<mu-badge success>已完成</mu-badge>
<mu-badge danger>异常</mu-badge>
```

### 反馈提示

```javascript
// 必须通过 inject 获取，不要直接 import
const { messageBox } = inject('$mussel')

// 对话框
messageBox.confirm('确认删除？').then(btn => { if (btn === 'ok') doDelete() })
messageBox.error('保存失败')

// 浮动通知
messageBox.notify({ title: '保存成功', type: 'success' })
// type: alert | success | warn | error
```

```html
<!-- 空状态 / 失败占位 -->
<mu-status-box icon="empty" title="暂无数据" message="请调整筛选条件">
  <mu-button button-style="outline" caption="重置" @click="reset" />
</mu-status-box>
```
