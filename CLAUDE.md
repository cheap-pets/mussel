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
├── components/         # 组件目录（每个子目录一个组件族，见下方「组件清单」）
├── styles/             # 全局样式（见下方「样式文件」）
├── utils/              # 工具函数（color/dom/date/size/type/object/string/vue/style/h/timer/crypto/key-builder/compatible 等）
├── events/             # 事件系统（custom-event/interceptor/resize/touch 手势）
├── icons/              # 图标注册系统（内置 SVG + Tabler 集成）
└── langs/              # 国际化（zh / en）
```

### 关键文件速查

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

### 组件清单（src/components/）

两级：第一行为目录（仅目录名 + 入口文件，常为 `index.js`），后续缩进行为该目录下注册的组件。

| 目录名 | 组件名 | 说明 | 主文件 | 其他文件 |
|------|------|------|----------------|---------|
| `layout/` | | 弹性布局容器与分隔 | `index.js` | flex-box.vue |
| | MuHBox | 水平排列容器 | h-box.vue | |
| | MuVBox | 垂直排列容器 | v-box.vue | |
| | MuSplitHBox | 可拖拽/收拢的水平分隔布局 | split-h-box.vue | split-box.js/scss, splitter.vue/scss |
| | MuSplitVBox | 可拖拽/收拢的垂直分隔布局 | split-v-box.vue | split-box.js/scss, splitter.vue/scss |
| | MuGridBox | 网格布局容器 | grid-box.vue | |
| | MuGridCell | 网格单元 | grid-cell.vue | |
| | MuFlexDivider / MuFlexSpace / MuFlexBreak | 分隔线 / 弹性占位 / 换行（函数式组件） | index.js（h 函数） | flex-splitter.vue/scss（未注册） |
| `bar/` | | 条形容器与工具栏 | `index.js` | |
| | MuBar | 通用条形容器 | bar.vue | bar.scss |
| | MuToolbar | 工具栏 | toolbar.vue | toolbar.scss, toolbar.js |
| `button/` | | 按钮 | `index.js` | |
| | MuButton | 按钮 | button.vue | button.scss, button.js |
| | MuIconButton | 图标按钮（仅图标） | icon-button.vue | button.scss |
| | MuButtonGroup | 按钮组 | button-group.vue | button-group.scss |
| `form/` | | 表单与输入控件 | `index.js` | |
| | MuInput | 文本输入框 | input.vue | input.scss, input.js |
| | MuInputGroup | 输入框分组 | input-group.vue | input.scss |
| | MuSelect | 下拉选择（不可输入） | select.vue | select.scss, select.js |
| | MuMultiSelect | 多选下拉 | multi-select.vue | multi-select.scss, multi-select.js |
| | MuComboBox | 可输入下拉 | combo-box.vue | combo-wrapper.vue/scss |
| | MuOption | 选项 | option.vue | |
| | MuDateInput | 日期选择框 | date-input.vue | date-input.scss, ../calendar/\* |
| | MuSwitch | 开关 | switch.vue | switch.scss |
| | MuCheck | 复选 | check.vue | check.scss |
| | MuCheckGroup | 复选组 | check-group.vue | check-group.scss |
| | MuRadio | 单选 | radio.vue | |
| | MuRadioGroup | 单选组 | radio-group.vue | |
| | MuSegmented | 分段控件 | segmented.vue | segmented.scss |
| | MuForm | 表单容器（声明式 + 数据驱动） | form.vue | form.scss, validation.js, items.js, input-types.js |
| | MuFormRow | 表单行 | form-row.vue | |
| | MuFormField | 表单字段 | form-field.vue | form-field.scss |
| `dropdown/` | | 下拉与菜单 | `index.js` | dropdown-wrapper.js |
| | MuDropdownPanel | 下拉面板 | dropdown-panel.vue | dropdown-panel.scss |
| | MuDropdownItem | 下拉项 | dropdown-item.vue | dropdown-item.scss, dropdown-item.js |
| | MuDropdownCheckItem | 勾选下拉项 | dropdown-check-item.vue | |
| | MuDropdownRadioItem | 单选下拉项 | dropdown-radio-item.vue | |
| | MuDropdown | 下拉触发器 | dropdown.vue | |
| | MuDropdownButton | 带下拉的按钮 | dropdown-button.vue | |
| | MuContextMenu | 右键菜单 | context-menu.vue | |
| `tree/` | | 树 | `index.js` | default-options.js |
| | MuTree | 树容器 | tree.vue | tree.scss, tree.js |
| | MuTreeNode | 树节点 | tree-node.vue | |
| `tabs/` | | 页签 | `index.js` | |
| | MuTabs | 页签容器 | tabs.vue | tabs.scss |
| | MuTabBar | 页签按钮栏 | tab-bar/tab-bar.vue | tab-bar/ |
| | MuTabPanel | 页签面板 | tab-panel.vue | tab-panel.scss |
| `list/` | | 列表 | `index.js` | list.vue, list-items.js |
| | MuListItem | 列表项 | list-item.vue | list-item.scss |
| | MuListDivider | 列表分隔线 | list-divider.vue | list-divider.scss |
| `calendar/` | | 日历 | `index.js` | calendar-grid.scss |
| | MuCalendar | 月历 | calendar.vue | calendar.scss, calendar.js |
| | （内部子组件） | 日期表 / 月份 / 年份选择器 | date-table.vue | month-picker.vue/scss, year-picker.vue/scss |
| `table/` | | 表格 | —（无 index.js） | |
| | MuTable | 常规表格（多种列类型） | table.vue | table.scss, table-row.vue, column-types/, utils.js |
| `modal/` | | 模态 | `index.js` | modal.js, modal-mask.scss, button-presets.js |
| | MuDialog | 对话框 | dialog.vue | dialog.scss |
| | MuDrawer | 抽屉 | drawer.vue | drawer.scss |
| `message/` | | 反馈 | `index.js` | constant.js |
| | MuStatusBox | 状态提示框 | status-box.vue | status-box.scss |
| | messageBox / notifier | 消息框 / 通知（`$mussel` API） | message-box.js, notifier.js | message-box.vue/scss, notifier.vue/scss, message.vue/scss |
| `pagination/` | | 分页 | —（无 index.js） | |
| | MuPagination | 分页 | pagination.vue | |
| `icon/` | | 图标 | `index.js` | |
| | MuIcon | 图标 | icon.vue | icon.scss, icon.js |
| | MuSortIcon | 排序图标 | sort-icon.vue | |
| `svg/` | | SVG 装饰 | `index.js` | |
| | MuSvgStripe | 条纹背景 | svg-stripe.vue | |
| `tag/` | | 标签 | —（无 index.js） | |
| | MuTags | 标签组 | tags.vue | tags.scss |
| `badge/` | | 徽章 | —（无 index.js） | |
| | MuBadge | 徽章 | badge.vue | badge.scss |
| `scrollbar/` | | 滚动条 | —（无 index.js） | directive.js |
| | MuScrollBox + v-mu-scrollbar 指令 | 自定义滚动条容器 | scroll-box.vue | scroll-box.scss, scrollbar.js/scss, attach.js, update-positions.js, track-mouse-events.js |
| `common/` | | 共享工具（非组件） | — | popup.js, props.js |

### 基础样式文件（src/styles/）

| 文件 | 简介 |
|------|------|
| `index.js` | 样式入口（统一导出） |
| `root.scss` | CSS 变量定义（颜色、间距、字体、阴影、z-index） |
| `layout.scss` | Flex/Grid 原子类 |
| `spacing.scss` | 间距原子类 |
| `border.scss` | 边框原子类 |
| `typography.scss` | 排版原子类 |
| `background.scss` | 背景色原子类 |
| `box-shadow.scss` | 阴影原子类 |
| `pointer.scss` | 鼠标指针样式 |
| `animation.scss` | 动画 |
| `link.scss` | 链接样式 |
| `tag.scss` | 标签样式 |

## Architecture & Conventions

### 组件约定

- **注册**：`Mu` 前缀 + kebab-case 自动注册，源码 `MuButton` → `<mu-button>`；每个 `components/<name>/index.js` 导出，由 `components/index.js` 统一注册
- **写法**：Composition API + `<script setup>`（无 Options API），`defineOptions({ name: 'MusselXxx' })` 设组件名，Props 用 `validator` 校验
- **命名**：内部名前缀 `Mussel`，注册名前缀 `Mu`
- **文件结构**（典型）：
  ```
  button/
  ├── button.vue       # <script setup> 单文件组件
  ├── button.scss      # 样式就近放置，组件内 import './xxx.scss'
  └── index.js         # 导出
  ```

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
- z-index: `--mu-z-index-float(1) < layer(10) < modal(100) < popup(1000) < ontop(10000)`

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
| 1 | 硬编码颜色（`#xxx` / `rgb()` / `red` 等） | `--mu-*` 颜色变量（如 `--mu-primary-color` / `--mu-bg-*`） |
| 2 | 手写 z-index 数字 | `--mu-z-index-*` 变量 |
| 3 | 非基准倍数间距（`12px` / `6px` 等） | `-0` / `-half` / `-1x`~`-4x` 后缀（0/4/8/16/24/32px） |
| 4 | 能用原子类解决的布局却写 `style` 属性 | 对应原子类 |
| 5 | 自造 `--mu-*` 变量 | 规范中已定义的变量 |

