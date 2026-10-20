# Demo 整体重构方案

> 状态：最终版（v3，主智能体复核，2026-10-20）
> 范围：`demo/` 目录重组、首页重建、公共版式、vite.demo.config.js 改造。仅方案，暂不实施。
> 修订依据：仓库现状核对，以及最小构建实验（Vite 8.1.4 / Rolldown，与项目依赖 `vite: ^8.0.3` 同大版本）验证多级入口、CSS 产物命名、serve-handler 二级路径行为。

## 1. 目标与定位

demo 承担两个职责：

1. **开发验证**：mussel 自身开发过程中验证组件行为（含边界场景回归）；
2. **用法参考**：外部开发者学习 mussel 用法的入口。

重构后须满足：

- 目录按组件分类组织，URL 有语义、可预测；
- 单页聚焦单一主题，内容从简单到复杂循序渐进；
- 页面骨架、版式、深浅色切换全站统一；
- 组件用法覆盖尽可能完整（对齐 `src/components/` 全量导出）。

## 2. 现状问题

### 2.1 目录与组织

- 22 个页面扁平堆在 `demo/src/` 下，无分类；
- 命名混杂：组件名（`button`）、场景名（`selection` 实为 check/radio/switch/segmented）、编号名（`complex-1`）、工具名（`grid-designer`）并存；
- 一页多组件混杂：`combo-box` 页装了 select/multi-select/search-input/input-group；`dropdown` 页装了 context-menu/tooltip/toolbar/list-divider；`calendar` 页装了 date-input/date-range-input/time-input；`tabs` 页装了 combo-box/input/dropdown-button。

### 2.2 覆盖缺口

`src/components/index.js` 的 install 路径共注册 65 个组件导出（含 `MuTreeNode`、`MuFlexDivider/Space/Break` 等功能性导出），另有 `v-mu-scrollbar`、`v-mu-tooltip` 指令与 `$mussel.messageBox` JS API。对照 `demo/src/` 现有页面：

- 完全无 demo：`mu-badge`、`mu-tags`、`mu-bar`、`mu-scroll-area`、`mu-list-item`、`mu-color-input`、`mu-h-box`；
- 仅在其他页顺带出现、无独立覆盖：`mu-pagination`（table 页）、`mu-list-divider`（dropdown 页）、`mu-tooltip`（dropdown 页）、`mu-flex-divider`（dropdown 页）、`mu-flex-space`（tabs 页）、`mu-flex-break`（form 页）、`mu-toolbar`（dropdown/tabs 页）；
- `mu-icon`、`mu-sort-icon`（icon 体系，含 `installIcons` 用法）无独立页；
- 日历类只覆盖 input 形态：`calendar` 页实际包含 `mu-date-input` 的 date/week/month/quarter/year 类型、`mu-date-range-input`、`mu-time-input`，但 `mu-calendar` 本身仅有一个最小示例；
- 内部/未注册组件不计入覆盖：`MuList`（`list.vue` 未导出）、`menu-item`/`popup-menu`、`splitter`、`tab-button`、`combo-wrapper`、calendar 下的 7 个 picker 子组件、`MuSvgStripe`（`svg` 模块未安装）。这些不得以 `mu-*` 公开组件名义单独成页，只能通过公开父组件或直接按源码路径引用（并在页面标注“内部组件”）。

### 2.3 首页与版式

- 根首页是手写静态 HTML（约 20K，内联全部样式 + Google Fonts import），新增页面须手工加卡片，与页面目录无联动；
- 页面版式各自为政：部分用 `h2/h3 + .group`，部分用 `mu-bar` 页头；theme-switch 组件以插槽形式散落在各页 h2 里；
- 内容量极不均衡：`complex-1` 675 行 vs `grid-layout` 55 行。

## 3. 总体设计

### 3.1 目录结构（分类/页面 两级）

```
demo/src/
├── catalog.js            # 全站页面清单（单一事实源，见 3.3）
├── common/               # 共享基础设施
│   ├── app.js            # 应用引导（保留现状）
│   ├── template.html     # 页面 HTML 模板（改为占位符，见 3.2）
│   ├── theme-switch.vue  # 深浅切换（保留，挂入统一页头）
│   ├── demo-page.vue     # 统一页面骨架（见 3.5）
│   ├── demo-section.vue  # 统一章节容器（见 3.5）
│   └── style.css         # 全站版式样式（扩展现有内容）
├── home/                 # 首页（Vue 入口，替代手写 index.html）
│   ├── main-view.vue
│   └── main.js
├── basics/               # 基础元素：icon、badge/tags
├── buttons/              # 按钮：button、button-group/icon-button
├── form/                 # 表单输入与表单（含 date/time/date-range input）
├── data/                 # 数据展示：table、tree、list、collapse、calendar
├── navigation/           # 导航：tabs、menu、side-menu、pagination
├── feedback/             # 反馈：message、status-box、tooltip
├── overlay/              # 弹层：dropdown、context-menu、dialog、drawer
├── layout/               # 布局与滚动：box、split-box、grid-box、bar、scrollbar
└── advanced/             # 进阶专题与综合案例：colors、gesture、case-form、case-grid-designer
```

