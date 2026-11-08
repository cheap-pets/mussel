---
name: mussel-ui
author: Scrollbar.W
date: 2026-11-08
description: >
  编写、修改、Review 使用 MUSSEL 4 组件库的 Vue 界面代码时使用。
  旧版 Mussel（Mussel 3，或 Mussel 1 / @mctech/mussel）升级到 Mussel 4 的迁移任务不使用本 skill，
  分别改用 mussel-3to4 / mussel-1to4 skill。
---

# MUSSEL 4 开发 Skill

> 本 Skill 仅覆盖 MUSSEL 组件库的特定约束（组件选型、Props、样式 Token），不涉及 Vue 通用写法（Composition API、`<script setup>`、响应式、生命周期等）。

> **版本检查**：
本文档及 `references/` 基于 MUSSEL `4.3.*`（当前 `4.3.1`），最后核对日期 **2026-11-08**。
开始前确认项目中依赖的 `mussel` 版本，若不符合，需进行提示确认。
若组件库源码与本文档描述出现冲突，**以源码为准**，并按实际情况订正对应 `references/` 文件。

## 工作流程

### 步骤 1：识别任务类型

**默认路径：新建 / 修改 / Review UI**（绝大多数任务走这条）
→ 直接进入步骤 2，只查阅 `references/components/*` 与 `references/styles.md`。

**升级任务**：Mussel 3 → 4、Mussel 1（`@mctech/mussel`，Vue 2）→ 4 的升级迁移不属本 skill，分别使用 `mussel3to4` / `mussel1to4` skill。

### 步骤 2：按需查阅 API 与样式

生成任何代码前先读 `references/principles.md`「核心规范」5 条（第 2–5 条为硬性禁止）。

按需查阅以下参考文件，不要凭记忆猜测属性名或样式值。组件 API 与样式 Token 常一起需要，无需区分先后。

**组件 API**：按 8 大类 1:1 路由。若不确定用哪个组件，先看下方「组件速查表」选型。

| 分类 | 参考文件 |
|------|---------|
| 1 布局 | `references/components/layout.md` |
| 2 容器与面板（含模态/抽屉） | `references/components/containers.md` |
| 3 按钮与操作 | `references/components/buttons.md` |
| 4 表单 / 输入 | `references/components/form.md` |
| 5 导航与菜单 | `references/components/navigation.md` |
| 6 数据展示（含表格） | `references/components/data.md` |
| 7 反馈 | `references/components/feedback.md` |
| 8 基础元素 | `references/components/basic.md` |

**样式 Token**：颜色、间距、原子类、布局模式等查阅 `references/styles.md`。

**安装初始化**：`install(app, options)`、options 字段、`$mussel` 上下文（含运行时换肤 `setupColors`）、`installIcons` 查阅 `references/install.md`。

### 步骤 3：生成后自检

生成代码后，逐条核对 `references/principles.md` 核心规范与文末快速自检清单，硬性禁止项任一违反即不合规。

---

## 组件速查表

> 只列选型决策。完整 Props / Events / Slots API 见对应参考文件，**不要用本节替代查阅 API**。


### 1. 布局

| 组件 | 用途 |
|------|------|
| `<mu-h-box>` / `flex flex-row` | 子元素水平排列 |
| `<mu-v-box>` / `flex flex-col` | 子元素垂直排列 |
| `<mu-grid-box>` + `<mu-grid-cell>` / `grid` | 二维网格布局 |
| `<mu-split-h-box>` / `<mu-split-v-box>` | 面板可拖拽分隔；`collapsible` 支持收拢，双击重置 |
| `<mu-scroll-box>` / `v-mu-scrollbar` | 替换原生滚动条为 Mussel 风格 |
| `<mu-scroll-area>` | 单轴滚动区，溢出时以位移按钮代替滚动条（工具栏/页签栏场景） |
| `<mu-bar>` | 固定高 40px 的条形容器（无 props，默认插槽） |
| `<mu-toolbar>` | 工具栏容器，常置于页面/面板顶部 |
| `<mu-flex-divider>` / `<mu-flex-space>` / `<mu-flex-break>` | flex 辅助元素：垂直分隔线 / 弹性占位 / 强制换行 |

### 2. 容器与面板

| 组件 | 用途 |
|------|------|
| `<mu-tabs>` + `<mu-tab-panel>` | 页签切换内容区 |
| `<mu-tab-bar>` | 独立页签栏，内容区自行管理 |
| `<mu-collapse>` | 可折叠面板，独立使用或置于 MuCollapseGroup |
| `<mu-collapse-group>` | 折叠面板组，`accordion` 手风琴模式 |
| `<mu-dialog>` | 模态对话框，遮罩居中 |
| `<mu-drawer>` | 抽屉，从边缘滑出（`position` 默认 bottom） |