### 工作流程

1. **识别任务类型**：Mussel 3 → 4 升级 → 流程读 `references/upgrade/process.md`、规则按需查 `references/upgrade/rules.md`；新建/修改 UI → 继续
2. **按需查阅 API 与样式**：组件 API 按 8 大类 1:1 路由到 `references/components/*.md`，不凭记忆猜测属性名；样式 Token 读 `references/styles.md`，安装初始化读 `references/install.md`
3. **生成并自检**：对照 `references/principles.md` 的硬性禁止清单逐条检查

### 样式要点

- **颜色**：语义扩展色优先（`--mu-primary-color` 等），不用基本色；状态色用语义色；hover 用 `-translucent` 变体
- **文本**：`.mu-text-strong` / `.mu-text-normal` / `.mu-text-subtle` / `.mu-text-soft` / `.mu-text-muted`
- **背景**：`--mu-bg-normal` / `--mu-bg-strong` / `--mu-bg-fill` / `--mu-bg-stripe` / `--mu-bg-disabled` / `--mu-bg-mask` / `--mu-bg-overlay`
- **间距**：`-0` / `-half` / `-1x`~`-4x` 后缀（0/4/8/16/24/32px），行内元素间距用 `--mu-inline-spacing`
- **阴影**：`--mu-shadow-focus` / `--mu-shadow-float` / `--mu-shadow-popup` / `--mu-shadow-layer` / `--mu-shadow-modal`
- **布局**：全屏布局用 flex + `flex-1`，不用 `calc(100vh - Xpx)`；平级间距用 `gap`，不给每个子项加 margin

