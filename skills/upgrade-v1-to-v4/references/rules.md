# Mussel 1 → Mussel 4 迁移规则

所有已知 API 变更的完整参考。升级过程中以此文件为权威依据。

> 本文件仅在用户**明确要求** M1（@mctech/mussel，Vue 2）→ M4 迁移时按需查阅；新功能开发不要读本文件。

**升级流程**（分析 → 计划 → 执行）见同级目录 `process.md`。

> ⚠️ **同步约束（SYNC-RULES）**：本文件为 API 变更的**权威定义**；`process.md` 分析阶段有一份对应的「grep 线索清单」。修改本文件任一迁移规则（新增/移除/重命名废弃项）**必须同步 `process.md` 的线索清单**。
>
> Mussel 4 目标写法的完整组件 API 优先查阅 mussel-ui skill 的 `references/components/*` 与 `references/styles.md`；本文「目标写法」列为权威速查。

> 章节顺序 = 执行顺序。**框架迁移（第 1 节）是硬前提**：`@mctech/mussel` 不能运行在 Vue 3 上，必须先完成 Vue 3 化与安装入口改写（第 2 节），项目才能启动验证；之后按 3 → 4 → 5 → 6 处理，7 收尾。

---

## 目录

1. [框架迁移（Vue 2 → Vue 3）](#1-框架迁移vue-2--vue-3)
2. [全局配置](#2-全局配置)
3. [CSS 变量与 CSS 类](#3-css-变量与-css-类)
4. [布局系统](#4-布局系统)
5. [图标](#5-图标)
6. [组件迁移](#6-组件迁移)
   - 6.1 按钮系 — 6.2 输入与编辑器系 — 6.3 选择系 — 6.4 表单系 — 6.5 弹层系（Dialog/Drawer）
   - 6.6 页签系 — 6.7 下拉系 — 6.8 表格 — 6.9 树 — 6.10 列表/条栏/分页/日历等 — 6.11 命令式弹窗与通知
7. [无对应与移除项汇总](#7-无对应与移除项汇总)
8. [新增能力](#8-新增能力)

---

## 1. 框架迁移（Vue 2 → Vue 3）

只列高频破坏点；完整差异以 Vue 3 官方迁移指南为准。

### 1.1 全局 API 与应用入口

| Vue 2 | Vue 3 |
|-------|-------|
| `new Vue({ render: h => h(App) }).$mount('#app')` | `createApp(App).mount('#app')` |
| `Vue.use(...)` / `Vue.component(...)` / `Vue.directive(...)` | `app.use(...)` / `app.component(...)` / `app.directive(...)` |
| `Vue.prototype.$xxx = ...` | `app.config.globalProperties.$xxx = ...`（或 `provide`/`inject`） |
| `Vue.mixin` / `Vue.filter` / `Vue.extend` | 组合式函数 / 移除 filter（改方法或 computed）/ `defineComponent` |

### 1.2 组件写法

| Vue 2 | Vue 3 | 说明 |
|-------|-------|------|
| `model: { prop: 'value', event: 'change' }` | 已移除 | v4 mussel 输入组件用标准 `modelValue`；**具名 model 见 6.x 各组件**（dialog→`v-model:visible`、tabs→`v-model:active-tab`） |
| `:prop.sync="x"` | `v-model:prop="x"` | `.sync` 移除 |
| `slot-scope="scope"` | `#name="scope"` | 老 v1 代码常见旧插槽语法 |
| `$listeners` | 并入 `$attrs` | `v-on="$attrs"` 替代 `v-on="$listeners"` |
| `this.$on/$off/$once` 事件总线 | 已移除 | 改 props/emit、provide/inject 或 mitt |
| `this.$children` | 已移除 | 用 ref |
| 管道过滤器 `{{ v \| fmt }}` | 已移除 | 改方法/computed |
| `v-enter` / `v-leave` transition 类 | `v-enter-from` / `v-leave-to` | |
| 渲染函数 `h`（自动注入） | `import { h } from 'vue'` | |
| `beforeDestroy` / `destroyed` | `beforeUnmount` / `unmounted` | |
| IE11 支持 | 不支持 | v4 使用 `rgb(from ...)` 相对色等现代特性，需现代浏览器 |

**与 mussel 相关的高发点**：v1 所有表单/弹层组件的 `v-model` 走自定义 `model` 选项（prop 为 `value`/`visible`/`activeTab`/`checked` 等，事件为 `change`）。模板里 `v-model="x"` 的**改写规则**见 6.x 各组件；显式写 `:value="x" @change="y"` 的，按 6.x 对照改为 `v-model` 或 `:model-value` + `@update:model-value`。

---

## 2. 全局配置

### 2.1 包名与安装

```js
// Mussel 1：导入即自动注册（副作用 install(Vue)），也可显式 Vue.use
import Vue from 'vue'
import '@mctech/mussel'            // 或 import mussel from '@mctech/mussel'; Vue.use(mussel)

// Mussel 4：显式 install，一次完成组件/指令/图标/主题/多语言/$mussel 上下文
import { createApp } from 'vue'
import { install } from 'mussel'

install(app, {
  colors: { primary: '#008cd6' },  // 主题色（见 2.2）
  dark: true,                      // true | 'auto' | 不传（亮色）
  locale: 'zh',                    // 'zh' | 'en'
  icons: { ... },                  // 等价 installIcons
  root: document.body              // 默认 document.body
}).mount('#app')
```

要点：
- v1 `install($Vue)` **不接受任何配置项**；v4 所有全局配置走 `options`。
- v4 `install` 返回 `app`，可链式 `.mount()`。
- 依赖 `inject('$mussel')` / `$mussel` 的代码必须在 `install` 之后执行。

### 2.2 主题

| | Mussel 1 | Mussel 4 |
|---|----------|----------|
| 定制方式 | ① `setTheme({ '--mu-primary-color': '#xx', ... })`（运行时，参数为 CSS 变量名）② 编译期覆盖变量 ③ CSS 类覆盖 | `install` 的 `colors: { primary: '#xx' }`（只需基础色，自动派生调色板）；运行时换肤 `$mussel.setupColors(colors)` |
| 导出 | `import { setTheme, variables } from '@mctech/mussel'` | `setTheme`/`variables` **不再导出**；换肤走 `$mussel.setupColors` |
| 语言 | `variables.lang = 'zh'` | `install` 的 `locale` / `localeResources` |

v1 `variables.js` 中非颜色配置（字号、控件高度、圆角、阴影等）在 v4 中一律改为覆盖 CSS 变量（`--mu-font-size`、`--mu-radius-*`、`--mu-shadow-*` 等，完整清单见 mussel-ui skill 的 `references/styles.md`）。

### 2.3 图标注册

```js
// Mussel 1
import { registerIcons } from '@mctech/mussel'
registerIcons({ edit: EditIcon })

// Mussel 4
import { installIcons } from 'mussel'
installIcons({ edit: EditIcon })          // 或 install 的 options.icons
```

### 2.4 导出变更

```js
// Mussel 1 导出：install、全部组件、registerIcons、scrollbar、setTheme、variables、
//               PopupGroupMixin、EventInterceptor、showMessage/alert/confirm/error/warn/notify
// Mussel 4 导出：install、installIcons、EventInterceptor、colors、icons、version/isDev（env）
```

顶层导入的 `showMessage`/`alert`/`confirm`/`error`/`warn`/`notify` 改为 `inject('$mussel').messageBox.*`（见 6.11）。

### 2.5 指令

| Mussel 1 | Mussel 4 | 说明 |
|----------|----------|------|
| `v-mu-scrollbar` | `v-mu-scrollbar` | 同名；v4 取值宽松：`false`/`'none'`（历史兼容写法）关闭，其余任意值开启；**不再支持选项对象** |
| `v-mussel-scrollbar`（legacy，支持 `{ scrollbarVisible, scrollbarX, scrollbarY, maxWheelDistance... }`） | `v-mu-scrollbar` | 选项对象不支持；v4 滚动条行为内置，无需参数 |
| `v-mussel-sticky` | **无对应** | 自行实现 |

---

## 3. CSS 变量与 CSS 类

> **早期 v1（0.1.x）没有本节任何 v1 侧内容**：无运行时 CSS 变量、无工具类。早期项目的自定义样式直接改写为 v4 原子类与 `--mu-*` 变量即可，不涉及"旧→新"映射。

### 3.1 CSS 变量

| Mussel 1 | Mussel 4 | 说明 |
|----------|----------|------|
| `--mu-primary-color` / `--mu-success-color` / `--mu-danger-color` / `--mu-warning-color` | 同名 | 不变 |
| `--mu-primary-plus-color`（更深） | `--mu-primary-color-7` ~ `-9` 调色板深档 | 按视觉深浅选择档位 |
| `--mu-primary-minus-color`（更浅） | `--mu-primary-color-1` ~ `-3` 调色板浅档 | 同上 |
| `--mu-primary-tiny-color`（约 7% 透明底） | `--mu-primary-faint` | |
| `--mu-primary-shadow-color`（约 15% 透明） | `--mu-primary-translucent`（10%） | |
| `--mu-border-color-normal` / `-soft` / `-strong` | 同名 | 不变 |
| `--mu-base-spacing` | 同名 | 不变 |
| `--mu-dark-background` | 移除 | 暗色由 `.mu-root.mu-dark` + `--mu-bg-*` 自动处理 |
| `--mu-block-border-radius`（4px） | `--mu-radius-control` | 圆角族改为 `--mu-radius-control/panel/modal` |

### 3.2 late-v1 工具类 → v4

v1 `base-styles` 提供的 `mu-*` 工具类（1.0.x）在 v4 中大部分移除（`.mu-text-ellipsis` 在 v4 仍保留为别名，替换非必须）：

| Mussel 1 类 | Mussel 4 | 说明 |
|-------------|----------|------|
| `.mu-text-ellipsis` | `.text-ellipsis` | CSS 选择器同步替换 |
| `.mu-text-color-normal` | `.text-normal` | |
| `.mu-text-color-weak` | `.text-muted` | |
| `.mu-text-color-subtitle` | `.text-subtle` | |
| `.mu-text-color-title` | `.text-normal` | 近似；确认视觉 |
| `.mu-text-color-primary` / `-success` / `-danger` / `-warning` | `.text-primary` / `.text-success` / `.text-danger` / `.text-warning` | |
| `.mu-text-color-highlight` | `style="color: #fff"` | 反白文本无原子类 |
| `.mu-text-title` / `.mu-text-subtitle` / `.mu-text-weak` / `.mu-text-body` | 无对应 | 组合 `.text-*` + 字号 style，人工处理 |
| `.mu-background-normal` | `.bg-normal` | |
| `.mu-background-light-grey` / `-grey` | `.bg-fill` / `style` | v4 灰底原子类有限，逐个确认 |
| `.mu-background-highlight` | `.bg-strong` + `style="color: #fff"` | v1 同时设置反白文字色；v4 bg-strong 为浅色底，视觉差异大需确认 |
| `.mu-background-disabled` | `.bg-disabled` | v1 需 `[disabled]` 属性才生效，注意场景 |
| `.mu-background-primary` / `-success` / `-danger` / `-warning` | `style="background: var(--mu-primary-color)"` | v4 无彩色背景原子类；注意 v1 `-danger` 误引用 success-color（v1 bug 渲染绿色），迁移后变红属修正非回归 |
| `.mu-background-info` / `.mu-background-hover` | 无对应 | 人工处理 |
| `.mu-bordered` / `[class^="mu-"][border]` 属性选择器 | `.border` / `.border-t` / `.border-r` / `.border-b` / `.border-l` / `.border-x` / `.border-y`（彩色加 `.border-primary` / `.border-danger`，虚线 `.border-dashed`） | `border~="x2"` → `.border-2`；`border~="none"` → `style="border: 0"` |
| `[class^="mu-"][margin~="all|hori|vert|top|left|right|bottom"]` × `1/x2/x4` | `.m-1x` ~ `.m-4x` / `.mx-*` / `.my-*` / `.mt-*` / `.ml-*` / `.mr-*` / `.mb-*` | v1 档位 all=8px/half，x2=16px/unit，x4=32px/double → 1x/2x/4x |
| `[class^="mu-"][padding~="..."]` 同上 | `.p-*` / `.px-*` / `.py-*` / `.pt-*` / `.pl-*` / `.pr-*` / `.pb-*` | 同上 |
| `[margin~="none"]` | `style="margin: 0"` | |
| `.mu-divider`（块级水平分隔线，`::before` border-top） | flex 容器内：`.flex-divider`；块级：`<div class="border-t">` 或 style | |
| `.mu-space`（类，`flex: 1 1 0`） | `.flex-space` | 与组件 `<mu-space>` 同步处理（见第 4 节） |

### 3.3 late-v1 compat 原子类（可保留）

v1 1.0.x 后期的 `compat/` 回移植了大部分 v4 同名原子类：`flex`、`flex-row/col(-reverse)`、`flex-0..8`、`flex-none/auto/initial`、`flex-wrap/nowrap`、`flex-center`、`items-*`、`self-*`、`justify-*`、`gap-{1..4}x`、`p/m/px/py/pt/pr/pb/pl/ml...-{0..4}x`、`border(-x/y/t/r/b/l)(-2/3/4)(-soft/strong/primary/danger)(-dashed/dotted/double)`、`text-ellipsis`、`line-clamp`、`whitespace-*`、`leading-none`、`cursor-*`、`select-*`、`static/relative/absolute/fixed/sticky`、`hidden`、`overflow-*`、`flex-divider`、`flex-space`、`flex-break`。

- 项目若已在用这些类，**类名无需改动**；但注意 compat 中**没有** `text-strong/normal/muted/subtle/soft` 等**文字颜色**类（被注释未启用）——项目若自定义为 `mu-text-color-*`，按 3.2 映射。
- `flex-divider` 的尺寸变体写法不同：v1 `line-width="1..4"` → v4 `flex-divider--stroke-{n}`（1~4px）；`.flex-divider--pill` 在 v4 仍保留（视觉大改：居中圆角条）。

---

## 4. 布局系统

v1 布局 = **组件体系**（`mu-flex-box` / `mu-h-box` / `mu-v-box` / `mu-flex-item` / `mu-space` / `mu-splitter`）+ `.mu-flex-box` 属性选择器样式；late v1 另有 `.mu-box` class 属性选择器体系（同 v3，映射见 3.2 与本节 4.4）。

### 4.1 布局容器

v4 的 `<mu-h-box>` / `<mu-v-box>` **仍存在**，props 变更为：`inline`、`flexReverse`、`gap`（`'none'|'half'|'1x'..'4x'`）、`flexWrap`、`flexCenter`、`alignItems`、`justifyContent`（kebab 模板写法自动映射驼峰 props）。**不再支持** `direction`/`layout` 属性（方向由标签决定）、`size`、`flex`、`padding`/`margin`/`border`（改原子类或 style）。`width`/`height`/`position`/`overflow` 在 v1 mu-h-box 上本就不生效（属 4.4 `.mu-box` 体系）。

| Mussel 1 | Mussel 4 | 说明 |
|----------|----------|------|
| `<mu-h-box>` | `<mu-h-box>` 或 `<div class="flex">` | 保留标签时 props 见上；转 div 更简洁 |
| `<mu-v-box>` | `<mu-v-box>` 或 `<div class="flex flex-col">` | |
| `<mu-flex-box direction="row|column">` | `<mu-h-box>` / `<mu-v-box>` 或 `div.flex` / `div.flex.flex-col` | `layout="flow"` 同 flex-wrap 场景 |
| `<mu-flex-box inline>` | `inline` prop 或 `class="inline-flex"` | |
| `justify-content="center"` 等（标签属性） | `justify-content` prop 或 `class="justify-*"` | mu-flex-box 的 CSS 仅实现 `center`/`start`/`end`（align-items 仅 `flex-start`/`center`/`stretch`）；完整 12 值域属 `.mu-box` 体系（见 4.4）。v4 无 `justify-left`/`justify-right` 类（validator 放行但静默失效）→ 改 `start`/`end` |
| `align-items="center"` 等 | `align-items` prop 或 `class="items-*"` | |
| `flex-center`（标签属性） | `flex-center` prop 或 `class="flex-center"` | |
| `flex-wrap`（标签属性） | `flex-wrap` prop 或 `class="flex-wrap"` | mu-flex-box 旧行为含 `align-content: flex-start`，需保留则补 `content-start`；`.mu-box[flex-wrap]` 旧行为含 `align-items: flex-start`，需保留则补 `items-start` |
| `<mu-flex-item size="N">`（N=1~8） | `class="flex-{N}"` | v4 flex-N = `flex: N N 0` |
| `<mu-flex-item size="auto">` | `class="flex-auto"` | |
| `<mu-flex-item size="240px">` / `size="30%">` | `style="width: 240px"` / `style="height: 30%"`（按父方向） | v1 按父 direction 设宽/高 |
| 子项属性 `flex-auto` / `flex-none` | `class="flex-auto"` / `class="flex-none"` | |
| 子项属性 `align-self="center|stretch"` | `class="self-center"` / `class="self-stretch"` | |
| `<mu-space>` | `<mu-flex-space>` / `<div class="flex-space">` | 带 `size` 的固定占位 → `style="flex: 0 0 24px"` 或间距类 |
| `<mu-splitter>` | `<mu-split-h-box>` / `<mu-split-v-box>` | 按父方向选择；`draggable` 属性移除（默认可拖拽）；支持 `collapsible` 收拢、双击重置 |

`.mu-absolute-fit` → `class="absolute inset-0"`；`.mu-absolute-top` / `.mu-absolute-bottom` → `style` 定位 + `class="z-float"` 近似（z 层级人工确认）。

旧表格仿制属性 `cell-padding` / `cell-spacing` / `content-spacing`（自动加半格间距）→ 移除，用 `gap-*x` / `p-*x` / `m-*x` 显式表达。

### 4.2 ref 访问 DOM 的连带变更

- v1 `<mu-h-box ref="x">` 是组件，`x.value.$el` 取根 DOM。
- v4 `<mu-h-box>` **仍是组件**，`$el` 用法保持有效；但若按推荐改写为 `<div class="flex" ref="x">`，`x.value` 直接是 DOM，**必须去掉 `.$el`**。
- 检查方法：grep `<mu-flex-box ref=` / `<mu-h-box ref=` / `<mu-v-box ref=`，凡标签被替换为 div 的，同步到 `<script>` 中删去对应 `.$el`；ref 标在自定义子组件上的不动。

### 4.3 升级示例

```html
<!-- v1 -->
<mu-v-box flex-center>
  <mu-h-box size="auto" border="bottom" padding="x2">
    <mu-input v-model="keyword" icon="search" icon-align="left" @enterkey="search" />
    <mu-space />
    <mu-button button-type="primary" @click="search">搜索</mu-button>
  </mu-h-box>
  <mu-flex-item size="1">列表</mu-flex-item>
</mu-v-box>

<!-- v4 -->
<div class="flex flex-col flex-center">
  <div class="flex items-center border-b p-2x flex-none">
    <mu-input v-model="keyword" prefix=":icon=search" @enter="search" />
    <div class="flex-space" />
    <mu-button color="primary" @click="search">搜索</mu-button>
  </div>
  <div class="flex-1">列表</div>
</div>
```

### 4.4 late v1 的 `.mu-box` class 体系

late v1 项目若使用了 `class="mu-box"` + `layout=`/`position=`/`width=`/`height=`/`margin=`/`padding=`/`border`/`flex~`/`gap=` 属性选择器（与 V3 同源的机制），一律改写为原子类/内联 style：

`layout="flex"` → `class="flex"`；`layout="grid"` → `class="grid"`；`direction="column"` → `flex-col`；`position="absolute|fixed"` → `class="absolute|fixed"`（`position~="fit"` → `style="inset: 0"`）；`width="100%"` → `style="width: 100%"`（纯数字→px）；`overflow="auto"` → `class="overflow-auto"`；`gap="2x"` → `class="gap-2x"`；`flex~="1"~"8"` → `class="flex-{N}"`；`flex~="9"~"12"` 超出 v4 `.flex-{0..8}` 档位，用 `style="flex: N N 0"`。

---

## 5. 图标

### 5.1 注册函数

`registerIcons` → `installIcons`（见 2.3）。

### 5.2 内置图标名映射

v4 内置名：`X`、`check`、`x`、`ok`、`info`、`alert`、`question`、`chevronUp/Down/Left/Right`、`arrowDownLeft`、`arrowUpRight`、`list`、`grid`、`search`、`file`、`folder`、`folderOpen`、`sun`、`moon`、`clock`、`calendar`、`loading`（自带 spin 动画），以及带旋转动画的组合图标 `windowClose`（dialog 关闭按钮自动使用）、`treeNodeExpand`（tree 展开箭头自动使用）、`dropdownExpand`（dropdown 展开箭头自动使用）。**注意大小写敏感**。

| Mussel 1 | Mussel 4 | 说明 |
|----------|----------|------|
| `x`（线条叉） | `X` | v4 小写 `x` 是 filled circle-x |
| `ok`（对勾） | `check` | v4 `ok` 是 filled circle-check |
| （v1 无 chevron* 内置名） | `chevronUp` / `chevronDown` / `chevronLeft` / `chevronRight` | chevron* 原名为 v4 新增；v1 用 key-* 别名（见下行） |
| `key-up` / `key-down` / `key-left` / `key-right` | `chevronUp` / `chevronDown` / `chevronLeft` / `chevronRight` | 别名已移除 |
| `dropdown`（=chevron-down） | `chevronDown` | v4 不内置 `dropdown` 名 |
| `circleX` | `x` | |
| `circleCheck` | `ok` | |
| `circleAlert` | `alert` | |
| `info` | `info` | |
| `file` / `folder` / `folderOpen` / `search` | 同名 | v1 `calendar` 为 calendar-event 图形，v4 为 calendar-month |
| `menu` | 无（近似 `list`） | 需要原形则 installIcons 注册 tabler `menu-2` |
| `refresh` / `tree`（sitemap） / `ellipsis`（dots） / `dotsVert` / `bulb` / `triangleAlert` / `expand`（square-plus） / `collapse`（square-minus） / `pin` / `pinned` / `pinned-off` | **无内置** | 需要用 `installIcons` 自行注册对应 tabler SVG |
| `tree-collapsed` / `tree-expanded` / `tree-leaf` / `tree-folder` / `tree-folder-open` | `treeNodeExpand` / `file` / `folder` / `folderOpen` | v1 随 tree 组件注册的内置图标；展开箭头 v4 自动用 `treeNodeExpand`，节点图标 v4 默认 `file`/`folder`/`folderOpen` |

### 5.3 mu-icon 组件属性

| Mussel 1 | Mussel 4 | 说明 |
|----------|----------|------|
| `icon="name"` | `icon="name"` | 图标名按 5.2 映射；支持 `name:animation`（如 `loading:spin`）与 `.icon-font-class`（以 `.` 开头走 class） |
| `svg="<svg...>"` | 移除 | 改 `installIcons({ name: svgString })` 后按名引用 |
| `icon-class="css-class"` | 移除 | 字体图标用 `icon=".css-class"`；普通附加 class 用 `class` |
| （无） | `tag` / `animation` props | 新增 |

---

## 6. 组件迁移

> 各组件「目标写法」的完整 Props/Events/Slots 以 mussel-ui skill 的 `references/components/*` 为准。

### 6.1 按钮系

**mu-button**

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `button-type="primary|submit|danger|normal"` | `color="primary|secondary|danger|normal"` | `submit` 移除：原生提交用 `type="submit"` 属性透传；v4 旧布尔 `primary`/`secondary`/`danger` 仍可用但 deprecated |
| `button-style="normal|outline|text|link"` | `button-style`（同名） | |
| `button-shape="round"` | `pill`（布尔） | |
| `icon="name"` / `icon-class` | `icon="name"` | 名按第 5 节映射；`icon-class` 移除 |
| `caption="文字"` | `caption` / 默认插槽 | |

**mu-icon-button**：同名；v1 继承 button 的 `button-type` 等属性同上迁移。
**mu-button-group**：同名；共享 `size`（`small|normal|large`）/`color`/`button-style`（组级仅受理 `normal|outline`）。
**mu-split-button** → **移除**：用 `<mu-dropdown-button split-button>`（主按钮 + 下拉箭头分割）。
**mu-dropdown-button**：同名；默认下拉图标 `icon="dropdown"` → `dropdown-icon="dropdownExpand"` 语义（v4 默认已内置，显式传 `dropdown` 名需改为 `chevronDown`）。

### 6.2 输入与编辑器系

v1 的 `mu-editor` 家族在 v4 统一为 `mu-input` 与 `mu-*-input`。**组件内 `v-model="x"` 语法不变**（v1 model= `value`/`change` → v4 modelValue）；变化在属性与事件签名。

**属性总映射**（适用于整个编辑器家族）：

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `icon="search"` + `icon-align="left"` | `prefix=":icon=search"` | 前置图标/按钮 |
| `icon="search"` + `icon-align="right"`（默认） | `suffix=":icon=search"` | 后置图标/按钮 |
| `icon-clickable`（默认 false，mu-editor） | 无需配置 | v4 prefix/suffix 点击始终触发 `@prefix-click`/`@suffix-click` |
| `clearable`（**默认 true**） | `clearable`（**默认 false**；`mu-search-input` 例外默认 true） | 需要清除按钮必须显式声明，否则升级后按钮消失（search-box → search-input 场景不受影响） |
| `:editable="false"` | `readonly` | |
| `type="password"` 等 | `type` | 文本类保留 |

**事件总映射**：

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `@enterkey` | `@enter` | v1 参数为组件实例，v4 参数为原生 KeyboardEvent |
| `@esckey` | `@esc` | 同上 |
| `@focus` / `@blur`（参数为组件实例） | `@focus` / `@blur`（参数为原生 Event） | 取 `event.target` |
| `@input`（参数为 value） | `@input`（参数为原生 input Event） | **`v-model` 不受影响**；仅手写 `@input` 处理 value 的需改为读 `event.target.value` |
| `@buttonclick` | `@prefix-click` / `@suffix-click` | |
| `@clear` | 无 | 通过 v-model 值变化感知 |
| `@inputclick` / `@keypress` | 无 / `@keydown` | |

**逐组件**：

| Mussel 1 | Mussel 4 | 特有变更 |
|----------|----------|----------|
| `<mu-input>`（裸 `<input>` 封装：props `type`/`disabled`/`autofocus`） | `<mu-input>` | 同名不同物；`autofocus` 移除（v4 未暴露 `focus()`，用 `ref.$el.querySelector('input')?.focus()` 或挂载后聚焦）；事件按上表 |
| `<mu-editor>` | `<mu-input>` | 主路径；label 场景改 `<mu-form-field label="...">` 包裹 |
| `<mu-search-box>` | `<mu-search-input>` | 防抖内置（`debounce-delay`）；**下拉候选模式（`options`/`value-mode`/`popup-style`）无对应**——候选场景改 `mu-select`（不可输入）或 `mu-combo-box editable`（可输入过滤）；`emit-null-on-input` 无对应 |
| `<mu-combo-box>` | `<mu-combo-box>` | `:multiple="true"` → 拆分 `<mu-multi-select>`；`fields`（自定义字段名 `{value,label}`）→ 无，用 computed 映射为 `{value,label}[]`（v4 `option-key` prop 已声明但实现未生效，勿依赖）；`popup-max-height`/`popup-style` 无对应；`<mu-option>` 子组件 → `:options` 数据或 `#dropdown-items` 插槽 |
| `<mu-option>` | 移除手写 | v4 仍有该组件但推荐 `options`/`dropdown-items` 驱动 |
| `<mu-date-editor>` | `<mu-date-input>` | `select-mode="date|month|year"` → `type="date|week|month|quarter|year"`；`range-start`/`range-end`（日期边界）→ **无对应**（人工）；`format` 保留；`language` → 全局 `locale`；`marked`/`marked-dates` → 无；`popup-width/height` → `dropdown-width`/`dropdown-height`（透传）；`range-start`/`range-end` 对应的 `min`/`max` 在 v4 已声明未实现，边界限制需人工 |
| `<mu-time-editor>` | `<mu-time-input>` | v1 为 AM/PM 12 小时制，v4 为 24 小时列式滚动，**值格式需人工核对** |
| `<mu-date-range-editor>` | **无对应** | 两个 `<mu-date-input>` 自行组合起止值 |
| `<mu-color-editor>` | `<mu-color-input>` | |
| `<mu-button-editor>`（省略号按钮型编辑器） | **无对应** | `<mu-dropdown-button>` + `#dropdown-items` 或自定义弹层组合 |
| `<mu-popup-editor>`（自定义弹层编辑器基座） | **无对应** | `<mu-dropdown-panel>` / `<mu-drawer>` 组合，人工设计 |

### 6.3 选择系

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `<mu-check v-model="b" label="x">` | 同名同写法 | v1 无 label 时根元素是裸 `<input>`，v4 恒渲染 `<label>`——CSS 选择器依赖根元素为 input 的需调整 |
| `<mu-checkbox v-model="checked">` | `<mu-check v-model="...">` | v1 model prop 为 `checked`，`v-model` 语法不变；`check-type` 移除；`indeterminate` → v4 无内置 prop，人工处理；`option`/`label` 二义取值 → 显式 `:value` + `label` |
| `<mu-checkbox-group v-model="arr">` + 子 checkbox | `<mu-check-group v-model="arr" :options="[{label, value}]">` | 数据驱动；`item-width` 移除 |
| `<mu-radio v-model="v" option="a" label="A">` | `<mu-radio v-model="v">` + `mu-radio-group :options` | `name`/`radio-style` 移除 |
| `<mu-radio-group v-model="v">` | `<mu-radio-group v-model="v" :options="[{label, value}]">` | |
| `<mu-toggle v-model="b">` | `<mu-switch v-model="b">` | `label`/`active-label`/`inactive-label` 仍可用（渲染为开关内部文案）；`button-style` 双按钮模式移除，改 `<mu-segmented>` |

### 6.4 表单系

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `<mu-form layout="flow|column|row">` | 移除 | v4 form 为 flex-wrap 自动换行容器（自带 padding）；行布局用 `<mu-form-row>` 或原子类 |
| `form-style="normal|table"` / `cellpadding` | 移除 | v4 统一样式 |
| `label-width` / `label-align` | 同名 | v4 `label-align` 仅 `left|right|top`，`center` 不再支持 |
| `<mu-form-field label label-width label-align>` | 同名 | 新增 `prop`/`input`/`required`/`error`/`suffix`/`width`；v1 的 `size` 属性移除（用 `width` 或原子类） |
| `<mu-form-row>` | 同名 | |
| （无） | `:model` + `:items` 数据驱动表单 | 新能力，简单表单可顺手改写（见 mussel-ui skill `references/components/form.md`） |

### 6.5 弹层系（Dialog / Drawer）

**mu-dialog**

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `v-model="visible"` | `v-model:visible="visible"` | **必须加参数**（v1 model prop 是 `visible`，v4 默认 model 是 `modelValue`） |
| `@change="(v, trigger) => ..."` | `@update:visible` | 参数 `(value, trigger)` 不变 |
| `@maskclick` | 移除 | 遮罩行为由 `dismissible` 控制 |
| `@hide`（参数 trigger） | `@hide`（**无参数**） | trigger 只在 `@update:visible` 第二参数提供 |
| `mask-action="close"`（**默认值，遮罩可关闭**） | `dismissible`（**默认 false，遮罩不可关闭**） | **默认行为翻转**：需要点遮罩关闭必须显式 `dismissible`（`true`/`'mask'`/`'esc'`） |
| `draggable`（默认 true） | 移除 | 始终可拖拽 |
| `keep-alive` | 移除 | v4 首次显示后保持挂载（`lazy` 默认 true），行为差异需验证 |
| `model-control="both|external"` | 移除 | 需要完全受控时用 `:visible` + `@update:visible` 且不回写（受控模式） |
| `primary-button="确定"` | 移除 | 用预设按钮 `'#OK'`（自动主按钮样式）或按钮对象样式属性 |
| `close-button`（默认 true） | `close-button`（默认 true） | 不变 |
| `footer`（默认 true，无按钮也渲染空条） | `footer`（默认 `'auto'`，无按钮/插槽时不渲染） | `'auto'` \| Boolean；有空 footer 视觉差异 |
| `danger` | 移除 | 按钮级危险样式用 `'#OK!'` 预设或按钮 `color="danger"` |
| `buttons="['-', {caption, buttonType}, ...]"` | `['#OK', '#CANCEL', { name, caption, ... }]` | 分隔符字符含义互换：v1 `'-'`（占位）/`'|'`（分隔线）→ v4 `' '`（占位）/`'-'`（分隔线）；`buttonType` → `color`；自定义按钮通常需 `name`（caption 缺省值 + 事件 payload 标识），显式 `caption` 时可不带 |
| `title` / `width` / `height` | 同名 | v4 `width`/`height` 支持 Number（px） |
| `@buttonclick` | `@button-click` | payload 为按钮对象（含 `name`/`action`）；v1 无 `name` 依赖 `_rawData` 的逻辑改用 `name` |
| 关闭/遮罩/ESC 触发标识 `'$close'` / `'$mask'` | `'$X'` / `'$MASK'` / `'$ESC'` | 大写化，ESC 为新增 |
| 默认插槽 | `#body`（推荐） | v4 `.mu-dialog__body` 无 padding：用 `body-class="p-2x"` / `body-style` / `body-scrollbar` 补偿 |
| `#header` / `#footer` 插槽 | 同名（附加内容语义） | 位置/行为核对 |
| CSS 类 `.mu-dialog-header` / `.mu-dialog-body` / `.mu-dialog-footer` | `.mu-dialog__header` / `.mu-dialog__body` / `.mu-dialog__footer` | 连字符改双下划线；`$attrs` 绑定层从遮罩层移到 `.mu-dialog` 层，自定义 class/样式选择器需核对 |
| `dialogRef.value.$el` | `dialogRef.value.maskEl` / `dialogRef.value.dialogEl` | v4 defineExpose 暴露，不再用 `$el` |

**mu-drawer**

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `v-model="visible"` | `v-model:visible="visible"` | |
| `position`（**默认 `right`**） | `position`（**默认 `bottom`**） | **必须显式检查**：v1 未写 position 的抽屉升级后会从底部滑出 |
| `mask`（String \| Boolean） | `mask`（Boolean） | |
| `margin` / `slot-wrapper` / `drawer-class` / `drawer-style` | 移除 | 用 `class`/`style` 透传或人工处理 |
| `mask-action` | `dismissible` | 同 dialog 默认值翻转 |

**mu-modal / mu-base-modal / mu-base-dialog / mu-dialog-wrapper / mu-prompt-panel**：v1 全局注册的公开组件（mu-prompt-panel 为 icon+标题+文案的内容面板），v4 不再提供；基于它们封装的自定义弹窗改用 `<mu-dialog>` 的 props/插槽重组，人工处理。

### 6.6 页签系

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `<mu-tabs v-model="activeTab">` | `<mu-tabs v-model:active-tab="activeTab">` | **必须加参数** |
| `@change` | `@update:active-tab` | payload 为 name 字符串（不变） |
| （无） | `@tab-click` | v4 新增，payload 为 name |
| `:tab-items="[...]"` | `:tab-buttons="[...]"` | 用 `<mu-tab-panel>` 声明式时无需此属性（两侧都自动收集） |
| tab item 对象 `{ name, label, icon, title, disabled }` | `{ name, caption, icon, disabled }` | `label` → `caption`；`title`（悬浮提示）v4 页签无对应，勿并入 caption |
| `tab-style="simple|card"` | `tab-style` | v4 值：`simple` / `lined-simple` / `card` / `button` / `small-button`；v1 `simple` 按视觉确认是否改 `lined-simple` |
| `tab-position="top|bottom|left|right"` | 同名 | |
| `model-control` | 移除 | 拦截切换改受控模式：`:active-tab` + `@update:active-tab` 回调中决定是否赋值 |
| `#header-prefix` / `#header-suffix` | `#tab-bar-prepend` / `#tab-bar-append` | |
| `<mu-tabs-header v-model="activeTab" :tab-items>` | `<mu-tab-bar v-model:active-tab="activeTab" :tab-buttons>` | 独立页签栏 |
| `<mu-tab-panel name="a" label="A">` | `<mu-tab-panel name="a" caption="A">` | |
| `@activated` / `@deactivated` | 移除 | 用 `@update:active-tab` 或 panel ref 的 `visible` |

### 6.7 下拉系

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `trigger-action="hover|click"` | `dropdown-trigger="hover|click"` | 默认 hover 不变 |
| 触发元素标记属性 `[dropdown-trigger]` | 移除 | v4 默认插槽整体为触发器；v1 靠该属性在多子元素中指定触发器的，需重组结构（人工） |
| `<template #dropdown>` 面板内容 | `:dropdown-items="[...]"`（推荐）或 `<template #dropdown-items>` | `#dropdown` 仅用于完全接管面板 |
| `<mu-dropdown-item label="x">` 手写列表 | dropdown-items 对象 `{ label, action }` | 手写组件仍可用，优先放 `#dropdown-items` 插槽 |
| `popup-style` | 无对应 | 人工确认 |
| `<mu-dropdown-panel>` 默认插槽手写内容 | `<mu-dropdown-panel :dropdown-items>` | v1 面板无 items 属性（内容仅经默认插槽传入）；v4 推荐 `:dropdown-items` |
| 面板定位 | 自动 | 两侧均自动计算，无需迁移 |

### 6.8 表格（重写）

v1 `<mu-table>` + `<mu-table-*-column>` 子组件列 → v4 `<mu-table :records :columns>` 数据驱动。**列定义必须逐列重写**。

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `:data="rows"` | `:records="rows"` | |
| `<mu-table-column field label width align>` | `columns: [{ field, caption, width, align, type }]` | `label` → `caption`；`type` 默认 `text` |
| `cell-text`（值或 fn） | `text` / `value`（fn） | |
| `cell-title` / `cell-class` / `cell-style` | `title` / `class` / `style`（fn） | |
| `cell-html` | 无对应 | 用列 items/自定义渲染（见 mussel-ui skill `references/components/data.md`） |
| `<mu-table-check-column>` | `{ type: 'check', field, headerCheckbox }` | |
| `<mu-table-button-column>` | `{ type: 'link', links: [{ caption, danger, disabled }] }` | 无 `action` 字段；点击统一 `@cell-item-click`（payload `{ record, column, link }`），v1 `@buttonclick` 改绑此事件 |
| `<mu-table-combo-column>` / `<mu-table-edit-column>` / `<mu-table-search-column>` | **无对应** | v4 无表格编辑/搜索列，需人工设计（弹窗编辑、行内自定义渲染） |
| `fixed="left"`（列固定） | 表级 `:fixed-left-columns="n"` | v1 另支持 `fixed="right"`，v4 仅左侧固定，右侧无对应 |
| `gridline="row|column|both|none"`（默认 row） | `gridlines="row|column|all|none"`（默认 all） | `both` → `all`；默认值变化 |
| `hover-mode` | 同名沿用 | 值域不变（none/row/column/cross/cell），默认 'row' |
| `row-height` / `selected-field` | 无对应 | `selected-field`（勾选列存储字段）与行高亮选中是两个概念：勾选用 check 列 `field`；行高亮用 `selected-record` / `selected-record-key` / `key-field` |
| 列类型 | v4 内置 `text` / `rec_no` / `check` / `bool` / `enum` / `date` / `datetime` / `number` / `currency` / `link` / `tag` / `img` | 可替代大量手写 cellText/cellHtml |

### 6.9 树

`<mu-tree>` 基本**不变**（v1 已是数据驱动，`data`/`props`/`buttons`/`checkbox`/`checked-nodes-keys`/`auto-expand-level`/`active-node`/`node-icons`/`expand-icons` 同名沿用；事件名 v1 为 kebab（`node-click`）、v4 emit 为 camel（`nodeClick`），模板 `@node-click` 因 Vue3 camelize 仍可用，`$on`/精确字符串匹配需改写）：

- `<mu-tree-nodes>` 在 v4 不再注册：直接使用过该内部标签的改为 `data` 驱动。
- `:cascaded-check="true"` 在 v4 已声明但未实现，可移除。
- 默认展开图标 v4 用 `treeNodeExpand` 语义（无需处理）；显式写过 `expand-icons="{ collapsed: 'dropdown', ... }"`（键为 `{ leaf, expanded, collapsed }`）的按第 5 节改名。
- 自定义过 `--mu-tree-node-*` CSS 变量的，v4 为 `--mu-tree_node-*`（连字符改下划线，padding 变量移除）。

### 6.10 列表 / 条栏 / 分页 / 日历 / 其他

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| `<mu-list-item value icon label selected active disabled trigger-icon>` | `<mu-list-item icon label tag>` | `value`/`selected`/`active`/`trigger-icon`/`icon-indent` 移除；选中/激活态用 `class` 自行控制；用 flex 容器包裹（v4 未注册 `mu-list`） |
| `<mu-list-divider>` | 同名 | |
| `<mu-bar>` | 同名 | |
| `<mu-paging-bar :page-count :page-index eof reload display-list>` | `<mu-pagination v-model:page-index :page-size :total>` | **模型重写**：v1 按页数（pageCount）驱动，v4 按总数（total/pageSize）派生页数；`eof`/`reload`/`display-list` 无对应；`page-size-options` v1 已有（displayList 模式），`quick-jumper` 为 v4 新增 |
| `<mu-calendar v-model :select-mode marked>` | `<mu-calendar v-model>` | `select-mode` → 见 v4 日历 API（mussel-ui skill `references/components/data.md`）；`range-start`/`range-end`/`marked` 核对 |
| `<mu-context-menu>` | `<mu-context-menu>` | 菜单项配置按 v4 dropdown-items 风格核对 |
| `<mu-scroll-box>` | `<mu-scroll-box>` | v1 基于 mussel-scrollbar 外挂实现，v4 内置，用法不变 |
| `<mu-expander v-model title>` | **无对应** | v1 为 Vue2 `model` 选项（prop `expanded`）；折叠面板自行实现（原子类 + 状态切换；无动画需求可用原生 `<details>`） |
| `<mu-sidebar-menu>` / `<mu-menu-group>` / `<mu-menu-item>` | **无对应** | 自行实现（原子类布局 + `mu-dropdown` / `mu-context-menu` 组合） |

### 6.11 命令式弹窗与通知

```js
// Mussel 1：顶层具名导出
import { alert, confirm, showMessage, notify } from '@mctech/mussel'

confirm('确认删除？', btn => { /* btn 通常为小写 id 字符串（'ok'/'cancel'/自定义 id），无 id 按钮才可能是对象 */ })
notify('warning', '保存失败', 3000, onClickHandler)  // v1 类型键为 INFO/SUCCESS/WARNING/ERROR，'warn' 会回退 INFO 样式

// Mussel 4：$mussel 上下文
const { messageBox } = inject('$mussel')
messageBox.confirm('确认删除？', trigger => {
  // trigger = 按钮 name 字符串，或 '$X' / '$MASK' / '$ESC'
})
messageBox.notify({ type: 'warn', message: '保存失败', duration: 3000 })
```

| Mussel 1 | Mussel 4 | 备注 |
|----------|----------|------|
| 顶层导入 `showMessage` / `alert` / `confirm` / `error` / `warn` / `notify` | `inject('$mussel').messageBox.*` | **组件外模块级调用**（无组件上下文）需从 app 实例取上下文，人工处理 |
| callback 参数 = 按钮对象（依赖 `btn.id` / `btn._rawData`） | callback 参数 = trigger 字符串（按钮 `name`，或 `'$X'`/`'$MASK'`/`'$ESC'`） | v1 遮罩/关闭按钮已触发 callback（`'$mask'`/`'$close'`），v4 触发值大写化；**ESC 触发为 v4 新增**，handler 需兼容；v4 预设 name 为大写（`'OK'`），与 v1 小写 `'ok'` 有大小写差异 |
| `showMessage({ title, message, danger, buttons, callback })` | `showMessage({ type, title, message, buttons, callback })` | `danger: true` → `type: 'error'` / `'warn'`（自动 danger 样式） |
| 预设按钮 `'OK'` / `'CANCEL'` / `'YES'` / `'NO'` | `'#OK'` / `'#CANCEL'` / `'#YES'` / `'#NO'`（新增 `'#CLOSE'`；`'#OK!'` 等 `!` 后缀为危险样式） | |
| 自定义按钮 `{ id, caption, buttonType: 'primary'|'danger', buttonStyle, action }` | `{ name, caption, color: 'primary'|'danger', buttonStyle, action }` | **`name` 必填**（否则 trigger 为 undefined）；`id` → `name`；`buttonType` → `color` |
| `notify(type, message, timeout, onClick)` | `notify({ type: 'alert'|'error'|'warn'|'success', message, duration, ... })` | `timeout` → `duration`（默认 3000）；`type` 值域变化（v1 的 info 等 → 近似映射）；点击回调（onClick）无对应 |

---

## 7. 无对应与移除项汇总

| Mussel 1 | 处理建议 |
|----------|----------|
| `mu-expander` | 自行实现折叠面板 |
| `mu-date-range-editor` | 两个 `mu-date-input` 组合 |
| `mu-split-button` | `mu-dropdown-button split-button` |
| `mu-button-editor` / `mu-popup-editor`（自定义编辑器基座） | `mu-dropdown-button`/`mu-dropdown-panel`/`mu-drawer` 组合，人工设计 |
| `mu-modal` / `mu-base-modal` / `mu-base-dialog` / `mu-dialog-wrapper` | 统一改用 `mu-dialog` |
| `mu-sidebar-menu` / `mu-menu-group` / `mu-menu-item` | 自行实现 |
| `mu-table-edit-column` / `-search-column` / `-combo-column` | v4 无编辑/搜索/下拉列，人工设计 |
| `mu-tree-nodes`（内部组件） | `data` 数据驱动 |
| `mu-option` 手写选项 | `options` / `dropdown-items` 驱动（mu-option v4 仍注册，select 家族内手写仍可用） |
| `PopupGroupMixin`（自定义弹层分组混入） | v4 弹层管理内置（dialog/drawer/dropdown-panel），自定义浮层人工迁移 |
| `scrollbar`（legacy 导出）与 `v-mussel-scrollbar` 选项对象 | 内置滚动条，`v-mu-scrollbar` 布尔控制 |
| `v-mussel-sticky` | 自行实现 |
| `setTheme` / `variables` 导出 | `install` 的 `colors` / `$mussel.setupColors` / CSS 变量 |
| `variables.js` 编译期配置（控件高度、字号、阴影等） | 覆盖对应 `--mu-*` CSS 变量 |
| `dropdown-trigger` 属性标记 | 重组触发器结构 |
| dialog `'|'` 按钮分隔符 | v1 `'-'`（占位）→ v4 `' '`；v1 `'|'`（分隔线）→ v4 `'-'`，字符含义互换 |
| EventInterceptor（`events` 导出） | v4 仍导出，核对用法 |

## 8. 新增能力

v1 无对应、迁移时可顺手用上的 v4 能力：

| 能力 | 说明 |
|------|------|
| `mu-select` / `mu-multi-select` | 下拉单选/多选（替代 combo-box 部分用法） |
| `mu-segmented` | 分段选择器（可替代 toggle 双按钮模式） |
| `mu-check-group` / `mu-radio-group` 的 `:options` | 数据驱动选项组 |
| 数据驱动 `<mu-form :model :items>` | 简单表单免手写 form-field |
| `mu-table` 列类型 | `enum`/`tag`/`currency`/`date` 等替代手写 cellText |
| `mu-toolbar` / `mu-bar` / `mu-scroll-area` | 工具栏/条形容器/单轴滚动区 |
| `mu-split-h-box` / `mu-split-v-box`（`collapsible`） | 可收拢分隔布局 |
| `mu-status-box` / `mu-tags` / `mu-badge` / `mu-icon-button` 增强 | 占位图/标签组/徽章 |
| 原子类体系 | `flex`/`p-*`/`text-*`/`border-*`/`gap-*` 等（早期 v1 项目首次可用） |
| `dark: 'auto'` 暗色模式 / `locale` 多语言 | `install` options |
| `mu-dropdown` 的 `dropdown-items` 三区结构（header/items/footer 插槽） | 面板结构化 |

---

## 升级检查清单（全量完成后逐条核对）

- [ ] 无 `@mctech/mussel` 导入残留；`install(app, {...})` 已配置 colors/locale/icons
- [ ] 无 `new Vue(` / `Vue.use(` / `.sync` / `slot-scope` / `$listeners` / filter 残留
- [ ] 所有弹窗 `v-model:visible`；需要遮罩关闭的已显式 `dismissible`
- [ ] 所有页签 `v-model:active-tab`
- [ ] 编辑器事件已改名（`@enter`/`@esc`），`@input` 处理器已适配原生 Event
- [ ] 需要 `clearable` 的输入已显式声明
- [ ] 抽屉显式声明了 `position`（v1 默认 right → v4 默认 bottom）
- [ ] 图标名已按第 5 节映射（重点：`x`→`X`、`ok`→`check`、`dropdown`→`chevronDown`）
- [ ] late-v1 的 `mu-text-*` / `mu-background-*` / `mu-bordered` / `mu-divider` 类与 `margin=`/`padding=`/`border` 属性选择器已替换
- [ ] `<mu-space>`/`<mu-flex-item>`/`<mu-splitter>` 已替换为 v4 等价物；转 div 的 ref 已去 `.$el`
- [ ] messageBox 调用已走 `inject('$mussel')`，callback 兼容 `'$X'`/`'$MASK'`/`'$ESC'`
- [ ] `mu-pagination` 已按 total/pageSize 重写
- [ ] CSS 选择器已适配 BEM 双下划线类名（`.mu-dialog__body` 等）与属性绑定层级变化
