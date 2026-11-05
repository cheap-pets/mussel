# 设计

## 方案概述

纯重构：把 `src/components/table/ex/` 内 7 个超 500 行文件按功能关注点拆为小文件，行为 / 公开 API / 注册名 / 样式零变化。

核心策略（两条，覆盖全部 7 个目标文件）：

1. **纯逻辑模块 = "入口保面 + 内部拆分"**：`cell-painters.js` / `painter.js` / `spans.js` / `editor.js` / `interactions.js` / `row-geometry.js` 保留为入口文件——对外导出面（demo 自检与目录内既有 import 消费的具名符号）经 `export … from` 原位重导出，函数体整体迁移到新文件（只移动、不改写）。目录外零改动（追加约束：拆分范围限 ex/）。
2. **table-ex.vue = "组合式抽取"**：沿用项目既有 C1 先例（`use-tree-rows.js` / `use-column-resize.js` / `row-geometry-controller.js` 的 ctx-getter 注入模式），把 script setup 按功能纵切为 7 个 composable + 1 个共享判定模块，shell 只留模板、props/emits、状态枢纽与组装。7 个 composable 共用单一 `host` ctx 载体（惰性 getter + `relayout` 前向槽，见接口节）：调用形如 `Object.assign(host, useX(host))`，`useTreeRows` / `useColumnResize` 亦直接吃 host，避免 7 份重复 ctx 字面量（shell ≤500 的行数预算依据）。

触及模块边界：仅 `src/components/table/ex/` 目录（新增 25 个文件、改写 7 个、`constants.js` 增 4 个共享常量）。不改 `index.js`、`table-ex.scss`、`demo/`、`docs*`、组件注册（`MusselTableEx` / `<mu-table-ex>`）。

新文件分四簇：cell-painters 簇（7 个，按"取值链 / 文本原语 / 图标图片 / 横排条目 / link 竖排 / canvasKind / tooltip"）、painter 簇（5 个，按绘制分区）、独立模块小拆（spans×2 / editor-resolve / schedulers / fenwick）、table-ex.vue 组合式（7 use-* + edit-button）。

依赖分层保持无环（新文件只向下 import 共享层，禁止反向；详见接口节依赖图）。

## 遵循约定与复用

自行提取（无探索报告；依据源码与根 AGENTS.md）：

- 复用（禁止复制实现，全部经 import）：`text-wrap.js`（wrapLines/ellipsize/cellFontOf）、`theme.js`（createMeasureCache）、`tree.js`（expandableAt/isExpandedKey）、`constants.js`（C2 镜像常量单一事实源）、`spans` 查询函数、`interactions` 决策函数、`editor` 几何函数。
- 命名：文件 kebab-case；组合式 `use-*` + ctx getter 注入（先例 `use-tree-rows.js:211-214`：setup 期 immediate watch 经 `ctx.relayout` 回壳）；`@` alias 仅跨目录，目录内相对路径。
- 常量收拢（C2 约定）：`TAG_HEIGHT/TAG_PADDING_X/TAG_RADIUS`（`cell-painters.js:52-55`，镜像 tag.scss 规格）拆分后跨 3 个新文件共享 → 迁入 `constants.js`（注释随迁）；`BUTTON_ICON_SIZE`（`cell-painters.js:59`）被 `drawButton*`（1206-1491）与 `buttonsOverflowOf`（1613）两文件消费，同样迁入 `constants.js`（共 4 个）；`PROGRESS_*` / `TAG_FONT_SIZE` 单文件消费，随消费者文件内保留。
- 警告通道：`utils/warn` once 去重 + `createWarner`（`spans.js:48`）；**警告文案逐字保留**（冻结基线含警告序列，见测试计划）。
- 样式：不拆任何 scss；`table-ex.scss`（184 行）整体不动。已核查：同特异性覆盖规则跨文件漂移问题（knowledge css-split-equal-specificity-order）在本任务不触发——无样式规则迁移。
- 纯 JS、无新依赖、无 package.json 改动。

## 改动清单

### 一、cell-painters 簇（现 1756 行）

| 新文件 | 职责 | 来源（cell-painters.js 行段） |
|---|---|---|
| `cell-content.js` | 列准备与取值链：prepareColumn / resolveCellContent / 行数上限 | 24-41（取值链文档注释）、73-77（CANVAS_ONLY_TYPES）、175-305（clampLimit…resolveCellContent、maxLinesOf）、397-405（capMaxLinesOf） |
| `cell-text.js` | 文本绘制共享原语：光学居中锚 / 水平锚 / 单多行落地 / 行高 / 下划线 y | 68（FALLBACK_LINE_HEIGHT）、524-665（measureOf、textAnchorCache、probeTextMetricsCapable、centeredTextAnchor、textAnchorX、drawTextValue + 534-546 文档）、957-966（linkUnderlineY、cellLineHeightOf）、1010-1013（fontFamilyOf） |
| `icon-image.js` | img/icon 异步加载缓存与字形绘制 | 64-65、79-173（IMAGE_CACHE_LIMIT、imageCache、getImageEntry、requestImage、requestIconImage、drawIconGlyph） |
| `item-painters.js` | 横排条目绘制与命中矩形：check/tag/img/icon/link/text 条目、条目色板 | 54（TAG_FONT_SIZE）、711-1008（itemClassOf…isTruthyAttr）、1015-1097（drawCheck…drawTag，含 reportHitRect/measureItem/drawItem/tagFontOf）、1493-1522（imageLayoutSize、drawCellImage）；fontFamilyOf（1010-1013）归 cell-text，本文件 import |
| `link-items.js` | link/list 列竖排绘制 | 1099-1201（alignedEntryX、drawLinkEntry、drawLinkItems） |
| `canvas-kind-painters.js` | canvasKind 分发绘制：progress 条 + button 组（pill/link 两形态） | 60-62（PROGRESS_*）、70-71（EMPTY_BUTTON，导出供 tooltip 共享单例）、1206-1491（drawProgress…drawButtonPill）；BUTTON_ICON_SIZE 已迁 constants |
| `cell-tooltip.js` | 单元格 tooltip 求值（title 列协议） | 1524-1756（TOOLTIP_NOOP…resolveCellTooltip） |
| `cell-painters.js`（改写为入口） | drawCell 主入口 + 分发 + 树形列绘制 + 全量重导出 | 1-23、43-51（头注与视觉常量注释；52-55 常量迁 constants）、307-395（drawCell）、407-499（isSkippableRect、drawCanvasKindContent、drawContentItems）、501-522（drawDisplayText）、667-709（drawTreeArrow、drawTreeAffordance）+ 末尾重导出块 |

