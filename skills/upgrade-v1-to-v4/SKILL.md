---
name: upgrade-v1-to-v4
description: >
  用户明确要求将 Mussel 1（@mctech/mussel，Vue 2）代码升级到 Mussel 4（Vue 3）时使用，
  如："把 @mctech/mussel 升级到 mussel 4"、"迁移 Vue 2 老页面到新版 Mussel"。
  同时覆盖 Vue 2 → Vue 3 框架迁移中与组件库相关的破坏点。
  仅编写/修改/Review MUSSEL 4 界面代码（非升级迁移）时，请使用 mussel-ui skill；
  仅做 Mussel 3 → 4 升级时，用 mussel-ui skill 的 references/upgrade/。
---

# Mussel 1 → Mussel 4 升级 Skill

> Mussel 1（`@mctech/mussel`，Vue 2.7）→ Mussel 4（`mussel`，Vue 3）是**框架 + 组件库的双重换代**，
> 跨度远大于 V3→V4：v1 的 API 与 V3 差异很大（编辑器体系、布局体系、样式体系均不同），
> **不能**用 mussel-ui skill 的 v3→v4 迁移规则直接套用。本 Skill 独立覆盖 v1→v4 全部已知差异。

> **版本检查**：
> 本文档基于 Mussel 1 仓库 `1.0.58`（含 0.1.x 早期版本差异说明）与 Mussel `4.1.0`（`4.0` 分支源码），最后核对日期 **2026-09-04**。
> 开始前确认项目 mussel 源版本（`@mctech/mussel` 0.1.x ~ 1.0.x）与目标版本（`mussel` 4.x）。
> 若组件库源码与本文描述冲突，**以源码为准**，并按实际情况订正对应文件。

## 早期 v1 的重要约束

**早期 v1 版本没有 `base-styles`（原子样式/工具类）**，且分析阶段不得假设项目已使用任何工具类：

| v1 版本档次 | base-styles 能力 | 典型写法 |
|-------------|------------------|----------|
| 0.1.x（早期） | **完全没有**。无运行时 CSS 变量、无工具类、无 setTheme | 布局靠 `<mu-h-box>` 等组件属性与内联 style；间距/文字样式靠自定义 CSS 或内联样式 |
| 1.0.0 ~ 1.0.x 中期 | `.mu-text-*`、`.mu-background-*` 类 + `:root` CSS 变量 | 在早期基础上叠加 |
| 1.0.x 后期 | 增加 `.mu-box` class 属性选择器体系、`margin=`/`padding=`/`border` 属性选择器、compat 原子类（`flex`/`p-1x` 等回移植） | 可能混用组件属性与属性选择器 |

**判定方法**：看 `package.json` 中 `@mctech/mussel` 版本；再 grep 源码中有无 `mu-text-color-`、`mu-background-`、`mu-box`、`margin~=` 等 late-v1 痕迹。
**影响**：早期 v1 项目升级后，布局/间距/文字样式**直接改写为 v4 原子类**（无"保留旧类"的中间态）；late v1 项目按 rules.md 第 3 节映射表替换旧类。

## 工作流程

### 步骤 1：识别升级路径（opt-in）

进入升级路径需**全部**满足：
1. 用户明确表达"升级 / 迁移 / 从 Mussel 1（@mctech/mussel）改到 Mussel 4"；
2. 任务目标是改写既有页面/组件/工程，而非新增功能；
3. 源代码基于 Vue 2 + `@mctech/mussel`（`package.json` 可见，或代码出现 `mu-editor`/`mu-flex-box`/`new Vue(` 等）。

判不准时先询问用户，不要凭代码痕迹自动启动。确认进入后：

- **流程**（退出检查 → 确认源目录与版本档次 → 分析 → 计划 → 执行）：读 `references/process.md`（分析阶段需完整读）。
- **规则**（权威迁移规则，按章节按需查）：`references/rules.md`——
  1 框架迁移（Vue 2→3）→ 2 全局配置 → 3 CSS 变量与类 → 4 布局系统 → 5 图标 → 6 组件迁移 → 7 无对应与移除项 → 8 新增能力。

### 步骤 2：写 v4 代码时查阅目标 API

rules.md 的「目标写法」覆盖高频迁移场景。需要更完整的 v4 组件 Props/Events/Slots 与样式 Token 时，
查阅 **mussel-ui skill** 的 `references/components/*` 与 `references/styles.md`（该 skill 已安装时优先使用；未安装时以组件源码为准）。

### 步骤 3：生成后自检

每个文件迁移完成后，用 rules.md 对应章节的检查清单逐条核对；全部完成后按 process.md 生成总结文档。

---

## v1 → v4 变化总览

