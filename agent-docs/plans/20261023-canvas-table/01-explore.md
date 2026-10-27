# 探索报告 — canvas-table 前置探索

任务：`agent-docs/plans/20261023-canvas-table/00-task.md`。范围：① kaka-grid-next canvas 绘制能力（主）② mussel 现有 table。已读 `decisions.md`（仅两条流程开关，无技术约束）。

---

## ① kaka-grid-next（D:\workshop\mctech\components\kaka-grid-next）

### 相关代码 — 渲染架构与图层

- `src/engine/DrawGrid.ts` — 引擎门面（1718 行）。构造时：创建 canvas（`getContext('2d', { alpha: false })`，`DrawGrid.ts:263-266`）、经 `transformHiDPI` 包装、创建 Scrollable + Selection + FocusControl + ColumnResizer/SelectionResizer/CellSelector（`DrawGrid.ts:272-338`）。四个状态域 `#viewport/#sizing/#paint/#interaction` 共享同一个 protectedSpace 对象（`DrawGrid.ts:254-259`）。
- 单 canvas，无多 canvas 图层。所谓"层"是绘制顺序层：`src/engine/paint/Layers.ts` 的 `DrawLayers` 按 level 排序收集绘制函数，最后统一在 `invalidateRect` 末尾 `drawLayers.draw(ctx)` 执行（`Layers.ts:34-56`；`RenderPipeline.ts:305,425`）。用于浮动元素（如选中框、图标浮层）绘制在单元格之上。
- `src/engine/paint/RenderPipeline.ts` — 主重绘入口 `invalidateRect(host, state, hooks, drawRect)`：取可视 Rect 与脏 Rect 交集，从脏区首行/首列开始逐行逐格绘制（`RenderPipeline.ts:262-430`）；数据范围外底纹 `underlayBackgroundColor`（默认 `#F6F6F6`）；末尾画网格外框（`borderMode: 'none'|'content-border'|'grid-border'`）。每格绘制由 `hooks.onDrawCell` 提供（宿主注入，`RenderPipeline.ts:54-126`）。
- 脏区失效 API：`src/engine/paint/Invalidate.ts` — `invalidate()`（整可视区）、`invalidateCell(col,row)`、`invalidateCellRange(range)`、`invalidateGridRect(...)`（脏格范围并集 + 与冻结区求交合并，`Invalidate.ts:11-52`）。失效偏移默认 1 格（`grid/overrides.ts:55-57`）。
- 单元格异步绘制：`onDrawCell` 返回 Promise 时进入延迟模式，记录到 `state.drawCells`，下一帧重绘该格时先 cancel（`RenderPipeline.ts:104-121,87-89`）。
- 表头不是独立图层：表头行就是冻结行。`grid/header.ts:174` — `grid.frozenRowCount = layoutMap.headerRowCount`；`grid/header.ts:58` 按 `row < headerRowCount` 区分表头/表体。

### 相关代码 — DPR / resize

- `src/shared/graphics/hiDPI.ts` — `transform(canvas)` 劫持 `getAttribute/setAttribute/width/height`：逻辑值写入时 `setAttribute(width, ratio*val)` 并 `ctx.scale(ratio, ratio)`；读取时除回 ratio（`hiDPI.ts:36-110`）。ratio 取 `Math.ceil(devicePixelRatio)`，>1 且为奇数则 +1（偶数化，`hiDPI.ts:8-17`），window resize 时重算（不自动重绘）。另劫持 `ctx.drawImage` 处理自拷贝缩放（配合滚动位移重绘，`hiDPI.ts:84-108`）。
- 尺寸应用：`DrawGrid.updateSize()`（`DrawGrid.ts:759-804`）— 清空 `canvas.style.width/height` → 读 `canvas.offsetWidth/offsetHeight`（CSS 布局尺寸，失败回退 parentElement 减滚动条宽）→ 赋 `canvas.width/height`（经 hiDPI 放大物理像素）→ 再设 `canvas.style.width/height = Npx`。赋值即清空画布，需随后 `invalidate()`。
- 宿主尺寸变化感知：Vue 绑定层 `src/vue/useGrid.ts:808-835` — mussel 环境下监听元素 `sizechange` 事件（`getEl()?.addEventListener('sizechange', debounceSizeChange)`，debounce 100ms），否则 `window resize`；回调里做 `autoStretchColumns` + `grid.resize()`。

