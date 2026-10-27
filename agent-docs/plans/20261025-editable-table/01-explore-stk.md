# 探索报告 — stk-table-vue（探索范围 ①）

调研对象：`D:\workshop\github\stk-table-vue`（v1.2.7，MIT，作者 japlus）
定位（仓库自述）：基于 Vue 3 / Vue 2.7 的高性能虚拟滚动表格组件库，目标场景为数万行实时数据展示。基于原生 `<table>`，零运行时第三方依赖。（`AGENTS.md` 项目定位节）

## 相关代码

### 渲染方式与架构分层

- 纯 DOM 渲染（非 canvas/混合）：组件模板即原生 `<div class="stk-table"> > <table> > <colgroup>/<thead>/<tbody>` 结构 — `src/StkTable/StkTable.vue:50-299`。全仓 `src/` 下 grep "canvas" 零命中。
- 架构分层：主组件装配层 + 功能 hook 层 + 内置单元格层 + 可选 feature 层。
  - `src/StkTable/StkTable.vue`（2416 行）— 装配层：模板 + props/emits 定义 + 各 hook 组装 + expose。文件头自带"分区地图"注释（`StkTable.vue:330-362`）。
  - `src/StkTable/use*.ts`（约 20 个）— 按 feature 拆分的组合式逻辑：`useVirtualScroll`（1032 行）、`useTableColumns`（142）、`useColResize`（202）、`useThDrag`（94）、`useSorter`（267）、`useFixedCol`/`useFixedStyle`/`useGetFixedColPosition`（固定列）、`useMergeCells`（541）、`useTree`（459）、`useRowExpand`（81）、`useHighlight`（270）、`useScrollbar`（177）、`useScrollRowByRow`（96）、`useWheeling`、`useAutoResize`（87）、`useKeyboardArrowScroll`、`useTrDrag` 等。
  - `src/StkTable/custom-cells/` — 内置单元格工厂：EditableCell / CheckboxCell / FilterCell / NumberCell / ChangeCell，各含 `createXxx.ts` 工厂 + 组件 + less。
  - `src/StkTable/features/` — 按需注册 feature（区域选取 useAreaSelection，1240 行）+ `registerFeature.ts` 注册机制。
  - `src/StkTable/types/index.ts`（596 行）— API 类型唯一权威来源（`AGENTS.md` 代码约定节）。
- 固定表头/固定列：CSS `position: sticky`（th 设 `top:0`，td 设 `left`），不用 thead sticky 是为兼容 chrome<90 — `虚拟滚动表格开发.md`「表头固定」节。备选 `cellFixedMode: 'sticky' | 'relative'`（`StkTable.vue:569-577`）；relative 模式下固定列直接重排到列数组两侧（`useTableColumns.ts:51-67`），样式响应式依赖滚动位置（`useVirtualScroll.ts:134-137` 注释）。
- 多级表头：`columns.children` 递归摊平为按层分组的二维数组 `tableHeaders`，叶子列标注 `__LF_S__/__LF_E__/__W__/__R_SP__/__C_SP__` 私有元数据 — `useTableColumns.ts:21-142`。

### 虚拟滚动实现