### 参考文档

> Skill 已从 `.claude/skills/` 迁移到项目根目录的 `skills/`，并按分类重组。下方路径均相对于 `skills/mussel-ui/`。

> ⚠️ **文档同步**：`skills/mussel-ui/references/` 与 `docs/quick-reference_*.md` 互为同步副本（前者供 agent 使用，后者面向最终用户）。修改其中任一处时，**必须同步修改另一处**，避免内容漂移。

**主入口**

| 文件 | 内容 |
|------|------|
| `SKILL.md` | Skill 主文件：工作流程、安装 options 速查、组件速查表（8 大类选型） |

**`references/` 参考**

| 文件 | 内容 |
|------|------|
| `references/principles.md` | 代码规范与强制约束（含 Good/Bad 示例、自检清单） |
| `references/styles.md` | CSS 变量（Tokens）、原子类、常用布局模式 |
| `references/install.md` | `install(app, options)`、options 全字段、`$mussel` 上下文、`installIcons` |

**`references/components/` 组件 API（按 8 大类 1:1 路由）**

| 文件 | 内容 |
|------|------|
| `references/components/layout.md` | 布局（FlexBox/HBox/VBox/Grid、Split、ScrollBox、Toolbar） |
| `references/components/containers-panels.md` | 容器与面板（Tabs、Dialog、Drawer） |
| `references/components/buttons.md` | 按钮与操作（Button/ButtonGroup/ToolButton/DropdownButton） |
| `references/components/form.md` | 表单与输入（Form/FormField/Input/Select/ComboBox/DateInput/Check/Radio/Segmented/Switch） |
| `references/components/navigation.md` | 导航与菜单（DropdownPanel/Dropdown/ContextMenu） |
| `references/components/data-display.md` | 数据展示（List/Tree/Tags/Calendar/Table） |
| `references/components/feedback.md` | 反馈（MessageBox/Notifier/StatusBox） |
| `references/components/basic-elements.md` | 基础元素（Icon/SortIcon/Badge） |

**`references/upgrade/` 升级（M3 → 4）**

| 文件 | 内容 |
|------|------|
| `references/upgrade/process.md` | 升级流程（分析→计划→执行） |
| `references/upgrade/rules.md` | 迁移规则（全局配置/CSS 变量/布局/图标/组件迁移/新增组件） |

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
