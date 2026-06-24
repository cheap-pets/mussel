---
name: mussel-ui
description: >
  编写或修改使用 MUSSEL 4 组件库的 Vue 界面代码时使用，
  包括新建页面、调整已有 UI、Review 代码合规性。
  用户明确要求将 Mussel 3 代码升级到 Mussel 4 时也需使用，
  如："升级到 Mussel 4"、"迁移到新版 Mussel"。
---

# MUSSEL 4 开发 Skill

> 本 Skill 仅覆盖 MUSSEL 组件库的特定约束（组件选型、Props、样式 Token、M3→4 迁移），不涉及 Vue 通用写法（Composition API、`<script setup>`、响应式、生命周期等）。

> **版本检查**：
本文档及 `references/` 基于 MUSSEL `4.0.*`。
开始前确认项目中依赖的 `mussel` 版本，若不符合，需进行提示确认。

## 工作流程

### 步骤 1：识别任务类型

- **Mussel 3 → 4 升级**：用户明确要求升级或迁移到 Mussel 4
  → **进入升级模式**：流程与规则分两个文件，按阶段加载，不走后续步骤。
    - 分析/计划/执行**流程**：读 `references/upgrade/process.md`（分析阶段需完整读）。
    - 执行阶段：按处理类别跳转到 `references/upgrade/rules.md` 对应「迁移规则 N」按需查，不必整文件重读：
      1 全局配置 → 2 CSS 变量与 CSS 类 → 3 布局系统 → 4 图标 → 5 组件迁移 → 6 新增组件。
- **新建 / 修改 UI** → 继续步骤 2

### 步骤 2：按需查阅 API 与样式

写代码过程中按需查阅以下参考文件（不要凭记忆猜测属性名或样式值），
组件 API 与样式 Token 往往一起需要（如改按钮颜色既要查 props 也要查 CSS 变量），无需区分先后。

**组件 API**：按 8 大类 1:1 路由。若不确定用哪个组件，先看下方「组件速查表」选型。

| 分类 | 参考文件 |
|------|---------|
| 1 布局 | `references/components/layout.md` |
| 2 容器与面板（含模态/抽屉） | `references/components/containers-panels.md` |
| 3 按钮与操作 | `references/components/buttons.md` |
| 4 表单 / 输入 | `references/components/form.md` |
| 5 导航与菜单 | `references/components/navigation.md` |
| 6 数据展示（含表格） | `references/components/data-display.md` |
| 7 反馈 | `references/components/feedback.md` |
| 8 基础元素 | `references/components/basic-elements.md` |

**样式 Token**：颜色、间距、原子类、布局模式等查阅 `references/styles.md`。

**安装初始化**：`install(app, options)`、options 字段、`$mussel` 上下文、`installIcons` 查阅 `references/install.md`。

### 步骤 3：生成后自检

生成代码后，用 `references/principles.md` 的**硬性禁止清单**（5 条）和**自检清单**逐条核对，该文件每条均附 Good/Bad 示例。任意一条硬性禁止违反即视为不合规。

---

## 安装与初始化

应用启动时通过 `install(app, options)` 挂载 Mussel（组件注册、图标、主题色、多语言、注入 `$mussel` 上下文）。

**配置项（options）速查：**

| 属性 | 说明 |
| ---- | ---- |
| root | 根元素（选择器或 DOM），注入主题 class 与 CSS 变量，默认 `document.body` |
| dark | `true` 强制暗色 \| `'auto'` 跟随系统 \| 否则亮色 |
| colors | 主题色 key：`primary` / `secondary` / `success` / `warning` / `danger` / `neutral` / `gray`，自动派生 `--mu-*` 变量 |
| icons | 初始图标集，等价于 `installIcons(icons)` |
| locale | `'zh'` \| `'en'`，未指定时按浏览器语言判断 |
| localeResources | 自定义语言包，内置 `zh` / `en` |

完整 API（`install` 签名、`options` 全字段、内部执行顺序、全局 `$mussel` 上下文、`installIcons`）查阅 `references/install.md`。

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
| `<mu-toolbar>` | 工具栏容器，常置于页面/面板顶部 |

### 2. 容器与面板

| 组件 | 用途 |
|------|------|
| `<mu-tabs>` + `<mu-tab-panel>` | 页签切换内容区 |
| `<mu-tab-bar>` | 独立页签栏，内容区自行管理 |
| `<mu-dialog>` | 模态对话框，遮罩居中 |
| `<mu-drawer>` | 抽屉，从边缘滑出（`position` 默认 bottom） |

### 3. 按钮与操作

| 组件 | 用途 |
|------|------|
| `<mu-button>` | 常规按钮；`color` 设主/次/危险色，`button-style` 设 normal/outline/text/link，`toggle` 开关模式 |
| `<mu-button-group>` | 多按钮视觉成组，共享 size/style/color |
| `<mu-icon-button>` | 仅图标按钮，常用于工具栏/列表项；`toggle` 开关模式 |
| `<mu-dropdown-button>` | 按钮带下拉菜单；`split-button` 分割为主按钮+下拉箭头 |

### 4. 表单

| 组件 | 用途 |
|------|------|
| `<mu-form>` | 表单容器；声明式用 form-row/form-field，数据驱动用 :model/:items |
| `<mu-input>` | 文本/数字/密码输入 |
| `<mu-select>` | 单选下拉，不可输入 |
| `<mu-combo-box>` | 单选下拉，`editable` 可手动输入 |
| `<mu-multi-select>` | 多选下拉 |
| `<mu-date-input>` | 日期/月份选择 |
| `<mu-color-input>` | 颜色选择（HEX 输入 + 内置 130 色色板） |
| `<mu-check>` / `<mu-check-group>` | 复选框及组 |
| `<mu-radio>` / `<mu-radio-group>` | 单选框及组 |
| `<mu-segmented>` | 分段控件（互斥选项条） |
| `<mu-switch>` | 开关 |

### 5. 导航与菜单

| 组件 | 用途 |
|------|------|
| `<mu-dropdown>` | 为任意元素附加下拉菜单（包裹触发器） |
| `<mu-dropdown-panel>` | 独立下拉面板，自行管理触发器 |
| `<mu-context-menu>` | 右键上下文菜单 |

### 6. 数据展示

| 组件 | 用途 |
|------|------|
| `<mu-table>` | 数据表格；列类型丰富（text/enum/link/tag/check/date 等） |
| `<mu-list-item>` + `<mu-list-divider>` | 列表项与分隔线（无 `<mu-list>` 全局组件，需局部 import） |
| `<mu-tree>` + `<mu-tree-node>` | 树形结构；支持勾选、懒加载、节点按钮 |
| `<mu-tags>` | 标签组；`removable` 可删除，`max` 截断省略 |
| `<mu-calendar>` | 内嵌月历，用于页面内日期展示与选择 |

### 7. 反馈

| 组件 | 用途 |
|------|------|
| `messageBox.alert/confirm/error/warn` | 命令式对话框，通过 `inject('$mussel')` 调用，返回 Promise |
| `messageBox.notify` | 浮动通知，自动消失（默认 3s） |
| `<mu-status-box>` | 状态占位（空数据/加载失败/无权限等） |

### 8. 基础元素

| 组件 | 用途 |
|------|------|
| `<mu-icon>` | 图标；SVG 需先注册，icon-font 以 `.` 开头 |
| `<mu-sort-icon>` | 排序方向指示（升序/降序三角） |
| `<mu-badge>` | 徽章/角标；支持颜色变体，空内容渲染为小红点 |