### 相关代码 — 虚拟滚动

- 滚动承载：真实 DOM 滚动容器。`src/shared/scroll/Scrollable.ts` — `.grid-scrollable`（overflow:scroll，原生滚动条被 CSS 隐藏）内放一个 `.grid-scroll-end-point` 撑高元素（absolute 定位，top/left 设为内容总尺寸，`Scrollable.ts:42-44,158-162`）。滚轮/触控板/键盘/`scrollTop` 赋值全部走原生滚动（`Scrollable.ts:9-16` 注释）。自定义常显滚动条 `CustomScrollbar.ts` 画在预留留白上（z-index:3，`shared/dom/style.css:80-88`）。
- 超浏览器高度上限处理：内容高度 > `browser.heightLimit - 1000` 时按比例压缩 DOM 高度，`scrollTop` getter 除以压缩比 `_p`、setter 乘回（`Scrollable.ts:7,141-153,124-129`）。
- 滚动事件 → 重绘：`scrollable.onScroll` → `scheduleScrollRedraw`（`engine/interaction/EventBinding.ts:426-427`）→ rAF 合帧，一帧最多重绘一次（`engine/viewport/ScrollSync.ts:110-122`，注释：原生 scroll 同帧可能触发多次）。
- 位移重绘策略（`ScrollSync.ts:17-101`）：记录画布当前对应的 `state.scroll`；位移量 < 可视区尺寸时，先 `ctx.drawImage(canvas, -moveX, -moveY)` 自拷贝平移旧画面，再只重绘暴露出来的窄条（moveY>0 重绘底部 moveY 高度条，moveY<0 重绘顶部 |moveY| 条）；有冻结行/列时追加重绘冻结区；位移 ≥ 整屏时整可视区重绘。
- 可视区计算：`engine/viewport/VisibleArea.ts:7-30` — `getScrollableVisibleRect` = (scrollLeft+冻结宽, scrollTop+冻结高, canvas宽-冻结宽, canvas高-冻结高)。
- 行列定位（虚拟滚动的索引换算）：`engine/viewport/HitTest.ts:14-76` — `getTargetRowAt(absoluteY)`：以 `defaultRowHeight` 估算候选行号，再向上/向下线性累加行高找精确行（等高行近似 O(1)，变高行 O(n) 兜底）；`getColIndexAt` 同理（`engine/sizing/AutoWidth.ts`）。列宽/行高累加缓存：`getRowsHeight/getRowHeight`（`engine/sizing/RowHeight.ts`）、`getColWidth/getColIndexAt`（`engine/sizing/AutoWidth.ts`）。

### 相关代码 — 事件命中检测 / 列宽拖拽 / 排序

