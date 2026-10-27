# 探索报告 — kaka-grid-next（对比维度补齐）

任务：`agent-docs/plans/20261025-editable-table/00-task.md` 探索范围②。对象：`D:\workshop\mctech\components\kaka-grid-next`（v2.5.0）。
旧报告 `agent-docs/plans/20261023-canvas-table/01-explore.md` 已覆盖：渲染架构与图层、DPR/resize、虚拟滚动与位移重绘、列宽拖拽/排序命中检测、编辑浮层 DOM 机制（InlineInputElement）、theme 静态色事实、optimization-recommendations.md。本报告不重复，聚焦：API 风格、列定义体系、编辑机制与只读控制链、性能实测数据、可扩展性、代码量与依赖。
已读 `decisions.md`（两条流程开关，无技术约束）。

---

## 相关代码 — 总体与代码量

- `src/` 共 344 个 `.ts` + 14 个 `.css`，**51005 行 TS**。分层行数：features 16263 / engine 8317 / shared 5303 / kit 5127 / render 4658 / grid 4015 / types 2403 / data 2247 / vue 1506（`wc -l` 统计）。
- 核心文件体量：`src/engine/DrawGrid.ts` 1718 行（引擎门面）、`src/grid/ListGrid.ts` 847 行（列表网格宿主）、`src/vue/useGrid.ts` 838 行（Vue 桥接）、`src/kit/sizing/width.ts` 686 行（列宽计算）。
- 构建产物（`dist/`，2026-10-23 构建）：`kakaGrid.min.js` 425,583 B raw / **115,073 B gzip**（引擎+列类型+features，不含 Vue 绑定）；`kakaGrid.mjs` 852,013 B / 178,289 B gzip；`vue.mjs` 1,019,639 B（`./vue` 入口把 kit 层与引擎整体打包）。
- 运行时依赖：package.json `dependencies` 仅 `perfect-scrollbar ^1.5.3`（`package.json:103-105`），但源码**不 import 它**——`src/shared/scroll/Scrollbar.ts:8-11` 读 `window.PerfectScrollbar` 全局构造器，宿主页面提供才启用；`peerDependencies` 为可选 `vue ^3.0.0`（`package.json:106-113`）。实际硬依赖为零。
- 滚动条实现三选一（`src/engine/DrawGrid.ts:272-280`）：`window.mussel` 存在 → `MusselScrollbar`（复用 mussel 滚动条皮肤）；`window.PerfectScrollbar` 存在 → `Scrollbar`（perfect-scrollbar）；否则 → `Scrollable` + 自绘 `CustomScrollbar`。

## 相关代码 — 分层架构补充（绘制路由）

- 单元格绘制路由链（旧报告只到 RenderPipeline hooks）：`engine/paint/RenderPipeline.ts:106` → `ListGrid.onDrawCell`（`src/grid/ListGrid.ts:450-451`）→ `ListGridDrawBinding.onDrawCell`（`src/grid/binding/draw.ts:65-96`）：按 `row < headerRowCount` 分流到 `header.headerType.onDrawCell` 或 `column.columnType.onDrawCell`，构造 `DrawCellInfo`（含 `drawCellBase/drawCellBg/drawCellBorder/getIcon/getMessage/getRecord` 回调集，`draw.ts:253-270`）后调用列类型的 draw。
- `src/grid/binding/draw.ts:130-194` `testCellHeight`：列类型可实现单元格高度测量（配合变高行），委托列/表头类型的 `testCellHeight`，未实现按 0。
- `src/features/columns/type/BaseColumn.ts:139-443`：列类型协议 `ColumnTypeAPI` — `onDrawCell`（默认实现转调 abstract `drawInternal`，`BaseColumn.ts:199`）+ `abstract clone()` + `abstract drawInternal()`（`BaseColumn.ts:443-444`）。

## 相关代码 — Vue 层 API 风格

