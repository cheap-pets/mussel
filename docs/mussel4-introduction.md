# Mussel 4 介绍

> 相对 Mussel 3 的主要变化与改进概览。细节请查阅 `skills/mussel-ui/references/`。



## 一、原子样式系统（新增）

Mussel 4 引入完整的**原子类（utility classes）系统**，覆盖布局、间距、边框、文本、背景、定位、溢出等场景：

| 类别 | 代表原子类 |
|------|-----------|
| 布局 | `flex` / `flex-col` / `flex-1` / `items-center` / `justify-between` / `gap-{n}x` |
| 定位 | `relative` / `absolute` / `fixed` / `sticky` / `z-modal` |
| 间距 | `p-{n}x` / `m-{n}x` / `px-{n}x` / `mx-{n}x` |
| 边框 | `border` / `border-r` / `border-primary` / `border-dashed` |
| 文本 | `text-strong` / `text-muted` / `text-primary` / `text-ellipsis` |
| 背景 | `bg-normal` / `bg-strong` / `bg-mask` |
| 溢出 | `overflow-auto` / `overflow-hidden` |

**好处**：
- 告别 V3 通过 HTML 属性选择器（`padding="2x"`、`flex="1"`、`border-right`）做布局的「魔法」写法，回归标准 CSS 心智模型，可读性与可维护性显著提升。
- 与 Tailwind/UnoCSS 等主流方案心智一致，团队上手成本低。
- 不再依赖特定组件根类（`.mu-box`）才能生效，原子类可在任意元素上组合使用。

---



## 二、新增组件

| 组件 | 用途 |
|------|------|
| `<mu-input>` | 替代 V3 `<mu-editor>`，API 更规范（`clearable`、`input-style`、`prefix`/`suffix` 属性） |
| `<mu-select>` / `<mu-multi-select>` | 从 V3 `<mu-combo-box :multiple>` 拆分出专用单选/多选组件，职责清晰 |
| `<mu-date-input>` | 日期/月份选择器 |
| `<mu-time-input>` |  时间选择器 |
| `<mu-color-input>` | 颜色选择器（HEX 输入 + 内置 130 色色板） |
| `<mu-table>` | 数据表格，内置丰富列类型（text/enum/link/tag/check/date 等） |
| `<mu-tree>` | 统一的树组件（数据驱动），替代 V3 的 tree-view/tree-nodes 三件套 |
| `<mu-tags>` | 标签组，支持 removable、max 截断 |
| `<mu-calendar>` | 内嵌月历 |
| `<mu-drawer>` | 抽屉面板（上/右/下/左） |
| `<mu-context-menu>` | 右键上下文菜单 |
| `<mu-split-h-box>` / `<mu-split-v-box>` | 可拖拽、可收拢的弹性分隔布局 |
| `<mu-segmented>` | 分段控件 |
| `<mu-pagination>` | 分页 |
| `<mu-status-box>` | 状态占位（空数据/加载失败/无权限） |
| `<mu-toolbar>` / `<mu-bar>` | 工具栏与通用条形容器 |
| `<mu-icon-button>` | 仅图标的快捷操作按钮 |
| `<mu-scroll-box>` + `v-mu-scrollbar` | 自定义滚动条容器与指令 |
| `<mu-check-group>` / `<mu-radio-group>` | 数据驱动的复选/单选组（`options` + `v-model`） |

---



## 三、组件功能增强

- **MuForm 数据驱动**：除声明式 `form-row`/`form-field` 外，新增 `:model` + `:items` 数组写法，简单表单可配置化生成；items 支持 `'hr'` 分隔、`'->'` 换行、自定义组件。
- **MuForm 内置校验与提示**：数据驱动基础上新增 `:rules` 校验体系，支持字符串简写（`'required|string'`）、函数 validator、对象规则三种声明方式；字段值变化时自动防抖（300ms）触发校验，错误信息绑定到对应 `form-field` 实时显示；提供 `validate()` / `validateField(prop)` / `clearValidate()` 方法，`validate()` 返回 `true` 或 `{ errors }` 便于提交前拦截。提示文案走 i18n，默认提供必填/非法两类消息并支持 `message` / `requiredMessage` 自定义。
- **MuDialog 重构**：
  - 新增 `header` / `footer` / `body-class` / `body-style` / `body-scrollbar` props，body 布局无需再套包裹 div。
  - `dismissible` 统一控制遮罩/ESC 关闭行为（替代 V3 的 `mask-action` / `easy-hide`）。
  - buttons 支持 `'#OK'` / `'#CANCEL'` 字符串简写。
  - 关闭回调 trigger 统一为按钮 `name`，并补充 `$X` / `$MASK` / `$ESC` 三种来源标识。