- 事件绑定集中在 `src/engine/interaction/EventBinding.ts`：所有 DOM 事件挂在网格根元素上，经 `getCellEventArgsSet(e)` 统一换算：`_getMouseAbstractPoint` → `getCellAt(x,y)` → `{col,row,event}`（`EventBinding.ts:70-98`）。派发语义化事件：`click_cell / dblclick_cell / mousedown_cell / mousemove_cell / mouseenter_cell / mouseleave_cell / contextmenu_cell / keydown / scroll / resize_column` 等（`engine/events.ts:1-101`）。
- mousedown 分派（`EventBinding.ts:114-151`）：先 fire `MOUSEDOWN_CELL`（可拦截）→ `getResizeSelectionAt`（选区角拖拽）→ `getResizeColAt`（列宽拖拽命中，≥0 则 `columnResizer.start`）→ Ctrl/Cmd 散选 → 普通 `cellSelector.start`。
- 列宽命中检测：`engine/viewport/HitTest.ts:89-112` — `getResizeColAt(x, y, offset=5)`：须落在冻结行（表头）内（`frozenRect.inPoint` 判定）；取命中单元格 rect，距左边缘 <5px 返回 `col-1`，距右边缘 <5px 返回 `col`，否则 -1。触摸长按（500ms）阈值放宽为 15px（`EventBinding.ts:196-207`）。
- 光标反馈：mousemove 里同步 `element.style.cursor = 'col-resize' | 'crosshair' | ''`（`EventBinding.ts:331-358`）；拖拽中（`_isResizerMoving()`）跳过光标更新。
- 列宽拖拽实现：`engine/interaction/ColumnResizer.ts` — 继承 `BaseMouseDownMover`（start 时 `_bindMoveAndUp` 绑 window 级 move/up）。move 中按 pageX 增量调 `setColWidth(col, afterSize)`，最小 10px 硬限（`ColumnResizer.ts:78-80`），每次 move 以可视区为脏区 `_invalidateRect(rect)` 重绘并 fire `RESIZE_COLUMN`（`ColumnResizer.ts:85-91`）；列宽可带 `colWidthsLimit[col].min/max/disableResize`（`EventBinding.ts:99-113`）。up 后 `updateScroll()` + 必要时整屏 invalidate。
- 点击误触抑制：click 事件里若刚结束拖拽（`lastMoving(e)`）则丢弃（`EventBinding.ts:360-366`）。
- 排序：`features/headers/action/SortHeaderAction.ts` — 表头是"列 action"体系，`bindCellClickAction` 绑定点击；点击时读 `grid.sortState = {col, row, order:'asc'|'desc'}`（同列再点翻转 asc/desc，首次 asc，`SortHeaderAction.ts:64-83`），执行 `grid.dataSource.sort(field, order)`（默认按 field；`sort` 可传函数自定义，`SortHeaderAction.ts:31-48`），最后 `invalidateGridRect(0,0,colCount-1,rowCount-1)` 全表重绘。排序图标由 `SortHeader.ts` 绘制：SVG 双三角，asc 亮色 `#0B8EEE` / 未排序灰 `#D8D8D8`（`SortHeader.ts:60-67`）。
- hover/enter/leave 是 JS 合成的单元格级事件（`EventBinding.ts:231-330`），canvas 无 DOM hover。

### 相关代码 — 编辑器浮层机制

- 双层结构：
  - 隐藏焦点 input：`engine/interaction/FocusControl.ts:76-77` — `.grid-focus-control`（1px、opacity:0、pointer-events:none，`shared/dom/style.css:51-72`），常驻 DOM，负责键盘/IME 捕获；composition 期间临时显示（`.composition` 类）。
  - 可见编辑器浮层：`features/columns/action/` 体系。`InlineInputEditor` → 单例 `InlineInputElement`（`InlineInputEditor.ts:14,24-39`）：一个原生 `<input class="kaka-grid__inline-input">`，`position:absolute; background:transparent; border:none`（`InlineInputElement.css:5-11`）。
