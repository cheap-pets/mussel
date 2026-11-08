# table-ex 调用层级关系结构图数据

> 基准：工作区（HEAD `ee16eb4` + table-ex 结构重构批次 B1–B6 改动未提交，2026-11-07 验证 PASS；批次定义与验证记录见 `agent-docs/plans/20261107-table-ex-reforge/02-design.md`）。
> 用途：agent 检索与分析的结构底图。代码重构后须同步更新本文件。
> 同步：2026-11-08 工作区改名 edit-button → cell-button（事件 cell-button-click、配置键 cellButton）并加编辑格门控；相关文件名与符号已更新。

## 1. 分层模型

按运行时调用方向（上层调下层）：

| 层 | 目录/文件 | 职责 | 依赖的下层 |
|---|---|---|---|
| L0 壳 | `table-ex.vue`（474 行） | props/emits、模板、host 袋构建、12 步组装、defineExpose | L1 全部 + spans/cell-content/paint-utils/editing×2/controller 直引 |
| L1 编排 | `composables/`（10 文件） | 功能纵切：树/tooltip/点击/选中/指针/列宽/绘制状态/relayout/实例/API；注册全部 watch 与生命周期 | L2/L3/L4 + 外部 tooltip-core |
| L2 管线与控制器 | `table-paint/painter.js`、`geometry/row-geometry-controller.js`、`editing/editor.js` | 有状态闭包工厂：rAF 合帧绘制调度、行高双模式几何、编辑状态机 | L3/L4 |
| L3 领域纯函数 | `table-paint/`（body/gridlines/header/overlay/utils）、`geometry/`（layout/row-geometry）、`interaction/`（6 文件：hit-test/click-resolve/resize-resolve/cell-button/cell-selection/schedulers）、`spans/`（合并索引）、`cell-paint/`（取值与绘制分发）、`editing/`（editor-geometry/editor-resolve 纯函数） | 单向数据变换：画分区、算几何、判命中、建索引、解析单元格内容/编辑盒几何与规整 | L4 + column-types/mappings |
| L4 共享原语 | `shared/`（constants/text-wrap/theme/tree/cell-identity）、`geometry/fenwick.js` | 常量、文本测量/折行、主题观察、树平铺、格身份/行序号、BIT | 无（text-wrap→constants 一条 L4 内边，其余零内部依赖） |
| 外部对接 | `../column-types/`（16 类型双通道 compile）、`../mappings`、`@/icons`、`form/index.js` | 列类型协议、映射、图标、编辑器表单组件 | — |

环依赖 NONE；跨目录边见 §6.3（paint/interaction 层直引 editing 纯函数模块 editor-geometry，非反向边）。

## 2. 目录级依赖图

```mermaid
graph TD
  subgraph L0
    SHELL[table-ex.vue]
  end
  subgraph L1["L1 composables"]
    CMP[composables/ 10 文件]
  end
  subgraph L2["L2 管线与控制器"]
    PAINTER[table-paint/painter.js]
    RGC[geometry/row-geometry-controller.js]
    EDITOR[editing/editor.js]
  end
  subgraph L3["L3 领域纯函数"]
    PAINT[table-paint/ 其余 5 文件]
    GEO[geometry/ layout+row-geometry+fenwick]
    INTER[interaction/ 6 文件]
    SPANS[spans/ 3 文件]
    CELL[cell-paint/ 8 文件]
    EGEO[editing/ editor-geometry+editor-resolve]
  end
  subgraph L4["L4 原语"]
    SHARED[shared/ 5 文件]
  end
  CTYPES[column-types/ 16 类型]
  MAP[mappings.js]

  SHELL --> CMP & SPANS & CELL & EDITOR & RGC & EGEO & PAINT
  CMP --> PAINTER & INTER & EGEO & CELL & SPANS & SHARED & GEO
  CMP -.->|use-cell-tooltip| TOOLTIP[@/components/tooltip]
  PAINTER --> PAINT & SPANS
  RGC --> GEO & SHARED
  EDITOR --> EGEO
  PAINT --> CELL & SPANS & SHARED & EGEO
  GEO --> SPANS & SHARED & CTYPES
  INTER --> GEO & SHARED & CELL & SPANS & EGEO
  INTER -.->|cell-button| ICON2[../column-types/icon]
  EGEO -.->|editor-resolve| MAP & FORM[form/index.js]
  CELL --> CTYPES & MAP & SHARED
  CELL -.->|icon-image| ICONS[@/icons]
  SPANS --> SHARED
  SHARED --> ∅
```

虚线 = 跨出 ex/ 的外部依赖。`spans` 与 `cell-paint` 被多文件消费（横切，§6.1）；INTER 内部：click-resolve → hit-test（isTreeArrowSlot 唯一跨文件私有依赖）。

## 3. 壳组装（table-ex.vue）

