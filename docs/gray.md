# Mussel 4 灰色使用总览

> 统计范围：`src/styles/` + `src/components/` 下所有 `.scss` / `.vue` / `.js` 文件
> 生成时间：2026-03-29

---

## 一、灰色色板定义

灰色系统由 neutral 色板生成，通过 CSS 变量暴露。

### 1.1 色板生成（JS 层）

| 文件 | 行 | 说明 |
|------|-----|------|
| `src/utils/color.js` | 283-307 | `generateNeutralPalette()` 基于主色生成灰度色板，参数 `{ count, densityFactor, saturationRatio, hueShift }` |
| `src/colors.js` | 4-23 | `PURPOSE_CONFIG` 定义 text/border/bg 三组用途的色板参数 |
| `src/colors.js` | 70-87 | 调用 `generateNeutralPalette` 生成 neutral（10 级）及 textGray/borderGray/bgGray（各 5 级） |
| `src/colors.js` | 99-112 | 将颜色映射为 CSS 变量，`neutral` 重命名为 `gray` |

### 1.2 CSS 变量映射（SCSS 层）

#### 亮色模式 — `src/styles/root.scss`

| 行 | 变量 | 值 | 用途 |
|-----|------|-----|------|
| 17 | `--mu-gray` | `neutral5` | 基础灰 |
| 20 | `--mu-gray-0` ~ `--mu-gray-9` | `neutral0` ~ `neutral9` | 10 级灰度阶梯 |
| 25 | `--mu-text-color-normal` | `--mu-gray-7` | 正常文本 |
| 26 | `--mu-text-color-strong` | `--mu-gray-8` | 清晰文本（输入框文字） |
| 27 | `--mu-text-color-soft` | `--mu-gray-4` | 柔和文本（标签、禁用） |
| 28 | `--mu-text-color-muted` | `--mu-gray-3` | 弱化文本 |
| 29 | `--mu-text-color-weak` | `--mu-gray-2` | 最弱文本（placeholder） |
| 39 | `--mu-translucent-gray` | `--mu-gray` 10% 透明度 | 半透明灰叠加层 |
| 45 | `--mu-border-color` | `--mu-gray-2` | 默认边框 |
| 46 | `--mu-border-color-soft` | `--mu-gray-1` | 弱化边框 |
| 32 | `--mu-bg-normal` | `#fff` | 正常背景（白色） |
| 32 | `--mu-bg-strong` | `rgba(0,0,0,.05)` | 加深背景（灰 tint） |
| 34 | `--mu-bg-disabled` | `rgba(0,0,0,.1)` | 禁用背景（灰 tint） |
| 37 | `--mu-bg-overlay` | `--mu-bg-normal` | 浮层背景 |

#### 暗色模式 — `src/styles/root.scss` + `src/styles/dark.scss`

| 变量 | 亮色值 | 暗色值 | 说明 |
|------|--------|--------|------|
| `--mu-gray` | neutral5 | neutral4 | 基础灰反转 |
| `--mu-text-color-normal` | gray-7 | gray-2 | |
| `--mu-text-color-strong` | gray-8 | gray-1 | |
| `--mu-text-color-soft` | gray-4 | gray-4 | |
| `--mu-text-color-muted` | gray-3 | gray-5 | |
| `--mu-text-color-weak` | gray-2 | gray-6 | |
| `--mu-translucent-gray` | 10% | 20% | 暗色模式加大透明度 |
| `--mu-border-color` | gray-2 | gray-5 | |
| `--mu-border-color-soft` | gray-1 | gray-6 | |
| `--mu-bg-normal` | `#fff` | gray-9 | |
| `--mu-bg-strong` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.1)` | |
| `--mu-bg-disabled` | `rgba(0,0,0,.1)` | `rgba(255,255,255,.15)` | |
| `--mu-bg-overlay` | `#fff` | gray-7 | |

---

## 二、组件灰色使用明细表

### 2.1 Badge — `src/components/badge/badge.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 5 | `--mu-badge_color` | `color` | 默认 | `#fff`（白色） |
| 6 | `--mu-gray` | `background-color`（via `--mu-badge_bg`） | 默认 | neutral5 |