- 打开方式：dblclick / dbltap / F2 / Enter / 直接键入（`BaseInputEditor.ts:128-183`，INPUT_CELL 直接输入）。打开前校验 readonly/disabled（`BaseInputEditor.ts:37-45`）。
- 定位：`grid.getAttachCellsArea(range)` 返回 `{ element: 网格根元素, rect: 单元格相对 rect, padding }`（`DrawGrid.ts:1385-1391,1670-1672`；`overrides.ts:65-77` 支持列类型回调 `reviseAttachCellsArea` 微调）；`attach()` 直接设 `input.style.top/left/width/height/padding-*` 后 `element.appendChild(input)`（`InlineInputElement.ts:173-186`）。
- 生命周期：`SELECTED_CELL`（选中变化）→ 先 `doChangeValue` 提交再 detach（`InlineInputEditor.ts:113-120`）；`SCROLL` → 提交 + detach（`InlineInputEditor.ts:121-124`）；readonly/disabled 变化 → detach；blur 由 `tryWithOffEvents` 防递归（`InlineInputElement.ts:237-241`）；attach 时 `setTimeout` 后 focus 并把光标移到末尾（`InlineInputElement.ts:194-228`）；Chrome blur 延迟导致 appendChild 报错有防御（`InlineInputElement.ts:154-162`）。
- 值流：编辑器不直接改数据，经 `grid.doChangeValue(col, row, getter)` 统一提交（`BaseInputEditor.ts:246-267`）。列编辑器是实例化对象（`new InlineInputEditor({ classList, type, ... })`），挂到列定义的 `columnType`/action 上。
- 编辑器种类：`InlineInputEditor`（text/number 等 type）、`InlineTextAreaEditor`、`InlineMenuEditor`（下拉）、`InlineLookupEditor`、`SmallDialogInputEditor`（弹小对话框）、`CheckEditor`/`RadioEditor`/`SwitchEditor`/`ButtonAction` 等（`features/columns/action/` 目录）。
- 浮层细节：input 上的 click/mousedown/touchstart/dblclick stopPropagation 防止透传到 canvas（`InlineInputElement.ts:279-283`）；wheel 处理可选（`_enabledMouseWheel`）。

### 相关代码 — 样式与 CSS 变量

- canvas 内绘制颜色来自 **theme 对象（静态值）**，不读取 `--mu-*` CSS 变量。CSS 变量只用于 DOM 覆盖层（`--kaka-minimap-width` 等，`shared/dom/style.ts:73-100`）和滚动条（颜色直接硬编码 mussel 灰的 rgba 静态值，注释明言"用静态色避免依赖 rgb(from ...) 语法"，`style.css:83-85`）。
- 字体测量读 `getComputedStyle(document.body).fontFamily`（`kit/sizing/width.ts:49`）；颜色字符串→RGBA 换算用 dummy 元素 + getComputedStyle（`shared/graphics/color.ts:5-19`，带缓存）。
- 全局 CSS 由 JS 注入（`style.initDocument()`，`DrawGrid.ts:260`）。

### 相关代码 — 性能优化手段（docs/performance/optimization-recommendations.md，201 行）

- 已完成 P0：完整可见单元格跳过 `save/clip/restore`（`CellContext.isolated` 标记，`RenderPipeline.ts:101-109`），实测整屏重绘 -17.5%~-20%、clip 调用 -50.7%（文档"P0：绘制管线"节，实测数据 Chromium 1400×700 / 20000 行）。
- 建议中的 P0：相邻同样式单元格合并 `beginPath` 批量 fill/stroke；减少逐格 Rect 对象分配（GC 压力）。
- P1：文本测量缓存（`Map<文本+字体, 宽度>` 带容量上限）；同步排序快速路径（避免全走 Promise 包装）；筛选增量收敛；列宽 fitContent 首屏后分批。
- 明确结论（"不建议优先做的事"）：不引入 DOM/虚拟 DOM 渲染；不在未 profile 前搬 Web Worker（Canvas 状态与 DOM 测量耦合主线程）；不默认关功能换性能。
- `highPerformanceMode` 现状：只影响 Vue 记录监听与列宽重算，不影响绘制管线（文档 P0 第 4 节）。
- 事件批处理：`grid/cellBatch.ts` + `docs/features/cell-batch-events.md`（批量设值时合并派发；文档结论"事件派发不是 300 列场景主瓶颈"）。

### 相关代码 — 其他可参考事实

