---
name: mussel-upgrade
description: 将使用 Mussel 3 的 Vue 项目升级到 Mussel 4 组件库。当用户需要升级、迁移 Mussel 版本，或将项目从 mussel3 过渡到 mussel4 时使用此 skill。也适用于用户提到升级 mussel 组件、迁移 mussel 版本、修复 mussel3 兼容性问题，或要求分析 mussel 版本差异、制定升级计划时。
---

# Mussel 3 → Mussel 4 升级 Skill

本 skill 引导将 Vue 项目从 Mussel 3 结构化地逐文件升级到 Mussel 4。
升级分为三个阶段：**分析** → **计划** → **执行**。

## 重要约束

- 对于**无法安全自动升级**的内容（上下文模糊、业务逻辑与 mussel API 耦合复杂、或迁移规则未覆盖的模式），仅在升级计划文档中标注，**不修改代码**，由开发者手动处理。
- 每次修改都必须记录到升级跟踪文档中。
- 修改前必须先读取文件。绝不猜测——阅读实际代码后再做修改。

## 阶段一：分析

扫描项目代码库，了解变更范围。首先读取 `references/migration-rules.md` 迁移规则参考——其中包含所有已知规则。然后系统地搜索项目文件。

### 步骤

1. 读取 `references/migration-rules.md`，将所有迁移规则加载到上下文中。
2. 定位项目根目录（查找 `package.json`、`vite.config.*` 等文件）。
3. 使用 Grep/Glob 在项目中搜索**所有 Mussel 3 模式**，检查以下类别：
   - **组件标签**：`<mu-editor`、`<mu-tabs-buttons`、`<mu-tree-view`、`<mu-tree-nodes`、`<mu-box`、`<mu-h-box`、`<mu-v-box`（已移除）；`<mu-option`、`<mu-tree-node`、`<mu-dropdown-item`、`<mu-dropdown-check-item`、`<mu-dropdown-radio-item`（仍可用，推荐迁移）
   - **废弃 CSS 类**：`class="mu-box"`、`class="mu-h-box"`、`class="mu-v-box"`、`class="mu-space"`、`class="mu-divider"`、`class="mu-flex-item"`、`class="mu-bg-transparent"`、`class="mu-bg-white"`、`class="mu-bg-black"`、`class="mu-bg-x-color"`（注意：`class="mu-space"` → `class="flex-space"`，`class="mu-divider"` → `class="flex-divider"`）
   - **废弃属性（box 属性选择器）**：`layout="flex"`、`layout="grid"`、`flex="`、`margin="`、`padding="`、`padding-x="`、`padding-y="`、`margin-x="`、`margin-y="`、`margin-top="`、`margin-bottom="`、`margin-left="`、`margin-right="`、`padding-top="`、`padding-bottom="`、`padding-left="`、`padding-right="`、`border`、`border-right`、`border-left`、`border-top`、`border-bottom`、`border-x`、`border-y`、`position="`、`width="`、`height="`、`overflow="`、`align-items="`、`align-self="`、`justify-content="`、`content-center`、`flex-wrap`、`inline`、`reverse`、`collapsible`、`gap="`（当这些属性出现在非组件的 `<div>` 上，或出现在 `<mu-h-box>`/`<mu-v-box>`/`<mu-grid-box>` 的 HTML 属性上而非组件 props 时，它们依赖已移除的 CSS 属性选择器，需要迁移）
   - **废弃属性（其他）**：`mask-action`、`easy-hide`、`:moveable`、`dialog-style`、`container`、`:clear-button`、`dropdown-align`、`sticky-target`、`reserve-icon-place`、`trigger-action`、`trigger-action="press"`、`:tab-bar-params`、`:messages`（Notifier 改为 `:notifications`）、`:tab-items`（TabBar 改为 `:tab-buttons`）、`dropdown-icon="dropdown"`（改为 `"dropdownExpand"`）
   - **废弃 CSS 变量**：`--mu-gray-dark`、`--mu-text-color-reversed`、`--mu-text-color-weak`、`--mu-background-normal`、`--mu-background-hover`、`--mu-background-disabled`、`--mu-primary-color-shadow`、`--mu-unit-spacing-size`、`--mu-editor-text-color`、`--mu-text-color-placeholder`
   - **废弃图标名称**：`icon="dropdown"`
   - **废弃类名**：`class="mu-editor"`（检查 mu-editor 相关的 class）、`class="mu-text-ellipsis"`（改为 `text-ellipsis`）
   - **废弃事件**：`@tab-click`、`@tab-change`、`@close-button-click`、`@mask-click`
   - **废弃插槽**：`<template #left>` / `<template #right>`（ComboBox 改为 `prefix`/`suffix` 属性）、`<template #tab-bar>`（Tabs 改为 `#tab-bar-prepend`/`#tab-bar-append`）
   - **废弃属性（子组件）**：`title`（TabButton 移除）、`divider`（ListDivider 移除）、`value`（ListItem 移除）
   - **缺少 mu-box class**：`<mu-form-field` 或 `<mu-form` 没有 `class="mu-box"`
   - **非 box 组件上的 width 属性**：除 box/form/dialog/tabs 外的组件使用了 `width="100%"`
   - **Dialog CSS 选择器**：`> .mu-dialog` 子选择器模式（Mussel 3 属性绑在 mask 层，Mussel 4 改为绑在 dialog 层，需调整 CSS 选择器）
   - **Dialog 默认 slot 内边距丢失**：Mussel 3 中 `.mu-dialog_center > *` 自动给默认 slot 内容加 `padding: 16px 24px`，Mussel 4 的 `.mu-dialog_body` 无 padding。需检查所有 `<mu-dialog>` 默认 slot，给根元素添加 `padding`（原子类 `p-2x` 或内联样式 `padding: 16px 24px`）