### 2.2 Button — `src/components/button/button.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 57 | `--mu-border-color` | `color`（via `--mu-button_color`） | 默认 | gray-2 |
| 60 | `--mu-text-color-normal` | `color` | 默认文字 | gray-7 |
| 61 | `--mu-bg-normal` | `background` | 默认 | `#fff` |
| 68 | `--mu-button_color` | `background-color`（rgb from 10%） | active | 继承 border-color |
| 79 | `--mu-button_color` | `box-shadow`（rgb from 15%） | focus | 继承 border-color |
| 114 | `--mu-button_color` | `border-color` | 默认 | gray-2 |
| 115 | `#fff` | `color` | primary | 白色 |
| 130 | `--mu-border-color-soft` | `border-color` | disabled | gray-1 |
| 131 | `--mu-text-color-muted` | `color` | disabled | gray-3 |
| 132 | `--mu-bg-disabled` | `background` | disabled | `rgba(0,0,0,.1)` |
| 148 | `transparent` | `border-color` | text variant | — |
| 153 | `--mu-translucent-gray` | `background` | text hover | gray 10% |
| 159 | `--mu-button_color` | `background-color`（rgb from 10%） | text active | 继承 |

### 2.3 Tool Button — `src/components/button/tool-button.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 48 | `--mu-text-color-soft` | `color` | 默认 | gray-4 |
| 60 | `--mu-translucent-gray` | `background-color` | hover | gray 10% |
| 65 | `--mu-button_color` | `background-color`（rgb from 10%） | active | 继承 |
| 69 | `--mu-text-color-muted` | `color`（via `--mu-button_color`） | disabled | gray-3 |

### 2.4 Button Group — `src/components/button/button-group.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 11 | `--mu-bg-normal` | `--mu-button-group_divider-color` | 默认 | `#fff` |
| 38 | `--mu-button_color` | `border-color` | 默认 | gray-2 |
| 42 | `--mu-button_color` | `border-color` | hover | 继承 |
| 46 | `--mu-border-color-soft` | `border-color` | disabled | gray-1 |

### 2.5 Input — `src/components/input/input.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 3 | `--mu-bg-normal` | `--mu-input_bg` | 默认 | `#fff` |
| 4 | `--mu-border-color` | `--mu-input_border-color` | 默认 | gray-2 |
| 6 | `--mu-input_border-color` | `box-shadow`（rgb from 15%） | focus | 继承 border-color |
| 48 | `--mu-text-color-strong` | `color` | 输入框文字 | gray-8 |
| 56 | `--mu-text-color-weak` | `color` | placeholder | gray-2 |
| 74 | `--mu-text-color-soft` | `color` | 前缀/后缀文字 | gray-4 |
| 86 | `--mu-text-color-normal` | `color` | 后缀链接 hover | gray-7 |
| 120 | `--mu-text-color-normal` | `color` | input-group 文字 | gray-7 |
| 130 | `--mu-border-color` | `border` | input-group 子项 | gray-2 |
| 151 | `--mu-bg-strong` | `background` | input-group addon | `rgba(0,0,0,.05)` |
| 171 | `--mu-input_border-color` | `border` | 默认 | gray-2 |
| 172 | `--mu-text-color-normal` | `color` | 默认文字 | gray-7 |
| 176 | `--mu-border-color-soft` | `--mu-input_border-color` | readonly | gray-1 |
| 188 | `--mu-border-color-soft` | `--mu-input_border-color` | disabled | gray-1 |
| 191 | `--mu-bg-disabled` | `background-color` | disabled | `rgba(0,0,0,.1)` |
| 200 | `--mu-text-color-soft` | `color` | disabled 文字 | gray-4 |
| 205 | `--mu-bg-strong` | `--mu-input_bg` | solid style | `rgba(0,0,0,.05)` |
| 218 | `--mu-border-color` | `--mu-input_border-color` | input-group 内 input | gray-2 |

### 2.6 Input Group — 同 `src/components/input/input.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 120 | `--mu-text-color-normal` | `color` | 默认 | gray-7 |
| 130 | `--mu-border-color` | `border` | 子项边框 | gray-2 |
| 151 | `--mu-bg-strong` | `background` | addon 背景 | `rgba(0,0,0,.05)` |