- 状态载体：`shallowRef` store（非逐行响应式），字段 containerHeight/pageSize/startIndex/endIndex/offsetTop/rowHeight/scrollHeight/viewportStartIndex/viewportEndIndex — `useVirtualScroll.ts:11-42,141-164`。
- Y 轴窗口计算（固定行高）：`pageSize = ceil(containerHeight / rowHeight)`（非 headless 时减去表头折算行数）— `useVirtualScroll.ts:594-599`；`startIndex = floor(scrollTop / rowHeight)`，`endIndex = startIndex + pageSize` — `useVirtualScroll.ts:822-824`；渲染 `dataSourceCopy.slice(startIndex, endIndex+1)` — `useVirtualScroll.ts:177-181`。
- virtual_on 仅在 `数据量 > pageSize` 时开启，小数据量全量渲染 — `useVirtualScroll.ts:173-175`。
- 占位方式：视口上方 `padding-top-tr`（offsetTop）+ 视口下方补偿 tr（offsetBottom）撑开滚动高度 — `StkTable.vue:160,295`；experimental.scrollY 时改用 `transform: translateY` 模拟滚动 — `StkTable.vue:153`、`useVirtualScroll.ts:587-589,753-760`。
- 变高行（autoRowHeight / 展开行）：行高 Fenwick 树（Float64Array 树状数组）O(log n) 求窗口与总高，替代逐行累加 — `useVirtualScroll.ts:788-820`、`utils/rowHeightFenwickTree.ts:1-74`；实测高度经 `tr.offsetHeight` 批量回填 + `setAutoHeight(rowKey, height)` 单点更新 — `useVirtualScroll.ts:790-807,683-696`。
- X 轴虚拟滚动（virtualX，要求每列设 width）：列窗口 startIndex/endIndex，累计列宽缓存 + 二分查找定位 — `useVirtualScroll.ts:932-1005,69-101`；可视列两侧插 spacer td（`__VT_C_SP__`）/固定列重排对齐 — `useVirtualScroll.ts:373-440`；多级表头按"顶层列组"粒度裁剪（整组滚出才移除）— `useVirtualScroll.ts:487-503`；表头加左右占位 th — `StkTable.vue:76-79,113`。
- 合并单元格与虚拟滚动共存：rowspan 跨界时反向扫描修正 startIndex/endIndex（限 maxRowSpan 范围，非全量扫描）— `useVirtualScroll.ts:841-881`；colspan 跨界时迭代扩展列范围 — `useVirtualScroll.ts:290-312`；大 rowspan 场景以 `height: calc(var(--row-height) * 行数)` 占位 tr/td 代替真实行 — `StkTable.vue:178-192,281-292`。
- 斑马纹防错位：startIndex 为奇数时减 1 对齐 — `useVirtualScroll.ts:883-890`。
- vue2 滚动优化（optimizeVue2Scroll）：向下滚动先更新 endIndex、200ms 延时再更新 startIndex — `useVirtualScroll.ts:915-924,103-104`。

### 列定义与 API 风格

- 列配置 `StkTableColumn<T>`（泛型 T = 行数据类型）— `types/index.ts:93-171`：`key`/`dataIndex`(必填)/`title`/`align`/`headerAlign`/`sorter`/`width`/`minWidth`/`maxWidth`/`sortField`/`sortType`/`sortConfig`/`fixed('left'|'right')`/`hidden`/`className`/`headerClassName`/`customCell`/`customHeaderCell`/`customFooterCell`/`children`(多级表头)/`mergeCells`/`type('seq'|'expand'|'dragRow'|'tree-node')`。
- 私有字段统一 `__` 前缀并标 `@private` — `types/index.ts:174-257`（`AGENTS.md` 代码约定节明文规定）。
- props 约 45 个，`withDefaults(defineProps<{...}>())` 内联在主组件（Vue 2.7 兼容限制，不能抽独立文件）— `StkTable.vue:438-660`。配置项多用"配置对象"风格：sortConfig/seqConfig/expandConfig/treeConfig/highlightConfig/scrollbar/experimental/footerConfig/areaSelection 等。
- emits 24 个（中文 JSDoc 含调用签名）— `StkTable.vue:664-813`：sort-change/row-click/current-change/cell-click/cell-selected/cell-mouseenter|leave|over|down/scroll/scroll-x/col-order-change/col-resize/toggle-row-expand/toggle-tree-expand/area-selection-change/filter-change/update:columns 等。
- expose 约 25 个实例方法 — `StkTable.vue:2237-2415`：initVirtualScroll(X|Y)/setCurrentRow/setSelectedCell/setHighlightDimCell/setHighlightDimRow/setSorter/resetSorter/getSortColumns/scrollTo(数字重载+options 重载，支持 index/key/px 定位)/getTableData/getRowIndex/setRowExpand/setAutoHeight/clearAllAutoHeight/setTreeExpand/getSelectedArea/setAreaSelection/clearSelectedArea/copySelectedArea/setFilter/clearMergeCellsCache。
- `v-model:columns`：列宽拖动与表头拖动换列通过 `emits('update:columns')` 回写外部列数组 — `useColResize.ts:170`、`useThDrag.ts:82`。
- slots 仅 4 个：`tableHeader`(col)/`expand`(row,col)/`empty`/`customBottom` — `StkTable.vue:105,190,309,311`。单元格级自定义不走向名插槽，走 `customCell` 组件。
- 数据流：`dataSourceCopy = shallowRef`，`initDataSource` 对 `props.dataSource` 浅拷贝后依次执行排序/树摊平/过滤 — `StkTable.vue:879,1318-1331`；dataSource 变化时长度变才重算虚拟窗口 — `StkTable.vue:1378-1402`。

### 列头交互（调宽/排序/拖动换列）