共 9 个分类、40 个页面 + 首页。`calendar` 不单独设分类（仅 1 页，归入 `data/`，与 `skills/mussel-ui/references/data.md` 的归类一致）。URL 与目录一致：`/form/input/`、`/overlay/dialog/`。页面目录内仍为 `main-view.vue + main.js`，构建产物 `demo/dist/<分类>/<页面>/`。

### 3.2 vite.demo.config.js 改造

现状：`readdirSync(demo/src)` 扫一层目录找 `main.js` 作 input；`copyHtmlFiles` 按目录名生成标题；根 `index.html` 由 `copyFileSync` 复制。

改造点：

1. **input 来源改为 catalog.js + home + 迁移期旧页兜底**：
   - `input` key 直接取 catalog 中的路径（如 `form/input`）与 `home`；
   - 迁移期（批次 0-7）额外扫描 `demo/src/<name>/main.js` 的一层旧目录，保留旧页面可访问，直到对应批次删除；`home/` 有 `main.js` 但属于固定入口，必须从旧页扫描中排除；批次 8 移除兜底扫描；
   - 不再用 `readdirSync` 作为唯一 input 来源。

2. **多级 input key 已验证可行**：Vite 8.1.4（Rolldown）下 `entryFileNames: '[name]/main.js'` 对 key `form/input` 实际输出 `dist/form/input/main.js`，无需自定义函数或替代方案。

3. **CSS 产物路径必须改**（v1 的“实施时验证”是硬伤）：
   - 实测 Vite 传给 `assetFileNames` 的 `assetInfo.name` 是**去掉目录后的 basename**（`form/input` 入口的 CSS 仍是 `input.css`），现有 `${name.replace('.css', '')}/style.css` 会输出 `dist/input/style.css`，与页面目录不符；
   - 改为用 `assetInfo.originalFileName`（实测为 `demo/src/form/input/main.js`，Vue SFC scoped style 同样如此）反推页面目录：

```js
import { relative, resolve } from 'node:path'

// output.assetFileNames
const name = assetInfo.name || ''
if (!name.endsWith('.css')) return 'assets/[name].[ext]'

const original = assetInfo.originalFileName || ''
const rel = relative(demoSrcDir, resolve(__dirname, original)).replace(/\\/g, '/')
const isPageCss = rel.endsWith('/main.js') && !rel.startsWith('..')
return isPageCss
  ? `${rel.slice(0, -'/main.js'.length)}/style.css`
  : 'assets/[name].[ext]'
```

   共享的 `app.css`（`common/app.js` 引入）仍走 `assets/[name].[ext]`；`originalFileName` 缺失或落在 `demo/src` 外时回退 `assets/`，不按 basename 猜目录。

4. **copyHtmlFiles 具体改法**：
   - 迭代 `Object.keys(input)`（含 catalog 页、home、旧页），不再迭代 `demoModules`；
   - 标题：catalog 路径查 title，旧页回退现有 `split('-')` 首字母大写逻辑，home 用固定标题；
   - `template.html` 改为占位符，按页面所在深度注入根前缀，解决二级页面 `../favicon.svg`、`../assets/app.css` 指向错误目录的问题（`{{root}}` 会出现多次，必须用 `replaceAll` 或全局正则，不能沿用单次 `replace`）：

```html
<link rel="icon" href="{{root}}favicon.svg">
<link rel="stylesheet" href="{{root}}{{appCss}}">
<link rel="stylesheet" href="{{pageCss}}">
<script type="module" src="{{pageJs}}"></script>
```

   - 普通页：`root = '../'.repeat(path.split('/').length)`，`pageCss = './style.css'`，`pageJs = './main.js'`；
   - 旧页（一层）：`root = '../'`；home：只生成 `dist/index.html`，`root = ''`，`pageCss = './home/style.css'`，`pageJs = './home/main.js'`；
   - `pageCss` 仅在 bundle 中存在对应 `<path>/style.css`（home 为 `home/style.css`）时输出 `<link>`，避免无样式页面产生 404；`pageJs` 必须存在；
   - `appCss` 从 bundle 中取 `assets/app.css` 的 `fileName`；取不到时直接报错（不允许写入空 `href`）；
   - `mkdirSync(..., { recursive: true })` 已支持多级，保留；删除现有 `demo/src/index.html` 的 `copyFileSync` 逻辑。

5. **serve-handler cleanUrls 已验证**：`/form/input/`、`/form/input` 均返回 200 并命中 `form/input/index.html`，无需改。内部链接统一带尾斜杠（`/form/input/`）；不要链接到 `index.html`（cleanUrls 会 301 到无扩展路径）。

6. **watch 注意事项**：input 在 config 加载时枚举，catalog 增删页面或新增目录都需重启 `npm run demo:build`（现有 pitfall 只写了新增目录，catalog 驱动后同样适用）。

### 3.3 catalog.js — 单一事实源

纯数据模块（无 Vue 依赖、无 Vite 特定语法，可被 vite config 与页面同时 import）：