- Props：26 个（`src/vue/props.ts:21-95`）。核心：`records / columns / keyField / readonly（默认 true）/ parentKeyField / selectedField / frozenColCount / hideHeader / singleSelection / checkCascade / gridType('list'|'report'|'excel') / theme / spanBodyOptions / scrollbarOptions / minimapOptions / excelAxis / statusBarOptions / autoCalcWidth / autoStretch / highPerformanceMode / storeId / headerFreezable / contextMenu / headerContextMenu / cellContextMenu / testId`。
- 事件：引擎事件映射为旧版语义名共 53 项（`src/kit/host/events.ts:9-53` `EVENT_NAME_MAP`）：`cellclick / dblclick / cellchange / cellinput / editablecellinput / editing / cellselect / columnresize / scroll / keydown / focus / blur / copy / cut / paste / cellpaste / filter-change / headerchange / beforedrag / drag / load / buttonclick / menu-action` + 勾选系列 `cellcheck/celluncheck/checkall/uncheckall/rowselect/...`。全部平铺 emit（`src/vue/KakaGrid.ts:221`）。
- ref API（`expose(api)`，`src/vue/useGrid.ts:71-97,743-804`）：21 个方法 — `loadRecords / setColumns / expandToLevel / expandToKey / updateExpandedKeys / expandByRowIndex / collapseByRowIndex / refreshDatasource / invalidate / selectAll / unSelectAll / getSelectedRecords / calculateColumnsWidth / calculateColumnWidthByColIndex / autoStretchColumns / calcSumWidth / updateHeadersWidth / getCellRectByKey / focusCellByKey / clickCellByKey` + getter `kakaGrid`（暴露整个 ListGrid 引擎实例，用户可越过封装层直调引擎 API）。
- 插槽：**仅 2 个** — `status-bar-left` / `status-bar-right`（`src/vue/KakaGrid.ts:369,381`）。单元格/表头无插槽（canvas 绘制，无 DOM 单元格可插）。
- 注册方式：Vue 插件 `app.use(KakaGridVue, { primaryColor })` → 全局组件 `<kaka-grid>`（`src/vue/index.ts:17-24`），非 `Mu` 前缀体系；`setTheme` / `setColumnPreset` 从 vue 入口导出。
- 组件渲染面：仅一个 `overflow:hidden` 容器 div（`KakaGrid.ts:344-354`），表格由引擎挂载；无模板插槽结构。
- 事件尾参兼容：`@load` 尾参是 Proxy（`createEventTarget`，`KakaGrid.ts:194-210`），同时暴露 api 方法集与组件实例属性（`$el` 等）——为兼容旧版 `vm.kakaGrid` 用法。

## 相关代码 — 列定义体系