- 调宽：每个可调列 th 内渲染左右两个 `.table-header-resizer` div（多级表头首列无左把手）— `StkTable.vue:91-95,111`；mousedown 记录状态并显示独立指示线元素，window mousemove 只移动指示线（不实时改列宽），mouseup 时一次性写 `col.width`、`emits('update:columns')` + `emits('col-resize')` — `useColResize.ts:74-190`；固定右列拖动方向反向计算 — `useColResize.ts:89-106`；`colResizable` 可传 `{disabled(col)}` 按列禁用 — `types/index.ts:448-450`；最小列宽 `colMinWidth` 默认 10（`StkTable.vue:641`）。要求列必须设 width 且 minWidth/maxWidth 不生效（`StkTable.vue:528-533` JSDoc）。
- 排序：列级 `sorter: boolean | ((data, {order, column}) => data[])` — `types/index.ts:4-6,115`；点击表头循环 `null → desc → asc → null` — `useSorter.ts:10,97-144`；本地排序重排 dataSourceCopy 副本（从后往前多列稳定排序）— `useSorter.ts:150-167`；`sortRemote: true` 时只发 sort-change 不动数据 — `useSorter.ts:185-191`；多列排序 `sortConfig.multiSort` + `multiSortLimit`（默认 3）— `types/index.ts:322-329`；编程式 `setSorter(colKey, order, option)` — `useSorter.ts:197-244`；列级可覆写 sortConfig — `useSorter.ts:182`。
- 表头拖动换列：原生 HTML5 Drag & Drop（dragstart/dragover/drop，dataTransfer 传 colKey）— `useThDrag.ts:22-58`；insert（默认）/swap 两种模式 — `useThDrag.ts:61-86`；`headerDrag` 可传 `{mode, disabled(col)}` — `types/index.ts:430-441`。

### 单元格编辑机制与编辑器实现

- 表格本体无编辑概念、无编辑状态管理、无行列只读控制、无校验。编辑能力全部来自 customCell 扩展机制。
- 内置示例实现 `createEditableCell({trigger?: 'dblclick'|'click', onChange?})` 工厂：返回包装组件（props 为 CustomCellProps 全集），内部渲染 `EditableCell.vue` — `custom-cells/EditableCell/createEditableCell.ts:18-41`。
- `EditableCell.vue` 实现（100 行）：非编辑态显示文本；触发事件后原地切换为原生 `<input>` 并 focus（`EditableCell.vue:2-4,42-48`）；Enter/Tab/blur 提交、Escape 取消、方向键 stopPropagation — `EditableCell.vue:73-89`；提交直接变异行数据 `row[col.dataIndex] = value` + 回调 `onChange(newValue, row, dataIndex)` — `EditableCell.vue:91-94`、`createEditableCell.ts:29-31`；编辑完成后把焦点还给 `.stk-table` 容器以保持键盘滚动 — `EditableCell.vue:96-99`。
- 其他内置单元格工厂（均为同一 `createXxx(options)` → `customCell` 组件模式）：`createCheckboxCell`（field/自定义 checkboxComponent/树形级联 cascade/onChange/onSelectAll）、`createFilterCell`、`createNumberCell`、`createChangeCell`（涨跌染色）— `src/StkTable/index.ts:10-21`。

### 性能优化手段（逐项）

1. `shallowRef` store + 手动 `triggerRef`，且恢复 hasChanged 语义：仅任一字段实际变化才触发；滚动位置字段（scrollTop/scrollLeft）"静默写入"不参与触发判定，滚动窗口未变的帧零组件重渲染 — `useVirtualScroll.ts:554-575,106-108`。
2. scroll 事件 rAF 节流，一帧只处理一次 — `StkTable.vue:1921-1930`；utils 提供 `rafThrottle`/`throttle` — `StkTable.vue:428`。
3. `smoothScroll=false` 时接管 wheel 事件手动滚动防快速滚动白屏，边界处放行父级滚动 — `StkTable.vue:1864-1919`。
4. 行 key 生成带 WeakMap 式缓存 rowKeyGenCache，key 为 undefined 时兜底随机 key — `StkTable.vue:1404-1426`。
5. v-for 的 key 必须放 template 上（否则 Fragment 无 key 走 unkeyed diff，滚动时整行重建）— `StkTable.vue:184-185` 注释。
6. 横向滚动列宽累计缓存（引用同一性判断是否重建）+ 二分查找 — `useVirtualScroll.ts:69-101,944-956`。
7. 变高行 Fenwick 树 O(log n) — `useVirtualScroll.ts:788-820`。
8. 大 rowspan 场景占位 tr/td 压缩 DOM 数 — `StkTable.vue:178-192`。
9. 高亮动画走 Web Animations API（`Animatable.animate`）+ rAF 循环，支持 fps→steps() 降帧 — `useHighlight.ts:26-99`、`StkTable.vue:37-38`。
10. 容器尺寸变化 ResizeObserver + debounce 自动重算虚拟滚动 — `useAutoResize.ts:38-86`。
11. 固定列阴影默认关闭（为省性能）— `StkTable.vue:550-551`。
12. th/td/tf 样式统一由 cellStyleMap computed 一次算好按 colKey 查表 — `StkTable.vue:1433,1655-1659`。
13. 树形/排序/筛选后强制重算虚拟窗口，避免残留 startIndex 吃掉数据（#80）— `useSorter.ts:185-189`、`StkTable.vue:1344-1346`。