```js
export const catalog = [
  { category: 'basics', title: '基础元素', desc: '图标、徽标等基础元素', pages: [
    { path: 'basics/icon', title: 'Icon 图标', desc: 'mu-icon / mu-sort-icon / installIcons' }
    // ...
  ]},
  // ...
]
```

职责：

- 首页渲染分类卡片导航（分类标题/描述 + 页面列表）；过滤/搜索为可选项，不引入额外依赖；
- vite config 生成 input（catalog 页 + home + 迁移期旧页）与各页 HTML 标题；
- `demo-page.vue` 计算面包屑、上一页/下一页导航；
- 构建时校验：
  - catalog 中每个 path 必须存在对应 `main.js`，否则 config 加载阶段直接抛错；
  - path 不得重复，且必须以声明的 category 开头；
  - 扫描 `demo/src/*/*/main.js`，存在但未登记的目录给出警告；迁移期旧页是一层目录，不参与该扫描，批次 8 移除旧页后才开启“未登记警告”；
- `demo-page` 收到未知 path 时在控制台警告，避免面包屑静默为空。

注意：catalog 是 config 的加载期依赖，修改 catalog 后必须重启 demo watch（见 3.2 第 6 点）。

### 3.4 首页（home）

- Vue 入口，安装 mussel 后用库自身组件构建；根元素由 `install` 在 `document.body` 上添加 `.mu-root`，home 不再嵌套第二个 `.mu-root`（避免 `theme-switch` 的 `querySelector('.mu-root')` 选错节点）；
- 结构：顶部 logo/版本/主题切换 + 分类区块卡片导航（分类标题、描述、页面列表），链接统一 `/category/page/`；
- 首页不是 catalog 页面：catalog 只登记 40 个内容页；home 作为独立入口，由 `copyHtmlFiles` 生成 `dist/index.html`（见 3.2）；
- 保留现有首页的 hero 气质但大幅精简，移除 Google Fonts import（内网/离线环境会阻塞），改系统字体栈；
- 卡片从 catalog 渲染，新增页面零手工维护。

### 3.5 统一版式组件

**demo-page.vue**（页面骨架）：

- props：`path`（对应 catalog 路径，用于查标题/面包屑/上下页）；
- `fluid`（案例页专用：内容区全宽/全高，不做 max-width 与卡片包裹；页头仍统一，案例自身可保留内部布局）；
- 结构：`position: sticky` 顶部 bar（返回首页链接、`分类 > 页面标题`、theme-switch）+ 内容区（居中、max-width）+ 底部上一页/下一页；
- 内容区只允许放 `demo-section`（`fluid` 案例页可放案例自有布局），页面模板不再写 `h2/h3` 或自建 `.group`；
- 不添加 `.mu-root`（同 3.4），主题切换作用于 `document.body`。

所有页面模板统一为：

```vue
<template>
  <demo-page path="form/input">
    <demo-section title="基础用法" note="最小可用示例" :code="basicCode">
      ...
    </demo-section>
    <demo-section title="属性与变体" note="输入框类型、尺寸与状态">
      ...
    </demo-section>
  </demo-page>
</template>
```

**demo-section.vue**（章节容器）：

- props：
  - `title`、`note`（一句话说明；交互示例的 `note` 必须写清触发方式与预期结果，如“点击按钮打开弹窗，ESC 关闭”）；
  - `vertical`（示例纵排，默认横排 wrap）；
  - `wide`（宽示例占满内容区，用于 table/calendar/长工具栏）；
  - `regression`（布尔，渲染“回归”标签，固定排在页面末尾）；
  - `code`（可选字符串，渲染折叠的“查看代码”块）；
- 渲染：编号（CSS counter，不手写）+ 标题 + 说明 + 卡片化示例区 + `details > pre > code` 代码块；
- 代码块规范：只给每页“基础用法”section 写最小可复制片段，必须包含最小状态声明或明确标注 `v-model` 绑定值；代码与示例同改同审，不允许只改示例不改代码块；不承诺全页代码自动同步（demo 保持静态示例，不做在线编辑）。
- 所有交互型示例（弹层、下拉、手势、拖拽、异步消息）必须有可触发控件与操作提示，不允许“加载即出现、无法复现”的示例。

**style.css 扩充**：页面/章节排版、示例卡片、`demo-row`/`demo-col` 等辅助类、代码块与回归标签样式，全部使用 `--mu-*` 变量保证深浅色一致；数值间距优先复用原子类，不新增硬编码颜色。

### 3.6 深浅色切换

- 保留现有机制：`install` 在 `document.body` 添加 `.mu-root`，theme-switch 切换 `mu-dark` 类 + localStorage 持久化；
- theme-switch 固定挂载在 demo-page 页头与首页头部，不再由各页面自行摆放；
- 页面与示例不得自行添加 `.mu-root`，否则 theme-switch 可能切换到错误的根节点；
- 每个新页验收时至少在深浅两种模式下检查一次卡片、文字、边框与弹层。

### 3.7 页面内容规范

每页内容按以下顺序组织 section（循序渐进，缺省可省略后面的）：