### 3.1 组装顺序（12 步，顺序敏感）

| 步 | 调用 | 返回并入方式 | 时序约束 |
|---|---|---|---|
| 1 | `useCellTooltip(host)` | Object.assign | 须先于 useTreeRows（immediate tree watch 运行时链依赖 hideCellTooltip） |
| 2 | `useTreeRows(host)` | Object.assign | immediate watch setup 期调 `host.relayout()` 空实现（前向槽） |
| 3 | `spans = computed(buildSpans)` | `host.spans` 直挂 | 依赖步骤 2 的 displayRows/wiredColumns |
| 4 | `createRowGeometryController({…14 getter})` | `host.rowGeometry` 直挂 | relayout 回调转发 `host.relayout()` |
| 5 | `useColumnResize(host)` | Object.assign | host.invalidate 此步未赋值，仅运行时触达 |
| 6 | `usePaintState(host)` | Object.assign | — |
| 7 | `createEditorController({ onCommit })` | `host.editor` 直挂 | onCommit 内 nextTick → remeasureRow + invalidateRow |
| 8 | `useCellClick(host)` | Object.assign | — |
| 9 | `usePointer(host)` | Object.assign | — |
| 9.5 | `useCellSelect(host)` | Object.assign | 清除 watch 须先于步骤 10 合并 watch flush（pre watcher 按创建 id 排序） |
| 10 | `useRelayout(host)` | Object.assign + 覆盖 `host.relayout` | 末尾覆盖前向槽 |
| 11 | `useTableInstances(host)` | Object.assign | onMounted 创建 painter/measure/wrapCache/themeWatcher |
| 12 | `useTableApi(host)` | Object.assign | — |

前向槽 3 个：`relayout`（空实现，步骤 10 覆盖）、`commit`（转发 editor）、`isTooltipEnabled`（惰性读 tooltipEnabled）。

### 3.2 host 袋（约 40 键，单 ctx 注入所有 composable）

| 组 | 键 |
|---|---|
| 响应式状态直传（.value 读） | `props, emit, rootEl, scrollEl, stickyEl, canvasEl, spacerEl, editorEl, preparedColumns, layout, selectedKey, hover, hoverItem, cursor, selectedCell, spans` |
| 普通 let 读写器（get*/set* 成对） | painter, themeWatcher, measure→getMeasure/setMeasure, wrapCache, lastRelayout, editingCellRef, getPreparedColumns/getScrollEl/getLayout/setLayout/getCanvasEl |
| 方法/谓词 | `resolveRecordKey, cellEditableOf, genRecordKey` |
| 服务对象 | `rowGeometry, editor, paintState(经 usePaintState), clickGuard, hitAt, onClick…` |
| 动作（各 composable 回填） | `redraw, invalidate, invalidateRow, syncPaintState, relayout, commit, startResize, resetOverrides, hideCellTooltip, delayHideCellTooltip, scheduleCellTooltip, selectCell, clearCellSelection, applyTreeToggle, recomputeViewWindows, refreshTheme` |

访问约定双轨：ref 走 `ctx.xxx.value`，let 走 `ctx.getXxx()`。composable 间无直接 import，横向调用全部经 host 运行时解析（§6.4）。

### 3.3 模板事件接线（全部在 `__sticky` 层，canvas 无事件）

`__scroll`: `@scroll=onScroll`、`@sizechange=onResize`；`__sticky`: `@pointermove=onPointerMove`、`@pointerleave=onPointerLeave`、`@pointerdown=onPointerDown`、`@click=onClick`；编辑浮层与 tooltip 锚点见 table-ex.vue L34-62。

## 4. 关键运行链路

### 4.1 绘制链（redraw → canvas）

```
usePaintState.redraw()                        [composables]
└─ syncPaintState()                           30+ 字段 host → paintState 原地同步
└─ painter.draw(paintState)                   [table-paint/painter.js]
   └─ paint(ctx, state, region)               DPR transform + 计时
      ├─ beginSpanFrame(state.spans)          [paint-body] 模块级单例 spanKeepRows
      ├─ 整幅: paintFull
      │  ├─ ① paintCellRange                  [paint-body] rowsOf→rowGeometry.heightAt
      │  │     ├─ spans=null: paintBodyRow(10 参)
      │  │     └─ spans≠null: paintBodyRowSpans(10 参) + paintSpanRegions(两遍式)
      │  │     └─ drawCellClipped(12 参) → cell-painters.drawCell(ctx, {19 字段})
      │  │        └─ resolveCellContent(col,{record,recordNumber,emit})  [cell-content]
      │  │           └─ col._render({record,value,emit})                [column-types compile 产物]
      │  ├─ ② paintGridlines                  [paint-gridlines] 分段跳线(spans.rowRegions/regions)
      │  ├─ ③ paintFixedArea                  [paint-body] 不透明底 + 递归 ①② (固定列区间)
      │  ├─ ④ paintHeader                     [paint-header] check/文本/排序图标/列线
	      │  └─ ⑤ paintOverlay                    [paint-overlay] hover/编辑描边/选中格/树箭头/格按钮/调宽参考线
	      │        └─ 描边单一事实源（B5 提取）: cellFrameOf（矩形链 regionAt→spanRectOf→editorRectOf）+ strokeBodyFrame（表体区裁剪描边块）
      ├─ 脏区: paintRegion                     5 形状 {header|rows|cols|cell|colFrom} 各自 clip+erase 后跑 ①②③⑤
      └─ endSpanFrame(state.itemHits, viewRows)  裁剪 itemHits + 复位单例
```