重导出（保持 demo `self-checks/cell-painters.js:51-59` 的 8 个符号路径不变）：`prepareColumn/resolveCellContent`（←cell-content）、`getImageEntry/requestIconImage/drawIconGlyph`（←icon-image）、`linkHoverColorOf`（←item-painters）、`resolveCellTooltip`（←cell-tooltip）。

### 二、painter 簇（现 1449 行）

| 新文件 | 职责 | 来源（painter.js 行段） |
|---|---|---|
| `paint-utils.js` | 绘制共享工具：视口换算 / 行背景 / 排序解析 / clip | 77（FALLBACK_DPR）、118-213（rowsOf…eraseClipRegion，含 cellRectAt 导出）、239-241（isEmptyRange） |
| `paint-body.js` | 分区 1 单元格区域 + 分区 3 固定列 + spanKeepRows 帧机制 | 79-82 + 215-237（spanKeepRows、setItemHitGroup、trimItemHits → 封装为 beginSpanFrame/endSpanFrame，见接口节）、243-490（rowBandEndX…drawCellClipped）、636-659（paintFixedArea） |
| `paint-gridlines.js` | 分区 2 网格线（含合并区域分段） | 492-634（isGridlineMode…paintGridlines） |
| `paint-header.js` | 分区 4 表头 + 表头测量缓存 | 74-75（SORT_*）、84-116（measuringCtx/measureCached/measureText、headerFontOf、headerMeasureOf）、661-889（headerColIndexes…paintHeader） |
| `paint-overlay.js` | 分区 5 覆盖层（hover/编辑感知/树箭头主色/编辑按钮） | 891-1054（paintTreeArrowAccent…paintOverlay） |
| `painter.js`（改写为入口） | 绘制入口 / 脏区调度 / paintable 校验 / createPainter + 重导出 cellRectAt | 31-73（state 契约注释）、1056-1449（windowStats…createPainter）+ `export { cellRectAt } from './paint-utils'` |

### 三、独立模块小拆

| 文件 | 改动 | 来源 |
|---|---|---|
| `spans-method.js`（新） | 区域登记基础设施 + 入口 B spanMethod 解析 | spans.js 61-355（createIndex…applySpanMethod） |
| `spans-auto.js`（新） | 入口 A autoRowSpan 级联分段 | spans.js 27-44（isEmptyKey、displayValueOf）、357-525（autoSpanKeyOf…applyAutoRowSpan） |
| `spans.js`（改写） | buildSpans 编排 + 全部查询函数（全部现行导出原地保留，无需重导出） | 保留 1-26、46-59（createWarner）、527-716 |
| `editor-resolve.js`（新） | 编辑器类型/props/开值/提交值规整链 | editor.js 37-47（NON_EDITABLE_TYPES、EDITOR_COMPONENTS）、101-255（COLUMN_TYPE_EDITORS…resolveEditorProps） |
| `editor.js`（改写） | 几何三函数 + 定位 + blur 兜底 + 控制器 + 重导出 | 保留 1-35、49-99、257-567；重导出 editor-resolve 全部导出 |
| `schedulers.js`（新） | createClickGuard + createFrameScheduler | interactions.js 437-508 |
| `interactions.js`（改写） | 决策函数保留 + `export { createClickGuard, createFrameScheduler } from './schedulers'` | 保留 1-435 |
| `fenwick.js`（新） | Fenwick 树数据结构 | row-geometry.js 158-214（buildFenwick、createFenwick） |
| `row-geometry.js`（改写） | 双模式几何工厂 + 估高/精算（导出面不变） | 保留 1-156、216-509，`import { createFenwick } from './fenwick'` |
| `constants.js`（改） | 增 `TAG_HEIGHT = 20` / `TAG_PADDING_X = 8` / `TAG_RADIUS = 4` / `BUTTON_ICON_SIZE = 12`（自 cell-painters.js:52-55、59 迁入，注释注明镜像 tag.scss / 图标档） | — |

### 四、table-ex.vue 组合式（现 1633 行）