- 用户面列定义 `KitColumnOption`（`src/kit/columns/types.ts:23-68`）：40+ 字段。关键字段：`type`（string 触发 preset）、`field`（string | number | `(record)=>value` | `{get}` 四形态）、`caption`（string 或函数）、`width/minWidth/maxWidth`、`align`、`style`（对象或按记录函数）、`headerStyle`、`format`、`disabled/readonly/contentHidden/hidden`（均支持 `boolean | (record)=>boolean` 按行控制）、`action`（编辑器/按钮动作实例）、`headerType/headerAction/headerReadonly`、`icon/tooltip`、`options`（编辑器选项）、`rowSpan/colSpan`、`columns`（嵌套多级表头）、索引签名 `[key:string]: unknown` 允许透传自定义字段。
- 解析管线：`KitColumnOption` → `defineColumn()`（`src/kit/columns/define.ts:94-205`）：查 preset（`presets[type]`）→ 合成 style 函数（默认 padding `[0,10]`、`textOverflow:'ellipsis'`、disabled 色 `theme.disabledColor`、readonly 样式，`define.ts:105-139`）→ `getAction()` 注入默认编辑器 → 列宽计算（`getWidthOption`）→ `convertColumnType` 挂值转换 → 删除非引擎字段。多级表头经 `getColumns()` 递归（`src/kit/columns/option.ts:12-65`）。
- 值 → 展示值转换 `convertColumnType`（`src/kit/columns/convert.ts:268-351`）：按 type/columnType 分派 text/multiText/no(行号)/DATE/number/lookup 六类 convert；空值显示 `'-'`（`convert.ts:17`）；date 默认格式 `YYYY-MM-DD` / `YYYY-MM-DD hh:mm:ss`（`convert.ts:105-108`）。
- 列宽策略（`src/kit/sizing/width.ts:604-633`）：类型专属宽度表 `COLUMN_WIDTH_OPTIONS[type]`；无 width 或 `fitContent` → 文本测量计算，夹在 min/max 之间；`'auto'` → 引擎布局分配。计算样本上限 **2000 条记录**（`MAX_RECORDS_LIMIT`，`width.ts:23,673-675`；`define.ts:23` 同）。
- 列预设注册表：内置 14 个预设 `tree/comboBox/checkBox/buttonLink/dangerLink/captionLink/modifyLink/removeLink/button/buttonIcon/treeLink/tag/switch/multiLineText`（`src/kit/columns/preset/index.ts:28-43`）；`setColumnPreset()` 可覆盖/追加（覆盖时 console.warn，`preset/index.ts:46-52`）。
- 引擎列类型注册表（`src/features/columns/type/`，18 种）：`Column / NumberColumn / CheckColumn / RadioColumn / SwitchColumn / ButtonColumn / ImageColumn / PercentCompleteBarColumn / IconColumn / BranchGraphColumn / MenuColumn / MultilineTextColumn / DateColumn / LookupColumn / TreeColumn / DrawColumn`（+Base），每类配套 Style 类（`features/columns/registry.ts` 聚合导出 type/style/action 三注册表）。
- 自定义绘制列 `DrawColumn`（`src/features/columns/type/DrawColumn.ts:16-48`）：构造项 `draw` 回调拿 ctx 直绘；tag 预设即用 `new Column({ draw })` 实现（`src/kit/columns/preset/tag.ts:99-141`，canvas 手绘圆角矩形+文字，返回 `true` 表示已绘制）。

## 相关代码 — 编辑机制与只读控制链

- 默认编辑器注入：`getAction()`（`src/kit/columns/action.ts:53-93`）——列无显式 `action` 且 columnType 属于 `DEFAULT/NUMBER/TREE/DATE`（`action.ts:13`）时自动 `new InlineInputEditor({ type, classList, readonly })`；input type 按列映射（number 列→`number`，date→`date`，dateTime→`datetime-local`，time→`time`，其余 `text`，`action.ts:37-48`）；date 列附 action 钩子自动 open（`action.ts:80-88`）。显式传 `action` 则完全接管。
- 只读控制链（两级、均支持按记录函数）：`isReadOnlyRecord = grid.readOnly || editor.readOnly`（`src/features/columns/action/action-utils.ts:60-69`），disabled 同理（`action-utils.ts:49-58`）；二者都是 `boolean | (record)=>boolean`，record 为 Promise（异步数据源）时按 true 处理（`action-utils.ts:38-44`）。表格级 `readonly` prop（默认 `true`，`props.ts:34`）经 `gridOption.readonly` 下沉为列编辑器默认 readonly（`action.ts:59` `optionReadonly = gridReadonly`）。
- 编辑器抽象层级：`BaseAction` → `Editor`（`src/features/columns/action/Editor.ts:4-38`，持有 `readOnly` getter/setter，`readonly` 为 deprecated 别名并 console.warn）→ `BaseInputEditor`（`BaseInputEditor.ts:33-268`）→ 具体编辑器。
- `BaseInputEditor.bindGridEvent` 绑定 8 类引擎事件（`BaseInputEditor.ts:72-245`）：`INPUT_CELL`（直接键入）、`PASTE_CELL`（单格粘贴，多格忽略）、`DBLCLICK_CELL/DBLTAP_CELL`（须落在 attach 区域内）、`KEYDOWN`（F2/Enter，Ctrl/Cmd 排除）、`SELECTED_CELL`、`SCROLL`、`EDITABLEINPUT_CELL`（编辑态询问，readonly 返回 false）、`MODIFY_STATUS_EDITABLEINPUT_CELL`（合并单元格时把编辑浮层调整为 range 尺寸，`BaseInputEditor.ts:206-243`）。
- 提交路径：`grid.doChangeValue(col, row, getter)` 统一改值（粘贴 `BaseInputEditor.ts:246-258`、Delete 键清空 `BaseInputEditor.ts:259-267`）；删除/粘贴同样先过 readonly/disabled 校验。
- 下拉编辑器 `InlineMenuEditor`（`src/features/columns/action/InlineMenuEditor.ts:34-79`）：`globalInlineMenuElement` **跨 grid 实例全局单例**，引用计数（`globalInlineMenuBindGridCount`）归零才 dispose——多实例共享一个下拉 DOM。
- 编辑器清单（`src/features/columns/action/`）：`InlineInputEditor`（5556 行目录内）`InlineTextAreaEditor / InlineMenuEditor（376 行）/ InlineLookupEditor（303 行）/ SmallDialogInputEditor / CheckEditor / RadioEditor（285 行）/ SwitchEditor / ButtonAction`。
- **死代码事实**：`useGrid.ts` 的 `isEditing` 仅声明、initGrid 重置 false、两处只读判断（`useGrid.ts:120,423,434,607`），全仓库无 `isEditing = true` 赋值（grep 证实）——"编辑中禁止列宽重算/autoStretch"拦截逻辑当前永不触发（推测：从旧包迁移时丢失赋值路径）。