### 2.7 Switch — `src/components/input/switch.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 26 | `--mu-gray-5` | `background-color` | 关闭态（默认） | neutral5 |
| 42 | `#fff` | `background-color` | 开关球 | 白色 |
| 48 | `#fff` | `color` | 开关文字 | 白色 |
| 56 | `--mu-gray-4` | `background-color` | 关闭态 hover | neutral4 |

### 2.8 Check / Radio — `src/components/input/check.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 17 | `--mu-text-color-normal` | `color` | 标签文字 | gray-7 |
| 26 | `--mu-border-color` | `border` | 默认边框 | gray-2 |
| 29 | `--mu-bg-normal` | `background-color` | 默认背景 | `#fff` |
| 46 | `--mu-text-color-soft` | `color` | disabled 文字 | gray-4 |
| 50 | `--mu-border-color-soft` | `border-color` | disabled 边框 | gray-1 |
| 51 | `--mu-bg-disabled` | `background-color` | disabled 背景 | `rgba(0,0,0,.1)` |
| 55 | `--mu-text-color-weak` | `background-color` | disabled + checked | gray-2 |

### 2.9 Calendar — `src/components/calendar/calendar.scss` + `calendar-grid.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| cal:6 | `--mu-text-color-normal` | `color` | 日历标题文字 | gray-7 |
| cal:8 | `--mu-bg-normal` | `background-color` | 日历背景 | `#fff` |
| cal:12 | `--mu-text-color-strong` | `color` | 月份文字 | gray-8 |
| grid:17 | `--mu-text-color-soft` | `color` | 日期文字 | gray-4 |
| grid:22 | `--mu-border-color-soft` | `border` | 日期边框 | gray-1 |
| grid:23 | `--mu-text-color-normal` | `color` | 日期文字 | gray-7 |
| grid:27 | `--mu-translucent-gray` | `background-color` | 日期 hover | gray 10% |
| grid:32 | `--mu-text-color-muted` | `color` | 非当月日期 | gray-3 |

### 2.10 Dropdown — `src/components/dropdown/dropdown-panel.scss` + `dropdown-item.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| panel:8 | `--mu-border-color-soft` | `border` | 面板边框 | gray-1 |
| panel:14 | `--mu-bg-overlay` | `background` | 面板背景 | `#fff`（亮色）/ gray-7（暗色） |
| item:6 | `--mu-translucent-gray` | `background` | 项 hover | gray 10% |

### 2.11 Tree — `src/components/tree/tree.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 24 | `--mu-text-color-normal` | `color` | 节点文字 | gray-7 |
| 61 | `--mu-translucent-gray` | `background` | 节点 hover | gray 10% |
| 70 | `--mu-primary-color` | `background`（rgb from 10%） | 选中节点 | 主色 10%（非灰色） |
| 76 | `--mu-text-color-muted` | `color` | disabled 文字 | gray-3 |

### 2.12 Table — `src/components/table/table.scss` + `column-types/style.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| table:6 | `--mu-border-color-soft` | `--head-border-bottom` | 表头底线 | gray-1 |
| table:14 | `--mu-border-color` | `border` | 表格边框 | gray-2 |
| table:15 | `--mu-text-color-normal` | `color` | 表头文字 | gray-7 |
| table:21 | `--mu-border-color-soft` | `box-shadow` | 选中行描边 | gray-1 |
| table:86 | `--mu-bg-normal` | `background-color` | 表格背景 | `#fff` |
| table:111 | `--mu-border-color-strong` | `border-right` | 列分隔线 | **未定义** |
| table:126 | `--mu-border-color-soft` | `box-shadow` | 合并行描边 | gray-1 |
| table:132 | `--mu-border-color-soft` | `--gridline-row` | 行网格线 | gray-1 |
| table:137 | `--mu-border-color-soft` | `--gridline-col` | 列网格线 | gray-1 |
| table:185 | `--mu-border-color` | `border` | 列宽拖拽参考线 | gray-2 |
| col:9 | `--mu-border-color` | `border` | 树形列边框 | gray-2 |
| col:18 | `--mu-bg-normal` | `background-color` | 列背景 | `#fff` |
| col:21 | `--mu-text-color-weak` | `color` | 列次要文字 | gray-2 |
| col:25 | `--mu-border-color-strong` | `border-color` | 列分隔线 | **未定义** |
| col:26 | `--mu-text-color-normal` | `color` | 列文字 | gray-7 |
| col:31 | `--mu-border-color` | `border-color` | 列 hover 边框 | gray-2 |
| col:32 | `--mu-bg-strong` | `background-color` | 列 hover 背景 | `rgba(0,0,0,.05)` |

