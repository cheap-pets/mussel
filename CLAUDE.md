# Mussel 4 — Vue 3 UI Component Library

## Project Overview

Mussel 是 Vue 3 组件库，当前版本 `4.0.0-alpha.13`。纯 JavaScript（无 TypeScript），使用 Composition API `<script setup>` 语法。

- **仓库**: https://github.com/cheap-pets/mussel.git
- **分支**: `4.0`（开发分支），`master`（主分支）
- **作者**: scrollbar-ww
- **旧版本参考**: 本文件上级目录 `../mussel3/` 中的 Mussel 3.x 旧版本，供升级迁移参考（若目录不存在直接忽略）

## Tech Stack

| 层面 | 技术 |
|------|------|
| 框架 | Vue 3.x (`<script setup>`, Composition API) |
| 构建 | Vite 8 + rolldown (UMD 输出) |
| CSS | Sass (sass-embedded) + LightningCSS |
| 图标 | @tabler/icons (SVG) |
| 校验 | Valibot (表单验证) |
| 语言 | JavaScript (无 TypeScript) |
| 包管理 | npm |

## Commands

```bash
npm run build          # 构建开发版 + 生产版 (dist/mussel.js + mussel.min.js)
npm run build:demo     # 构建 demo (watch 模式)
npm run pub            # 构建 + npm publish
```

无测试框架。通过 demo 页面验证组件行为。

## Project Structure

```
src/
├── index.js            # 入口：install() 注册全部组件、颜色、图标、语言
├── colors.js           # 颜色系统：调色板生成、CSS 变量注入
├── env.js              # 环境变量导出
├── components/         # 组件目录（每个子目录一个组件族）
│   ├── button/         # MuButton, MuToolButton, MuButtonGroup
│   ├── form/           # MuForm, MuFormField, MuFormRow, MuInput, MuSelect, MuComboBox, MuMultiSelect, MuCheck, MuRadio, MuSwitch, MuDateInput, MuSegmented
│   ├── table/          # MuTable (常规表格，含多种列类型)
│   ├── table2/         # MuBigTable (虚拟滚动大表)
│   ├── modal/          # MuDialog, MuDrawer
│   ├── dropdown/       # MuDropdown, MuDropdownPanel, MuContextMenu, MuDropdownButton
│   ├── tree/           # MuTree, MuTreeNode
│   ├── tabs/           # MuTabs, MuTabBar, MuTabPanel
│   ├── list/           # MuList, MuListItem, MuListDivider
│   ├── calendar/       # MuCalendar, MuDateTable, MuMonthPicker
│   ├── message/        # MuMessage, MuMessageBox, MuNotifier, MuStatusBox
│   ├── layout/         # MuHBox, MuVBox, MuFlexBox, MuFlexSplitter, MuSplitHBox, MuSplitVBox, MuGridBox, MuGridCell
│   ├── bar/            # MuBar, MuToolbar
│   ├── pagination/     # MuPagination
│   ├── icon/           # MuIcon, MuSortIcon
│   ├── svg/            # MuSvgStripe
│   ├── tag/            # MuTags
│   ├── badge/          # MuBadge
│   ├── scrollbar/      # MuScrollBox + v-mu-scrollbar 指令
│   └── common/         # 共享工具 (popup.js, props.js)
├── styles/             # 全局样式
│   ├── index.js        # 样式入口（统一导出）
│   ├── root.scss       # CSS 变量定义（颜色、间距、字体、阴影、z-index）
│   ├── layout.scss     # Flex/Grid 原子类
│   ├── spacing.scss    # 间距原子类
│   ├── border.scss     # 边框原子类
│   ├── typography.scss # 排版原子类
│   ├── background.scss # 背景色原子类
│   ├── box-shadow.scss # 阴影原子类
│   ├── pointer.scss    # 鼠标指针样式
│   ├── animation.scss  # 动画
│   ├── link.scss       # 链接样式
│   └── tag.scss        # 标签样式
├── utils/              # 工具函数
│   ├── color.js        # 调色板生成算法
│   ├── dom.js          # DOM 操作
│   ├── size.js         # 尺寸解析
│   ├── date.js         # 日期处理
│   ├── case.js         # 大小写转换 (kebabCase 等)
│   ├── type.js         # 类型判断
│   ├── object.js       # 对象工具
│   ├── array.js        # 数组工具
│   ├── string.js       # 字符串工具
│   ├── vue.js          # Vue 相关工具
│   ├── prop.js         # 属性工具
│   ├── style.js        # 样式工具
│   ├── h.js            # 渲染函数工具
│   ├── timer.js        # 定时器
│   ├── crypto.js       # 加密
│   ├── key-builder.js  # 按键构建器
│   └── compatible.js   # 废弃 API 兼容/警告
├── events/             # 事件系统
│   ├── index.js        # 事件模块入口
│   ├── custom-event.js
│   ├── interceptor.js  # EventInterceptor
│   ├── resize.js       # resize 监听
│   └── touch/          # 触摸/手势 (tap, pan, press)
├── icons/              # 图标注册系统
│   ├── index.js        # 图标注册/安装
│   ├── svg/            # 内置 SVG 图标
│   └── tabler-icons.js # Tabler 图标集成
└── langs/              # 国际化
    ├── index.js
    ├── zh.js
    └── en.js
```