## 相关代码 — 表头交互补充

- 表头 action 体系：`bindCellClickAction`（`src/features/headers/action/actionBind.ts:11-96`）绑 click + mouseover/move/out（cursor 'pointer' 反馈），拖拽调宽进行中（`grid._isResizerMoving()`）跳过；`bindCellKeyAction`（`actionBind.ts:97-133`）绑 Enter/Space 键触发。排序 `SortHeaderAction`、全选 `CheckHeaderAction`、`SwitchHeaderAction` 均基于此机制。
- 列宽拖拽后处理（`src/vue/useGrid.ts:444-461` `addResizeColumnEvent`）：记录 `resizeColumnsMap[colIndex] = { col, width, percent }` 并在列定义上标 `resized = true`——后续 `calculateColumnWidth()` 重算时跳过用户已手动调宽的列（`useGrid.ts:313-318`）。

## 相关代码 — 性能：实测数据与策略

- 性能热点分析文档 `docs/performance/performance-discovery.md`（未见于旧报告）：
  - 热点排名：P0 逐帧可见单元格 canvas 绘制（滚动/拖拽高频路径，置信度高）；P1 记录变化时列宽计算、筛选与排序；P1/P2 树数据源重建；P2 状态栏统计；P3 minimap 重建。
  - P0 优化实测（120 列 auto × 20000 行）：整屏重绘 29.71→24.51 ms（-17.5%）；300 列 78.03→62.39 ms（-20%）；120 列连续滚动 23.72→28.25 fps（+19.1%）；`save/restore` 各 80586→53280 次、`clip` 53904→26598 次。**宽表仍未达 60 fps**。
  - cell-batch-events.md 既有实测：20 列定宽/auto 60.1 fps（4.7/5.9 ms 整屏）；120 列定宽 60.1 fps（4.6 ms，仅 12 列可见）；**120 列 auto 22.8 fps（37.9 ms，120 列全可见）**；300 列 auto 约 93.4 ms。可见帧率瓶颈 = 可见单元格数 × 单格绘制成本，事件派发非主因。