1. 基础用法（最小可用示例 + 该页唯一必需代码块）
2. 属性与变体（类型/风格/尺寸/色彩等枚举）
3. 插槽与自定义
4. 受控与事件（v-model、程序化操作）
5. 边界与回归场景（disabled、空数据、异常态；标注 `regression`，固定置于页末）

约束：

- **section 数优先**：组件页 ≤ 8 个 section；案例页（`advanced/case-*`）≤ 12 个；色板页（`advanced/colors`）按数据循环组织但同样 ≤ 8 个 section。模板行数辅助控制：组件页 ≤ 350 行；案例页与数据驱动色板页不受行数限制。
- **拆分触发**：超过 section 上限按维度拆页，拆页需同步 catalog 并在本方案页面清单中登记。`form/date-input`、`form/date-range-input`、`form/time-input` 已在清单中预拆；`form/selection`（6 个控件）若实施时超过 8 节，拆为 `form/check-radio` + `form/switch-segmented`。
- 页面标题用「组件名 + 中文名」格式（如 `Input 输入框`），section 标题用中文短语，放弃当前全大写英文风格。
- 回归/边界场景保留内容但收编为页末一个 `regression` section，内部可用子分组承载多个用例（如 collapse 页原 12 组），不再出现“12 个 section”与“≤8 节”并存的矛盾；确实无法收编时再拆独立回归页。
- 交互示例必须给出操作提示；弹层/下拉示例要固定触发按钮，不依赖页面加载时自动打开。
- 示例代码只展示基础用法，放在 `demo-section` 的折叠块中；页面私有状态、异步数据不在代码块里伪装成可直接运行。
- 深浅色、窄视口（< 900px）下示例卡片不得溢出；宽表示例使用 `wide` 或内部横向滚动。
- 不引入页面级布局组件（除 demo-page/demo-section），保证全站版式一致；案例页（#39/#40）使用 `demo-page` 的 `fluid` 模式，保留案例自身布局，但页面顶栏与 theme-switch 由 demo-page 统一提供，不重复自建。

## 4. 目标页面清单

来源标注：迁移 = 从现有 demo 页迁移改造；新建 = 补覆盖缺口；重组 = 现有多页内容重新分配。

**覆盖核对**：`src/components/index.js` 注册 65 个组件导出（含 `MuTreeNode`、`MuFlexDivider/Space/Break` 等功能性导出），下表覆盖全部 65 个；另覆盖 `v-mu-scrollbar`、`v-mu-tooltip`、`$mussel.messageBox`、`installIcons`、`EventInterceptor` 与 `--mu-*` 色彩系统。未注册/未导出的内部组件不单独成页：`MuList`、`menu-item`、`popup-menu`、`splitter`、`tab-button`、`combo-wrapper`、calendar 的 7 个 picker 子组件、`MuSvgStripe`；`MuTreeNode` 虽有导出但依赖 MuTree 上下文，仅通过 `MuTree` 插槽演示。