- **MuDropdown 系列**：推荐 `dropdown-items` 数组属性驱动，减少模板嵌套；`dropdown-position` / `dropdown-anchor` 命名更直观。
- **MuButton**：新增 `color`（统一颜色语义）与 `button-style`（normal/outline/text/link）属性，替代 V3 散落的布尔属性。
- **MuInput**：事件对齐全生 Event 参数，新增 `@keydown` / `@prefix-click` / `@suffix-click`；`prefix`/`suffix` 改为属性，免去插槽。
- **MuTabs**：事件语义化（`@button-click` / `@update:active-tab`），新增 `#tab-bar-prepend` / `#tab-bar-append` 插槽支持页签栏定制。

---



## 四、重新设计的颜色系统

Mussel 4 对颜色系统做了全面重构，以更好的支持暗色与主题色切换。

从 V3 的「逐个手填 CSS 变量」改为「基础色自动派生完整色板」的生成式体系。



### 4.1 自动派生色板

仅需在 `install` 时指定少量基础色（`primary` / `secondary` / `success` / `warning` / `danger`，可选 `neutral`），系统自动生成：

- **语义色 10 级调色板**：每个语义色派生 `--mu-{color}-color-0` ~ `--mu-{color}-color-9`（明→暗），覆盖 hover/active/disabled 等所有状态色需求。
- **20 级灰阶**：`--mu-gray-0` ~ `--mu-gray-19`（V3 仅 10 级），由 `neutral` 或 `primary` 自动派生，提供更细粒度的层次表达。
- **基础色族**：保留 12 种基础色（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange），用于图标、徽章、标签等多彩场景。

**好处**：主题定制从「维护几十个 CSS 变量」简化为「指定 5 个基础色」，衍生色由算法保证一致性与可访问性对比度，杜绝人工配色偏差。



### 4.2 语义化衍生变体

每个语义色除主色与 10 级调色板外，自动派生三种语义变体：

| 变体 | 含义 | 典型用途 |
|------|------|---------|
| `--mu-{color}-color-{0-9}` | 明暗梯度 | hover/active 状态、深浅主题 |
| `--mu-{color}-translucent` | 10% 透明（亮色）/ 20%（暗色） | hover 背景、焦点环、柔和填充 |
| `--mu-{color}-faint` | 极浅色（调色板第 0 级） | 标签底色、徽章背景 |

**好处**：替代 V3 含糊的 `dark/light/shadow` 三变体，命名直接表达用途，hover/focus 等状态色不再需要手填。



### 4.3 文本色与边框色语义化

V3 的 `text-color-normal/reversed/weak/placeholder` 在 V4 中重构为五级语义层次：

| V4 文本色 | 对应灰阶 | 用途 |
|-----------|---------|------|
| `--mu-text-color-strong` | gray-18 | 标题、强调 |
| `--mu-text-color-normal` | gray-15 | 正文 |
| `--mu-text-color-subtle` | gray-11 | 次要说明 |
| `--mu-text-color-soft` | gray-8 | 辅助文字 |
| `--mu-text-color-muted` | gray-6 | 占位符、禁用 |

边框色同理分为 `strong` / `normal` / `soft` 三级。

**好处**：层次命名直接表达视觉权重，告别 V3「weak 到底多 weak」的歧义；灰阶映射在暗色模式下整体翻转，保证两端对比度一致。



### 4.4 暗色模式重构

- 配置项 `darkMode` → `dark`，取值不变（`true` / `'auto'`）。
- 根元素标记从 `[dark-mode]` 属性改为 `.mu-dark` class，符合主流 class-based 暗色模式约定。
- 暗色下：灰阶映射翻转、`translucent` 透明度从 10% 提升到 20%（暗底需要更强填充才可见）、`faint` 取调色板高端（亮色）。

**好处**：与 Tailwind `dark:`、Element Plus 等主流方案的暗色实现思路一致，便于在混合技术栈中协同。


---



## 五、其他代码重构

| 重构点 | 好处 |
|--------|------|
| **install 函数化**：V3 的插件对象改为导出 `install` 函数，返回 app 支持链式 `.mount()` | 入口更简洁，职责单一（组件/图标/主题/语言/上下文一次完成） |
| **i18n 内置**：`locale` / `localeResources` | 组件文案可中英切换，无需自建语言包 |
| **`$mussel` 上下文**：`messageBox` / `options` / `rootElement` 等统一注入 | 命令式 API 与组件配置访问入口统一 |
| **移除 mu-box 属性选择器体系** | 消除「HTML 属性当 CSS 用」的反模式，回归标准 CSS |

---



总体上，Mussel 4 在**样式表达**（原子类）、**颜色系统**（生成式色板）、**组件覆盖**（新增 20+ 组件）、**API 一致性**（属性语义化、命名规范化）四个维度系统升级，从「框架强约束」转向「标准 CSS + 数据驱动」，更贴近现代 Vue 3 生态的心智模型。