- 分层架构：`docs/architecture.md` — `types → shared → engine/render → grid → data → features → kit → vue`，单向依赖，脚本门禁校验。单文件 ≤1600 行（AGENTS.md 硬约束）。
- kaka 与 mussel 的既有集成：`MusselScrollbar`（`shared/scroll/MusselScrollbar.ts:24-29`）调用 `window.mussel.scrollbar.attach(el)` 复用 mussel 滚动条皮肤；`useGrid.ts:812-814` 检测 `window.mussel` 后优先用 `sizechange` 事件。storybook 有 `docs/design/storybook-mussel4-integration.md`。
- 小地图（Minimap）、Excel 轴层（ExcelAxisLayer）为独立可选叠加层，各自持 canvas/绘制调度（`DrawGrid.ts:348-414`）。

---

## ② mussel 现有 table（src/components/table/）

### 相关代码

- `table.vue`（385 行）— 组件 `MusselTable`，模板为真实 `<table>` + `v-mu-scrollbar` 包裹容器（`table.vue:2-8`）。无 canvas。
- `table-row.vue` — 行组件，`<td>` 循环渲染，单元格内容由列类型的 `compile()` 产物渲染（`table-row.vue:43-75`）。
- `column-types/` — 列类型体系：`resolveColumnType(type)`（`index.js:32-34`），类型注册表 `text/rec_no/check/bool/enum/date/datetime/number/currency/link/tag/img`（`index.js:16-30`）。每类型导出 `{ align, width, compile }`，`compile(column)` 返回渲染函数 `({ record, recordNumber, value, emit }) => { text | items, class, style, title, ... }`。
- `utils.js` — `ensureFn / getPixelNumber / getCellAlignClass`。

### 现有 API（props — table.vue:65-85）

`keyField / records / columns / selectedRecord / selectedRecordKey / headerChecked / orderBy / recordsOffset / fixedLeftColumns / gridlines('none'|'all'|'row'|'column') / hoverMode('none'|'row'|'column'|'cross'|'cell') / striped / placeholder`

### 现有事件（emits — table.vue:87-95）

`header-click(column) / cell-click({record, recordIndex, column}) / cell-item-click / update:header-checked / update:cell-value({record, column, value})（check 列专用）/ update:selected-record / update:selected-record-key`

无方法暴露（无 defineExpose）、无插槽。

### 现有列定义字段（table.vue:159-203 + docs/quick-reference_components.md "Column 配置"）

`field / caption / type / width / minWidth / maxWidth / align / sortable / text(Function|String) / value / title / class / style / headerClass / headerStyle / placeholder` + 各类型专属（`multiline / lineClamp / mappings / format / formatOption / links / linkOption / tags / tagOption / disabled / headerCheckbox`）。`width` 支持 number 或 '50px' 字符串。

### 现有能力事实

- 排序：**展示型**。`order-by` prop 格式 `field:asc|field:desc`（`table.vue:144-153`），点击表头仅 emit `header-click`，实际排序由父级做；表头渲染 `mu-sort-icon`（`table.vue:29`，`src/components/icon/sort-icon.vue`）。`sortable` 只控制图标与 cursor 样式。
- 列宽拖拽：**不存在**。列宽仅由 `width/minWidth/maxWidth` 经 `<colgroup><col>` 声明（`table.vue:10-12`）。
- 单元格编辑：**通用编辑不存在**。唯一"编辑"是 check 列点击翻转值 emit `update:cell-value`（`column-types/check.js:19-25`）。无 editor 字段、无 readonly 字段。
- 固定列：`fixedLeftColumns` + `position: sticky`（`table.scss:62-65`），`last-fixed-col` 右边框在横向滚动时加深（`table.scss:136-138`）。
- hover 指示：DOM 层独立指示条 div，`--hover-*` CSS 变量定位（`table.vue:111-297`），滚动/调整时 throttle 30ms；`hoverMode` 控制 row/column/cross/cell。
- 滚动阴影/边缘态：`x/y-scrolled`、`y-scrolled-end`、`x/y-overflowed` 类（`table.vue:131-142,299-334`），驱动 thead 投影（`table.scss:132-134`）与底部阴影（`table.scss:140-160`）。
- 空态：`mu-table--empty` 类（`table.vue:129,135`；`table.scss:115-120`）。
- records 引用变化时滚动复位到顶部（`table.vue:358-366`）。
- 子组件通信：`provide('table', { setHoverIndicator, onCellClick, emit })`（`table.vue:368-372`）。