| # | 路径 | 标题 | 覆盖组件/主题 | 来源 |
|---|------|------|--------------|------|
| 1 | `basics/icon` | Icon 图标 | MuIcon、MuSortIcon、installIcons、icons | 新建 |
| 2 | `basics/badge` | Badge/Tags 徽标与标签 | MuBadge、MuTags（max/expandable/removable/tooltip） | 新建 |
| 3 | `buttons/button` | Button 按钮 | MuButton（类型/风格/色彩/状态/尺寸/图标） | 迁移 button 页 |
| 4 | `buttons/group` | ButtonGroup 按钮组 | MuButtonGroup、MuIconButton | 迁移 button 页后半 |
| 5 | `form/input` | Input 输入框 | MuInput、MuInputGroup、MuSearchInput | 重组（input 页 + combo-box 页拆出） |
| 6 | `form/selection` | 选择控件 | MuCheck/CheckGroup、MuRadio/RadioGroup、MuSwitch、MuSegmented | 迁移 selection 页 |
| 7 | `form/select` | Select 选择器 | MuSelect、MuMultiSelect、MuOption | 重组（combo-box 页拆出） |
| 8 | `form/combo-box` | ComboBox 组合框 | MuComboBox（可编辑/远程搜索/自定义下拉） | 迁移 combo-box 页 |
| 9 | `form/color-input` | ColorInput 颜色输入 | MuColorInput（色板/格式/清空/禁用） | 新建 |
| 10 | `form/date-input` | DateInput 日期输入 | MuDateInput（date/week/month/quarter/year、format、value-type、min/max） | 重组 calendar 页 |
| 11 | `form/date-range-input` | DateRangeInput 日期范围 | MuDateRangeInput（范围面板/字符串值/清空） | 重组 calendar 页 |
| 12 | `form/time-input` | TimeInput 时间输入 | MuTimeInput（时/分/秒、步进、格式） | 重组 calendar 页 |
| 13 | `form/form` | Form 表单 | MuForm、MuFormRow、MuFormField（布局/校验/联动） | 迁移 form 页 |
| 14 | `data/calendar` | Calendar 日历 | MuCalendar（week-starts-on、min/max、value-type/value-format、月份切换） | 迁移 calendar 页（仅日历部分） |
| 15 | `data/table` | Table 表格（基础） | MuTable：列定义、样式、事件 | 迁移 table 页 |
| 16 | `data/table-advanced` | Table 表格（进阶） | 选择、自定义渲染、分页联动（按 table.md API 全量梳理） | 新建 |
| 17 | `data/tree` | Tree 树（基础） | MuTree、MuTreeNode（导出但仅内部节点渲染，不单独使用）、数据结构、图标、自定义节点插槽（原 1-7 节） | 迁移 tree 页 |
| 18 | `data/tree-advanced` | Tree 树（进阶） | 懒加载、checkbox、右键菜单（原 8-14 节） | 迁移 tree 页 |
| 19 | `data/list` | List 列表 | MuListItem、MuListDivider（MuList 未导出，不演示） | 新建（含 dropdown 页 list-divider 用例） |
| 20 | `data/collapse` | Collapse 折叠面板 | MuCollapse、MuCollapseGroup（原 12 组回归场景收编为 1 个 regression section） | 迁移 collapse 页 |
| 21 | `navigation/tabs` | Tabs 标签页 | MuTabs、MuTabBar、MuTabPanel（tab-button 内部；剥离 toolbar） | 迁移 tabs 页 |
| 22 | `navigation/menu` | Menu 菜单 | MuMenu（menu-item/popup-menu 为内部组件，不单列） | 迁移 menu 页 |
| 23 | `navigation/side-menu` | SideMenu 侧边菜单 | MuSideMenu | 迁移 side-menu 页 |
| 24 | `navigation/pagination` | Pagination 分页 | MuPagination | 重组（table 页拆出） |
| 25 | `feedback/message` | Message 消息 | `$mussel.messageBox`：alert/confirm/error/warn/showMessage/notify/dismiss | 迁移 message 页（剥离 status-box） |
| 26 | `feedback/status-box` | StatusBox 状态块 | MuStatusBox（icon/插槽/尺寸） | 重组（message 页拆出） |
| 27 | `feedback/tooltip` | Tooltip 提示 | MuTooltip、v-mu-tooltip（placement/trigger/arrow/富内容） | 重组（dropdown 页拆出） |
| 28 | `overlay/dropdown` | Dropdown 下拉 | MuDropdown、MuDropdownButton、MuDropdownPanel、MuDropdownItem、MuDropdownCheckItem、MuDropdownRadioItem | 迁移 dropdown 页（剥离 tooltip/toolbar/list-divider） |
| 29 | `overlay/context-menu` | ContextMenu 右键菜单 | MuContextMenu | 重组（dropdown 页拆出） |
| 30 | `overlay/dialog` | Dialog 对话框 | MuDialog（基础/确认/表单嵌套/可调整尺寸） | 重组（modal 页拆出） |
| 31 | `overlay/drawer` | Drawer 抽屉 | MuDrawer（方向/尺寸/嵌套/resizable） | 重组（modal 页拆出） |
| 32 | `layout/box` | Box 布局盒 | MuHBox、MuVBox、MuFlexDivider、MuFlexSpace、MuFlexBreak + flex 原子类 | 重组（flex-layout 页拆出） |
| 33 | `layout/split-box` | SplitBox 分割 | MuSplitHBox、MuSplitVBox（splitter 内部组件） | 重组（flex-layout 页拆出） |
| 34 | `layout/grid-box` | GridBox 网格 | MuGridBox、MuGridCell + grid 原子类 | 迁移 grid-layout 页 |
| 35 | `layout/bar` | Bar 工具栏 | MuBar、MuToolbar、MuScrollArea | 重组（tabs/dropdown 页拆出 toolbar；scroll-area 新建） |
| 36 | `layout/scrollbar` | Scrollbar 滚动 | MuScrollBox、v-mu-scrollbar | 迁移 scrollbar 页 |
| 37 | `advanced/gesture` | Gesture 手势 | EventInterceptor（tap/press/pan） | 迁移 gesture 页 |
| 38 | `advanced/colors` | 颜色系统 | `--mu-*` CSS 变量、色板层级、`colors` 导出（`setupColors` 非公开导出，不写） | 迁移 color 页 |
| 39 | `advanced/case-form` | 案例：综合表单 | 表单/弹窗/表格联动场景 | 迁移 complex-1 页改名 |
| 40 | `advanced/case-grid-designer` | 案例：网格设计器 | grid-box 综合应用 | 迁移 grid-designer 页改名 |

共 40 页（含首页 41 个构建入口）。页面数控制：40 为基线；若某页触发 3.7 的拆分条件（如 `form/selection`），允许拆页并同步更新本清单，基线最多约 42 页；除此之外不新增主题页，新需求先并入同族页。

薄页/重页处理：