### 3. 按钮与操作

| 组件 | 用途 |
|------|------|
| `<mu-button>` | 常规按钮；`color` 设主/次/危险色，`button-style` 设 normal/outline/text/link，`toggle` 开关模式 |
| `<mu-button-group>` | 多按钮视觉成组，共享 size/style/color |
| `<mu-icon-button>` | 仅图标按钮，常用于工具栏/列表项；`toggle` 开关模式 |

### 4. 表单

| 组件 | 用途 |
|------|------|
| `<mu-form>` | 表单容器；声明式用 form-row/form-field，数据驱动用 :model/:items |
| `<mu-input>` | 文本/数字/密码输入 |
| `<mu-search-input>` | 带防抖与搜索图标的过滤输入框 |
| `<mu-input-group>` | 输入框成组容器，相邻输入控件包装为视觉整体 |
| `<mu-select>` | 单选下拉，不可输入 |
| `<mu-combo-box>` | 单选下拉，`editable` 可手动输入 |
| `<mu-multi-select>` | 多选下拉 |
| `<mu-date-input>` | 日期/月份选择 |
| `<mu-date-range-input>` | 日期区间选择（单面板两次点击定区间） |
| `<mu-time-input>` | 时间选择（时/分/秒列式滚动，下拉面板） |
| `<mu-color-input>` | 颜色选择（HEX 输入 + 内置 130 色色板） |
| `<mu-check>` / `<mu-check-group>` | 复选框及组 |
| `<mu-radio>` / `<mu-radio-group>` | 单选框及组 |
| `<mu-segmented>` | 分段控件（互斥选项条） |
| `<mu-switch>` | 开关 |

### 5. 导航与菜单

| 组件 | 用途 |
|------|------|
| `<mu-side-menu>` | 侧边导航菜单；`items` 数据驱动，一级组内联展开、深层弹层下钻，内置收藏组，支持 `rail` 图标列与 `collapsed` 收起 |
| `<mu-menu>` | 横向导航菜单（顶部栏）；一级溢出自动折叠进「更多」，组行弹层下钻 |
| `<mu-dropdown>` | 为任意元素附加下拉菜单（包裹触发器） |
| `<mu-dropdown-panel>` | 独立下拉面板，自行管理触发器 |
| `<mu-dropdown-button>` | 按钮型下拉触发器；`split-button` 分割为主按钮+下拉箭头，`dropdown-items` 配置菜单项 |
| `<mu-context-menu>` | 右键上下文菜单 |
| `<mu-dropdown-item>` / `<mu-dropdown-check-item>` / `<mu-dropdown-radio-item>` | 下拉菜单项的组件形式（普通 / 勾选 / 单选） |

### 6. 数据展示

| 组件 | 用途 |
|------|------|
| `<mu-table>` | DOM 数据表格；列类型丰富（text/number/bool/link/tag/check/date 等），`mappings` / `options` 显示映射 |
| `<mu-table-ex>` | canvas 高性能表格，仅 `mussel.ex` 版本含；API 与 `mu-table` 同源，扩展单元格编辑、列宽拖拽、树形、`progress` / `button` 列 |
| `<mu-list-item>` + `<mu-list-divider>` | 列表项与分隔线（需自行用容器包裹渲染） |
| `<mu-tree>` + `<mu-tree-node>` | 树形结构；支持勾选、懒加载、节点按钮 |
| `<mu-tag>` | 单个标签（静态展示、不可删除、可着色） |
| `<mu-tags>` | 标签组；`removable` 可删除，`max` 截断省略 |
| `<mu-calendar>` | 内嵌月历，用于页面内日期展示与选择 |
| `<mu-pagination>` | 分页，常与 `mu-table` 配合置于表格下方 |

### 7. 反馈

| 组件 | 用途 |
|------|------|
| `<mu-tooltip>` / `v-mu-tooltip` | 文字提示气泡；指令挂纯文本，组件形态支持 `#tooltip` 富内容插槽；12 方向 placement + 箭头 |
| `messageBox.alert/confirm/error/warn` | 命令式对话框，通过 `inject('$mussel')` 调用，返回 Promise |
| `messageBox.notify` | 浮动通知，自动消失（默认 3s） |
| `<mu-status-box>` | 状态占位（空数据/加载失败/无权限等） |

### 8. 基础元素

| 组件 | 用途 |
|------|------|
| `<mu-icon>` | 图标；SVG 需先注册，icon-font 以 `.` 开头 |
| `<mu-sort-icon>` | 排序方向指示（升序/降序三角） |
| `<mu-badge>` | 徽章/角标；支持颜色变体，空内容渲染为小红点 |
