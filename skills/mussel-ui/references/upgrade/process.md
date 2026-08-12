# Mussel 3 → Mussel 4 升级流程

本文件只包含**升级流程**（分析 → 计划 → 执行）。所有迁移规则的权威定义在同级目录的 `rules.md`。

---

## 目录

- [重要约束](#重要约束)
- [前置步骤：确认源目录](#前置步骤确认源目录)
- [阶段一：分析](#阶段一分析)
- [阶段二：计划](#阶段二计划)
- [阶段三：执行](#阶段三执行)
- [Mussel 4 速查表](#mussel-4-速查表)

---

## 重要约束

- **升级前必须确保当前代码已 commit 或处于独立分支**，以便随时回退。若用户尚未 commit，先提醒用户执行 `git add -A && git commit` 或创建新分支。
- **无法安全自动升级**的内容（上下文模糊、业务逻辑耦合复杂、规则未覆盖）只在计划文档中标注，**不修改代码**，由开发者手动处理。
- 每次修改都记入升级跟踪文档。
- 修改前必须先读文件，绝不猜测。

---

## 前置步骤：确认源目录

0. **退出检查**（先做，命中任一即停止升级流程，回到 `SKILL.md` 步骤 2）：
   - 用户消息未出现"升级 / 迁移 / V4"等明确意图词；
   - `package.json` 中 mussel 版本 ≥ 4，且用户未要求迁移既有代码；
   - 任务是新增/修改类，目标文件在 git 中为 untracked / 新建；
   - 检测到的 V3 模式仅出现在 `demo/`、`docs/`、`node_modules/` 或测试夹具中，业务源码已为 V4。

   > 升级流程是 opt-in。若不确定是否应进入，先询问用户，不要凭代码中存在 V3 痕迹自动启动。

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

---

## 阶段一：分析

1. 读本文件全部流程内容（即本文件）。
2. 以前置步骤确认的源目录为项目根目录，验证 `package.json`、`vite.config.*` 等配置文件位置。
3. 用 Grep/Glob 搜索**所有 Mussel 3 模式**，分类：

   **全局配置（安装入口）**：
   - 导入与注册：`import pluginMussel`、`app.use(pluginMussel,`、`registerIcons`
   - 配置项：`theme:`、`theme: false`、`autoComplementColors`、`root:`（V3 默认 `document.documentElement`）
   - 导出引用：`import { ..., registerIcons, scrollbar } from 'mussel'`

   **CSS 变量与 CSS 类**：
   - 废弃 CSS 变量：`--mu-gray-dark`、`--mu-text-color-reversed`、`--mu-text-color-weak`、`--mu-background-normal`、`--mu-background-hover`、`--mu-background-disabled`、`--mu-primary-color-shadow`、`--mu-unit-spacing-size`、`--mu-editor-text-color`、`--mu-text-color-placeholder`
   - 废弃 CSS 类：`mu-editor`→`mu-input`、`mu-text-ellipsis`→`text-ellipsis`、`mu-text-color-weak`→`text-muted`

   **布局系统**：
   - 已移除组件：`<mu-box>`、`<mu-h-box>`、`<mu-v-box>`
   - 废弃 CSS 类：`mu-box`、`mu-h-box`、`mu-v-box`、`mu-space`→`flex-space`、`mu-divider`→`flex-divider`、`mu-flex-item`、`mu-bg-transparent`、`mu-bg-white`、`mu-bg-black`、`mu-bg-x-color`
   - 废弃属性选择器：`layout="flex"`、`flex="..."`、`margin="..."`、`padding="..."`、`padding-x/y`、`margin-x/y`、`margin-top/bottom/left/right`、`padding-top/bottom/left/right`、`border`/`border-right` 等、`position="..."`、`width="..."`、`height="..."`、`overflow="..."`、`align-items="..."`、`align-self="..."`、`justify-content="..."`、`content-center`、`flex-wrap`、`inline`、`reverse`、`collapsible`、`gap="..."`
   - ref 连带变更：`<mu-box ref="...">` / `<mu-h-box ref="...">` / `<mu-v-box ref="...">`（模板）+ 对应 `{refName}.value.$el`（脚本），见 rules.md 3.5

   **图标**：
   - `icon="dropdown"` → `icon="chevronDown"`

   **组件迁移**：
   - 已移除组件：`<mu-editor>`、`<mu-tabs-buttons>`
   - Tree 相关：`<mu-tree-nodes>`（V4 不再注册，见 rules.md 5.7）
   - 推荐迁移：`<mu-option>`、`<mu-tree-node>`、`<mu-dropdown-item>` 等
   - 废弃属性：`mask-action`、`easy-hide`、`:moveable`、`dialog-style`、`:clear-button`、`dropdown-align`、`sticky-target`、`reserve-icon-place`、`trigger-action`、`:tab-bar-params`、`:messages`（Notifier→`:notifications`）、`:tab-items`（TabBar→`:tab-buttons`）、`dropdown-icon="dropdown"`→`"dropdownExpand"`
   - 废弃事件：`@tab-change`、`@close-button-click`、`@mask-click`
   - 行为差异（非废弃，需人工审核）：
     - `<mu-dialog>` 同时使用 `action: 'hide'`/`'close'` 按钮与 `@button-click` handler（V3 hide 按钮不触发，V4 全触发，见 rules.md 5.1）
     - `<mu-tabs>` 的 `@tab-click` handler 使用了 tab 对象的字段（事件名与 V3 一致，但 payload 从完整 tab 对象变为 tab `name` 字符串；V3 中 `@tab-click` 与 `@button-click` 合并为单个 `@tab-click`，见 rules.md 5.5）
     - `<mu-tabs>` 传入了 `:on-tabchange`（V3 中它不是事件，而是组件通过 `$attrs.onTabchange` 捕获的用户自定义方法，返回 `false` 阻止切换；V4 已移除该机制，需升级为 `:active-tab` + `@update:active-tab` 受控模式，见 rules.md 5.5）
   - 废弃插槽：`<template #left>`/`#right`（ComboBox→`prefix`/`suffix` 属性）、`<template #tab-bar>`（Tabs→`#tab-bar-prepend`/`#tab-bar-append`）、`<template #client>`/`#header-prepend`/`#header-append`/`#footer-prepend`/`#footer-append`（Dialog→`#body`/`#header`/`#footer`）
   - 废弃子组件属性：`title`（TabButton）、`divider`（ListDivider）、`value`（ListItem）
   - 缺少 `mu-box` class 的 `<mu-form-field>`/`<mu-form>`
   - 非 box 组件上的 `width="100%"`
   - Dialog CSS 选择器 `> .mu-dialog`（Mussel 4 改为绑在 dialog 层）
   - Dialog 默认 slot 内边距丢失（Mussel 4 `.mu-dialog__body` 无 padding，需加 `p-2x` 或 `padding: 16px 24px`）

   > ⚠️ **同步约束（SYNC-RULES）**：以上清单仅为分析阶段的 **grep 线索**，权威定义在 `rules.md` 对应章节。改动任一处（新增/移除/重命名废弃项）**必须同步另一处**，否则会出现「grep 命中但无迁移规则」或「有规则但分析漏检」的不一致。修改前先确认对方文件的对应章节是否需要同步更新。

4. 检查 `package.json` 的 mussel 依赖版本与全局插件配置（`app.use(pluginMussel, {...})`）。
5. 检查所有 CSS/SCSS 文件对 mussel 变量的引用。

汇总表报告：

| 类别 | 数量 | 涉及文件 |
|------|------|----------|
| 全局配置（安装入口） | N | ... |
| CSS 变量/类 | N | ... |
| 布局系统 | N | ... |
| 图标 | N | ... |
| 组件迁移 | N | ... |

---

## 阶段二：计划

在 `{项目根目录}/mussel-upgrade-plan.md` 创建计划文档：

```markdown
# Mussel 3 → Mussel 4 升级计划

**项目**：{项目名称}
**日期**：{今天}
**生成工具**：Mussel UI Skill

## 范围概览
{简要概述}

## 迁移项

### 1. 全局配置（install 入口、theme→colors、图标函数等）
| 文件 | 变更说明 | 可自动？ |
|------|----------|----------|

### 2. CSS 变量 / CSS 类
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 3. 布局系统
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 4. 图标
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 5. 组件迁移
| 文件 | 行号 | 组件 | 当前写法 | 目标写法 | 可自动？ |
|------|------|------|----------|----------|----------|

### 6. 需要人工审核的项目
{列出无法自动升级项及原因}

## 执行顺序
1. 全局配置（基础层，改写应用入口 install）
2. CSS 变量 / CSS 类
3. 布局系统
4. 图标
5. 组件迁移（按组件逐个处理）
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

---

## 阶段三：执行

逐类别系统处理。

执行规则：
1. **修改前先读文件**，绝不盲目编辑。
2. **逐文件处理**，完成一个文件所有变更后再下一个。
3. **跟踪进度**，每改一个文件后更新计划文档，增加"状态"列：`已完成` / `跳过（需人工处理）` / `受阻`。
4. **跳过非自动项**，在计划中备注，不改代码。
5. **保留业务逻辑**，仅变更 mussel 相关 API/属性/类/变量。

> 执行某个类别时，按需跳转 `rules.md` 对应章节查具体规则：
> 1 全局配置 → 2 CSS 变量与 CSS 类 → 3 布局系统 → 4 图标 → 5 组件迁移 → 6 新增组件。

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
- **组件 API**：按 8 大类 1:1 查阅对应参考文件（详见 `SKILL.md` 步骤 2 路由表）
  - 1 布局：`references/components/layout.md`
  - 2 容器与面板（含模态/抽屉）：`references/components/containers-panels.md`
  - 3 按钮与操作：`references/components/buttons.md`
  - 4 表单 / 输入：`references/components/form.md`
  - 5 导航与菜单：`references/components/navigation.md`
  - 6 数据展示（含表格）：`references/components/data.md`
  - 7 反馈：`references/components/feedback.md`
  - 8 基础元素：`references/components/basic.md`
- **组件选型**：`SKILL.md` 组件速查表
- **安装初始化**：`install(app, options)`、options 字段、`$mussel` 上下文、`installIcons` 查阅 `references/install.md`

> 迁移规则中的「目标写法」列均使用 Mussel 4 语法，具体属性/事件/插槽的完整 API 请查阅上述参考文件。