- `highPerformanceMode` prop 具体行为（`src/vue/useGrid.ts:710-739`）：开 → records watch 不加 `deep: true`、额外 watch `records.length`；关 → deep watch 整个 records 数组。records 变化时 `highPerformanceMode` 下跳过 `calculateColumnsWidth()`（`useGrid.ts:695-706`）。
- records 同引用变更走长度 diff + `dataSource.length` 直改（`useGrid.ts:674-693`），不重建数据源；换引用才 `loadRecords` 全量重建。
- 数据源层：`src/data/` 五种 — `DataSource / CachedDataSource / FilterDataSource / PivotDataSource / TreeDataSource`。树数据由 `CachedDataSource.ofArray(records)` + `TreeDataSource` 包装（`useGrid.ts:199-205`），懒加载子节点防重入（`lazyLoadingRecords` 标记，`useGrid.ts:172-186`）。
- 文本测量（`src/kit/sizing/width.ts:39` `getTextWidth`）与列宽计算在**主线程同步执行**（限 2000 条样本）；optimization-recommendations.md（旧报告已覆盖）明确不引入 DOM 渲染、不未 profile 先搬 Web Worker。

## 相关代码 — 可扩展性

- 自定义渲染三条路：① 列 `draw` 回调 / `DrawColumn`（canvas 直绘，拿 ctx + rect + record）；② 继承 `BaseColumn` 实现 `drawInternal`（18 种内置列类型同协议）；③ style 函数按记录返回绘制参数（色、对齐、padding、icon）。无 Vue 渲染函数/插槽路径。
- `GridCanvasHelper`（`src/render/CellPainter.ts:59-339` + `src/render/canvas/CanvasHelper.ts` 671 行）：绘制辅助 API — `getColor / toBoxArray / drawWithClip / drawBorderWithClip / text / fillText / fillCell / fillCellWithState / fillRect / border / borderSelection` 等，自定义列类型复用。
- 单元格内联多元素：`src/render/inlines/`（`Inline / InlineDrawer / InlineIcon / InlineImage / InlinePath2D / InlineSvg`），`buildInlines` 组装文本+图标混排（`inlines/index.ts:166`）。
- 主题：`src/kit/theme/index.ts` — 3 预设（list 行高 34 / report 28 / excel 26）+ 全局基础 `theme` + `setTheme()` 就地合并 + `mergeTheme()` 产出新对象（`theme/index.ts:167-185`）；全部静态色字符串（`#008CD6` 主色等），`applyPrimaryColor` 同步联动 report/excel 高亮边框与 tree 链接色（`theme/index.ts:151-161`）。
- 引擎事件机制：`grid.listen(type, fn) → EventListenerId` / `grid.unlisten(id)`，kit 层绑定后集中销毁（`useGrid.ts:606,646-647`）。
- 列可见性/状态栏：`statusBarOptions.columnVisibility` 支持列隐藏（`allowHideAll` 防全隐藏，`KakaGrid.ts:275-294`）；列树投影 `projectColumns` 处理隐藏列的 colSpan/rowSpan 收敛（`KakaGrid.ts:117-186`）。
- 表头体系（`src/features/headers/type/`）：HeaderType 与 ColumnType 平行，`headerType/headerAction` 独立于列内容可定制（排序/checkbox/switch 表头 action）。
- E2E 钩子：`testId` prop + `registerE2EGrid`（`useGrid.ts:502-532`）暴露 DOM 可定位接口，`getCellRectByKey/focusCellByKey/clickCellByKey`（`useGrid.ts:761-800`，clickCellByKey 用 `canvas.dispatchEvent(new MouseEvent(...))` 模拟点击）。

## 相关代码 — 质量与配套

