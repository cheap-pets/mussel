# Mussel 1 → Mussel 4 升级流程

本文件只包含**升级流程**（分析 → 计划 → 执行）。所有迁移规则的权威定义在同级目录的 `rules.md`。

---

## 目录

- [重要约束](#重要约束)
- [前置步骤 0：退出检查](#前置步骤-0退出检查)
- [前置步骤 1：确认源目录与 v1 版本档次](#前置步骤-1确认源目录与-v1-版本档次)
- [阶段一：分析](#阶段一分析)
- [阶段二：计划](#阶段二计划)
- [阶段三：执行](#阶段三执行)

---

## 重要约束

- **升级前必须确保当前代码已 commit 或处于独立分支**，以便随时回退。若用户尚未 commit，先提醒用户执行 `git add -A && git commit` 或创建新分支。
- **无法安全自动升级**的内容（上下文模糊、业务逻辑耦合复杂、规则未覆盖）只在计划文档中标注，**不修改代码**，由开发者手动处理。
- 每次修改都记入升级跟踪文档。
- 修改前必须先读文件，绝不猜测。
- v1→v4 是 Vue 2 → Vue 3 + 组件库换代，**必须整体替换后项目才能运行**（`@mctech/mussel` 无法在 Vue 3 下运行）。大型项目按"模块"划批，每批保持可编译的里程碑，而不是按"层"分批。

---

## 前置步骤 0：退出检查

先做，命中任一即停止升级流程：

- 用户消息未出现"升级 / 迁移 / V4"等明确意图词；
- `package.json` 中依赖已是 `mussel` 4.x（Vue 3），且用户未要求迁移既有代码；
- 任务是新增/修改类，目标文件在 git 中为 untracked / 新建；
- 检测到的 v1 痕迹仅出现在 `node_modules/`、`docs/` 或测试夹具中，业务源码已是 v4。

> 升级流程是 opt-in。若不确定是否应进入，先询问用户。
> Mussel 3（`mussel` 3.x，Vue 3）→ 4 的升级**不走本流程**，改用 mussel-ui skill 的 `references/upgrade/`。

---

## 前置步骤 1：确认源目录与 v1 版本档次

1. 查找并初步判断需升级的项目源码目录（前端源码根，通常含 `package.json`、`src/`）。
2. 让用户确认需升级的源码目录路径。
3. 验证路径有效性：
   - 目录存在且可读，包含 `.vue` / `.js` 源文件；
   - `package.json` 依赖 `@mctech/mussel`（或代码中存在 `mu-editor` / `mu-flex-box` / `new Vue(` 等痕迹）。
4. **判定 v1 版本档次**（影响样式迁移策略，见 SKILL.md「早期 v1 的重要约束」）：
   - 读 `package.json` 中 `@mctech/mussel` 的版本号；
   - grep 业务源码中 late-v1 类痕迹：`mu-text-color-`、`mu-background-`、`class="mu-box`、`mu-bordered`、`mu-divider`；
   - grep compat 原子类痕迹：`class="flex`、`p-1x`、`text-ellipsis`、`items-center`（late v1 后期才有）；
   - 向用户报告判定结果：「早期 v1（无原子样式）/ 中期 / 后期（可能已用部分原子类）」，后续分析按此校准预期。
5. 若路径无效或不含 v1 代码，向用户报告原因并重新确认。
6. 确认后，后续所有阶段均基于此目录操作。

---

## 阶段一：分析

1. 读本文件全部流程内容。
2. 验证 `package.json`、构建配置（vue-cli / vite / webpack）、入口文件位置。
3. 用 Grep 搜索以下**模式线索**并分类计数。

> ⚠️ **同步约束（SYNC-RULES）**：以下清单仅为分析阶段的 **grep 线索**，权威定义在 `rules.md` 对应章节。改动任一处（新增/移除/重命名废弃项）**必须同步另一处**，否则会出现「grep 命中但无迁移规则」或「有规则但分析漏检」的不一致。

**框架层（Vue 2 痕迹）**：
- `new Vue(`、`Vue.use(`、`Vue.component(`、`Vue.directive(`、`Vue.prototype`、`Vue.filter`、`Vue.extend(`
- `.sync=`（模板修饰符）、`slot-scope`、`$listeners`、`$children`、`$on(`、`$off(`、`$once(`
- `model: {`（组件自定义 v-model）、`filters:`、管道过滤器 `{{ x | fn }}`
- `vue-router` 3.x / `vuex`（项目侧另行升级，只在计划中标注）

**全局配置（安装入口）**：
- `@mctech/mussel`（import 来源全部命中）
- `setTheme`、`registerIcons`、`variables`（从 mussel 导入）、`scrollbar`（导入）、`PopupGroupMixin`
- 自动注册依赖：入口文件仅 `import 'mussel'` 即完成注册（v1 导入副作用）

**CSS 变量与 CSS 类**：
- 运行时变量：`--mu-primary-plus-color`、`--mu-primary-minus-color`、`--mu-primary-tiny-color`、`--mu-primary-shadow-color`、`--mu-success-plus-color` 等 plus/minus/tiny/shadow 后缀、`--mu-dark-background`、`--mu-block-border-radius`
- late-v1 类：`mu-text-color-`、`mu-text-title`、`mu-text-subtitle`、`mu-text-weak`、`mu-text-body`、`mu-text-ellipsis`、`mu-background-`、`mu-bordered`、`mu-divider`
- 属性选择器用法（SCSS/CSS 中或模板属性上）：`margin~=`、`padding~=`、`border~=`、`class="mu-box`
- 指令：`v-mussel-scrollbar`、`v-mu-scrollbar`、`v-mussel-sticky`

**布局系统**：
- 组件：`<mu-flex-box`、`<mu-flex-item`、`<mu-h-box`、`<mu-v-box`、`<mu-space`、`<mu-splitter`
- 子项属性：`size="1"` ~ `size="8"`、`size="auto"`、`flex-auto`、`flex-none`、`flex-size=`
- 辅助类：`mu-absolute-fit`、`mu-absolute-top`、`mu-absolute-bottom`、`cell-padding`、`cell-spacing`、`content-spacing`

**图标**：
- `icon="dropdown"`、`icon="key-up|key-down|key-left|key-right"`、`icon="x"`、`icon="ok"`、`icon="circleX"`、`icon="circleCheck"`、`icon="circleAlert"`、`icon="triangleAlert"`、`icon="menu"`、`icon="refresh"`、`icon="tree"`、`icon="ellipsis"`、`icon="expand"`、`icon="collapse"`、`icon="pin"`、`icon="tree-collapsed"`、`icon="tree-expanded"`
- `icon-class=` / `:icon-class`（icon.vue 属性）

**组件迁移**：
- 输入家族：`<mu-editor`、`<mu-search-box`、`<mu-option`、`<mu-date-editor`、`<mu-time-editor`、`<mu-date-range-editor`、`<mu-color-editor`、`<mu-button-editor`、`<mu-popup-editor`、`fields=`、`popup-style=`、`popup-max-height`
- 事件签名：`@enterkey`、`@esckey`、`@buttonclick`、`@inputclick`、`@maskclick`、`@change=`（v1 model 事件）
- 选择家族：`<mu-checkbox`、`<mu-checkbox-group`、`<mu-toggle`
- 弹层家族：`mask-action`、`<mu-modal`、`<mu-base-modal`、`<mu-base-dialog`、`<mu-dialog-wrapper`、`<mu-prompt-panel`、`primary-button`、`primaryButton`、`keep-alive`、`keepAlive`、`model-control`、`modelControl`、`draggable`
- 其他：`<mu-expander`、`<mu-split-button`、`<mu-sidebar-menu`、`<mu-menu-group`、`<mu-menu-item`、`<mu-paging-bar`、`<mu-tabs-header`、`<mu-table-column`、`<mu-table-edit-column`、`<mu-table-check-column`、`<mu-table-combo-column`、`<mu-table-search-column`、`<mu-table-button-column`、`<mu-tree-nodes`、`tab-items=`、`form-style=`、`formStyle`、`select-mode`、`selectMode`、`trigger-action`、`triggerAction`、`icon-align`、`iconAlign`
- message 导入：`from '@mctech/mussel'` 中的 `showMessage` / `alert(` / `confirm(` / `error(` / `warn(` / `notify(`

4. 检查全局插件配置与主题定制方式（`setTheme` 调用、编译期变量覆盖、CSS 类覆盖）。
5. 检查所有 CSS/SCSS/Less 文件对 mussel 类名与变量的引用。

汇总表报告：

| 类别 | 数量 | 涉及文件 |
|------|------|----------|
| 框架层（Vue 2 痕迹） | N | ... |
| 全局配置（安装入口） | N | ... |
| CSS 变量/类 | N | ... |
| 布局系统 | N | ... |
| 图标 | N | ... |
| 组件迁移 | N | ... |

---

## 阶段二：计划

在 `{项目根目录}/mussel-upgrade-plan.md` 创建计划文档：

```markdown
# Mussel 1 → Mussel 4 升级计划

**项目**：{项目名称}
**日期**：{今天}
**生成工具**：upgrade-v1-to-v4 Skill
**源版本档次**：{早期 v1（无原子样式）/ 中期 / 后期}

## 范围概览
{简要概述；Vue 2 → Vue 3 为硬前提}

## 迁移项

### 1. 框架迁移（Vue 2 → Vue 3）
| 文件 | 变更说明 | 可自动？ |
|------|----------|----------|

### 2. 全局配置（安装入口、主题、图标注册）
| 文件 | 变更说明 | 可自动？ |
|------|----------|----------|

### 3. CSS 变量 / CSS 类
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 4. 布局系统
| 文件 | 行号 | 当前写法 | 目标写法 | 可自动？ |
|------|------|----------|----------|----------|

### 5. 图标
| 文件 | 行号 | 当前图标名 | 目标图标名 | 可自动？ |
|------|------|------------|------------|----------|

### 6. 组件迁移
| 文件 | 行号 | 组件 | 当前写法 | 目标写法 | 可自动？ |
|------|------|------|----------|----------|----------|

### 7. 需要人工审核/设计的项目
{列出无对应组件、行为差异、无法自动项及原因与建议}

## 执行顺序
1. 全局配置与框架入口（createApp + install，项目可编译的第一步）
2. 按模块迁移页面/组件（框架写法 + mussel API 同文件一次改完）
3. CSS 变量 / CSS 类与布局系统（随所在模块一并处理）
4. 图标
5. 人工审核项
```

**可自动？= 否** 的判定条件：
- 上下文模糊（动态属性值、运行时拼接的组件名/图标名）
- 业务逻辑与 mussel API 紧密耦合（如依赖 `PopupGroupMixin`、`modelControl`、`_rawData` 等内部机制）
- 模式无法明确匹配任何迁移规则（v1 `mu-table-*-column` 的 edit/search/combo 列等无对应能力）
- 文件位于 `node_modules` 或为生成文件

向用户展示计划并询问：

> 已分析项目并在 `{路径}/mussel-upgrade-plan.md` 创建升级计划。包含 {N} 个可自动升级项和 {M} 个人工审核项。是否开始执行？

等待确认。

---

## 阶段三：执行

逐模块系统处理。

执行规则：
1. **修改前先读文件**，绝不盲目编辑。
2. **逐文件处理**，同一文件内框架写法与 mussel API 一次改完，完成一个文件所有变更后再下一个。
3. **跟踪进度**，每改一个文件后更新计划文档，增加"状态"列：`已完成` / `跳过（需人工处理）` / `受阻`。
4. **跳过非自动项**，在计划中备注，不改代码。
5. **保留业务逻辑**，仅变更框架写法与 mussel 相关 API/属性/类/变量。

> 执行某类迁移时，按需跳转 `rules.md` 对应章节查具体规则：
> 1 框架迁移 → 2 全局配置 → 3 CSS 变量与类 → 4 布局系统 → 5 图标 → 6 组件迁移 → 7 无对应与移除项 → 8 新增能力。

升级日志（计划文档中维护）：

```markdown
## 升级日志
| 序号 | 文件 | 变更内容 | 状态 |
|------|------|----------|------|
```

全部完成后生成 `{项目根目录}/mussel-upgrade-summary.md`：

```markdown
# Mussel 1 → Mussel 4 升级总结
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
- [ ] package.json：移除 `@mctech/mussel`、`vue` 2.x，加入 `mussel` 4.x 与 `vue` 3.x
- [ ] 构建链升级（vue-cli→vite 或对应版本、`unplugin-vue2` 等移除）
- [ ] 运行应用，逐页测试已迁移组件（重点：弹窗遮罩关闭、tab 切换、表格列、日期选择）
- [ ] 真实浏览器验证（v4 使用现代 CSS 特性，不支持 IE11）
```
