# Mussel 3 → Mussel 4 升级指南

本文件包含**升级流程**和**迁移规则**两部分。
进入升级任务时必须先读顶部「升级流程」，再按需查「迁移规则」。

---

## 目录

- [升级流程](#升级流程)
  - [重要约束](#重要约束)
  - [阶段一：分析](#阶段一分析)
  - [阶段二：计划](#阶段二计划)
  - [阶段三：执行](#阶段三执行)
- [Mussel 4 速查表](#mussel-4-速查表)
- [迁移规则](#迁移规则)
  1. [布局系统](#1-布局系统)
  2. [CSS 变量与 CSS 类](#2-css-变量与-css-类)
  3. [图标](#3-图标)
  4. [组件迁移](#4-组件迁移)
     - [4.1 MuDialog（含 Drawer）](#41-mudialog)
     - [4.2 MuInput（原 MuEditor）](#42-muinput原-mueditor)
     - [4.3 MuComboBox / MuMultiSelect](#43-mucombobox--mumultiselect)
     - [4.4 MuDropdown 系列](#44-mudropdown-系列)
     - [4.5 MuTabs / MuTabBar / MuTabButton](#45-mutabs--mutabbar--mutabbutton)
     - [4.6 MuForm / MuFormField](#46-muform--muformfield)
     - [4.7 MuTree](#47-mutree)
     - [4.8 MuButton / MuBadge / MuIcon](#48-mubutton--mubadge--muicon)
     - [4.9 MuList / MuListItem / MuListDivider](#49-mulist--mulistitem--mulistdivider)
     - [4.10 MuNotifier](#410-munotifier)
     - [4.11 MuMessageBox](#411-mumessagebox)
     - [4.12 其他小组件](#412-其他小组件)
  5. [全局配置](#5-全局配置)
  6. [新增组件](#6-新增组件)

---

## 升级流程

三阶段：**分析** → **计划** → **执行**。

### 重要约束

- **升级前必须确保当前代码已 commit 或处于独立分支**，以便随时回退。若用户尚未 commit，先提醒用户执行 `git add -A && git commit` 或创建新分支。
- **无法安全自动升级**的内容（上下文模糊、业务逻辑耦合复杂、规则未覆盖）只在计划文档中标注，**不修改代码**，由开发者手动处理。
- 每次修改都记入升级跟踪文档。
- 修改前必须先读文件，绝不猜测。

### 前置步骤：确认源目录

1. 查找并初步判断需升级的目录：
  - 项目中前端源码目录；
  - 若项目中同时包含 vue2、vue3 版本源码的目录，通常是名称包含 vue3 的目录。
2. 让用户确认需升级的项目源码目录路径。
3. 验证路径有效性：
   - 目录存在且可读
   - 包含 Vue 组件文件（`.vue`）
   - 包含 Mussel 3 依赖的迹象（`package.json` 中 mussel 版本 < 4、或 `.vue`/`.js`/`.css` 文件中存在 `mu-editor`/`mu-box`/`mu-tree-view` 等 Mussel 3 模式）
4. 若路径无效或不包含 Mussel 3 代码，向用户报告原因并重新确认。
5. 确认后，后续所有阶段均基于此目录操作。

> 此步骤确保升级流程作用于正确目录，避免误改无关项目或遗漏目标文件。

### 阶段一：分析

1. 读本文件「迁移规则」部分，加载全部规则。
2. 以前置步骤确认的源目录为项目根目录，验证 `package.json`、`vite.config.*` 等配置文件位置。
3. 用 Grep/Glob 搜索**所有 Mussel 3 模式**，分类：

   **布局系统**：
   - 已移除组件：`<mu-box>`、`<mu-h-box>`、`<mu-v-box>`
   - 废弃 CSS 类：`mu-box`、`mu-h-box`、`mu-v-box`、`mu-space`→`flex-space`、`mu-divider`→`flex-divider`、`mu-flex-item`、`mu-bg-transparent`、`mu-bg-white`、`mu-bg-black`、`mu-bg-x-color`
   - 废弃属性选择器：`layout="flex"`、`flex="..."`、`margin="..."`、`padding="..."`、`padding-x/y`、`margin-x/y`、`margin-top/bottom/left/right`、`padding-top/bottom/left/right`、`border`/`border-right` 等、`position="..."`、`width="..."`、`height="..."`、`overflow="..."`、`align-items="..."`、`align-self="..."`、`justify-content="..."`、`content-center`、`flex-wrap`、`inline`、`reverse`、`collapsible`、`gap="..."`

   **CSS 变量与 CSS 类**：
   - 废弃 CSS 变量：`--mu-gray-dark`、`--mu-text-color-reversed`、`--mu-text-color-weak`、`--mu-background-normal`、`--mu-background-hover`、`--mu-background-disabled`、`--mu-primary-color-shadow`、`--mu-unit-spacing-size`、`--mu-editor-text-color`、`--mu-text-color-placeholder`
   - 废弃 CSS 类：`mu-editor`→`mu-input`、`mu-text-ellipsis`→`text-ellipsis`、`mu-text-color-weak`→`mu-text-color-muted`

   **图标**：
   - `icon="dropdown"` → `icon="chevronDown"`

   **组件迁移**：
   - 已移除组件：`<mu-editor>`、`<mu-tabs-buttons>`、`<mu-tree-view>`、`<mu-tree-nodes>`
   - 推荐迁移：`<mu-option>`、`<mu-tree-node>`、`<mu-dropdown-item>` 等
   - 废弃属性：`mask-action`、`easy-hide`、`:moveable`、`dialog-style`、`container`、`:clear-button`、`dropdown-align`、`sticky-target`、`reserve-icon-place`、`trigger-action`、`:tab-bar-params`、`:messages`（Notifier→`:notifications`）、`:tab-items`（TabBar→`:tab-buttons`）、`dropdown-icon="dropdown"`→`"dropdownExpand"`
   - 废弃事件：`@tab-click`、`@tab-change`、`@close-button-click`、`@mask-click`
   - 废弃插槽：`<template #left>`/`#right`（ComboBox→`prefix`/`suffix` 属性）、`<template #tab-bar>`（Tabs→`#tab-bar-prepend`/`#tab-bar-append`）、`<template #client>`/`#header-prepend`/`#header-append`/`#footer-prepend`/`#footer-append`（Dialog→`#body`/`#header`/`#footer`）
   - 废弃子组件属性：`title`（TabButton）、`divider`（ListDivider）、`value`（ListItem）
   - 缺少 `mu-box` class 的 `<mu-form-field>`/`<mu-form>`
   - 非 box 组件上的 `width="100%"`
   - Dialog CSS 选择器 `> .mu-dialog`（Mussel 4 改为绑在 dialog 层）
   - Dialog 默认 slot 内边距丢失（Mussel 4 `.mu-dialog__body` 无 padding，需加 `p-2x` 或 `padding: 16px 24px`）

4. 检查 `package.json` 的 mussel 依赖版本与全局插件配置（`app.use(pluginMussel, {...})`）。
5. 检查所有 CSS/SCSS 文件对 mussel 变量的引用。

汇总表报告：

| 类别 | 数量 | 涉及文件 |
|------|------|----------|
| 布局系统 | N | ... |
| CSS 变量/类 | N | ... |
| 图标 | N | ... |
| 组件迁移 | N | ... |
| 全局配置 | N | ... |

### 阶段二：计划

在 `{项目根目录}/mussel-upgrade-plan.md` 创建计划文档：

```markdown
# Mussel 3 → Mussel 4 升级计划

**项目**：{项目名称}
**日期**：{今天}
**生成工具**：Mussel UI Skill

## 范围概览
{简要概述}

## 迁移项

### 1. 布局系统
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 2. CSS 变量 / CSS 类
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 3. 图标
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 4. 组件迁移
| 文件 | 行号 | 组件 | 当前写法 | 目标写法 | 可自动？ |
|------|------|------|----------|----------|----------|

### 5. 全局配置
| 文件 | 变更说明 | 可自动？ |
|------|----------|----------|

### 6. 需要人工审核的项目
{列出无法自动升级项及原因}

## 执行顺序
1. 全局配置（基础层）
2. CSS 变量 / CSS 类
3. 布局系统
4. 组件迁移（按组件逐个处理）
5. 图标
6. 人工审核项
```

**可自动？= 否** 的判定条件：
- 上下文模糊（动态属性值）
- 业务逻辑与 mussel API 紧密耦合
- 模式无法明确匹配任何迁移规则
- 文件位于 `node_modules` 或为生成文件

向用户展示计划并询问：

> 已分析项目并在 `{路径}/mussel-upgrade-plan.md` 创建升级计划。包含 {N} 个可自动升级项和 {M} 个人工审核项。是否开始执行？

等待确认。

### 阶段三：执行

逐类别系统处理。

执行规则：
1. **修改前先读文件**，绝不盲目编辑。
2. **逐文件处理**，完成一个文件所有变更后再下一个。
3. **跟踪进度**，每改一个文件后更新计划文档，增加"状态"列：`已完成` / `跳过（需人工处理）` / `受阻`。
4. **跳过非自动项**，在计划中备注，不改代码。
5. **保留业务逻辑**，仅变更 mussel 相关 API/属性/类/变量。

升级日志（计划文档中维护）：

```markdown
## 升级日志
| 序号 | 文件 | 变更内容 | 状态 |
|------|------|----------|------|
```

全部完成后生成 `{项目根目录}/mussel-upgrade-summary.md`：

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

## 需要人工审核的项目
| 项目 | 文件 | 原因 |
|------|------|------|

## 后续步骤
- [ ] 审核所有"需要人工审核"项
- [ ] 将 package.json 的 mussel 依赖更新为 4.x
- [ ] 运行应用，测试所有已修改组件
- [ ] 移除升级期间的 CSS 兼容垫片（如有）
```

---

## Mussel 4 速查表

升级完成后编写新代码时参考以下文档：

- **原子样式**（CSS 变量、原子类、间距、颜色）：`references/styles.md`
- **组件 API**：按类型查阅对应参考文件
  - 模态框 / 抽屉：`references/dialog.md`
  - 表单 / 输入：`references/form.md`
  - 表格：`references/table.md`
  - 其他组件：`references/components.md`
- **组件选型**：`SKILL.md` 组件速查表

> 迁移规则中的「目标写法」列均使用 Mussel 4 语法，具体属性/事件/插槽的完整 API 请查阅上述参考文件。

---

## 迁移规则

所有已知 API 变更的完整参考。升级过程中以此部分为权威依据。

---

## 1. 布局系统

Mussel 4 移除了 `.mu-box` 的所有 CSS 属性选择器样式，简化了布局组件。所有原本通过 `MuBox|MuFlexBox` 组件、`class="mu-box|mu-flex-box|mu-h-box|mu-v-box"` + HTML 属性实现的布局、间距、边框、尺寸等，现在需改用原子类实现。

### 1.1 移除项

| 移除项 | 说明 |
|--------|------|
| `<mu-box>` 组件 | 已删除，不再可用 |
| `class="mu-box"` CSS 类 | 无对应样式定义，仅是一个无意义的 class 名 |
| `.mu-box` 上的属性选择器样式 | 所有 `margin=`、`padding=`、`border`、`width=`、`height=`、`position=`、`layout=`、`flex=`、`align-items=`、`justify-content=`、`gap=`、`overflow=`、`content-center`、`flex-wrap`、`inline`、`reverse` 等属性选择器均已失效 |
| `class="mu-h-box"` / `class="mu-v-box"` 作为纯 CSS 类 | 不再具有 `display: flex` / `display: flex; flex-direction: column` 的效果 |
| `class="mu-space"` | 改为 `class="flex-space"` |
| `class="mu-divider"` | 改为 `class="flex-divider"` |
| `class="mu-flex-item"` | 无对应样式 |

### 1.2 组件变更

| 组件 | Mussel 3 渲染 | Mussel 4 渲染 | 迁移方式 |
|------|---------------|---------------|----------|
| `<mu-h-box>` | `<div class="mu-h-box">` | `<div class="flex">` | 改为 `<div class="flex ...">` |
| `<mu-v-box>` | `<div class="mu-v-box">` | `<div class="flex flex-col">` | 改为 `<div class="flex flex-col ...">` |
| `<mu-grid-box>` | `<div class="mu-grid-box">` + 属性选择器 | `<div class="grid">` + 内联 style | **保留组件**，但 `width`/`height`/`padding` 等属性需改用 `style` 或原子类 |
| `<mu-grid-cell>` | `<div>` + 属性选择器 | `<div>` + 内联 style | **保留组件**，通过 `:col-start`/`:col-end`/`:row-start`/`:row-end` props 传值 |

### 1.3 属性选择器 → 原子类 / 内联样式 完整映射

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

> 此规则不仅适用于 `mu-box`，也适用于所有 `<mu-*>` 组件（如 `mu-form-field`）。

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `flex="0"` | `class="flex-0"` | |
| `flex="1"` | `class="flex-1"` | |
| `flex="2"` ~ `flex="8"` | `class="flex-2"` ~ `class="flex-8"` | |
| `flex="9"` ~ `flex="12"` | `style="flex: 9"` ~ `style="flex: 12"` | 无对应原子类 |
| `flex="none"` | `class="flex-none"` | |
| `flex="auto"` | `class="flex-auto"` | |
| `flex="1 auto"` | `class="flex-auto"` | 等价于 `flex: auto` |

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
| `border-radius="window"` | 无原子类，需 `style` | |

#### 尺寸

> 此规则不仅适用于 `mu-box`，也适用于所有未将 `width` / `height` 定义为 props 的 `<mu-*>` 组件（如 `mu-form-field`、`mu-grid-box` 等）。
> `mu-drawer`、`mu-dialog` 等组件已通过 `sizeProps` 声明了 `width` / `height` props，无需迁移。

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `width="100%"` | `style="width: 100%"` | |
| `width="400"` | `style="width: 400px"` | 纯数字视为 px |
| `height="270"` | `style="height: 270px"` | 纯数字视为 px |
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

`mu-space` 已重命名为 `flex-space`，`mu-divider` 已重命名为 `flex-divider`。尺寸变体改用属性选择器。

**flex-space（原 mu-space）：**

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `<div class="mu-space" />` | `<div class="flex-space" />` | flex: 1 1 0 |
| `<div class="mu-space" space="1x" />` | `<div class="flex-space" space="1x" />` | 等间距变体 1x ~ 4x |
| `<div class="mu-space" space="100%" />` | `<div class="flex-break" />` | 强制换行 |

**flex-divider（原 mu-divider）：**

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `<div class="mu-divider" />` | `<div class="flex-divider" />` | 默认 2px |
| `<div class="mu-divider" thin />` | `<div class="flex-divider" line-width="1" />` | 1px 细分隔线 |
| 像素值变体 | `class="flex-divider" line-width="{n}"` | 1 ~ 4px |

### 1.4 升级示例

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
  <div class="flex-space" />
  <div class="flex-divider" />
</template>
<template #tab-bar-append>
  <div class="flex-divider" />
  <div class="flex-space" />
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

### 1.5 升级检查清单

对每个涉及 `mu-box` 的文件，逐一检查：

- [ ] `class="mu-box"` → 移除，合并到其他 class 中
- [ ] `class="mu-h-box"` / `class="mu-v-box"`（非组件用法）→ `class="flex"` / `class="flex flex-col"`
- [ ] `<mu-h-box>` / `<mu-v-box>` 组件 → `<div class="flex ...">` / `<div class="flex flex-col ...">`
- [ ] `<mu-box>` 组件 → `<div>` + 合并 class
- [ ] `layout="flex"` / `layout="grid"` → `class="flex"` / `class="grid"`
- [ ] `flex="N"` → `class="flex-N"` / `class="flex-none"` / `class="flex-auto"`（适用于 `mu-box` 及所有 `<mu-*>` 组件）
- [ ] `padding=` / `margin=` 系列 → 原子类（`p-*x`、`m-*x`、`px-*x`、`mx-*x` 等）
- [ ] `gap="Nx"` → `class="gap-Nx"`
- [ ] `align-items=` / `align-self=` / `justify-content=` → 原子类（`items-*`、`self-*`、`justify-*`）
- [ ] `border` / `border-right` 等 → `class="border"` / `class="border-r"` 等
- [ ] `position="fixed fit"` → `class="fixed"` + `style="inset: 0"`
- [ ] `width=` / `height=` → `style="width: ..."` / `style="height: ..."`（适用于 `mu-box` 及所有未声明 `width`/`height` props 的 `<mu-*>` 组件，如 `mu-form-field`、`mu-grid-box`）
- [ ] `overflow=` → `class="overflow-*"`
- [ ] `content-center` → `class="flex-center"`
- [ ] `class="mu-space"` → `class="flex-space"`（`space="Nx"` 保留为属性选择器）
- [ ] `class="mu-divider"` → `class="flex-divider"`（`thin` 改为 `line-width="1"`）
- [ ] `class="mu-box mu-bg-normal"` → `class="bg-normal"`
- [ ] `<mu-grid-box>` 上非 props 的属性（`width`、`height`、`padding`）→ `style` 或原子类（已包含在上条通用规则中）
- [ ] `<mu-grid-cell>` 上的 `margin=` → `class="m-*x"`

---

## 2. CSS 变量与 CSS 类

### 文本颜色

#### CSS 变量

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-text-color-normal` | `--mu-text-color-normal`（不变） |
| `--mu-text-color-reversed` | `#fff`（直接使用颜色值） |
| `--mu-text-color-weak` | `--mu-text-color-muted` |
| `--mu-text-color-placeholder` | _(已移除)_ |
| _(无)_ | `--mu-text-color-strong`（新增） |
| _(无)_ | `--mu-text-color-subtle`（新增） |
| _(无)_ | `--mu-text-color-soft`（新增） |

#### CSS 类

| Mussel 3 | Mussel 4 |
|----------|----------|
| `.mu-text-color-weak` | `.mu-text-color-muted` |
| _(无)_ | `.mu-text-color-strong`（新增） |
| _(无)_ | `.mu-text-color-subtle`（新增） |
| _(无)_ | `.mu-text-color-soft`（新增） |

### 背景颜色

#### CSS 变量

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-background-normal` | `--mu-bg-normal` |
| `--mu-background-hover` | `--mu-gray-translucent` |
| `--mu-background-strong` | `--mu-bg-strong` |
| `--mu-background-disabled` | `--mu-bg-disabled` |

#### 废弃的背景类

以下类在 Mussel 4 中**已移除**，需替换为内联样式：

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-bg-transparent"` | `style="background: transparent"` |
| `class="mu-bg-white"` | `style="background: white"` |
| `class="mu-bg-black"` | `style="background: black"` |
| `class="mu-bg-x-color"` | `style="background-color: var(--mu-xxx)"` |

### 边框颜色

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-border-color` | `--mu-border-color-normal` |
| `--mu-divider-color` | `--mu-border-color-soft` |

### 其他变量

| Mussel 3 | Mussel 4 |
|----------|----------|
| `--mu-gray-dark` | `--mu-text-color-normal` |
| `--mu-primary-color-shadow` | `--mu-primary-translucent` |
| `--mu-unit-spacing-size` | `--mu-base-spacing` |
| `--mu-editor-text-color` | `--mu-text-color-strong` |
| `--mu-mask-background` | `--mu-bg-mask` |

### Editor 专用变量（已移除）

以下变量在 Mussel 4 中不再存在：
- `--mu-editor-background` → 使用 `--mu-bg-normal`
- `--mu-editor-background-solid` → 已移除
- `--mu-editor-background-readonly` → 已移除
- `--mu-editor-border-color` → 已移除
- `--mu-editor-label-background` → 已移除

### Editor 类名重命名

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-editor"` | `class="mu-input"` |

### 文本省略类重命名

| Mussel 3 | Mussel 4 |
|----------|----------|
| `class="mu-text-ellipsis"` | `class="text-ellipsis"` |
| `.mu-text-ellipsis`（CSS 选择器） | `.text-ellipsis` |

此规则适用于 Vue 模板中的 class 属性和 CSS/SCSS 中的选择器。

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

### CSS 兼容性垫片

在应用根样式中添加以下映射，使旧变量名继续生效：

```css
.mu-root {
  --mu-mask-background: var(--mu-bg-mask);
  --mu-divider-color: var(--mu-border-color-soft);
  --mu-background-hover: var(--mu-gray-translucent);
  --mu-unit-spacing-size: var(--mu-base-spacing);
  --mu-list-item-hover-background: var(--mu-gray-translucent);
  --mu-text-color-weak: var(--mu-text-color-muted);
  --mu-button-border-color-normal: var(--mu-border-color);
  --mu-background-normal: var(--mu-bg-normal);
  --mu-primary-color-shadow: var(--mu-primary-translucent);
}
```

### 新增原子类（Mussel 4）

Mussel 4 新增了完整的原子类系统。完整列表见 `references/styles.md`，主要类别：

**布局**：`.flex`、`.inline-flex`、`.block`、`.inline-block`、`.grid`、`.inline-grid`、`.contents`、`.hidden`、`.flex-row`、`.flex-col`、`.flex-1`、`.items-center`、`.justify-between`、`.gap-{n}x`

**定位**：`.static`、`.relative`、`.absolute`、`.fixed`、`.sticky`、`.z-float`、`.z-layer`、`.z-modal`、`.z-popup`、`.z-ontop`

**间距**：`.p-{n}x`、`.m-{n}x`、`.px-{n}x`、`.mx-{n}x`（n: 1-4）

**边框**：`.border`、`.border-2`、`.border-3`、`.border-4`、`.border-primary`、`.border-danger`、`.border-soft`、`.border-strong`、`.border-dashed`、`.border-dotted`

**文本**：`.text-strong`、`.text-normal`、`.text-muted`、`.text-subtle`、`.text-soft`、`.text-primary`、`.text-secondary`、`.text-success`、`.text-warning`、`.text-danger`、`.text-ellipsis`、`.line-clamp`

**背景**：`.bg-normal`、`.bg-strong`、`.bg-disabled`、`.bg-overlay`、`.bg-mask`、`.bg-fill`、`.bg-stripe`

**溢出**：`.overflow-auto`、`.overflow-hidden`、`.overflow-visible`、`.overflow-clip`

---

## 3. 图标

| Mussel 3 | Mussel 4 |
|----------|----------|
| `icon="dropdown"` | `icon="chevronDown"` |

---

## 4. 组件迁移

### 4.1 MuDialog

> 完整 MuDialog API：`references/dialog.md`

#### 属性变更

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `mask-action="hide"` | `dismissible`（需显式设置） | |
| `render-to-body` | _(已移除，自动处理)_ | |
| `moveable` | _(已移除)_ | 拖拽始终可用，无需配置 |
| `dialog-style` | _(已移除)_ | 用标准 `style` 属性传入（通过 `$attrs` fallthrough 到 `.mu-dialog`） |
| `container` | _(已移除)_ | 自动挂载到 body |
| `easy-hide` | `dismissible` | 早期 Mussel 4 曾用 `easy-hide`，现已改为 `dismissible` |
| _(无)_ | `header` prop | `'auto'`\|Boolean，控制头部显隐 |
| _(无)_ | `footer` prop | `'auto'`\|Boolean，控制底部显隐 |
| _(无)_ | `body-class` prop | 为 `.mu-dialog__body` 添加 class，用于内部布局（如 `flex flex-col`） |
| _(无)_ | `body-style` prop | 为 `.mu-dialog__body` 添加内联样式（如 `{ padding: '16px 24px' }`） |
| _(无)_ | `body-scrollbar` prop | 启用 body 内置滚动条 |

> `dismissible` 支持：`false`（默认值，禁止关闭）、`true`（遮罩+ESC均可关闭）、`'esc'`（仅ESC）、`'mask'`（仅遮罩）。

#### 事件变更

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `@close-button-click` | _(已移除)_ | 关闭按钮点击触发 `hide` 事件 |
| `@mask-click` | _(已移除)_ | 用 `dismissible` 控制遮罩行为 |

```js
// Mussel 4：新的事件签名
function onDialogVisibleChange (value, trigger) {
  // trigger 可以是：'CANCEL'、'$MASK'、'$X' 或按钮名称
  if (trigger === 'CANCEL') doSomething()
  visible.value = value  // 必须手动赋值才能关闭
}
```

#### 插槽变更

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `<template #client>` | _(已移除)_ | 不再有整体包裹 slot |
| `<template #header-prepend>` / `#header-append` | `<template #header>` | header slot 从完全自定义改为附加内容 |
| `<template #footer-prepend>` / `#footer-append` | `<template #footer>` | footer slot 从完全自定义改为附加内容（插入在按钮之前） |
| _(无)_ | `<template #body>` | 推荐的主体内容插槽，替代 default slot |

#### DOM 结构变更

**属性绑定层级变更**：Mussel 3 中，用户传入的属性（`class`、`style` 等）绑定在最外层 `.mu-modal-mask` 元素上。Mussel 4 中改为绑定在内层 `.mu-dialog` 元素上。

```html
<!-- Mussel 3 -->
<div class="mu-modal-mask my-dialog" style="...">  ← $attrs 绑定在这里
  <div class="mu-dialog">
    ...
  </div>
</div>

<!-- Mussel 4 -->
<div class="mu-modal-mask flex flex-center">  ← 不再接收 $attrs
  <div class="mu-dialog my-dialog" style="...">  ← $attrs 绑定在这里
    ...
  </div>
</div>
```

**内部结构变更**：Mussel 3 的 header/body/footer 包裹在 `.mu-dialog_center` 容器中，且有 `.mu-dialog_side-panel` 侧面板。Mussel 4 移除了这些包裹层。

```html
<!-- Mussel 3 内部结构 -->
<div class="mu-dialog">
  <slot name="side-panel" />           <!-- 侧面板 -->
  <div class="mu-dialog_center">       <!-- 居中包裹层 -->
    <div class="mu-dialog_header">...</div>
    <slot />                           <!-- body -->
    <div class="mu-dialog_footer">...</div>
  </div>
</div>

<!-- Mussel 4 内部结构 -->
<div class="mu-dialog">
  <!-- 无 side-panel，无 mu-dialog_center -->
  <div class="mu-dialog__header">
    <div class="mu-dialog__header-content">
      <mu-icon ... />
      <span class="mu-dialog__title">...</span>
      <slot name="header" />
    </div>
    <div class="mu-dialog__sys-buttons">...</div>
  </div>
  <div class="mu-dialog__body">
    <slot name="body" />               <!-- body 插槽（推荐） -->
    <slot v-if="!$slots.body" />       <!-- default 插槽（兼容旧版） -->
  </div>
  <div class="mu-dialog__footer">
    <slot name="footer" />             <!-- footer 附加内容 -->
    <!-- 按钮列表 -->
  </div>
</div>
```

迁移要点：

| 变更 | 说明 |
|------|------|
| `mu-dialog_center` 已移除 | 不再有居中包裹层，header/body/footer 直接在 `.mu-dialog` 内 |
| `side-panel` 插槽已移除 | 侧面板不再支持，需自行实现 |
| padding 模式变更 | Mussel 3 通过 `.mu-dialog_center > *` 自动给所有子元素加 padding；Mussel 4 用 `--mu-dialog-padding` 变量，仅 header/footer 有 padding，body 需手动添加 |
| 关闭按钮变更 | Mussel 3 使用 `<mu-icon icon="x">`；Mussel 4 使用 `<mu-tool-button icon="windowClose" danger>` |
| header/footer 显隐控制 | 新增 `header`/`footer` props（`'auto'`\|Boolean），`'auto'` 时根据内容自动判断，也可显式 `true`/`false` |
| body 插槽 | 新增 `#body` 插槽（推荐），替代 default slot；default slot 保留作为兼容 |
| body-scrollbar | 新增 `body-scrollbar` prop，为 body 区域启用自定义滚动条 |
| body-class | 新增 `body-class` prop，为 `.mu-dialog__body` 添加 class（解决内部布局迁移） |
| body-style | 新增 `body-style` prop，为 `.mu-dialog__body` 添加内联样式（解决内边距等） |
| header 内部结构 | 新增 `mu-dialog__header-content` 包裹层（图标 + 标题 + header slot） |
| 移除插槽 | `client`、`header-prepend`、`header-append`、`footer-prepend`、`footer-append` 已移除 |
| 尺寸默认值变更 | `min-width` 360→320，`max-width/height` 90%→100% |

#### CSS 选择器迁移

之前通过外层 class 定位内层 `.mu-dialog` 的 CSS 选择器需要调整：

```css
/* 升级前（Mussel 3）：属性在 mask 层，需用子选择器定位 dialog */
.my-dialog > .mu-dialog {
  /* ... */
}

/* 升级后（Mussel 4）：属性直接在 dialog 层，直接选择即可 */
.my-dialog {
  /* ... */
}
```

**示例 1：简单尺寸设置（SCSS 嵌套写法）**

```scss
/* 升级前（Mussel 3）：通过子选择器定位 dialog */
.my-dialog {
  & > .mu-dialog {
    width: 600px;
    height: 400px;
  }
}

/* 升级后（Mussel 4）：class 直接在 dialog 上，样式直接写 */
.my-dialog {
  width: 600px;
  height: 400px;
}
```

**示例 2：带内部元素样式**

```scss
/* 升级前（Mussel 3） */
.my-dialog {
  & > .mu-dialog {
    width: 800px;
    height: 90%;

    & > .mu-dialog-body {
      overflow: auto;
      display: flex;
      flex-direction: column;
    }

    & .mu-dialog_header, .mu-dialog_footer {
      padding: 16px;
    }
  }
}

/* 升级后（Mussel 4）：去掉 > .mu-dialog 中间层，子元素改为平级选择器 */
.my-dialog {
  width: 800px;
  height: 90%;

  .mu-dialog__body {
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .mu-dialog__header, .mu-dialog__footer {
    padding: 16px;
  }
}
```

**示例 3：`mu-dialog_center` 包裹层移除**

Mussel 4 移除了 `.mu-dialog_center` 包裹层，`header`/`body`/`footer` 直接在 `.mu-dialog` 内。

```scss
/* 升级前（Mussel 3）：有 mu-dialog_center 中间层 */
.dialog-message-center {
  & > .mu-dialog {
    width: 770px;

    & > .mu-dialog_center {
      width: 100%;

      & .dialog-message-center_body {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    }

    & .mu-dialog_header, .mu-dialog_footer {
      padding: 16px;
    }
  }
}

/* 升级后（Mussel 4）：去掉 > .mu-dialog 和 > .mu-dialog_center 两层 */
.dialog-message-center {
  width: 770px;

  .dialog-message-center_body {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .mu-dialog__header, .mu-dialog__footer {
    padding: 16px;
  }
}
```

**示例 4：扁平写法（非 SCSS 嵌套）**

```css
/* 升级前 */
.my-dialog > .mu-dialog {
  width: 400px;
}
.my-dialog .mu-dialog-body {
  min-height: 400px;
}

/* 升级后 */
.my-dialog {
  width: 400px;
}
.my-dialog .mu-dialog__body {
  min-height: 400px;
}
```

**示例 5：JS 中获取 Dialog DOM 元素**

> ⚠️ 此项涉及 JS 逻辑变更（事件监听器绑定/解绑等），**无法安全自动升级**，需人工逐个审核。

Mussel 4 中 MuDialog 组件通过 `defineExpose` 暴露 `dialogEl`（`shallowRef`）和 `maskEl`（`shallowRef`），分别对应 `.mu-dialog` 和 `.mu-modal-mask` DOM 元素。通过 template ref 访问时 Vue 自动解包，无需 `.value`。不应再使用 `$el`。

```js
// 升级前：通过 $el 和 querySelector 定位 mask / dialog
const maskEl = dialogRef.value.$el                              // mask 层
const dialogEl = dialogRef.value.$el.querySelector('.mu-dialog') // dialog 层

// 升级后：通过 defineExpose 暴露的属性直接获取
const maskEl = dialogRef.value.maskEl    // mask 层（.mu-modal-mask）
const dialogEl = dialogRef.value.dialogEl // dialog 层（.mu-dialog）
```

迁移要点：
- `ref.value.$el` → 不再使用，改用 `ref.value.maskEl` 或 `ref.value.dialogEl`
- `ref.value.$el.querySelector('.mu-dialog')` → `ref.value.dialogEl`
- `dialogEl` / `maskEl` 均为 `shallowRef`，通过 template ref 访问时 Vue 自动解包，直接用 `ref.value.dialogEl` 即可拿到 DOM 元素
- 在 mask 层监听事件（如遮罩点击）→ 用 `ref.value.maskEl`
- 在 dialog 层操作（focus、paste 等）→ 用 `ref.value.dialogEl`

#### Body 内容迁移

**迁移原则**：若原默认插槽内只有一个根元素（通常是为获取 padding/layout 而添加的包裹 div），升级时优先使用 `body-class`/`body-style`/`body-scrollbar` 属性替代该包裹元素，减少不必要的 DOM 层级。

```html
<!-- 升级前：默认 slot 内有包裹 div 用于布局和间距 -->
<mu-dialog :visible.sync="visible">
  <div class="mu-box mu-v-box" padding="2x" overflow="auto">
    <mu-form>...</mu-form>
    <div class="mu-box" margin-top="2x">
      <mu-button>提交</mu-button>
    </div>
  </div>
</mu-dialog>

<!-- 升级后（推荐）：包裹 div 的功能全部由 body-* 属性承担，消除多余层级 -->
<mu-dialog v-model:visible="visible" body-class="flex flex-col p-2x" body-scrollbar>
  <mu-form>...</mu-form>
  <div class="mt-2x">
    <mu-button>提交</mu-button>
  </div>
</mu-dialog>

<!-- 升级后（兼容）：保留包裹 div -->
<mu-dialog v-model:visible="visible">
  <div class="flex flex-col p-2x overflow-auto">
    <mu-form>...</mu-form>
    <div class="mt-2x">
      <mu-button>提交</mu-button>
    </div>
  </div>
</mu-dialog>
```

#### 默认 slot 内边距丢失

Mussel 3 中，`.mu-dialog_center > *` 会给所有子元素（包括 header、body、footer）自动添加 `padding: 16px 24px`。因此默认 slot 中的内容天然具有内边距，无需手动设置。

Mussel 4 中，`.mu-dialog__body` 仅有 `flex: 1`，**没有 padding**。`--mu-dialog-padding` 变量（默认值 `12px`）仅作用于 header 和 footer。默认 slot 内容会紧贴边缘，导致视觉上的内容挤压。

**检测方法**：检查所有 `<mu-dialog>` 的默认 slot 内容，如果 Mussel 3 下视觉效果正常（内容与边缘有间距），升级后内容会贴边。

**解决方案**（优先使用 `body-class` / `body-style`，无需额外包裹 div）：

```html
<!-- 方案 A（推荐）：body-style 属性，直接作用于 .mu-dialog__body -->
<mu-dialog v-model:visible="visible" body-style="padding: 16px 24px">
  内容
</mu-dialog>

<!-- 方案 B：body-class 属性 + 原子类 -->
<mu-dialog v-model:visible="visible" body-class="p-2x">
  内容
</mu-dialog>

<!-- 方案 C：body-class 同时解决内边距和内部 flex 布局 -->
<mu-dialog v-model:visible="visible" body-class="flex flex-col p-2x">
  <mu-toolbar>...</mu-toolbar>
  <div class="flex-1 overflow-auto">内容</div>
</mu-dialog>

<!-- 方案 D（兼容）：slot 根元素加内联样式 -->
<mu-dialog v-model:visible="visible">
  <div style="padding: 16px 24px;">
    内容
  </div>
</mu-dialog>
```

> **注意**：如果默认 slot 中的内容本身已有占满宽度的子元素（如表格、表单行），通常只需顶部和底部 padding，可改为 `body-style="padding: 16px 0"` 或 `body-class="py-2x"`，让内容自然撑满宽度。

#### 按钮格式变更

```js
// 升级前：对象数组
buttons: [{ caption: '确定', primary: true }, { caption: '取消', action: 'close' }]

// 升级后：支持字符串简写
buttons: ['#OK', '#CANCEL']
// 或混合使用
buttons: ['#OK', '#CANCEL', { caption: '自定义', primary: true }]
```

---

### 4.2 MuInput（原 MuEditor）

`<mu-editor>` 已重命名为 `<mu-input>`。

| Mussel 3 | Mussel 4 |
|----------|----------|
| `<mu-editor>` | `<mu-input>` |
| `class="mu-editor"` | `class="mu-input"` |
| `:clear-button="true"` | `clearable` |
| `solid`（布尔属性） | `input-style="solid"` |
| `underline`（布尔属性） | `input-style="underline"` |
| `round`（布尔属性） | `pill`（布尔属性） |
| `<template #prefix>` / `<template #suffix>` 插槽 | `prefix=":icon=search"` / `suffix=":icon=search"` 属性 |
| `width="100%"` | `style="width: 100%;"` |

```html
<!-- 升级前 -->
<mu-editor v-model="value" :clear-button="true" solid width="100%">
  <template #suffix><mu-icon icon="search" /></template>
</mu-editor>

<!-- 升级后 -->
<mu-input v-model="value" clearable input-style="solid" style="width: 100%;" suffix=":icon=search" />
```

事件变更：

| Mussel 3（MuEditor） | Mussel 4（MuInput） | 备注 |
|----------------------|---------------------|------|
| `@input` | `@input` | 参数变更：V3 传 `value`，V4 传原生 `Event` |
| `@click` | `@click` | 不变，传原生 `Event` |
| `@focus` | `@focus` | 参数变更：V3 传组件 ref，V4 传原生 `Event` |
| `@blur` | `@blur` | 参数变更：V3 传组件 ref，V4 传原生 `Event` |
| `@enterkey` | `@enter` | 重命名；参数变更：V3 传组件 ref，V4 无参数 |
| `@esckey` | `@esc` | 重命名；参数变更：V3 传组件 ref，V4 无参数 |
| _(无)_ | `@keydown` | 新增，传原生 `Event` |
| _(无)_ | `@prefix-click` | 新增，前置按钮点击 |
| _(无)_ | `@suffix-click` | 新增，后置按钮点击 |

---

### 4.3 MuComboBox / MuMultiSelect

#### MuComboBox

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `:clear-button="true"` | `clearable` | |
| `class="mu-box"` | _(移除该 class)_ | |
| `width="100%"` | `style="width: 100%;"` | |
| `label`（属性） | `prefix` / `suffix` | |
| `dropdown-align` | `dropdown-position` | 同 MuDropdown |
| `<template #left>` | `prefix` 属性 | `#left` 插槽已移除，用 `prefix` 属性代替 |
| `<template #right>` | `suffix` 属性 | `#right` 插槽已移除，用 `suffix` 属性代替 |

#### 多选拆分

```html
<!-- 升级前：单选和多选共用一个组件 -->
<mu-combo-box :multiple="true" ... />

<!-- 升级后：多选使用专用组件 -->
<mu-multi-select :options="options" v-model="values" clearable />
```

---

### 4.4 MuDropdown 系列

#### MuDropdown

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `dropdown-align` | `dropdown-position` | 值：auto / fixed / top / bottom |
| `sticky-target` | `dropdown-snap-to` | 默认：组件根元素 |
| `reserve-icon-place` | _(已移除)_ | |

#### MuDropdownPanel

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `items` | `dropdown-items` | |
| `align` | `position` | |
| `sticky-target` | _(已移除)_ | |

#### MuDropdownButton

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `trigger-action="click"` | `dropdown-trigger="click"` | |
| `trigger-action="press"` | _(已移除)_ | `'press'` 触发模式不再支持，仅 `'hover'` 和 `'click'` |
| `dropdown-icon="dropdown"` | `dropdown-icon="dropdownExpand"` | 默认图标名变更 |

#### MuDropdownItem / MuDropdownCheckItem / MuDropdownRadioItem

三个组件在 Mussel 4 中仍保留，但推荐使用 MuDropdown/MuDropdownPanel 的 `dropdown-items` 数组属性。

```html
<!-- 升级前 -->
<mu-dropdown>
  <mu-button>菜单</mu-button>
  <template #dropdown>
    <mu-dropdown-item caption="选项1" />
    <mu-dropdown-check-item caption="勾选1" />
  </template>
</mu-dropdown>

<!-- 升级后（推荐） -->
<mu-dropdown :dropdown-items="[
  { caption: '选项1', action: 'opt1' },
  { caption: '勾选1', type: 'check', value: 'check1' }
]">
  <mu-button>菜单</mu-button>
</mu-dropdown>

<!-- 升级后（兼容，仍可用） -->
<mu-dropdown>
  <mu-button>菜单</mu-button>
  <template #dropdown>
    <mu-dropdown-item caption="选项1" />
    <mu-dropdown-check-item caption="勾选1" />
  </template>
</mu-dropdown>
```

---

### 4.5 MuTabs / MuTabBar / MuTabButton

#### MuTabs

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `:tab-bar-params` | `tab-bar-attrs` | |
| `<template #tab-bar>` | _(已移除)_ | 无法再整体替换 tab-bar，改用 `#tab-bar-prepend` / `#tab-bar-append` 插槽 |

#### MuTabBar

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `:tab-items` | `:tab-buttons` | 属性重命名 |

#### MuTabButton

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `title` | _(已移除)_ | |

#### 事件变更

| 组件 | Mussel 3 | Mussel 4 | 备注 |
|------|----------|----------|------|
| MuTabs | `@tab-click` | `@button-click` | payload 从完整 tab 对象变为 tab `name` 字符串 |
| MuTabs | `@tab-change` | `@update:active-tab` | |

> **MuTabs 事件 payload 变更**：`@tab-click` 的 payload 是完整的 tab 对象，`@button-click` 的 payload 是 tab `name` 字符串。如果回调中使用了 tab 对象的其他字段（如 `caption`、`icon`），需改用 `name` 自行查找。

---

### 4.6 MuForm / MuFormField

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `class="mu-box"` | _(移除该 class)_ | `.mu-box` 不再有样式，改用原子类 |
| `margin="2x"` | `class="m-2x"` | 改为原子类 |
| `padding="8px"` | `style="padding: 8px;"` | 转为内联样式 |

Mussel 4 新增数据驱动表单能力：

```html
<!-- 升级前：声明式写法（仍可用） -->
<mu-form label-width="80px">
  <mu-form-field label="姓名">
    <mu-input v-model="form.name" />
  </mu-form-field>
  <mu-form-field label="角色">
    <mu-select v-model="form.role" :options="roleOptions" />
  </mu-form-field>
</mu-form>

<!-- Mussel 4：数据驱动写法（推荐用于简单表单） -->
<mu-form :model="form" :items="items" label-width="80px" />
```

```javascript
const items = [
  { prop: 'name', label: '姓名', required: true },
  { prop: 'role', label: '角色', input: {
    type: 'select',
    options: [{ value: 'admin', label: '管理员' }, { value: 'user', label: '用户' }]
  }}
]
```

`input` 属性支持的类型：`text`（默认）| `memo` | `date` | `month` | `select` | `multi-select`。
items 数组还支持：字符串标题、`'hr'` 分隔线、`'->'` 换行、数组子行、`{ is: '组件名' }` 自定义组件。

---

### 4.7 MuTree

`<mu-tree-view>` 和 `<mu-tree-nodes>` 已移除。`<mu-tree-node>` 仍保留但推荐使用数据驱动方式。
三个组件推荐统一由 `<mu-tree>` 数据驱动方式替代。

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

```html
<!-- 完整示例 -->
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

### 4.8 MuButton / MuBadge / MuIcon

#### MuButton

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `primary|secondary|danger`（Boolean） | `color="primary|secondary|danger"` | 旧布尔属性仍可用（deprecated），优先使用 `color` |
| `x-color` | _(已移除)_ | 无替代 |

Mussel 4 推荐 `color` 属性：`'normal' | 'primary' | 'secondary' | 'danger'`。
Mussel 4 新增 `buttonStyle` 属性：`'normal' | 'outline' | 'text' | 'link'`（控制按钮外观样式）。

#### MuBadge

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `secondary` | `secondary`（不变） | |
| `accent` | `secondary` | `accent` 已移除 |

#### MuIcon

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `reverse` | _(已移除)_ | |

---

### 4.9 MuList / MuListItem / MuListDivider

| 组件 | Mussel 3 | Mussel 4 | 备注 |
|------|----------|----------|------|
| MuListItem | `value` | _(已移除)_ | |
| MuListDivider | `divider`（布尔属性） | _(已移除)_ | |

---

### 4.10 MuNotifier

| Mussel 3 | Mussel 4 | 备注 |
|----------|----------|------|
| `:messages` | `:notifications` | 属性重命名 |

---

### 4.11 MuMessageBox

#### callback 签名变更

| | Mussel 3 | Mussel 4 |
|---|----------|----------|
| **参数** | `btn`（按钮原始名称字符串，如 `'OK'`、`'CANCEL'`） | `trigger`（按钮 `name` 属性字符串，或 `'$X'`/`'$MASK'`/`'$ESC'`） |
| **关闭/遮罩** | ❌ 不触发 callback | ✅ 关闭按钮 `'$X'`、遮罩 `'$MASK'`、ESC `'$ESC'` |
| **Promise resolve** | 同 callback 参数 | 同 callback 参数 |

```js
// Mussel 3
messageBox.alert('确认删除？', btn => {
  // btn = 'OK'（字符串）
})

// Mussel 4
messageBox.alert('确认删除？', trigger => {
  // trigger = 'OK'（按钮 name）或 '$X'/'$MASK'/'$ESC'（用户关闭了弹窗）
})
```

#### 自定义 buttons 必须有 name 属性

Mussel 3 的 `showMessage` 会自动给自定义按钮对象添加 `raw` 字段作为标识。Mussel 4 不会自动添加，自定义按钮**必须包含 `name` 属性**，否则按钮点击后 callback 收到的 trigger 为 `undefined`。

```js
// Mussel 3：自定义按钮无需 name，raw 自动添加
messageBox.showMessage({
  type: 'confirm',
  message: '确定要保存吗？',
  buttons: [
    { caption: '保存', primary: true },    // raw 自动添加
    { caption: '不保存', 'button-style': 'text' }  // raw 自动添加
  ],
  callback (btn) {
    // btn = '保存' 或 '不保存'（caption 值，因 raw 未设置时 fallback 到整个 btn 对象）
    // 实际 btn = btn.raw || btn，raw 由 showMessage 内部自动注入
  }
})

// Mussel 4：必须提供 name
messageBox.showMessage({
  type: 'confirm',
  message: '确定要保存吗？',
  buttons: [
    { name: 'SAVE', caption: '保存', primary: true },
    { name: 'DISCARD', caption: '不保存', buttonStyle: 'text' }
  ],
  callback (trigger) {
    // trigger = 'SAVE' 或 'DISCARD' 或 '$X'/'$MASK'/'$ESC'
  }
})
```

#### 预设按钮字符串格式变更

Mussel 3 使用无前缀字符串 `'OK'`、`'CANCEL'` 等。Mussel 4 使用 `#` 前缀预设常量。

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `'OK'` | `'#OK'` | 主要确认按钮 |
| `'CANCEL'` | `'#CANCEL'` | 取消按钮（text 样式） |
| `'YES'` | `'#YES'` | 确认按钮 |
| `'NO'` | `'#NO'` | 否定按钮（text 样式） |

`#` 后缀加 `!` 表示危险样式：`'#OK!'`（danger 主按钮）、`'#YES!'`（danger 确认）。

> 通常 `showMessage` 的 `type` 会自动设置预设 buttons，无需手动传入。仅当自定义 buttons 时需注意上述规则。

#### 升级检查清单

- [ ] `showMessage` / `alert` / `confirm` / `error` / `warn` 的 callback 参数从 `btn.raw` 改为 `trigger`（按钮 name 字符串）
- [ ] 新增处理 `'$X'`/`'$MASK'`/`'$ESC'` trigger（关闭按钮 / 遮罩点击 / ESC）
- [ ] 自定义 buttons 数组中每个对象必须有 `name` 属性
- [ ] 自定义按钮的 `'button-style'` 改为 `buttonStyle`（驼峰）
- [ ] 自定义按钮的 `primary: ''` 改为 `primary: true`（布尔值）

---

### 4.12 其他小组件

#### MuCheck / MuRadio 根元素变更

Mussel 3 中，`<mu-check>` 和 `<mu-radio>` 在没有 `label` 时渲染裸 `<input>` 作为根元素。Mussel 4 始终渲染 `<label>` 作为根元素。如果有 CSS 选择器依赖根元素是 `<input>`，需相应调整。

#### width 属性

仍支持 `width` 属性的组件：**form、dialog、tabs**。
其他所有组件（包括 box）：`width="100%"` → `style="width: 100%;"`。

---

## 5. 全局配置

### 插件注册

```js
// Mussel 3
app.use(pluginMussel, {
  theme: {
    // 主题变量（驼峰，直接映射 CSS 变量）
    primary: '#008CD6',
    danger: '#f57a79',
    success: '#00b25a',
    warning: '#f4af61',
    primaryColorDark: '#006db0',
    primaryColorLight: '#24a7e3',
    commonFontSize: '12px',
    textColorNormal: 'var(--mu-gray-8)',
    borderColor: '#ebecf0',
    dividerColor: '#ebecf0',
    // ...
  },
  darkMode: true | 'auto',   // 暗色模式
  autoComplementColors: true, // 自动补全衍生色（默认开启）
  root: document.documentElement,  // 挂载根元素
  icons: { ... }             // 图标注册
})

// Mussel 4
app.use(pluginMussel, {
  root: '#app',              // 挂载根元素（选择器或 DOM 元素）
  darkMode: true | 'auto',   // 暗色模式
  colors: {
    // 仅需指定基础色/语义色，自动生成调色板（10 级衍生色 + 20 级灰阶）
    primary: '#1c7ed6',
    danger: '#f03e3e',
    success: '#37b24d',
    warning: '#f76707',
    secondary: '#...',        // 可选，不指定则从 primary 自动生成
    neutral: '#...'           // 可选，不指定则从 primary 生成灰阶
  },
  icons: { ... },            // 图标注册
  locale: 'zh',              // 语言包（'zh' | 'en'）
  localeResources: { ... },  // 自定义语言资源
  // 其余属性作为 componentOptions 传入，通过 $mussel.options 访问
  messageBox: { dismissible: false },  // MessageBox 默认配置
  tree: { ... }                        // Tree 默认配置
})
```

#### 配置项变更对照

| Mussel 3 | Mussel 4 | 说明 |
|----------|----------|------|
| `theme: { primary: '...', ... }` | `colors: { primary: '...', ... }` | 重命名。V3 手动指定每个 CSS 变量值；V4 仅指定基础色，自动生成调色板 |
| `theme: false` | _(已移除)_ | V4 始终初始化颜色系统 |
| `darkMode` | `darkMode`（不变） | 但根元素 class 变更：V3 加 `dark-mode` 属性，V4 加 `mu-dark` class |
| `autoComplementColors` | _(已移除)_ | V4 始终自动补全，不可关闭 |
| `root` | `root`（不变） | 默认值变更：V3 默认 `document.documentElement`，V4 默认 `document.body` |
| `icons` | `icons`（不变） | |
| _(无)_ | `locale` | 新增：语言包设置（`'zh'` \| `'en'`） |
| _(无)_ | `localeResources` | 新增：自定义语言资源 |
| _(无)_ | `...componentOptions` | 新增：其余属性作为组件级配置，通过 `inject('$mussel').options` 访问 |

#### 主题变量映射变更

V3 `theme` 中手动指定的变量，在 V4 中改为 `colors` 只需指定基础色值：

| Mussel 3 `theme.*` | Mussel 4 `colors.*` | 说明 |
|--------------------|---------------------|------|
| `primary` | `primary` | 基础色，V4 自动生成 `primary-color-0` ~ `primary-color-9` 调色板 |
| `danger` / `success` / `warning` | `danger` / `success` / `warning` | 同理，自动生成调色板 |
| `primaryColorDark` | _(已移除)_ | 由调色板自动生成 |
| `primaryColorLight` | _(已移除)_ | 由调色板自动生成 |
| `secondary` | `secondary` | 可选，不指定则从 primary 自动生成 |
| _(无)_ | `neutral` | 灰阶基准色，不指定则从 primary 生成 20 级灰阶 |
| `commonFontSize` | _(已移除)_ | 用 CSS 变量 `--mu-font-size` 控制 |
| `textColorNormal` | _(已移除)_ | 用 CSS 变量 `--mu-text-color-normal` 控制 |
| `borderColor` / `dividerColor` | _(已移除)_ | 用 CSS 变量 `--mu-border-color-normal` / `--mu-border-color-soft` 控制 |

> **V3 theme 中除颜色外的变量**（`commonFontSize`、`textColorNormal`、`borderColor` 等）在 V4 中不再通过 `install` 传入，改为直接覆盖 CSS 变量。

#### 暗色模式变更

| | Mussel 3 | Mussel 4 |
|---|----------|----------|
| 根元素标记 | `root.setAttribute('dark-mode', '')` | `root.classList.add('mu-dark')` |
| CSS 变量覆盖 | `[dark-mode] .mu-root { --mu-xxx: ... }` | `.mu-root.mu-dark { --mu-xxx: ... }` |

#### 导出变更

```js
// Mussel 3
export { install, components, icons, registerIcons, scrollbar }

// Mussel 4
export { install, installIcons }  // 仅导出 install 和 installIcons
```

---

## 6. 新增组件

Mussel 4 新增了以下组件，可用于替代手工实现：

| 组件 | 用途 |
|------|------|
| MuInput | 替代 MuEditor |
| MuSelect | 下拉单选框 |
| MuMultiSelect | 下拉多选框（带标签显示） |
| MuDateInput | 日期/月份选择器 |
| MuTable | 数据表格，支持多种列类型（text、check、bool、enum、date、link、tag 等） |
| MuBigTable | 大数据量表格，支持虚拟滚动 |
| MuList | 列表容器，支持滚动条 |
| MuListItem | 列表项 |
| MuListDivider | 列表分隔线 |
| MuTree | 统一的树组件 |
| MuTags | 标签组，支持展开/收起 |
| MuCalendar | 月历组件 |
| MuDrawer | 抽屉面板（上/右/下/左） |
| MuContextMenu | 右键上下文菜单 |
| MuSplitHBox / MuSplitVBox | 可拖拽、可收拢的弹性分隔布局（分隔条为内部组件） |
| MuToolButton | 仅图标的快捷操作按钮 |
| MuInputGroup | 输入框分组 |
| MuToolbar | 工具栏组件 |
| MuSvgStripe | SVG 装饰条纹 |
| MuBar | 通用条形容器 |
| MuPagination | 分页组件 |
| MuScrollBox | 可滚动容器（带自定义滚动条） |
| MuSegmented | 分段选择器 |
| MuFormRow | 表单行布局 |
| MuStatusBox | 状态提示框 |
| MuCheckGroup | 复选框组（数据驱动，`options` 数组 + `v-model`） |
| MuRadioGroup | 单选框组（数据驱动，`options` 数组 + `v-model`） |
| MuMessageBox | 消息弹框（插件式调用） |
| MuNotifier | 通知提示（插件式调用） |