- 薄页：`data/list` 若不足 3 个 section，取消独立页，`mu-list-item`/`mu-list-divider` 用例并入 #28 `overlay/dropdown`（dropdown-items 的数据结构直接使用这两个组件）；`basics/badge` 已与 tags 合并，不再单独拆 badge。
- 重页：`form/select`（3 个组件）若超过 8 个 section，按组件拆为 `form/select` + `form/multi-select`；`layout/bar` 若超过 8 个 section，把 `MuScrollArea` 移入 #36 `layout/scrollbar`（滚动类聚合），不新增页面；`form/date-input`/`date-range-input`/`time-input` 已预拆。
- 页面合并/拆分只在同一分类内进行，跨分类合并（如 list 并入 dropdown）仅作为薄页兜底，需在 catalog 中保留最终路径。

分类归属说明（有意与 references 不同的项）：

- `badge` 与 `tags` 合并为 `basics/badge`，避免只包一层 `div` 的 badge 单独成页过薄；页面内按 Badge、Tags 两个 section 组织，tags 的数据展示属性在页内说明。
- `calendar` 归 `data/`（references/data.md 同样归 data），不单设分类。
- `pagination` 归 `navigation/`（按导航语义），references 归 data；页面需同时覆盖 table 分页联动（#16）。
- `tabs` 归 `navigation/`、`dropdown/context-menu` 归 `overlay/`（按导航/弹层语义），references 分别归 containers/navigation；demo 以交互形态优先。

与 `skills/mussel-ui/references` 分类的对应关系：basics≈basic，buttons≈buttons，form≈form（date/time 输入在 form，日历面板归 data），data≈data，navigation≈navigation，feedback≈feedback，overlay≈containers 中的弹层部分，layout≈containers/layout 中的布局部分。不强求一致，demo 以“同族组件聚合一页、单页单一主题”为准。

## 5. 实施批次

每批独立提交。批内流程：停掉旧 watch → 建新页/改 catalog → 重启 `npm run demo:build` → 本地验证 → 删除该批不再被依赖的旧页 → 再次验证 → 提交。迁移期 input 仍保留一层旧页兜底（见 3.2），因此未迁移页面不会在批次 0 就失效。

| 批次 | 内容 | 页面 |
|------|------|------|
| 0 | 基础设施：catalog.js、vite.demo.config.js 改造（含 CSS 路径修复、模板占位符、home 根 HTML）、demo-page/demo-section、style.css 扩充、home 首页；迁移一个简单页验证骨架；home 验证通过后删除手写 `demo/src/index.html` 及其复制逻辑；更新 README 基础说明 | home + #3 |
| 1 | basics + buttons 收尾 | #1 #2 #4 |
| 2 | form 第一批（输入/选择/下拉/组合框/颜色） | #5 #6 #7 #8 #9 |
| 3 | form 第二批 + 日历面板 | #10 #11 #12 #13 #14 |
| 4 | data（表格/树/列表/折叠/分页） | #15 #16 #17 #18 #19 #20 #24 |
| 5 | navigation + feedback（不含 pagination） | #21 #22 #23 #25 #26 #27 |
| 6 | overlay | #28 #29 #30 #31 |
| 7 | layout（含从 tabs/dropdown 剥离的 toolbar） | #32 #33 #34 #35 #36 |
| 8 | 收尾（颜色系统 + advanced）+ 全量清理：移除旧页兜底扫描、删除全部旧目录、README 重写、catalog 校验通过 | #37 #38 #39 #40 |

### 5.1 旧页删除时机

旧页必须在“其全部内容对应的新页”建成后删除；跨批次依赖如下（尤其 tabs/dropdown 的 toolbar 内容要到批次 7 才用完）：

| 旧页 | 去向 | 删除批次 |
|------|------|----------|
| `index.html` | home | 0 |
| `button` | #3、#4 | 1 |
| `input` | #5 | 2 |
| `selection` | #6 | 2 |
| `combo-box` | #7、#8 | 2 |
| `form` | #13 | 3 |
| `calendar` | #10、#11、#12、#14 | 3 |
| `table` | #15、#16、#24（pagination 用例） | 4 |
| `tree` | #17、#18 | 4 |
| `collapse` | #20 | 4 |
| `menu` | #22 | 5 |
| `side-menu` | #23 | 5 |
| `message` | #25、#26 | 5 |
| `modal` | #30、#31 | 6 |
| `tabs` | #21（toolbar 内容 → #35） | 7 |
| `dropdown` | #27、#19（list-divider）、#28、#29（toolbar/flex-divider → #35） | 7 |
| `flex-layout` | #32、#33 | 7 |
| `grid-layout` | #34 | 7 |
| `scrollbar` | #36 | 7 |
| `gesture` | #37 | 8 |
| `color` | #38 | 8 |
| `complex-1` | #39 | 8 |
| `grid-designer` | #40 | 8 |

批次 8 结束时 `demo/src/` 只允许保留 `catalog.js`、`common/`、`home/` 与 9 个分类目录，不允许残留一层旧页目录。

## 6. 验证方式