4. 同时检查 `package.json` 中的 mussel 依赖版本，以及全局插件配置（如 `app.use(pluginMussel, {...})`）。
5. 检查所有 CSS/SCSS 文件中对 mussel 变量的引用。

用汇总表向用户报告分析结果：

| 类别 | 数量 | 涉及文件 |
|------|------|----------|
| 组件替换 | N | file1.vue, file2.vue, ... |
| 属性重命名 | N | ... |
| 变量重命名 | N | ... |
| CSS 类变更 | N | ... |
| 图标变更 | N | ... |
| 全局配置变更 | N | ... |

## 阶段二：计划

在 `{项目根目录}/mussel-upgrade-plan.md` 创建升级计划文档。文档结构如下：

```markdown
# Mussel 3 → Mussel 4 升级计划

**项目**：{项目名称}
**日期**：{今天}
**生成工具**：Mussel 升级 Skill

## 范围概览

{简要概述发现的内容}

## 迁移项

### 1. 组件替换

| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|
| path/to/file.vue | 42 | `<mu-editor>` | `<mu-input>` | 是/否 |

### 2. 属性 / 事件重命名

| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|
| ... | ... | ... | ... | 是/否 |

### 3. CSS 变量更新

| 文件 | 当前变量 | 目标变量 | 可自动？ |
|------|----------|----------|----------|
| ... | --mu-gray-dark | --mu-text-color-normal | 是/否 |

### 4. CSS 类更新

| 文件 | 当前类名 | 目标 | 可自动？ |
|------|----------|------|----------|
| ... | .mu-bg-white | style="background: white" | 是/否 |

### 5. 全局配置 / 插件变更

| 文件 | 变更说明 | 可自动？ |
|------|----------|----------|
| ... | ... | 是/否 |

### 6. 需要人工审核的项目

{列出无法安全自动升级的项目，并说明原因}

## 执行顺序

1. 全局配置 / CSS 变量（基础层）
2. 组件替换
3. 属性 / 事件重命名
4. CSS 类变更
5. 人工审核项
```

将阶段一中发现的所有迁移项填入表格。当出现以下情况时标记为**可自动？= 否**：
- 上下文模糊（例如动态属性值，无法确定是旧 API 还是新 API）
- 变更涉及与 mussel API 紧密耦合的业务逻辑
- 模式无法明确匹配任何迁移规则
- 文件位于 `node_modules` 或为生成文件

### 确认

向用户展示计划并询问：

> 已分析项目并在 `{路径}/mussel-upgrade-plan.md` 创建了升级计划。计划包含 {N} 个可自动升级项和 {M} 个需要人工审核的项目。是否开始执行可自动升级的变更？

等待用户确认后再进入阶段三。

## 阶段三：执行

按照计划中的执行顺序进行升级。逐类别系统地处理。

### 执行过程中

1. **修改前先读取文件。** 绝不盲目编辑。
2. **逐文件处理。** 完成一个文件的所有变更后再处理下一个。
3. **跟踪进度。** 每修改一个文件后，更新升级计划文档。增加"状态"列，将项目标记为 `已完成`、`跳过（需人工处理）` 或 `受阻`。
4. **跳过非自动项。** 对于标记为"可自动？= 否"的项目，在计划中添加备注，但不修改代码。
5. **保留业务逻辑。** 仅变更 mussel 相关的 API、属性、类和变量。不要重构周围的代码。

### 升级日志

修改文件时，在计划文档中维护一个 `## 升级日志` 区段：

```markdown
## 升级日志

| 序号 | 文件 | 变更内容 | 状态 |
|------|------|----------|------|
| 1 | src/components/UserForm.vue | 将 `<mu-editor>` 替换为 `<mu-input>`，`:clear-button` 改为 `clearable`，更新 class | 已完成 |
| 2 | src/views/Settings.vue | `dropdown-align` 重命名为 `dropdown-position` | 已完成 |
| 3 | src/styles/theme.css | `--mu-gray-dark` 更新为 `--mu-text-color-normal` | 已完成 |
```

### 全部完成后

在 `{项目根目录}/mussel-upgrade-summary.md` 生成升级总结文档：

```markdown
# Mussel 3 → Mussel 4 升级总结

**项目**：{项目名称}
**日期**：{今天}

## 结果

- 修改文件数：{N}
- 应用变更总数：{N}
- 跳过项数（需人工审核）：{N}

## 已修改文件

| 文件 | 变更说明 |
|------|----------|
| path/to/file1.vue | {简要描述} |
| path/to/file2.vue | {简要描述} |

## 需要人工审核的项目

| 项目 | 文件 | 原因 |
|------|------|------|
| {描述} | path/to/file.vue | {为什么无法自动升级} |

## 后续步骤

- [ ] 审核上方"需要人工审核的项目"列表中的所有项目
- [ ] 将 package.json 中的 mussel 依赖更新为 4.x 版本
- [ ] 运行应用，测试所有已修改的组件
- [ ] 移除升级过程中添加的 CSS 兼容性垫片（如有）
```

## 参考文件

- `references/migration-rules.md` — Mussel 3 → 4 全部 API 变更、变量重命名、组件替换及代码示例的完整映射。开始任何工作前请先阅读此文件。