| 新文件 | 职责 | 来源（table-ex.vue 行段） |
|---|---|---|
| `use-cell-tooltip.js` | tooltip 壳级编排：状态/定时器/锚点/求值调度 | 197-209（状态声明）、624-779（tooltipEnabled 之外全部：isSameCell…hideCellTooltip，另抽 `delayHideCellTooltip` = 现 onPointerLeave 的 tooltip 段 961-965） |
| `use-paint-state.js` | paintState 持久状态组装与 syncPaintState/redraw/invalidate | 359-394（paintState 契约注释 + object；含 362 `itemHits`）、413-469（syncPaintState、redraw、invalidate、invalidateRow） |
| `use-pointer.js` | 命中换算 + hover/hoverItem/光标 + 指针事件 | 784-1028（pointOf…onPointerDown，其中 isEditButtonHit 968-988 移入 edit-button.js）；hover/hoverItem/cursor（310-315）留 shell |
| `use-cell-click.js` | click 单一入口派发：表头/树槽/编辑按钮/条目/选中/check + 编辑开启 + veil watch | 1030-1351（runEvents…toPxStyle，含 openEditorAt/focusEditor）、1500-1520（editor.state.editing veil watch） |
| `use-relayout.js` | 布局重算/滚动/尺寸响应 + 三个源 watch | 317-319（yScrolled 族 ref）、473-607（syncCanvasSize…onResize）、1522-1576（relayout 源合一 watch、渲染 props watch、headerChecked watch） |
| `use-table-instances.js` | 实例生命周期（onMounted/onUnmounted）+ 主题变更链 | 1406-1441（refreshTheme、onThemeChange）、1601-1632（onMounted/onUnmounted 内部注册）；实例槽 `painter/themeWatcher/lastRelayout`（351-354）与 `measureFn/wrapCacheObj`（304-306）留在 shell（状态枢纽），经 host setter 写入 |
| `use-table-api.js` | 暴露方法与选中 watch | 1353-1370（keyNameOf、findRowByKey）、1374-1496 中 scrollToRecord/getLayoutInfo/getThemeSnapshot/getCellRect、1578-1599（selectedKey watch） |
| `edit-button.js` | isEditButtonHit 纯判定（编辑按钮区命中，pointer 与 click 共用） | 968-988（注释 + 函数体） |
| `table-ex.vue`（改写） | 模板 + props/emits + 状态枢纽 + `host` 组装 + defineExpose | 保留 1-170、172-195、211-302（useTreeRows/spans/rowGeometry/useColumnResize 接线，改为 host 注入）、304-347、349-357（实例槽 lets）、396-411（resolveRecordKey、cellEditableOf）、609-622（editor 控制器）、632-639（tooltipEnabled + immediate watch）、1487-1496（defineExpose） |

估算：shell ≈400~450 行 = 保留段 387（模板 68 + props/emits/imports ~150 + 接线与状态枢纽 ~169）+ host 袋 ~32 + 8 处 `Object.assign`/解构 ~20；各 composable 100~380 行。若实测 >500，按片 4 步骤 4 兜底阶梯处理（已裁定可执行）。

### 五、确认零改动

`index.js`、`table-ex.scss`、`layout.js`、`theme.js`、`tree.js`、`text-wrap.js`、`use-tree-rows.js`、`use-column-resize.js`、`row-geometry-controller.js`、`constants.js` 其余内容、`src/components/index.ex.js`、`demo/**`、`docs*/**`、`skills/**`（按项目规则"完成代码实现后未经用户确认不更新文档"，本任务无 API 变化，不动文档）。

## 接口 / 数据结构

### 公开 API（不变，验证锚点）

- 组件：`MusselTableEx` / `<mu-table-ex>`（`table-ex.vue:116`、`index.js`）。
- 各入口文件导出面与符号名逐一保持（demo 消费清单：`demo/src/data/table-ex/self-checks/{cell-painters,painter,spans,editor,interactions,row-geometry}.js` import 列表；`painter.js:4` 与 `demo/.../self-checks/painter.js:24` 消费 `editor.js` 的 `editButtonRectOf` 等）。

### 新文件导出（内部 API，签名不变者不列）

- `paint-body.js`：`beginSpanFrame(spans)` / `endSpanFrame(itemHits, viewRows)`——替代 painter.js:82/1253/1261/1263 对模块变量 `spanKeepRows` 的跨文件直接读写；语义逐字等价（paint 入口 `spans ? new Set() : null` → paintSpanRegions 收集 → trimItemHits 消费 → 复位 null）。另导出 `paintCellRange` 供调度器消费；`paintGridlines` 由调度器直接从 paint-gridlines.js import（paint-body 不转手）。
- `item-painters.js` 导出：`drawItems`、`resolveItemKind`、`itemClassOf`、`linkHoverColorOf`、`isLinkEntryHovered`、`isTruthyAttr`、`itemsStartX`、`tagFontOf`、`imageLayoutSize`（后五者供 canvas-kind / link-items / cell-tooltip 消费）。
- `canvas-kind-painters.js` 导出：`drawProgress`、`drawButton`、`buttonHeightOf`、`EMPTY_BUTTON`。
- `constants.js`（改）：新增 `TAG_HEIGHT` / `TAG_PADDING_X` / `TAG_RADIUS` / `BUTTON_ICON_SIZE`（供 item-painters / canvas-kind-painters / cell-tooltip 跨文件消费）。
- `painter` 簇导出（被入口 / 其它分区 import 的最小面）：`paint-utils.js` → `cellRectAt`、`viewportColX`、`viewportRowY`、`viewRowsRange`、`viewColsRange`、`withClip`、`eraseClipRegion`、`rowsOf`、`recordKeyOf`、`rowBackground`、`sortDirectionOf`、`isEmptyRange`（`isSelectedRow` 仅 rowBackground 内部使用，不导出）；`paint-body.js` → `beginSpanFrame`、`endSpanFrame`、`paintCellRange`、`paintFixedArea`；`paint-gridlines.js` → `paintGridlines`；`paint-header.js` → `paintHeader`；`paint-overlay.js` → `paintOverlay`（其余文件内私有）。
- `spans-method.js` 导出：`createIndex`、`applySpanMethod`（spans.js 消费）、`registerRegion`、`isOccupied`（spans-auto 消费）；`spans-auto.js` 导出：`applyAutoRowSpan`（spans.js 消费）。
- `fenwick.js` 导出：`createFenwick`；`schedulers.js` 导出：`createClickGuard`、`createFrameScheduler`；`link-items.js` 导出：`drawLinkItems`。
- `cell-content.js` 导出：`prepareColumn`、`resolveCellContent`、`capMaxLinesOf`。
- `cell-text.js` 导出：`measureOf`、`centeredTextAnchor`、`textAnchorX`、`drawTextValue`、`cellLineHeightOf`、`fontFamilyOf`、`linkUnderlineY`。
- `edit-button.js` 导出：`isEditButtonHit(hit, col, { layout, spans, snapshot })`（自 table-ex.vue:968-988 提参，逻辑逐字保留）。