### 视觉规格（table.scss，全部走 --mu-* 变量）

- 尺寸变量（组件级局部变量，`table.scss:2-15`）：`--row-height: 36px / --cell-padding: 8px / --cell-line-height: 18px / --head-row-height: 36px / --head-border-bottom: 1px solid var(--mu-border-color-soft) / --gridline-row|col / --select-bg: var(--mu-primary-faint) / --hover-bg: var(--mu-gray-translucent)`。
- 语义色：外框 `var(--mu-border-color-normal)`、文字 `var(--mu-text-color-normal)`（`table.scss:17-18`）；表头底 `var(--mu-bg-fill)`（`table.scss:77`）、单元格底 `var(--mu-bg-normal)`（`table.scss:96`）、斑马纹 `var(--mu-bg-stripe)`（`table.scss:107-109`）；网格线 `var(--mu-border-color-soft)`（`table.scss:124-130`）；排序图标色 `var(--mu-primary-color)`（`table.scss:88`）；z-index 用 `var(--mu-z-index-above)`（`table.scss:31,64`）。
- 单元格：`overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:var(--cell-line-height)`（`table.scss:44-56`）。
- 暗色模式：`.mu-root.mu-dark` 覆盖同一批 `--mu-*` 变量（`src/styles/root.scss:88-104`），table.scss 无暗色专用规则——变量切换自动生效。

### 可复用的 mussel 设施（编辑器与浮层相关）

- 输入组件（`src/components/form/`）：`MuInput`（`input.vue`，`defineModel()` + `inputProps{invalid,readonly,disabled,placeholder,clearable,size,pill}` + emits `input/focus/blur/keydown/enter/esc`，`input.js:7-33`）；`MuSelect`（`select.vue:33-35`，`options` prop + `defineModel()`）；`MuDatePicker`（`date-input.vue:94`，`defineModel({type:[Date,String]})`）；另有 combo-box / multi-select / switch / radio-group 等。全部 `Mu` 前缀全局注册（`components/index.js:25-59`）。
- 尺寸变化感知：全局 `sizechange` 自定义事件 — ResizeObserver 驱动（`src/events/resize.js:5-10`），任意元素可 `@sizechange` 监听；table.vue 已在 wrap 与 table 上使用（`table.vue:8`）。
- 滚动条：`v-mu-scrollbar` 指令（`scrollbar/directive.js`，`attach/detach` in `scrollbar.js`）；kaka-grid-next 的 MusselScrollbar 模式即调用 `window.mussel.scrollbar.attach`（`MusselScrollbar.ts:24`）。
- CSS 变量 JS 读取先例：`getComputedStyle(el).getPropertyValue('--mu-menu-item_height')`（`menu.vue:128`）、splitter/modal 读计算样式（`splitter.vue:98-99`、`dialog-move-resize.js:102-107`，含"百分比不做 px 归一"坑注释）。

### 验证方式

- 无测试框架（package.json 无 test script，`package.json:10-17`）。验证靠 demo 页：`npm run demo:build`（watch）+ `http://localhost:3000/<name>/`；demo 页按 `demo/src/<name>/main-view.vue + main.js` 组织，页面清单在 `demo/src/catalog.js`（增删页面需重启 demo:build，`catalog.js:1-8` 注释）。现有表格 demo：`demo/src/data/table/`、`demo/src/data/table-advanced/`。
- 样式检查：stylelint（AGENTS.md：style lint 错误先 `stylelint --fix`）。构建：`npm run build`。

---

## 现有约定（跨两部分）