### 资源占用特征

- DOM 节点量：与数据量无关，仅 = 视口行数（containerHeight/rowHeight）× 列数 + 表头 + 若干占位 tr；10K/50K 行时渲染行数由 perf 脚本实测输出（`test/perf/scrollPerf.test.js:156,188` 输出 `domNodes=... renderedRows=...`），仓库内无已保存的结果数据（`test/perf/results/` 不存在，未找到实测数字）。
- 构建产物（`lib/`，本地构建）：`StkTable.js` 252,618 B（未压缩，保留 `//#region` 注释）+ 入口 `stk-table-vue.js` 24,403 B（压缩 ESM）+ `style.css` 21,369 B，合计 JS ≈ 277 KB 未 gzip — `lib/` 目录实测。npm 发布包为 minified 产物（推测，未验证 registry 产物）。
- 运行时依赖 0：package.json 全部依赖均为 devDependencies，vue 以 peer 形式消费 — `package.json`。
- 内存结构：autoRowHeightMap（行高缓存，数据变化时修剪不在新数据中的行键，防无限残留）— `useVirtualScroll.ts:631-670`；rowKeyGenCache、mergeCellsCache（行引用同一性校验）、highlight Map — `StkTable.vue:1404`、`mergeCellsCache.ts`、`useHighlight.ts:45-52`。
- 重绘策略：滚动只重渲窗口内 tr；窗口未变帧完全跳过（见性能优化 1）；纵向/横向滚动分别判定（scrollTop/scrollLeft 差值）— `StkTable.vue:1927-1964`。

### 可扩展性

- 单元格自定义渲染：列配置 `customCell`（td）/`customHeaderCell`（th）/`customFooterCell`（tfoot td），值为组件（defineComponent 组件 / 函数式组件 / string）— `types/index.ts:87-90,146-166`；由 `<component :is>` 渲染进每个 td — `StkTable.vue:207-238`。
- 自定义组件 props 契约 `CustomCellProps<T>`：row/col/cellValue/rowIndex/colIndex/expanded/treeExpanded/level/expandable/treeLoading/showGuide — `types/index.ts:8-53`；树形单元格可复用内部插槽 `stkFoldIcon`/`stkTreeIndent`/`stkDragIcon` — `StkTable.vue:224-237`。
- 类型设计注记：CustomCell 特意组合 `Component<T> | Component<Partial<T>>` 两种形态，兼顾函数式组件与 defineComponent 的 props 可选性 — `types/index.ts:79-90` 注释。
- feature 注册机制：`registerFeature(feature)` 把 useAreaSelection 等重功能做成按需导入，未注册时以空实现兜底（config disabled、方法 no-op）— `registerFeature.ts:5-40`、`src/StkTable/index.ts:1-2`。
- 单元格合并：列级 `mergeCells(param) => {rowspan?, colspan?} | undefined` 回调 — `types/index.ts:69-76,170`。
- 主题：`theme: 'light'|'dark'` 切 class + CSS 变量（--row-height/--header-row-height/--highlight-duration/--sb-width 等）— `StkTable.vue:33-41`；样式单文件 `style.less`（893 行）。

### 代码量与依赖

- `src/StkTable` 共 60 文件、约 11,370 行（ts/vue/less 合计，wc 实测）。最大文件：StkTable.vue 2416、features/useAreaSelection.ts 1240、useVirtualScroll.ts 1032、style.less 893、types/index.ts 596、useMergeCells.ts 541、useTree.ts 459。
- 语言与框架：TypeScript；Vue 3 与 Vue 2.7 双兼容（影响：props 必须内联在 `<script setup>`、不能用 defineOptions、用 export default 声明 name — `StkTable.vue:322-327,436-440`）。
- 依赖：运行时 0；开发链 vite 8 + vite-plugin-dts + less；测试 vitest 4 + happy-dom + @vue/test-utils；文档 vitepress 四语言。
- 仓库自带面向 AI 的 API 速查 `llms.txt` 与 `AI-API-REFERENCE.md`。