## Architecture & Conventions

### Component Registration

组件通过 `Mu` 前缀 + `kebab-case` 自动注册：
- 源码: `MuButton` → 注册为 `<mu-button>`
- 每个 `components/<name>/index.js` 导出组件，由 `components/index.js` 统一注册

### Component File Pattern

每个组件典型结构：
```
button/
├── button.vue       # 单文件组件 (<script setup>)
├── button.scss      # 组件样式（就近放置，组件内 import）
└── index.js         # 导出
```

### Vue Component Conventions

- **Composition API + `<script setup>`** — 统一使用，无 Options API
- `defineOptions({ name: 'MusselXxx' })` — 设置组件名
- 样式文件在组件内 `import './xxx.scss'` 引入
- Props 验证使用 `validator` 函数
- 组件名以 `Mussel` 为内部名前缀，注册名用 `Mu` 前缀

### CSS Architecture

**命名规范**: BEM 风格，`mu-` 前缀
- Block: `mu-button`
- Modifier: `mu-button--primary`, `mu-button--large`
- Element: `mu-form-field__label`, `mu-form-field__input`

**CSS Variables**: 所有颜色/间距/字体通过 CSS 变量控制
- 基础色: `--mu-red`, `--mu-blue`, `--mu-green` ...
- 语义色: `--mu-primary-color`, `--mu-danger-color`, `--mu-success-color` ...
- 灰阶: `--mu-gray-0` ~ `--mu-gray-19`（20级）
- 文本色: `--mu-text-color-strong/normal/subtle/soft/muted`
- 边框色: `--mu-border-color-strong/normal/soft`
- z-index: `float(1) < layer(10) < modal(100) < popup(1000) < ontop(10000)`

**Sass 构建注入**: `root.scss` 编译时通过 `vite.config.js` 注入 `$colors` map 和 `@use "sass:map"`

**暗色模式**: `.mu-root.mu-dark` 覆盖 CSS 变量

### Color System

`src/colors.js` 管理颜色系统：
- 12 种基础色 (red → orange)
- 5 种语义色 (primary, secondary, success, warning, danger)
- `generatePalette()` — 自动生成调色板
- `generateNeutralPalette()` — 灰阶生成
- `setupColors()` — 运行时注入 CSS 变量到根元素
- `generatePreCssVariables()` — 构建时预生成 Sass 变量

### Path Aliases

- `@` → `src/`
- `~icons` → `node_modules/@tabler/icons/icons`

### Build Output

UMD 格式库文件：
- `dist/mussel.js` — 开发版
- `dist/mussel.min.js` — 生产版
- `dist/mussel.css` / `mussel.min.css` — 样式
- Vue 作为外部依赖 (`globals.vue: 'Vue'`)

### i18n

`src/langs/` 提供 `zh` / `en` 语言包，通过 `setupLocale()` 初始化。

## Mussel UI Skill

### 触发场景

编写或修改使用 Mussel 4 组件库的 Vue 界面代码时自动触发，包括：
- 新建页面 / 修改已有 UI
- Review 代码合规性
- 用户明确要求将 Mussel 3 代码升级到 Mussel 4（如 "升级到 Mussel 4"、"迁移到新版 Mussel"）

### 硬性禁止

生成代码前必须确认以下五条，任意一条违反均导致 Review 不通过：

| # | 禁止内容 | 应替换为 |
|---|---------|---------|
| 1 | 硬编码颜色（`#xxx` / `rgb()` / `red` 等） | `--mu-color-*` CSS 变量 |
| 2 | 手写 z-index 数字 | `--mu-z-index-*` 变量 |
| 3 | 非 8px 体系间距（`12px` / `6px` 等） | 8px 基准倍数值（`{n}x` 系列） |
| 4 | 能用原子类解决的布局却写 `style` 属性 | 对应原子类 |
| 5 | 自造 `--mu-*` 变量 | 规范中已定义的变量 |

### 工作流程

1. **识别任务类型**：Mussel 3 → 4 升级 → 先读 `references/mussel3-to-mussel4.md`；新建/修改 UI → 继续
2. **识别组件，查阅 API**：按需读取对应参考文件，不凭记忆猜测属性名
3. **确认样式**：涉及颜色/间距/原子类/布局时，读取 `references/styles.md`
4. **生成并自检**：对照硬性禁止逐条检查

### 组件速查表

**布局容器**：`<mu-h-box>` / `<mu-v-box>` / `<mu-grid-box>` + `<mu-grid-cell>` / `<mu-flex-splitter>` / `<mu-scroll-box>` 或 `v-mu-scrollbar` / `<mu-svg-stripe>`