### 组合式 host（ctx 载体）与各模块契约

shell 在 setup 顶部建单一 `host` 对象；所有 composable 以 `useX(host)` 调用，返回值为 `Object.assign(host, api)`（`useTreeRows` / `useColumnResize` 亦直接吃 host，见调用顺序）。

**取值规则**
- 响应式状态按**对象直传**：composable 内写 `ctx.layout.value` / `ctx.spans.value` / `ctx.hover.value`；不再包一层 getter。
- shell 的普通 `let`（`painter/themeWatcher/measureFn/wrapCacheObj/lastRelayout/editingCellRef`）用 `getX()` / `setX()` 读写（`let` 会被重新赋值，不能传值）。
- 一切"尚未创建的 composable 的成员"只能经 host 惰性读取；**不得直接写解构出的 const 标识符**（不提升，setup 期求值即 TDZ）。
- setup 期被调用的前向成员只有 `relayout`（`useTreeRows` 的 immediate watch，`use-tree-rows.js:211-214`）：host 预置 `relayout: () => {}`，useRelayout 创建后覆盖为 `relayoutAndRedraw`。等价性：现实现该路径进入 `relayoutAndRedraw` 后因 `scrollEl.value` / `themeWatcher` 为空在 `table-ex.vue:499-501` 早退，且 `hideCellTooltip` 在 `rootEl.value == null` 时 `isAnchorIn(null)` 恒 false（`tooltip-core.js:129-131`），无副作用。
- `hover` / `hoverItem` / `cursor`（310-315）、`selectedKey`（308）、模板 ref 绑定变量（`tooltipAnchorEl` 等）与 `editor` 控制器的 setup 绑定留在 shell，保证模板与保留段可直接引名。

**host 键来源**

| 键 | 来源 |
|---|---|
| props / emit / rootEl / scrollEl / stickyEl / canvasEl / spacerEl / editorEl | shell（118-170、172-177） |
| preparedColumns / layout / selectedKey / hover / hoverItem / cursor | shell（preparedColumns 185、layout 195；`selectedKey/hover/hoverItem/cursor` 自 308-315 上移至 host 之前） |
| spans / wiredColumns / displayRows / flatRows / treeExpanded / treeOptions / resizeGuideX / widthOverrides / clickGuard / paintState / rowGeometry / editor | 各步骤创建后 `Object.assign` / 赋值加入（不在 host 字面量里直接引用，避免 TDZ） |
| getPreparedColumns / getLayout / setLayout / getScrollEl / getCanvasEl | 既有 `useTreeRows` / `useColumnResize` 读的是 getter 形式（`use-column-resize.js:64-71`），host 同时提供 getter 与上面的直传 ref |
| getPainter / getThemeWatcher / getMeasure / getWrapCache / getLastRelayout / getEditingCellRef | shell 实例槽 `let`（304-306、351-357） |
| setPainter / setThemeWatcher / setMeasure / setWrapCache / setLastRelayout / setEditingCellRef | 同上（useTableInstances / useRelayout 写入） |
| resolveRecordKey / cellEditableOf / genRecordKey | shell 函数声明（398-411、179） |
| commit | `() => host.editor.commit()`（useTreeRows 运行时调用；editor 步骤 7 赋值） |
| relayout | 前向槽（初始空实现，useRelayout 后覆盖） |
| 其余键 | 由各 composable 返回后并入（见下） |

**各 composable 读取键与返回**

```
useCellTooltip 读取：rootEl, props, wiredColumns, flatRows, displayRows, layout, spans,
  getThemeWatcher, getMeasure, getWrapCache, getEditingCellRef, resizeGuideX
  → { tooltipAnchorEl, tooltipController, scheduleCellTooltip, hideCellTooltip,
      delayHideCellTooltip }

usePaintState 读取：props, emit, displayRows, flatRows, spans, treeExpanded, wiredColumns,
  getMeasure, getWrapCache, selectedKey, hover, hoverItem, getEditingCellRef, resizeGuideX,
  getThemeWatcher, cellEditableOf, resolveRecordKey, getPainter
  → { paintState, syncPaintState, redraw, invalidate, invalidateRow }
  （paintState.getRecordKey 取 resolveRecordKey；itemHits = paintState.itemHits）

usePointer 读取：canvasEl, props, layout, wiredColumns, flatRows, spans, getThemeWatcher,
  cellEditableOf, paintState, syncPaintState, hover, hoverItem, cursor, invalidate, editor,
  hideCellTooltip, delayHideCellTooltip, scheduleCellTooltip, isTooltipEnabled, startResize
  → { hitAt, onPointerMove, onPointerLeave, onPointerDown }
  （updateHover/updateHoverItem 原地写 hover/hoverItem 与 paintState.hoverItem；
    onPointerLeave 走 delayHideCellTooltip——与 hideCellTooltip 不同：只清去重键+定时器，
    面板经 tooltipController.delayHide 延迟收起，见 table-ex.vue:956-966）

useCellClick 读取：emit, props, wiredColumns, flatRows, displayRows, spans, layout, selectedKey,
  resolveRecordKey, cellEditableOf, paintState, editor, editorEl, getEditingCellRef,
  setEditingCellRef, invalidate, invalidateRow, getPainter, hideCellTooltip, applyTreeToggle,
  clickGuard, hitAt
  → { onClick }

useRelayout 读取：scrollEl, canvasEl, props, preparedColumns, displayRows, rowGeometry,
  widthOverrides, layout, paintState, getThemeWatcher, hideCellTooltip, editor, redraw,
  invalidate, resetOverrides, invalidateMeasureCache, setLastRelayout
  → { relayoutAndRedraw, recomputeViewWindows, onScroll, onResize, scrollFrame,
      yScrolled, yScrolledEnd, yOverflowed }

useTableInstances 读取：scrollEl, stickyEl, rootEl, canvasEl, getThemeWatcher, setThemeWatcher,
  getPainter, setPainter, setMeasure, setWrapCache, relayout, rowGeometry,
  recomputeViewWindows, redraw, editor, hideCellTooltip, scrollFrame, onResize
  → { refreshTheme, onThemeChange }

useTableApi 读取：props, scrollEl, canvasEl, displayRows, treeOptions, layout, getPainter,
  rowGeometry, getThemeWatcher, spans, invalidateRow, selectedKey, genRecordKey, getLastRelayout
  → { scrollToRecord, getLayoutInfo, getThemeSnapshot, getCellRect }
```