### 2.13 List — `src/components/list/list-item.scss` + `list-divider.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| item:35 | `--mu-text-color-normal` | `color` | 文字 | gray-7 |
| item:41 | `--mu-translucent-gray` | `background` | hover | gray 10% |
| item:46 | `#fff` | `color` | active 文字 | 白色 |
| item:52 | `--mu-text-color-muted` | `color` | muted 文字 | gray-3 |
| divider:4 | `--mu-border-color-soft` | `border-top` | 分割线 | gray-1 |
| divider:5 | `--mu-text-color-muted` | `color` | 分割线文字 | gray-3 |

### 2.14 Tabs — `src/components/tabs/tabs.scss` + `tab-panel.scss` + `tab-bar/tab-button.scss` + `tab-bar/tab-bar.scss` + `tab-bar/tab-style-simple.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| tabs:6 | `--mu-bg-normal` | `background` | tabs 背景 | `#fff` |
| panel:3 | `--mu-bg-normal` | `background` | 面板背景 | `#fff` |
| bar:3 | `--mu-bg-strong` | `background` | tab bar 背景 | `rgba(0,0,0,.05)` |
| btn:20 | `--mu-text-color-normal` | `color` | 按钮文字 | gray-7 |
| btn:30 | `--mu-translucent-gray` | `background` | 按钮 hover | gray 10% |
| btn:34 | `#fff` | `color` | active 文字 | 白色 |
| btn:41 | `--mu-text-color-muted` | `color` | disabled 文字 | gray-3 |
| simple:4 | `--mu-border-color-soft` | `border-color` | 简单样式边框 | gray-1 |
| simple:8 | `--mu-bg-normal` | `background` | 简单样式背景 | `#fff` |

### 2.15 Modal — `src/components/modal/dialog.scss` + `drawer.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| dialog:24 | `--mu-text-color-normal` | `color` | 标题文字 | gray-7 |
| dialog:26 | `--mu-bg-overlay` | `background` | 对话框背景 | `#fff`（亮色）/ gray-7（暗色） |
| dialog:63 | `--mu-text-color-normal` | `color` | 内容文字 | gray-7 |
| drawer:22 | `--mu-text-color-normal` | `color` | 抽屉文字 | gray-7 |
| drawer:24 | `--mu-bg-overlay` | `background` | 抽屉背景 | `#fff`（亮色）/ gray-7（暗色） |

### 2.16 Form — `src/components/form/form-field.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 22 | `--mu-text-color-soft` | `color` | 标签文字 | gray-4 |

### 2.17 Message — `src/components/message/status-box.scss` + `notifier.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| status:5 | `--mu-text-color-normal` | `color` | 文字 | gray-7 |
| status:18 | `--mu-text-color-muted` | `color` | secondary 文字 | gray-3 |
| notifier:20 | `--mu-border-color-soft` | `border` | 通知边框 | gray-1 |
| notifier:23 | `--mu-bg-overlay` | `background` | 通知背景 | `#fff`（亮色）/ gray-7（暗色） |

### 2.18 Tags — `src/components/tag/tags.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 26 | `--mu-text-color-weak` | `color` | 标签文字 | gray-2 |
| 84 | `--mu-text-color-muted` | `color` | secondary 文字 | gray-3 |
| 87 | `--mu-text-color-normal` | `color` | active 文字 | gray-7 |

### 2.19 Layout — `src/components/layout/box/style/border.scss` + `flex-splitter.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| border:9 | `--mu-border-color` | `border` | 边框基础 | gray-2 |
| border:45 | `--mu-border-color-soft` | `border-color` | muted 边框 | gray-1 |
| border:85 | `--mu-border-color-soft` | `border-left-color` | left variant | gray-1 |
| border:125 | `--mu-border-color-soft` | `border-right-color` | right variant | gray-1 |
| border:165 | `--mu-border-color-soft` | `border-top-color` | top variant | gray-1 |
| border:205 | `--mu-border-color-soft` | `border-bottom-color` | bottom variant | gray-1 |
| splitter:27 | `--mu-border-color-soft` | `background` | 水平分割线 | gray-1 |
| splitter:63 | `--mu-border-color-soft` | `background` | 垂直分割线 | gray-1 |