**导航/工具栏**：`<mu-bar>` / `<mu-toolbar>` / `<mu-tabs>` + `<mu-tab-panel>` / `<mu-pagination>`

**按钮**：`<mu-button>` / `<mu-button-group>` / `<mu-tool-button>`（纯图标）/ `<mu-dropdown-button>`（带下拉）

**输入组件**：`<mu-input>` / `<mu-select>`（不可输入）/ `<mu-combo-box>`（可输入）/ `<mu-multi-select>` / `<mu-date-input>` / `<mu-check>` / `<mu-radio>` / `<mu-segmented>` / `<mu-switch>`

**表单**：`<mu-form>` 支持声明式（`<mu-form-row>` + `<mu-form-field>`）和数据驱动（`:model` + `:items`）

**模态/抽屉**：`<mu-dialog>` / `<mu-drawer>`

**下拉/菜单**：`<mu-dropdown>` / `<mu-dropdown-panel>` / `<mu-context-menu>`

**数据展示**：`<mu-table>` / `<mu-list-item>` / `<mu-tree>` / `<mu-tags>` / `<mu-calendar>`

**图标/徽章**：`<mu-icon>` / `<mu-sort-icon>` / `<mu-badge>`

**反馈**：`messageBox`（通过 `inject('$mussel')` 获取）/ `<mu-status-box>`

### 样式要点

- **颜色**：语义扩展色优先（`--mu-primary-color` 等），不用基本色；状态色用语义色；hover 用 `-translucent` 变体
- **文本**：`.text-strong` / `.text-normal` / `.text-subtle` / `.text-soft` / `.text-muted`
- **背景**：`--mu-bg-normal` / `--mu-bg-strong` / `--mu-bg-fill` / `--mu-bg-stripe` / `--mu-bg-disabled` / `--mu-bg-mask` / `--mu-bg-overlay`
- **间距**：`{n}x` 系列（1x=8px，2x=16px，3x=24px，4x=32px），行内元素间距用 `--mu-content-spacing`
- **z-index**：`float(1) < layer(10) < modal(100) < popup(1000) < ontop(10000)`
- **阴影**：`--mu-shadow-focus` / `--mu-shadow-float` / `--mu-shadow-popup` / `--mu-shadow-layer` / `--mu-shadow-modal`
- **布局**：全屏布局用 flex + `flex-1`，不用 `calc(100vh - Xpx)`；平级间距用 `gap`，不给每个子项加 margin

### 已废弃 API（禁止在新代码中使用）

| 废弃属性 | 替代方案 |
|---------|---------|
| `primary` / `danger` / `secondary` Boolean（按钮） | `color="primary"` / `color="danger"` / `color="secondary"` |
| `easy-hide`（模态/抽屉） | `dismissible` |
| `mask-action` | `dismissible` |
| `label`（输入） | `prefix` / `suffix` |
| `solid` / `underline`（输入） | `input-style` |
| `trigger-action`（下拉） | `dropdown-trigger` |
| `@tabClick` / `@tabChange` | `@button-click` / `@update:active-tab` |

### 参考文件

| 文件 | 内容 |
|------|------|
| `.claude/skills/mussel-ui/SKILL.md` | Skill 主文件：工作流程、组件速查表 |
| `.claude/skills/mussel-ui/references/principles.md` | 代码规范与强制约束（含 Good/Bad 示例） |
| `.claude/skills/mussel-ui/references/styles.md` | CSS 变量（Tokens）、原子类、常用布局模式 |
| `.claude/skills/mussel-ui/references/components.md` | 布局/图标/按钮/导航/下拉/数据展示/反馈 组件 API |
| `.claude/skills/mussel-ui/references/dialog.md` | MuDialog / MuDrawer 完整 API |
| `.claude/skills/mussel-ui/references/form.md` | MuForm / MuFormField / 输入组件完整 API |
| `.claude/skills/mussel-ui/references/table.md` | MuTable 完整 API（列配置、列类型） |
| `.claude/skills/mussel-ui/references/mussel3-to-mussel4.md` | Mussel 3 → 4 升级指南（迁移规则、升级流程） |

## Commit Convention

使用 emoji 前缀（cz-customizable 配置）：

| Emoji | 类型 | 说明 |
|-------|------|------|
| ✨ | feat | 新功能 |
| 🐛 | fix | Bug 修复 |
| 🔨 | refactor | 代码重构 |
| 💄 | style | 样式/UI |
| 📝 | docs | 文档/示例 |
| 🔧 | chore | 构建/配置 |

格式: `<emoji>: <描述>`，subject 限 80 字符，跳过 scope 和 body。

## Key Files Quick Reference

| 用途 | 文件 |
|------|------|
| 库入口 | `src/index.js` |
| 构建配置 | `vite.config.js` |
| 颜色系统 | `src/colors.js` |
| CSS 变量定义 | `src/styles/root.scss` |
| 组件注册 | `src/components/index.js` |
| 工具函数 | `src/utils/*.js` |
| 触摸手势 | `src/events/touch/` |
| 图标系统 | `src/icons/index.js` |