模板绑定（1-68 不变）：`@scroll` / `@sizechange` / `@pointermove` / `@pointerleave` / `@pointerdown` / `@click` 的处理函数在 shell 解构（步骤 8-10）后直接绑定，模板不引用 host。

### 依赖方向（禁止反向，实施时 build 即时暴露）

```
constants ← fenwick ← row-geometry
constants ← text-wrap ← cell-text ← cell-content（cellLineHeightOf）/ item-painters / link-items / canvas-kind-painters
constants ← text-wrap ← cell-content / item-painters / link-items / canvas-kind-painters / cell-tooltip
icons ← icon-image ← item-painters / canvas-kind-painters / paint-overlay
cell-text + icon-image + cell-content ← item-painters ← link-items
item-painters ← canvas-kind-painters ← cell-tooltip；cell-content + item-painters ← cell-tooltip
spans-method ← spans-auto；spans-method + spans-auto ← spans.js（入口）
editor-resolve ← editor.js（入口）
schedulers ← interactions.js（重导出）
paint-utils ← paint-gridlines / paint-body / paint-header / paint-overlay ← painter.js（入口）
cell-painters 簇全部 ← painter.js；edit-button ← use-pointer / use-cell-click
```

### table-ex.vue 组装顺序（TDZ 关键，必须照此）

0. shell 声明：模板 refs（172-177）、props/emits、`preparedColumns` / `layout`、`selectedKey` / `hover` / `hoverItem` / `cursor`（自 308-315 上移）、实例槽 lets（304-306、349-357）、`const host = { ... }`（只放此刻已存在的成员：props/emit/元素 refs/上述状态/各 `get*`·`set*`/`commit` 闭包/`relayout: () => {}` 前向槽/`isTooltipEnabled` 惰性键）。
1. `const tooltipApi = useCellTooltip(host)` → `Object.assign(host, tooltipApi)`；解构 `{ tooltipAnchorEl, tooltipController }`（模板 ref 绑定 / tooltipEnabled watch 用）。
2. `const treeApi = useTreeRows(host)` → `Object.assign(host, treeApi)`；保留现有 10 项解构（`treeExpanded/treeOptions/flatRows/displayRows/wiredColumns/treeIndentsOf/applyTreeToggle/expandAll/collapseAll/getTreeExpandedKeys`）。**此时 host.relayout 为空实现**：immediate tree watch 调用后等价早退（等价性见接口节）。
3. spans computed + devWarn（保留 245-262）；`host.spans = spans`。
4. `rowGeometry = createRowGeometryController({ ...269-286 现有键, relayout: () => host.relayout() })`；`host.rowGeometry = rowGeometry`。
5. `const resizeApi = useColumnResize(host)` → `Object.assign(host, resizeApi)`；保留现有解构 `{ resizeGuideX, clickGuard, widthOverrides, startResize, resetOverrides }`。`host.invalidate` 此刻未赋值——useColumnResize 只在拖拽 move 回调调用它，运行时已由步骤 6 赋值。
6. `Object.assign(host, usePaintState(host))`。
7. `const editor = createEditorController({ ...611-622 })`；`host.editor = editor`。
8. `const clickApi = useCellClick(host)`；`Object.assign(host, clickApi)`；`const { onClick } = clickApi`。
9. `const pointerApi = usePointer(host)`；`Object.assign(host, pointerApi)`；`const { onPointerMove, onPointerLeave, onPointerDown } = pointerApi`（hover/hoverItem/cursor 已在 shell 声明并放入 host，本步不回填）。
10. `const relayoutApi = useRelayout(host)`；`Object.assign(host, relayoutApi)`；**`host.relayout = relayoutApi.relayoutAndRedraw`（覆盖前向槽，必须在本步末执行）**；`const { onScroll, onResize, yScrolled, yScrolledEnd, yOverflowed } = relayoutApi`。
11. `const instancesApi = useTableInstances(host)`；`Object.assign(host, instancesApi)`；`const { refreshTheme } = instancesApi`（内部注册 onMounted/onUnmounted，首帧 `nextTick(host.relayout)`）。
12. `const apiApi = useTableApi(host)`；`Object.assign(host, apiApi)`；`const { scrollToRecord, getLayoutInfo, getThemeSnapshot, getCellRect } = apiApi`；`tooltipEnabled` computed + immediate watch 保留原位（632-639，须在 useTreeRows 之后；host 以 `isTooltipEnabled: () => tooltipEnabled.value` 惰性键供给 usePointer）；defineExpose 保留 1487-1496。

验证不变量：setup 期唯一同步执行的跨 composable 调用 = tree immediate watch → `host.relayout()`（空实现，等价于现实现早退）；其余 composable 的 setup 体只做声明与 hook 注册，不读任何尚未赋值的 host 成员。

### 模块级可变状态迁移清单（单例语义不变，仅换文件）

`imageCache`/`textAnchorCache`（cell-painters → icon-image / cell-text）、`measuringCtx`/`measureCached`（painter → paint-header）、`spanKeepRows`（→ begin/endSpanFrame 封装）。迁移后各仅存一份，禁止出现副本。