绘制副作用：canvas 像素 + `state.itemHits`（两级 Map，row→col→rects[]，供点击/悬停反查）+ lastPaint 统计。

### 4.2 指针交互链

```
pointermove → usePointer.onPointerMove
  └─ hitAt: hitTest({12 字段}) [hit-test] → colAt/rowAt/findResizeColumn [geometry/layout]
  │    └─ resolveSpanCell(spans, rawHit)      合并格归一为主格坐标（壳出口单一接入点）
  ├─ updateHover → hoverRegions(prev/next,mode,spans) → invalidate(带脏区)
  ├─ updateHoverItem → resolveItemClick({hit,itemHits}) [click-resolve]
  └─ resolveCursor(hit, columns, {flatInfo,editable,isCellEditableFn}) [hit-test]
      └─ scheduleCellTooltip → resolveTooltipTarget 门控 [hit-test] → (80ms) resolveCellTooltip [cell-tooltip]

pointerdown → usePointer.onPointerDown
  └─ resolvePointerdown({editing,hit}) [hit-test] → editor.commit() | startResize(event,hit) [use-column-resize]

click → useCellClick.onClick（单一入口，分支序固定）
  └─ clickGuard.consume → hitAt
  ├─ 表头: resolveHeaderClick → resolveOrderByNext [click-resolve] → emit header-click/update:*
  ├─ 树槽: resolveTreeToggle [click-resolve] → applyTreeToggle [use-tree-rows]
  ├─ 格按钮: isCellButtonHit [interaction/cell-button] → emit cell-button-click
  ├─ 条目: resolveItemClick [click-resolve] → emitCellItemClick → emitButtonItemClick/emitDomItemClick
  │         （dom 路径重入 resolveCellContent 重建 payload）
  ├─ check/选中: resolveCellClick({9 字段}) [click-resolve] → emit update:cell-value/selected-*
  └─ 开编辑: resolveCellClickOpen [click-resolve] → openEditorAt → resolveEditorType [editor-resolve]
              + computeEditorStyle({17 字段}) [editor-geometry] → editor.open({7 字段})
```

### 4.3 relayout / 滚动链

```
onScroll → useRelayout.onScroll → editor.commit + hideCellTooltip + yScrolled*
  └─ scrollFrame.schedule(rAF 合帧) → recomputeViewWindows
      ├─ computeViewRows({scrollTop,viewH,rowGeometry}) / computeViewCols [geometry/layout]
      └─ rowGeometry.remeasureVisibleRows → ensureRowMeasured({10 字段}) [geometry/row-geometry]
      ├─ spans.spanHeightRoleOf + text-wrap.wrapLines/estimateLineCount
      └─ 锚定补偿: syncAnchoredLayout（row-geometry-controller 内单一事实源，B6 收敛内联块）
      └─ redraw()

relayoutAndRedraw（host.relayout，resize/主题/树 toggle/列变/合并 watch 共用）
  └─ computeLayout(=layout.relayout {11 字段}) 双过 [geometry/layout]
  └─ rowGeometry.resolveForRelayout → rescanRowHeights(7 参)/估高扫描签名
  └─ syncCanvasSize(dpr) → remeasureVisibleRows → recomputeViewWindows → redraw
```

### 4.4 编辑链

```
click 可编辑格 → openEditorAt [use-cell-click]
→ editor.open({column,record,…}) [editing/editor.js]
→ 值 watch(flush:sync)/Enter/Esc/blur(setTimeout 0 兜底)
→ applyCommit: normalizeCommitValue [editor-resolve] → column.editor.validate → 去重
→ onCommit(壳) → emit update:cell-value → nextTick → remeasureRow + invalidateRow
```

### 4.5 树展开链

```
click 树箭头槽 → resolveTreeToggle → applyTreeToggle [use-tree-rows]
  锚定捕获(offsetToRow+topAt) → commit(编辑) → toggleKey(shared/tree) → emit
  → relayoutAndRedraw → 锚定补偿回写 scrollTop → recomputeViewWindows → redraw
（onThemeChange [use-table-instances] 含同构锚定补偿代码）
```