### 2.20 Toolbar — `src/components/bar/toolbar.scss`

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 3 | `--mu-bg-strong` | `background-color` | 工具栏背景 | `rgba(0,0,0,.05)` |

### 2.21 Link — `src/styles/link.scss`（全局样式，非组件专属）

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 3 | `--mu-text-color-normal` | `--mu-link_color` | 默认链接色 | gray-7 |
| 31 | `--mu-text-color-muted` | `color` | disabled 链接 | gray-3 |

### 2.22 Typography — `src/styles/typography.scss`（全局样式）

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 2 | `--mu-text-color-normal` | `color` | `.mu-text-color-normal` | gray-7 |
| 6 | `--mu-text-color-body` | `color` | `.mu-text-color-clear` | — |
| 10 | `--mu-text-color-muted` | `color` | `.mu-text-color-muted` | gray-3 |
| 14 | `--mu-text-color-weak` | `color` | `.mu-text-color-weak` | gray-2 |
| 29 | `--mu-text-color-soft` | `color` | `.mu-label` | gray-4 |

### 2.23 Background — `src/styles/background.scss`（全局样式）

| 行 | 变量 | CSS 属性 | 状态 | 实际灰色映射（亮色） |
|-----|------|----------|------|---------------------|
| 2 | `--mu-bg-normal` | `background-color` | `.mu-bg-normal` | `#fff` |
| 6 | `--mu-bg-strong` | `background-color` | `.mu-bg-strong` | `rgba(0,0,0,.05)` |

---

## 三、硬编码颜色

| 文件 | 行 | 值 | 用途 | 是否灰色 |
|------|-----|-----|------|----------|
| `switch.scss` | 42 | `#fff` | 开关球背景 | 白色 |
| `switch.scss` | 48 | `#fff` | 开关文字 | 白色 |
| `badge.scss` | 5 | `#fff` | badge 文字 | 白色 |
| `button.scss` | 115 | `#fff` | primary 按钮文字 | 白色 |
| `tab-button.scss` | 34 | `#fff` | active tab 文字 | 白色 |
| `list-item.scss` | 46 | `#fff` | active list 文字 | 白色 |
| `flex-splitter.scss` | 101 | `#fff` | 分割线 active 文字 | 白色 |
| `flex-splitter.scss` | 160 | `#FFF` | 分割线 active 背景 | 白色 |
| `root.scss` | 31 | `#fff` | `--mu-bg-normal` | 白色 |
| `root.scss` | 32 | `rgba(0,0,0,.05)` | `--mu-bg-strong` | 灰色 tint |
| `root.scss` | 34 | `rgba(0,0,0,.1)` | `--mu-bg-disabled` | 灰色 tint |

> 所有 `#fff` 均为白色（非灰色），所有灰色 tint 均通过 `rgba(0,0,0,...)` 或 `rgba(255,255,255,...)` 实现，未使用灰色 hex 值。

---

## 四、色值合理性分析

### 4.1 默认主色 `#1c7ed6` (蓝) 下的实际灰色色值

| 变量 | 生成算法 | 实际色值 | 视觉印象 |
|------|----------|----------|----------|
| `--mu-gray-0` | neutral0 | `#f7f7f7` | 近白（亮度 96.5%，饱和度 0%） |
| `--mu-gray-1` | neutral1 | `#eaeef2` | 极浅蓝灰 |
| `--mu-gray-2` | neutral2 | `#dce4ea` | 浅蓝灰 |
| `--mu-gray-3` | neutral3 | `#c7d2db` | 中浅蓝灰 |
| `--mu-gray-4` | neutral4 | `#afbbc6` | 中蓝灰 |
| `--mu-gray-5` | neutral5 (**基础灰**) | `#93a1ad` | 中蓝灰 |
| `--mu-gray-6` | neutral6 | `#74818c` | 中深蓝灰 |
| `--mu-gray-7` | neutral7 | `#515c66` | 深蓝灰 |
| `--mu-gray-8` | neutral8 | `#2d343a` | 近黑蓝灰 |
| `--mu-gray-9` | neutral9 | `#07080a` | 近纯黑（亮度 3.5%） |