## 被拒绝的备选

1. **对半机械拆分**（如 cell-painters → 前后半两文件）：不按功能关注点分组，agent 定位"某类列的编辑/绘制逻辑"仍需读全量，违背任务目标（00-task 目标：特定功能优化时更少/更快读取）。
2. **更新 demo/文档 import 指向新文件、不做入口重导出**：超出追加约束"拆分范围限 src/components/table/ex/"，且爆炸半径扩大到目录外。
3. **table-ex.vue 不拆**（仅拆纯逻辑模块）：1633 行是目录内最大文件，直接违反验收标准 1"所有源码文件 ≤500 行"。
4. **按水平层拆 composable**（先全部状态文件、再全部函数文件）：违背项目 use-* 先例的功能纵切模式，且状态与操作分离后 wiring 反而更多。

## 风险与回滚

- 单向门：无。不改公开 API、不改注册名、不加依赖、不改样式；全部改动为文件内代码整体迁移 + 重导出 + composable 抽取。
- 双向门：单 commit（`🔨: 拆分 table-ex 大文件为按功能关注点的小模块`），回滚 = revert 该 commit。爆炸半径 = table-ex 组件本身（demo 3 个引用页：table-ex / table-ex-basic / table-ex-scene）。
- 主要风险与对策：
  1. **TDZ / 调用顺序**（table-ex.vue 拆分）：现实现依赖函数声明提升（`redraw:451`、`relayoutAndRedraw:495`、`resolveRecordKey:398`、`cellEditableOf:409`）；拆分后一律 host 惰性读取 + `relayout` 前向槽（接口节）。验证 = demo 页加载无异常（setup 期 TDZ 立即抛 ReferenceError）+ 自检 223/223。
  2. **模块级单例状态误复制**：迁移清单见接口节；逐字迁移（连注释一起搬），禁止重写函数体。
  3. **循环 import**：依赖图无环约束；vite build 对循环会告警/报运行时错，每片构建即暴露。
  4. **行为漂移**：冻结基线逐字比对（测试计划，含归一化规则）+ demo 自检双安全网（knowledge table-ex-refactor-frozen-probe）。
  5. **spanKeepRows 帧语义**：begin/endSpanFrame 封装必须保持"paint 入口置集合 → region pass 写入 → trim 消费 → 复位"同一时序，painter 自检组（分区 5/keepRows 用例）覆盖。
  6. **shell 超 500 行**：host 袋接线 + 片 4 步骤 4 兜底阶梯（两步，逐条给迁移范围与预算）；阶梯用尽仍超则停下回报，不继续猜迁移点。
  7. **demo 包未重建导致假通过**：浏览器断言前必须过新鲜度门（`find src/components/table/ex -newer demo/dist/assets/catalog.js` 为空；否则等 watch 重建或启动 `npm run demo:build`）。

## 测试计划

| 验收标准 | 归属 | 手段 | 检查方式 |
|---|---|---|---|
| 1. 所有源码文件 ≤500 行 | 每片 + 终验 | 命令 | `wc -l src/components/table/ex/*.js src/components/table/ex/*.vue src/components/table/ex/*.scss` 逐行 ≤500 |
| 2a. 库构建无报错 | 每片 + 终验 | 命令 | `npm run build` 退出码 0（base/ex × dev/prod 四段全过） |
| 前置门：demo 包已重建 | 每片 + 终验 | 命令 | `find src/components/table/ex -newer demo/dist/assets/catalog.js` 输出为空；非空则等 watch 重建或启动 `npm run demo:build`（watch），禁止在旧包上断言 |
| 2b. demo 页正常渲染、无 console 错误 | 每片 + 终验 | 浏览器（headless Edge，knowledge headless-edge-dom-verification） | `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom --enable-logging=stderr --virtual-time-budget=8000 http://localhost:3000/data/table-ex/ > <临时目录>/dom.txt 2> <临时目录>/console.txt`（URL 前缀 /data/，knowledge demo-page-url-data-prefix；临时文件交付前删除）。断言：① canvas 宽高 > 0（`<canvas class="mu-table-ex__canvas" width="…" height="…">`）；② `.ct-check-item--fail` 计数 = 0；③ `.ct-self-checks` 区块文本 md5 = 基线；④ console 的 MUSSEL 消息序列（归一化后）与基线逐行一致（规则见基线行） |
| 2c. 滚动/编辑入口等基本交互正常 | 终验 | 浏览器（CDP，无 playwright 亦可） | 附录 A 脚本：headless Edge `--remote-debugging-port=9333 --remote-allow-origins=*` + node `Runtime.evaluate`。断言：① 点击可编辑列（列 3，未开编辑则依次回退 4-8；knowledge table-ex-demo-interaction-verify）后 150ms 内 `.mu-table-ex__editor` 存在且 `.ct-event-log__item` 条数增加；② `scrollTop=120` 后 `getLayoutInfo().viewRows` 变化；③ `Runtime.exceptionThrown` / `console.error` 为空。改前实测基线：editor=true、日志 1→3、viewChanged=true、errors=[] |
| 冻结基线 | 片 1 步骤 1 / 集成 | 命令 | 改前用 2b 命令抓 `dom.txt` / `console.txt`：① `grep -o '<div class="ct-debug__block ct-self-checks">.*</ul></div>' dom.txt \| head -1 \| md5sum`；② `grep -o '\[MUSSEL[^"]*' console.txt \| sed 's/[0-9]\{6,\}/<N>/g'`（消息文本序列，剔除 source/行号与易变数字）。两项写任务目录 `baseline.txt`；集成片逐字比对，交付前删除（knowledge table-ex-refactor-frozen-probe）。实测两次运行 md5 与序列完全一致 |
| 目录外零改动 | 终验 | 命令 | `git status --short` 仅 `src/components/table/ex/` 内路径 + 任务目录 `agent-docs/plans/20261105-table-ex-refactor/`（既有 untracked）；`git diff --stat -- src/components/table/ex` 复核 |
| lint | 终验 | 命令 | `eslint src/components/table/ex`：0 error 且 warning ≤ 基线（实测基线 0 error / 6 warning，均在 cell-painters.js：4 处 complexity + 2 处 max-len） |