- 每批重启 `npm run demo:build`（catalog 变更、新增目录都不会被现有 watch 跟踪，见 pitfall `demo-watch-new-entry-restart`），确认产物与 `:3000` 可访问；
- 批次 0 重点验证构建骨架：
  - `/buttons/button/` 返回 200，`dist/buttons/button/main.js`、`dist/buttons/button/style.css` 存在且被 HTML 正确引用；
  - 页面 HTML 中 `favicon`、`assets/app.css` 使用 `../../` 前缀且返回 200；
  - `dist/index.html` 引用 `home/main.js`、`home/style.css`、`assets/app.css`，首页可交互；
  - 旧页（一层目录）仍可访问，证明迁移期兜底 input 生效；
- 每批用 playwright 访问新页做 DOM 断言（标题、组件渲染、交互触发、深浅切换类切换），不使用截图断言；
- 批次 8 全量走查：从 catalog 生成 URL 清单，逐个 fetch 断言 200；解析每页 HTML 的 `link[href]`/`script[src]` 断言资源 200；`dist/assets` 下每个 CSS 必须被至少一个页面链路引用（防止共享 CSS 未链接导致样式缺失）；
- 检查 `demo/src/` 无一层旧页目录、catalog 与目录一一对应；
- watch 重建会清空 `demo/dist`（pitfall `demo-watch-wipes-dist`），验证期间不手工放置临时资产；
- 页面在窄视口（约 800px）与深色模式下各抽查一次，确认无横向溢出、弹层可读；
- playwright 若生成 `.playwright-mcp/`，按项目规范放入 `.gitignore`（内容 `*` + `!.gitignore`），不提交验证产物。

## 7. 风险与注意事项

1. **多级入口已排除风险**：`entryFileNames: '[name]/main.js'` 在多级 key 下实测输出 `form/input/main.js`，方案不再保留“实施时验证”的不确定项。
2. **CSS 产物路径已定位并给出修复**：Vite 的 `assetInfo.name` 只含 basename，原逻辑会把二级页面 CSS 写到 `dist/<page>/style.css`；按 3.2 用 `originalFileName` + `relative(demoSrcDir, …)` 反推目录。实施时必须用仓库根为 Vite root 的路径（`demo/src/...`）验证，不能沿用实验中的 `src/...` 前缀。
3. **模板相对路径**：二级页面沿用现有 `../` 模板会导致 favicon/app.css 404，必须按 3.2 注入 `{{root}}`；home 的 `pageCss/pageJs` 指向 `home/` 子目录，不能套普通页模板。
4. **迁移期 input 兜底**：catalog 不能作为批次 0 的唯一 input，否则未迁移旧页立即 404；批次 0-7 保留一层旧页扫描，批次 8 移除。
5. **catalog/目录变更需重启**：watch 不跟踪新增目录，catalog 是 config 加载期依赖；每次增删页面后重启 demo:build。
6. **旧 URL 引用**：`agent-docs` 下历史方案/交接文档仍引用 `/dropdown/`、`/message/` 等旧 URL；本方案 5.1 + 第 4 节路径表已给出旧→新对应关系，历史文档按归档处理，不批量改写，但新验证不得再引用旧 URL。
7. **共享 CSS 漏链**：现有构建只有 `assets/app.css` + 每页 `style.css`；若多入口拆分出其他共享 CSS，必须补进模板或调整 `cssCodeSplit`，批次 0 与批次 8 都要检查。
8. **页面 basename 冲突**：CSS 资产名取自入口 basename；新增页面避免与现有页面同名（如再出现一个 `input`）。即使 `assetFileNames` 用 `originalFileName` 映射，同名入口仍可能触发 Vite 资产名冲突，不作为支持场景。
9. **主题根节点**：`theme-switch` 用 `document.querySelector('.mu-root')`；页面/首页不得再包一层 `.mu-root`，否则深浅切换可能作用到错误节点。
10. **页面数量膨胀**：40 页为基线；除 3.7 触发的同族拆分（如 `form/selection`、`form/select`）外不再新增页，内容过多优先合并 section 或拆同族维度；`advanced/case-*` 行数上限豁免但 section 仍 ≤12。
11. **迁移等价性**：迁移现有内容时保持行为等价，不做功能性改写；版式、章节标题、拆分可调整；案例页移除自建顶栏/主题开关、改用 demo-page `fluid` 属于版式统一，不算功能改写；需要新增覆盖时只补示例，不改 `src/`。
12. **文档同步**：批次 8 完成后更新 `demo/README.md`；`skills/mussel-ui`、`docs-site`、`docs/` 不受影响（demo 不在文档同步范围）。`demo/README.md` 现有 `npm run build:demo` 与 `ButtonDemo.vue` 描述已过时，批次 0 先修正命令行，批次 8 全量重写。
13. **`setupColors` 不是公开导出**：`src/index.js` 只导出 `colors`/`install`/`installIcons`/`EventInterceptor`/`icons`；颜色页只讲 CSS 变量与 `colors`，不把 `setupColors` 写成用户 API。
14. **静态服务约束**：demo 固定由 serve-handler 托管在根路径；内部链接统一 `/path/` 并带尾斜杠。若未来改为子路径部署，需同时调整 catalog 链接与模板根前缀。

## 8. 不做的事