- 测试：Vitest 单测 50 个 `*.test.ts`（`test/unit/` 等）+ Playwright e2e 两套（`examples/tests/e2e`、storybook，`playwright.config.ts` / `playwright.storybook.config.ts`）；`yarn ci` = lint(oxlint) → boundaries 门禁 → typecheck → test → build。
- 示例：vitepress `examples/demos/` 13 组（big-data / column-types / editing-context-menu / filter / grid-types / header-column-visibility / minimap / multi-level-header / quick-start / selection-statusbar / span-and-events / tree / framework-integration）+ storybook。
- 仓库硬约束（AGENTS.md）：分层依赖只向下 `types → shared → engine/render → grid → data → features → kit → vue`，脚本门禁；公共 API 契约不可变；单文件 ≤1600 行；禁 `as any`/`@ts-ignore`。
- dist 入库（AGENTS.md「发布产物 dist/ 入库，改源码后需重新构建」）。

## 现有约定

- 命名：Vue 组件 `KakaGrid`（注册名 `kaka-grid`，无前缀体系）；CSS 类 `kaka-grid__inline-input` / `grid-scrollable` 等；对外事件名小写连写（`cellclick`），非 mussel 的 kebab-case 风格。
- 列定义风格：宽松 TS interface + 索引签名透传；`boolean | (record)=>boolean` 双形态贯穿 disabled/readonly/hidden/style/caption；多级表头用 `columns` 嵌套而非扁平 `children` 配置。
- 状态管理：无全局 store；跨层经 hostContext 闭包（`createHostContext`，`useGrid.ts:129-143`）与引擎 `getGridState/setGridState`（symbol 键）。
- 错误处理：防御式（旧报告已录 blur 时序、浏览器高度上限）；deprecated API console.warn（`Editor.readonly`）。

## 约束与风险

- **体量**：核心 min+gzip 115 KB（不含 Vue 绑定）；vue 入口全量打包 1.02 MB raw。mussel 若参考其架构，须按需裁剪（features 16263 行占 32%）。
- 全部 TS + 类型门禁 + 单文件行数门禁 + 分层边界门禁——与 mussel「纯 JS、无门禁」体系不同，无法直接搬文件，只能参考模式。
- 主题静态色与 mussel `--mu-*` 变量体系冲突（旧报告已述）；本报告补充：主色联动是 `applyPrimaryColor` 显式函数，改主色需经 `setTheme` API 而非 CSS。
- 事件名 53 项平铺、prop 名与 mussel table 风格差异大（`readonly` vs mussel 无此概念；`records/columns/keyField` 同名）。mussel `update:cell-value` 语义对应其 `cellchange`。
- 编辑器为原生 DOM input 单例（InlineInputElement/InlineMenuElement 全局单例），非 Vue 组件；mussel 要求复用现有输入组件（MuInput/MuSelect 等），不能照搬单例模式（旧报告同结论，此处补充 InlineMenuEditor 跨实例单例细节）。
- `isEditing` 死代码：编辑中列宽重算拦截实际未生效——参考此逻辑时不可信其防护。
- 列宽 fitContent 依赖全量文本测量（限 2000 条样本、主线程同步），大数据量下首屏与 records 变更时有可感知成本（performance-discovery P1）。

## 验证方式

- kaka 仓库（只读参考）：`yarn ci`（lint → boundaries → typecheck → test → build）、`yarn test`（Vitest 50 文件）、`yarn storybook:dev` / `yarn examples:dev`（vitepress 5173）。
- 对比实验环境：`examples/demos/big-data`、`docs/features/cell-batch-events.md:131-149` 记录的 Playwright + Chromium 基准方法可复用于 mussel 方案验证。

## 未解问题

1. 【探索补遗】`vue.mjs` 1.02 MB 中 kit+engine 占比未拆分（tsdown 无 sourcemap 分析）；若 mussel 借鉴其 Vue 桥接模式，实际可借鉴部分体积需按模块估算，未逐一统计。
2. 【探索补遗】BranchGraphColumn（575 行，最大列类型）与 PivotDataSource 未深入——与可编辑表格任务关联弱，如设计涉及分支图/透视再补查。
3. 【设计】kaka 的 `grid.readOnly` 表格级 + 编辑器 `readOnly` 列级的两级函数式只读模型 vs 任务约束的"表格级与列级均可定义只读"，映射关系（是否需再加行级）留设计决策。