## 5. 核心数据对象

| 对象 | 字段数 | 生产者 | 消费者 |
|---|---|---|---|
| `layout` 快照 | 22 | `layout.relayout()` | 绘制层全量、hitTest、computeEditorStyle、cellRectAt |
| `paintState` | 30 | `usePaintState` 组装（每次绘制前 sync） | painter 全管线（隐式贯穿 39 个函数） |
| host 袋 | ~40 | table-ex.vue + 各 composable 回填 | 10 个 composable（@host-* 注解声明消费面） |
| `drawCell` 实参 | 19 | `drawCellClipped` | cell-paint 绘制分发 |
| `computeEditorStyle` 实参 | 17 | `openEditorAt` | editor 几何 |
| controller deps | 14（全 getter） | table-ex.vue 步骤 4 | row-geometry-controller |
| `hitTest` 入参 | 12（JSDoc 已列全） | `hitAt` | 命中检测 |
| spans 共享 ctx | 10 | `buildSpans` 构造 | spans-method/spans-auto |
| `relayout` 入参 | 11 | relayoutAndRedraw | layout 聚合 |
| theme 快照 | 21 + 17 色 | `readSnapshot` [shared/theme] | 绘制/几何/字体 |

## 6. 横切关注点与结构异常点（agent 分析时的关键锚）

### 6.1 横切枢纽
- `spans/*`：被 8+ 文件消费（composables×3、table-paint×3、geometry×1、interaction×1、editing 间接经壳）。
- `cell-paint/cell-painters.js`：绘制适配聚合入口（drawCell 单入口分发 7 个子 painter 文件；已无 re-export）。
- `table-paint/paint-utils.js`：绘制层叶子，几何换算汇聚点（viewportColX/RowY/cellRectAt/contentRightXOf；cellRectAt 唯一事实源，消费方直引）。
- `interaction/`：决策纯函数按域分居——hit-test（命中/光标/按下/tooltip 门控）、click-resolve（click 七分支）、resize-resolve（调宽 clamp），composables 4 个文件消费（use-pointer/use-cell-click/use-column-resize/use-cell-tooltip）。

### 6.2 命名成对但内容分居（检索约定）
- `composables/use-cell-select.js`（编排/键盘/剪贴板）↔ `interaction/cell-selection.js`（纯函数：复制文本/移动/滚动量）。
- `editing/editor.js`（状态机）↔ `editing/editor-resolve.js`（编辑器类型/值规整纯函数）↔ `editing/editor-geometry.js`（编辑盒几何纯函数；paint/interaction 层直引该文件，不经 editor.js）。
- `spans/spans.js`（查询面）↔ `spans-method.js`/`spans-auto.js`（构建面）。

### 6.3 跨目录依赖与环检测
1. `table-paint/paint-overlay.js`、`interaction/cell-button.js` → `editing/editor-geometry.js`：编辑盒几何为纯函数模块（仅依赖 shared/constants），paint/interaction 层直引——原"paint 层→编辑层"反向边已消除（editor.js 保持 L2 纯状态机）。
2. `interaction/cell-selection.js` → `cell-paint/cell-content.js`（resolveCellContent，interaction→cell-paint 目录边）。
3. `geometry/row-geometry.js` → `spans/spans.js`（spanHeightRoleOf；几何依赖合并索引，L3 同层内边）。
4. 环依赖：NONE。

### 6.4 隐式依赖（import 图不可见）
- composable 间横向调用全经 host 袋（如 usePointer → useColumnResize.startResize；useCellClick → useCellSelect.clearCellSelection，后者可选链防时序）。
- `paintState` 被 6+ composable 共享引用，靠 syncPaintState 手动同步。
- `spanKeepRows` 模块级单例：painter.paint ↔ paint-body begin/endSpanFrame 跨文件帧协议。
- 模块级缓存：`textAnchorCache`（cell-text）、`imageCache`（icon-image，上限 200）、`measureCached`（paint-header，进程级跨实例共享）。
- spans 构建顺序协议：applySpanMethod 先跑写 `takenOver`，applyAutoRowSpan 后跑读。

### 6.5 已知潜在缺陷（分析时注意）
- `fenwick.rebuild` 换 tree 不复算 `power`，行数跨 2 幂边界后 findRowAtOffset 步长失配（未修复）。
- paintBodyRow/Spans 背景带：近同构重复（未收敛）。
- 已收敛（2026-11-07 结构重构 B5/B6）：paint-overlay 描边三函数 → cellFrameOf/strokeBodyFrame；controller 内联锚定块 → syncAnchoredLayout；isSameCell/Hover → shared/cell-identity.js isSamePoint 单一事实源（isSameHoverItem 五字段语义不同，保留独立）；hitTest JSDoc 已列全 12 字段。