## 现有约定

- 命名：组件 kebab-case 场景 class `stk-table`/`stk-*`；私有字段 `__XXX__`；hook 文件 `useXxx.ts`；单元格工厂导出 `createXxxCell`。
- API 三件套：props（配置对象风格）+ emits（含签名 JSDoc）+ expose（方法集）；列配置单文件类型权威（types/index.ts），改 API 的闭环为 types → StkTable.vue → 文档 → llms.txt → 示例 → 测试（`AGENTS.md` 修改指引节）。
- 状态管理：组件内 shallowRef + triggerRef 手动精细化触发；数据源浅拷贝副本（dataSourceCopy），外部行数据允许原地变异（编辑单元格直接写 row 字段即依赖此契约）。
- 单元格扩展模式：`createXxxCell(options)` 工厂返回 `{XxxCell}` 组件构造器（调用一次得到组件，如 `customCell: ChangeCell()` — `createChangeCell.ts:39-46` 示例）。
- 测试方式：vitest + happy-dom，`test/` 下 40+ 文件，含若干 `.repro.test.js` 回归用例（trReuse/silentScroll/rowMergeVirtualScroll/filterSortVirtualScroll 等）；性能基准 `test/perf/scrollPerf.test.js`（mount 耗时/DOM 节点数/滚动重算耗时，10 场景）+ 版本对比 runner `run-perf-benchmark.mjs`。

## 约束与风险

- Vue 2.7 兼容是硬约束，导致：props 不能抽独立文件（`StkTable.vue:438-440`）、props 全量内联在一个 defineProps 中（约 220 行）— 若 mussel 借鉴其代码需剥离这部分结构。
- 主组件 2416 行 + 单文件多职责，任何借鉴以 hook 粒度（useVirtualScroll/useColResize/useThDrag/useSorter）为单位更可行；仓库 AGENTS.md 自己也在控制该文件继续膨胀。
- 编辑能力事实边界：stk 的 EditableCell 是"演示级"实现 — 仅原生 input、无校验、无表格级/列级只读、无编辑器扩展注册、编辑态无全局唯一管理（每个 cell 各自为政）。任务约束 4（复用 mussel 输入组件 + 适配层）在 stk 中没有现成对应物，只能借鉴其 customCell 注入通道（CustomCellProps 契约 + `<component :is>` 渲染位置）。
- 调宽/换列均依赖 `v-model:columns` 回写外部列数组（受控列）；sorter 是列级字段而非表头事件插槽。
- 虚拟滚动正确性依赖大量边界修正（rowspan/stripe/数据变少滚动条越界/排序后窗口残留 #80/筛选后窗口残留），这些修正逻辑（useVirtualScroll 内约 300 行）是历史坑沉淀，移植时不可省略。
- `mergeCells`、区域选取、树形懒加载等高级 feature 与编辑表格目标无直接关系，代码量大（合计约 2200 行），借鉴时注意排除。

## 验证方式

- 仓库自身：`pnpm test`（vitest 单测）、`pnpm test:types`（tsc 双项目）、`pnpm perf`（性能基准）、`pnpm build`（vite 产物到 lib/）— `package.json` scripts、`AGENTS.md` 常用命令节。
- 本探索为只读调研，未执行上述命令；stk-table-vue 非 mussel 工作区，无 mussel 侧验证项。

## 未解问题

1. 【需实测】浏览器真实环境 DOM 节点量 / 滚动帧率 / 内存占用数字：perf 结果目录为空（`test/perf/results/` 不存在），本报告只含机制描述与 lib 产物字节数，无运行时实测值。设计阶段若需量化对比，可运行其 `test/perf/scrollPerf.test.js` 或自行在 demo 中测量。
2. 【范围外 → explorer ③】stk 的 props/事件/列配置与 mussel 现有 table（`src/components/table/`）API 的逐项映射关系，需 mussel 现状报告对照后由设计阶段完成。
3. 【范围外 → explorer ②】canvas 路线（kaka-grid-next）与 DOM 路线（stk）的对比结论，需两份报告在设计阶段合并。
4. 【设计决策】stk 编辑机制的缺口（无校验/无只读控制/无编辑器扩展点）如何在 mussel 适配层补齐，属设计阶段取舍，本报告仅陈述事实。