| 层面 | v1 | v4 |
|------|----|----|
| 框架 | Vue 2.7（Options API / JSX / render 函数） | Vue 3（`<script setup>` Composition API） |
| 包名 | `@mctech/mussel` | `mussel` |
| 安装 | 导入即自动注册（`if (Vue) install(Vue)`），`install($Vue)` 无配置项 | `install(app, options)`，options 含 `colors` / `dark` / `locale` / `icons` / `root` 等 |
| 主题 | `setTheme()` + 编译期变量 + `--mu-*-color` 少量运行时变量 | `install` 的 `colors` 自动派生调色板，运行时换肤 `$mussel.setupColors` |
| 图标 | `registerIcons()`，内置名含 `dropdown`/`key-down`/`ok`/`x` 等 | `installIcons()`，内置名为 tabler 命名（`chevronDown`/`check` 等），见 rules.md 第 5 节 |
| 样式 | 早期无工具类；后期有 `mu-*` 前缀类与属性选择器体系 | 原子类体系（`flex`/`p-2x`/`text-muted` 等）+ `--mu-*` 变量 |
| 布局 | `<mu-flex-box>`/`<mu-h-box>`/`<mu-v-box>`/`<mu-flex-item>`/`<mu-space>`/`<mu-splitter>` 组件 + 属性选择器 | `<mu-h-box>`/`<mu-v-box>`（保留但 props 变更）+ 原子类 + `<mu-split-h-box>`/`<mu-split-v-box>` |
| 表单输入 | `mu-editor` 家族（date/time/color/combo/search/…-editor） | `mu-input` 家族（`mu-date-input` 等）+ 新增 `mu-select`/`mu-multi-select` |
| 数据表格 | `<mu-table>` + `<mu-table-*-column>` 子组件列 | `<mu-table :columns="[...]">` 数据驱动列配置（**重写**） |
| 命令式弹窗 | 顶层导出 `alert`/`confirm`/`showMessage`/`notify` | `inject('$mussel').messageBox.*` |

## 组件去向速查表

> 只列去向决策；具体属性/事件/插槽迁移见 rules.md 第 6 节。

| v1 组件 | v4 去向 |
|---------|---------|
| `mu-flex-box` / `mu-h-box` / `mu-v-box` | `mu-h-box` / `mu-v-box`（props 变更）或 `div` + 原子类 |
| `mu-flex-item` | `div` + `flex-{n}` 原子类 |
| `mu-space` | `mu-flex-space` / `class="flex-space"` |
| `mu-splitter` | `mu-split-h-box` / `mu-split-v-box` |
| `mu-icon` | `mu-icon`（props/图标名变更） |
| `mu-button` / `mu-icon-button` / `mu-button-group` | 同名（`buttonType`→`color`，`buttonShape="round"`→`pill`） |
| `mu-split-button` | `mu-dropdown-button` 的 `split-button` |
| `mu-dropdown-button` | 同名（默认图标名变更） |
| `mu-input`（裸输入框） | `mu-input`（同名不同物，事件签名变更） |
| `mu-editor` | `mu-input`（v4 输入组件的正身） |
| `mu-search-box` | `mu-search-input`（下拉模式→`mu-select`/`mu-combo-box`） |
| `mu-combo-box` | `mu-combo-box`（多选拆 `mu-multi-select`） |
| `mu-option` | `dropdown-items` 属性 / `#dropdown-items` 插槽（v4 仍注册 mu-option，select 家族内可用） |
| `mu-date-editor` / `mu-time-editor` / `mu-color-editor` | `mu-date-input` / `mu-time-input` / `mu-color-input` |
| `mu-date-range-editor` | **无对应**（两个 `mu-date-input` 组合） |
| `mu-button-editor` / `mu-popup-editor` | **无对应**（`mu-dropdown-button`/`mu-dropdown-panel` 组合） |
| `mu-check` / `mu-radio` | 同名（v-model 语法不变） |
| `mu-checkbox` / `mu-checkbox-group` | `mu-check` / `mu-check-group` |
| `mu-toggle` | `mu-switch` |
| `mu-form` / `mu-form-row` / `mu-form-field` | 同名（`formStyle`/`layout` 移除；新增数据驱动 `:model`/`:items`） |
| `mu-list-item` / `mu-list-divider` | 同名（`value` 移除） |
| `mu-tree` | `mu-tree`（基本不变；`mu-tree-nodes` 不再注册） |
| `mu-bar` | `mu-bar` |
| `mu-paging-bar` | `mu-pagination`（**模型重写**：total/pageSize） |
| `mu-tabs` | `mu-tabs`（`v-model`→`v-model:active-tab`；`tabItems`→`tab-buttons`） |
| `mu-tabs-header` | `mu-tab-bar` |
| `mu-tab-panel` | `mu-tab-panel`（`label`→`caption`） |
| `mu-dropdown` / `mu-dropdown-panel` / `mu-dropdown-item` | 同名（`#dropdown` 插槽→`#dropdown-items` 推荐） |
| `mu-expander` | **无对应**（自行实现折叠） |
| `mu-dialog` | `mu-dialog`（`v-model:visible`；`mask-action`→`dismissible`，**默认行为翻转**） |
| `mu-modal` / `mu-base-modal` / `mu-base-dialog` / `mu-dialog-wrapper` | **移除**（内部组件，统一用 `mu-dialog`） |
| `mu-drawer` | `mu-drawer`（**`position` 默认 right→bottom**） |
| `mu-sidebar-menu` / `mu-menu-group` / `mu-menu-item` | **无对应**（自行实现） |
| `mu-context-menu` | `mu-context-menu` |
| `mu-table` + `mu-table-*-column` | `mu-table` + `columns` 配置（**重写**） |
| `mu-calendar` | `mu-calendar` |
| `mu-scroll-box` | `mu-scroll-box` |
| 指令 `v-mussel-scrollbar` / `v-mu-scrollbar` | `v-mu-scrollbar`（`false`/`'none'` 关闭，其余值开启） |
| 指令 `v-mussel-sticky` | **无对应** |