> 注意：由于基底色是蓝色 (h=208)，所有灰度都带蓝调（冷灰色系）。

### 4.2 语义变量 → 色值映射（亮色模式）

| 语义变量 | 指向 | 色值 | 用途 |
|----------|------|------|------|
| `--mu-text-color-normal` | gray-7 | `#515c66` | 正常正文、标题 |
| `--mu-text-color-strong` | gray-8 | `#2d343a` | 输入框输入文字 |
| `--mu-text-color-soft` | gray-4 | `#afbbc6` | 标签、禁用文字 |
| `--mu-text-color-muted` | gray-3 | `#c7d2db` | 次要信息、非当月日期 |
| `--mu-text-color-weak` | gray-2 | `#dce4ea` | placeholder |
| `--mu-border-color` | gray-2 | `#dce4ea` | 默认边框 |
| `--mu-border-color-soft` | gray-1 | `#eaeef2` | 弱化边框 |
| `--mu-translucent-gray` | gray-5 @ 10% | `#93a1ad` 10% | hover 背景 |
| `--mu-bg-strong` | `rgba(0,0,0,.05)` | — | 加深背景 |
| `--mu-bg-disabled` | `rgba(0,0,0,.1)` | — | 禁用背景 |

### 4.3 逐项合理性评估

#### 文本色

| 语义 | 色值 | 评估 | 说明 |
|------|------|------|------|
| **text-normal** (`#515c66`) | gray-7 | ✅ 合理 | 深灰色作正文，对比度约 7:1（在白底上），满足 WCAG AA |
| **text-clear** (`#2d343a`) | gray-8 | ✅ 合理 | 深色用于输入框文字，与 placeholder (gray-2 `#dce4ea`) 形成强烈对比，引导用户注意 |
| **text-soft** (`#afbbc6`) | gray-4 | ⚠️ 偏浅 | 用于标签（form-field:22）和禁用文字。在白底上对比度约 2.5:1，**不满足 WCAG AA 的 4.5:1 要求**，仅适合大号文字或装饰性标签 |
| **text-muted** (`#c7d2db`) | gray-3 | ⚠️ 偏浅 | 用于次要文本（status-box secondary、list divider、disabled link）。白底对比度约 1.8:1，**不满足任何 WCAG 等级**，仅适合非关键信息 |
| **text-weak** (`#dce4ea`) | gray-2 | ✅ 合理 | placeholder 设计上就是低对比度，符合行业惯例 |

> **总结**：`text-soft` 和 `text-muted` 在亮色模式下对比度偏低。如果用于承载关键可读信息（如表单标签），可能影响可访问性。但这属于设计取舍——浅灰在视觉上更"柔和"，适合现代 UI 风格。

#### 边框色

| 语义 | 色值 | 评估 | 说明 |
|------|------|------|------|
| **border-color** (`#dce4ea`) | gray-2 | ✅ 合理 | 与 text-weak 同色值，边框和 placeholder 视觉统一，不会喧宾夺主 |
| **border-color-muted** (`#eaeef2`) | gray-1 | ✅ 合理 | 更浅的边框用于分割线等场景，视觉上更弱，层次分明 |

#### 背景色

| 语义 | 色值 | 评估 | 说明 |
|------|------|------|------|
| **bg-normal** (`#fff`) | 纯白 | ✅ 合理 | 标准亮色背景 |
| **bg-strong** (`rgba(0,0,0,.05)`) | 纯黑 5% | ⚠️ 与灰色色板脱节 | 使用纯黑色而非 gray-N，在任何底色上都是中性灰。与蓝色调灰色色板可能产生**色温不一致** |
| **bg-disabled** (`rgba(0,0,0,.1)`) | 纯黑 10% | ⚠️ 同上 | 同 bg-strong 的问题 |