- 不引入 vue-router / 测试框架 / CSS 框架，维持"每页独立入口"的轻量架构；
- 不做示例代码在线编辑（docs-site 已承担文档职责，demo 保持纯静态示例）；
- 不改动 `src/` 组件源码与公共样式。

## 9. 修订记录

### v2（子智能体修订，2026-10-20）

**可行性（核实后替换 v1 的“实施时验证”）**

- 最小构建实验（Vite 8.1.4 / Rolldown）确认多级 input key `form/input` + `entryFileNames: '[name]/main.js'` 输出 `dist/form/input/main.js`；删除“不支持则退化”的备用分支，直接采用。
- 发现 v1 的 CSS 路径逻辑有硬伤：`assetInfo.name` 只有 basename（`input.css`），二级页面 CSS 会错误输出到 `dist/input/style.css`。改为用 `assetInfo.originalFileName` + `relative(demoSrcDir, …)` 反推页面目录，并给出可执行代码；Vue SFC scoped style 同样验证通过。
- 明确 `copyHtmlFiles` 的模板占位符（`{{root}}`/`{{appCss}}`/`{{pageCss}}`/`{{pageJs}}`）、二级页面根前缀、home 的 `home/main.js` 与 `home/style.css` 特例、无样式页面不输出 `link`、app.css 缺失时报错。
- 实测 serve-handler `cleanUrls` 对 `/form/input/` 与 `/form/input` 均返回 200；内部链接约定带尾斜杠。

**覆盖与页面清单**

- 按 `src/components/index.js` 的 install 路径逐项核对，确认共 65 个组件导出（含 `MuTreeNode` 等内部导出）并在清单中全部覆盖；补充 `MuFlexDivider/Space/Break`、`MuTreeNode` 的归属。
- 修正 v1 的错误归属：`MuList` 未导出（只演示 `MuListItem`/`MuListDivider`）；`menu-item`/`popup-menu`、`splitter`、`tab-button`、`combo-wrapper`、calendar picker 子组件均为内部组件，不再以 `mu-*` 公开组件列入；`MuSvgStripe` 未安装，明确排除；`MuTreeNode` 仅通过 MuTree 插槽演示。
- 修正 message 页：公开能力是 `$mussel.messageBox`（alert/confirm/error/warn/showMessage/notify），不是 `mu-message` 组件。
- 移除不存在的 `setupColors` 公开 API 表述。
- `form/picker-input` 内容过重，预拆为 `form/date-input`、`form/date-range-input`、`form/time-input` 三页；`calendar` 不再单独设分类，`MuCalendar` 归 `data/calendar`。
- 页面总数由 38 调整为 40（含首页 41 个入口），并给出合并/拆分原则：badge+tags 合并、pagination 与 table 联动、collapse 12 组收编、案例页与色板页的行数豁免。

**版式与规范**

- 3.7 增加示例代码展示方式（`demo-section` 的 `code` 折叠块、只覆盖基础用法、与示例同改同审）、交互示例操作提示要求、`wide`/`regression` 属性、CSS counter 编号、窄视口与深浅色检查。
- 解决 v1 “≤8 节”与 collapse“保留 12 节”的矛盾：统一收编为页末一个 regression section，确实无法收编时才拆页。

**实施与风险**

- 批次由 0-7 调整为 0-8；批次 0-7 保留一层旧页 input 兜底，避免 catalog 切换导致未迁移页面立即 404；批次 8 移除兜底。
- 新增 5.1 旧页删除时机表，明确 tabs/dropdown 的 toolbar 内容依赖 #35（批次 7），旧页必须等全部去向页建成后再删。
- 补充风险：旧 URL 在历史文档中的残留、共享 CSS 漏链、页面 basename 冲突、主题根节点、`demo/README.md` 命令过时、静态服务根路径约束。
- 验证方式补充：批次 0 的产物/CSS/模板路径断言、批次 8 的 URL 与资源全量 fetch、`dist/assets` CSS 引用检查。

### v3（主智能体复核，2026-10-20）

- 逐项复核 v2 的事实声明并全部验证成立：`MuList`/`splitter`/`menu-item`/`popup-menu`/`tab-button`/`combo-wrapper`/7 个 picker 确未从各 `index.js` 导出；`MuFlexDivider/Space/Break` 为 layout 的函数式导出；`MuTreeNode` 有导出；组件导出总数精确复核为 65（icon 2 + layout 9 + form 20 + button 3 + calendar 1 + list 2 + tree 2 + menu 2 + bar 4 + tabs 3 + modal 2 + dropdown 7 + tooltip 1 + message 1 + collapse 2 + 单独注册 4）；table 页确含 pagination 用例；项目 vite 依赖为 `^8.0.3`（与实验 8.1.4 同大版本，实验结论适用）；`$mussel.messageBox` API 与 `message-box.js`/`notifier.js` 源码一致。
- 校准版本措辞（vite 版本与项目依赖的关系）、message API 名单补 `dismiss`。
- 复核批次依赖、5.1 删除时机表、目录结构与 catalog 校验逻辑，未发现矛盾；方案定稿。