### 附录 A：交互冒烟脚本（临时，交付前删除）

启动（Git Bash；记录 PID 供收尾；端口被占则改 9334）：

```bash
rm -rf /tmp/edge-smoke && mkdir -p /tmp/edge-smoke
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --no-first-run \
  --remote-debugging-port=9333 --remote-allow-origins=* \
  --user-data-dir=/tmp/edge-smoke "http://localhost:3000/data/table-ex/" &
```

`<任务目录>/smoke-interaction.mjs`（node ≥22，全局 `WebSocket` / `fetch`）：

```js
const port = 9333
const deadline = Date.now() + 15000
let target = null
while (!target && Date.now() < deadline) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    target = list.find(t => t.type === 'page' && t.url.includes('/data/table-ex/'))
  } catch {}
  if (!target) await new Promise(r => setTimeout(r, 300))
}
if (!target) { console.error('FAIL: no page target'); process.exit(1) }

const ws = new WebSocket(target.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); return }
  if (msg.method === 'Runtime.exceptionThrown') errors.push('exception')
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console.error')
})
await new Promise(r => ws.addEventListener('open', r))
const send = (method, params = {}) => new Promise(r => {
  const id = ++seq
  pending.set(id, r)
  ws.send(JSON.stringify({ id, method, params }))
})
await send('Runtime.enable')

const expression = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const deadline = Date.now() + 10000
  while (!window.__canvasTable && Date.now() < deadline) await sleep(100)
  const inst = window.__canvasTable
  const sticky = document.querySelector('.mu-table-ex__sticky')
  const canvas = document.querySelector('.mu-table-ex__canvas')
  if (!inst || !sticky || !canvas) return { ok: false, reason: 'not ready' }
  const layout = inst.getLayoutInfo()
  const rect = canvas.getBoundingClientRect()
  const fire = col => {
    let x = 0
    for (let i = 0; i <= col; i++) x += layout.colWidths[i]
    x -= layout.colWidths[col] / 2
    const opts = { bubbles: true, clientX: rect.left + x, clientY: rect.top + layout.headHeight + 18 }
    sticky.dispatchEvent(new PointerEvent('pointerdown', opts))
    sticky.dispatchEvent(new PointerEvent('pointerup', opts))
    sticky.dispatchEvent(new MouseEvent('click', opts))
  }
  const before = document.querySelectorAll('.ct-event-log__item').length
  let editor = false
  for (const col of [3, 4, 5, 6, 7, 8]) {
    fire(col)
    await sleep(150)
    editor = !!document.querySelector('.mu-table-ex__editor')
    if (editor) break
  }
  const after = document.querySelectorAll('.ct-event-log__item').length
  const scrollEl = document.querySelector('.mu-table-ex__scroll')
  const v0 = JSON.stringify(inst.getLayoutInfo().viewRows)
  scrollEl.scrollTop = 120
  scrollEl.dispatchEvent(new Event('scroll'))
  await sleep(250)
  const v1 = JSON.stringify(inst.getLayoutInfo().viewRows)
  return {
    ok: true,
    summary: document.querySelector('.ct-self-checks .ct-debug__header span')?.textContent,
    fails: document.querySelectorAll('.ct-check-item--fail').length,
    canvas: [canvas.width, canvas.height],
    editor,
    logDelta: after - before,
    viewChanged: v0 !== v1,
    scrollTop: scrollEl.scrollTop
  }
})()`

const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
const r = result.value ?? {}
const pass = r.ok && r.fails === 0 && r.canvas?.[0] > 0 && r.canvas?.[1] > 0 &&
  r.editor && r.logDelta > 0 && r.viewChanged && r.scrollTop > 0 && errors.length === 0
console.log(JSON.stringify({ pass, ...r, errors }))
ws.close()
process.exit(pass ? 0 : 1)
```

收尾：`taskkill //F //PID <启动 PID>`；删除 `smoke-interaction.mjs`（交付 diff 不含临时脚本）。

## 实施步骤

### 片 1：独立纯逻辑模块（spans / editor / interactions / row-geometry）

- 行为判据：build 成功；demo 自检全绿（计数 = 基线）；`spans.js / editor.js / interactions.js / row-geometry.js` 均 ≤500；目录外零改动。
- 步骤：
  1. 采集冻结基线（改前、未编辑任何源码时）：过新鲜度门 → 执行 2b 命令 → 提取 `.ct-self-checks` 区块文本 md5 + 归一化 MUSSEL 消息序列 → 写任务目录 `baseline.txt`（格式：两行，`md5 <值>` / `mussel <n 行>` 后接序列）。改前自检计数记录为 223/223。
  2. 拆 `fenwick.js`、`schedulers.js`（最小两拆）。
  3. 拆 `editor-resolve.js`，`editor.js` 重导出。
  4. 拆 `spans-method.js`、`spans-auto.js`，`spans.js` 保留 buildSpans + 查询。
  5. `npm run build` + `wc -l` 复核；过新鲜度门后跑 2b（md5 / MUSSEL 序列 / fail=0 / canvas 尺寸）。
- 文件集合：`fenwick.js`、`schedulers.js`、`editor-resolve.js`、`editor.js`、`spans-method.js`、`spans-auto.js`、`spans.js`、`interactions.js`、`row-geometry.js`、`baseline.txt`（任务目录，非源码）。
- 依赖片：无。