> **bg-strong / bg-disabled 的色温问题**：灰色色板是冷蓝调（`#93a1ad`），但 bg-strong/bg-disabled 用纯黑 rgba，在白底上呈现中性暖灰。当它们出现在同页面时（如 tab bar 背景 `bg-strong` + 输入框边框 `gray-2`），可能有微妙的色温割裂感。实际影响取决于用户敏感度，多数情况下不明显。

#### Switch 直接使用 gray-5

| 使用 | 色值 | 评估 |
|------|------|------|
| 关闭态背景 `gray-5` (`#93a1ad`) | 中蓝灰 | ✅ 合理，关闭态用中等灰是标准做法 |
| hover `gray-4` (`#afbbc6`) | 中浅蓝灰 | ✅ 合理，hover 比默认略浅，暗示可交互 |

> Switch 是唯一直接使用 gray-N 而非语义变量的组件。这合理，因为 Switch 需要精确控制轨道颜色，语义变量不适合。

#### translucent-gray

| 使用 | 色值 | 评估 |
|------|------|------|
| hover 背景 (gray-5 @ 10%) | `rgba(147,161,173,0.1)` | ✅ 合理，微妙的蓝色调灰底，与主色协调 |

#### 暗色模式映射

| 语义 | 亮色 | 暗色 | 评估 |
|------|------|------|------|
| text-normal | gray-7 `#515c66` | gray-2 `#dce4ea` | ✅ 合理，深浅反转 |
| text-clear | gray-8 `#2d343a` | gray-1 `#eaeef2` | ✅ 合理 |
| text-soft | gray-4 `#afbbc6` | gray-4 `#afbbc6` | ✅ 巧妙，soft 在两种模式下保持一致的中等灰 |
| text-muted | gray-3 `#c7d2db` | gray-5 `#93a1ad` | ✅ 合理 |
| text-weak | gray-2 `#dce4ea` | gray-6 `#74818c` | ✅ 合理 |
| border-color | gray-2 | gray-5 | ✅ 暗色模式下边框用较深灰，在深色背景上可见 |
| border-color-muted | gray-1 | gray-6 | ✅ 合理 |
| bg-normal | `#fff` | gray-9 `#07080a` | ✅ 近纯黑，标准暗色背景 |
| bg-overlay | `#fff` | gray-7 `#515c66` | ✅ 暗色浮层用深灰而非纯黑，形成层次感 |
| translucent-gray | 10% | 20% | ✅ 暗色模式下透明度翻倍，保证可见度 |

> 暗色模式映射设计良好，text-soft 保持不变尤其巧妙。

### 4.4 综合结论

| 维度 | 评价 |
|------|------|
| **色板生成** | ✅ 优秀。基于主色生成、非线性分布、饱和度压缩，灰色与主色协调统一 |
| **语义分层** | ✅ 优秀。5 级文本色 + 2 级边框色 + 3 级背景色，层次清晰 |
| **亮色模式文本对比度** | ⚠️ `text-soft` / `text-muted` 对比度偏低（< 3:1），影响可访问性 |
| **色温一致性** | ⚠️ `bg-strong` / `bg-disabled` 用纯黑 rgba，与蓝色调灰色色板色温略有偏差 |
| **暗色模式** | ✅ 优秀。深浅反转合理，text-soft 不变的设计很巧妙 |
| **Switch 直接引用** | ✅ 合理。唯一精确控制灰度的地方，语义变量不适合 |
| **变量使用规范** | ✅ 除 Switch 外，所有组件均通过语义变量引用灰色，无硬编码 |

---

## 五、问题发现

| 严重性 | 文件 | 行 | 问题 |
|--------|------|-----|------|
| **BUG** | `src/components/table/table.scss` | 111 | `--mu-border-color-strong` **未被定义**，在 `root.scss` / `dark.scss` 中均无声明 |
| **BUG** | `src/components/table/column-types/style.scss` | 25 | 同上，引用了未定义的 `--mu-border-color-strong` |
| **设计** | `src/styles/root.scss` | 32, 34 | `--mu-bg-strong` / `--mu-bg-disabled` 使用纯黑 rgba，与蓝色调灰色色板存在色温偏差 |
| **可访问性** | `src/styles/root.scss` | 27, 28 | `--mu-text-color-soft` / `--mu-text-color-muted` 在白底上对比度不足 WCAG AA |