- 命名：组件内部名 `MusselXxx` / 注册名 `Mu` 前缀（`table.vue:383`、`components/index.js`）；CSS BEM `mu-table__td`；kaka 内部类 `kaka-grid__inline-input`。
- mussel 组件文件结构：`src/components/<name>/` 下 `xxx.vue + xxx.scss（就近 import）+ index.js`，经 `components/index.js` 注册（新增组件需在此 import）。
- 纯 JS、`<script setup>` Composition API；mussel 无 TS、无单文件行数门禁。
- 状态管理：组件内 ref/computed + props/emit，无全局 store；跨组件用 provide/inject（table→table-row）。
- 错误处理：无统一约定；kaka 的防御性处理（blur 时序、appendChild 报错、浏览器高度上限）可作参考。

## 约束与风险

- 00-task.md 约束 #2：canvas 内颜色/间距必须来自 `--mu-*` 变量——而 kaka 的做法是 theme 静态值（见上），**canvas 无法直接消费 CSS 变量**，需在 JS 侧读取（mussel 已有 `getComputedStyle().getPropertyValue()` 先例）并感知暗色切换时机；这是设计必须解决的点（探索仅陈述事实）。
- `rgb(from var(...) ...)` 相对色语法（root.scss 大量使用）无法在 canvas `ctx.fillStyle` 中按变量求值——kaka 注释明确因此改用静态色（`style.css:83-85`）。
- hiDPI 方案依赖劫持 canvas width/height 属性（侵入式 monkey-patch）；mussel 若复刻需决定沿用该方案或用标准 `canvas.width = cssW * dpr` 直乘方案（设计层决策，此处仅记录两种形态均存在于代码中）。
- kaka 行定位在变高行场景为线性扫描（`HitTest.ts:66-75`），mussel table 现有行高恒定 36px（`--row-height`），等高模型可大幅简化窗口计算。
- kaka 编辑器 detach 时机绑定 `SCROLL` 事件（滚动即提交+关闭）；`SELECTED_CELL` 也提交。选型 mussel 输入组件为 Vue 组件，kaka 编辑器为原生 input 单例——复用 mussel 组件需要 Vue mount 浮层，不能照抄 kaka 单例 input 模式（事实差异，非建议）。
- mussel table 的 `update:cell-value` 事件语义已存在（check 列），canvas-table 若新增通用编辑事件需考虑与该命名风格兼容。
- 浏览器高度上限（`MAX_SCROLL = browser.heightLimit - 1000`，`shared/utils` 的 browser.heightLimit）是 kaka 虚拟滚动的隐式依赖；mussel 侧无对应实现。

## 验证方式

- mussel：无 lint/typecheck/test 脚本；`npm run build`（构建校验）、`npm run demo:build` + `http://localhost:3000/<name>/`（行为验证，playwright 可直接访问）、`npm run docs:dev`（文档站预览）。
- kaka（只读参考，不改动）：`yarn ci` = lint → boundaries → typecheck → test → build（其 AGENTS.md）。

## 未解问题

1. 【用户/设计】canvas 取 `--mu-*` 变量的具体读取与暗色切换感知时机（MutationObserver / 手动 API / sizechange 式全局事件）——00-task 验收项要求给出方案，探索确认了：mussel 无现成"变量变更监听"设施，`rgb(from var())` 语法不可用于 canvas 取值；需设计层决策。
2. 【设计】DPR 方案沿用 kaka 的属性劫持还是标准直乘方案（两种形态的事实均见上）。
3. 【设计】mussel 输入组件是 Vue 组件，编辑浮层需 Vue 挂载（kaka 为原生单例 input），挂载点/Teleport 与 z-index 层级（`--mu-z-index-above` 等）需在设计文档定位。
4. 【探索补遗·区域外】`src/styles/` 原子类与 `--mu-z-index-*` 完整层级清单未逐项核对（root.scss 只读了前 104 行，z-index 变量在更后位置）；设计引用具体 z-index 变量名前需补读。