### 片 2：cell-painters 簇

- 行为判据：同片 1（自检的 cell-painters/painter 组不变绿即停）。
- 步骤：
  1. `constants.js` 增 `TAG_HEIGHT` / `TAG_PADDING_X` / `TAG_RADIUS` / `BUTTON_ICON_SIZE`（4 个）。
  2. 按"共享层 → 消费层"顺序建文件：cell-text、icon-image、cell-content → item-painters → link-items、canvas-kind-painters → cell-tooltip → 改写 cell-painters.js（入口 + 重导出）。每建 1-2 个文件跑一次 build。
  3. build + 自检 + `wc -l` 复核（8 文件均 ≤500）。
- 文件集合：`constants.js`、`cell-text.js`、`icon-image.js`、`cell-content.js`、`item-painters.js`、`link-items.js`、`canvas-kind-painters.js`、`cell-tooltip.js`、`cell-painters.js`。
- 依赖片：无（与片 1 串行执行以避免同文件冲突）。

### 片 3：painter 簇

- 行为判据：同片 1（painter 自检组重点：分区绘制 / 脏区调度 / keepRows / lastPaint）。
- 步骤：
  1. 建 `paint-utils.js` → `paint-gridlines.js` → `paint-body.js`（含 begin/endSpanFrame）→ `paint-header.js` → `paint-overlay.js`。
  2. 改写 `painter.js` 为调度入口 + 重导出 cellRectAt；paint() 接入 begin/endSpanFrame。
  3. build + 自检 + `wc -l` 复核（6 文件均 ≤500）。
- 文件集合：`paint-utils.js`、`paint-gridlines.js`、`paint-body.js`、`paint-header.js`、`paint-overlay.js`、`painter.js`。
- 依赖片：无。

### 片 4：table-ex.vue 组合式

- 行为判据：demo 页加载无 console 错误（setup TDZ 即时暴露）；自检全绿；交互冒烟（2c）；`table-ex.vue` ≤500。
- 步骤：
  1. 建 `edit-button.js`（验：build 过）。
  2. 按接口节"组装顺序"逐步建 composable，每建 1 个跑一次 build：use-cell-tooltip → use-paint-state → use-pointer → use-cell-click → use-relayout → use-table-instances → use-table-api。每个都以 `useX(host)` 形式、只读接口节列出的键。
  3. 改写 `table-ex.vue`：建 host 袋 → 按 0-12 步重排组装 → 保留模板 / props / emits / 状态枢纽 / `tooltipEnabled` 与 immediate watch（632-639）/ defineExpose（1487-1496）。现有 3 处对 `relayoutAndRedraw` 的引用（useTreeRows ctx、rowGeometry 269-286、useColumnResize）统一走 `host.relayout`；`stickyStyle` 等仍用 shell 声明的 `cursor`。
  4. 过新鲜度门 → build + 2b + 2c + `wc -l` 复核。若 `table-ex.vue` >500，按阶梯兜底（每步后复跑 build + 2b）：
     a. `spans` computed + `devWarn`（245-262）迁入 `use-paint-state.js`（返回 `spans`）；shell 解构该返回值，`host.spans = spans`；rowGeometry ctx 的 `getSpans` 改为 `() => host.spans.value`。预计 −14 行。
     b. `isEmpty` / `wrapClass` / `stickyStyle` / `spacerStyle`（321-347）迁入新 `use-view-computed.js`（新增 1 文件，返回 4 个 computed）。预计 −22 行。
     c. 仍 >500 → 停下回报（附 `wc -l` 与保留段行数分布），不继续猜迁移点。
- 文件集合：`edit-button.js`、`use-cell-tooltip.js`、`use-paint-state.js`、`use-pointer.js`、`use-cell-click.js`、`use-relayout.js`、`use-table-instances.js`、`use-table-api.js`、`table-ex.vue`（兜底 b 触发时另加 `use-view-computed.js`）。
- 依赖片：无（建议在片 1-3 后实施，降低回归定位难度）。

### 集成（终验 + 提交）

- 行为判据：验收标准 1、2 全通过；基线逐字一致。
- 步骤：
  1. 全量 `wc -l`（目录内全部 .js/.vue/.scss ≤500）。
  2. `npm run build`。
  3. 过新鲜度门 → 2b（canvas / fail=0 / md5 / MUSSEL 序列）+ 2c（附录 A，退出码 0）。
  4. `git status --short` 确认目录外零改动（仅 ex/ + 任务目录）；`git diff --stat -- src/components/table/ex`；`eslint src/components/table/ex`（0 error / warning ≤6）。
  5. 删除 `baseline.txt` 与 `smoke-interaction.mjs`；确认 demo/dist 无临时资产；复跑 2b 一次（md5 与序列仍与基线一致，证明临时文件不参与运行）。
  6. 单 commit：`git add src/components/table/ex && git commit -m "🔨: 拆分 table-ex 大文件为按功能关注点的小模块"`（仅 src；任务目录不入库）。
- 文件集合：无新增（核对全部）。
- 依赖片：片 1、2、3、4。

## 未解问题

无。原两项已按派发追加约束裁定：

1. **table-ex.vue 行数兜底**：主方案改 host 袋接线（估算 ≈400~450，余量 ~50-100 行）；兜底阶梯两步（片 4 步骤 4a/4b，纯迁移、预计 −14 / −22 行），阶梯用尽仍 >500 则停下回报。判定：可执行。
2. **交互冒烟取证强度**：采用 00-task「验证命令/环境」允许的 headless Edge，升级为 CDP 注入（`--remote-debugging-port` + `Runtime.evaluate`），以合成指针事件取证（编辑器浮层出现 + 事件日志增量 + 滚动后 viewRows 变化 + 无 console error）；附录 A 为可运行脚本，改前已实测通过。不再留待主会话 playwright 点验。
