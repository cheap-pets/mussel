/** table-ex 绘制管线（02-design.md A2 图层划分 / A3 按需重绘与 lastPaint / A8）。
    入口：draw / drawRegion / cellRectAt / createPainter（见各导出函数注释） */
import { drawCell, drawTreeArrow, requestIconImage } from './cell-painters.js'
import { editorRectOf, editorGridlineFlagsOf, editorButtonRectOf } from './editor.js'
import { createMeasureCache } from './theme.js'
import { ellipsize } from './text-wrap.js'
import { isExpandedKey } from './tree.js'
import {
  coveredAnchorOf,
  regionAt,
  regionsForRows,
  spanCellKindOf,
  spanRectOf,
  spanRegionRect
} from './spans.js'
import {
  TREE_INDENT,
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK,
  EDITOR_BUTTON_AREA,
  EDITOR_BUTTON_ICON_SIZE,
  CHECK_SIZE,
  CHECK_RADIUS,
  CHECK_FONT_SIZE,
  FONT_SIZE_FALLBACK,
  FONT_FAMILY_FALLBACK
} from './constants.js'

// 单 canvas 分区绘制，分区顺序固定（后区不透明覆盖前区）：
// 1 表体滚动区（可视行 × 滚动区可视列，逐格背景→内容）；2 网格线
// 3 固定左列区（整高不透明重绘）；4 表头区（整宽）；5 覆盖层（hover/编辑感知）

// 选中底色与斑马纹在分区 1/3 画行背景时直接取值，不做覆盖层；脏区绘制先在 clip
// 内擦除为透明再走同一分区管线（半透明行底色直接叠画会重复混色）

// state 契约（table-ex.vue 持有并传入，字段见组件壳 syncPaintState 组装）：
// - dpr 每次绘制 setTransform(dpr,0,0,dpr,0,0)；layout = relayout() 快照（含
//   rowGeometry 引用，画布 css 宽高取 stickyWidth/Height）

// - records / displayRows：painter 经 rowsOf(state) = displayRows ?? records 取行
// - columns = prepareColumn() 后的内部列数组；recordsOffset / emit /
//   keyField/getRecordKey/selectedKey（选中行判定）原样消费

// - headerChecked / gridlines / hoverMode / striped / orderBy / placeholder 原样传入
// - hover / hoverItem / editingCell（veil）/ resizeGuideX 视口命中与覆盖层状态

// - flatInfo / expandedKeys 树形列绘制（树关 = flatInfo null；含 parentKeys 平行
//   数组，spans 树父链切断数据源）
// - editable / isCellEditableFn hover 编辑感知；measure / wrapCache 文本测量注入

// - spans（§5.1 合并单元格，spans.buildSpans 产物 | null）：null 走原实现路径
//   （paintCellRange 逐行单遍，零回归）；非 null 走两遍式（①全行背景 + 非 span
//   格内容 → ②region pass 区域底色 + 主格内容）+ 网格线分段 + 脏区归一扩展

// - itemHits 条目命中矩形集合：Map<row, Map<col, Array>>，绘制 items 时按格
//   整组替换收集，批次结束按可视窗口行裁剪（veil 格整组清空）

// - onImageLoad (row, col) => void：img 加载完成回调，createPainter 自动接管为
//   invalidateCell(row, col)（行窗口校验在 invalidate 内）

// 脏区 region 形状（A3 重绘表）：
//   { rows: [from, to) } 行横带；{ cols: [from, to) } 列竖带；{ cell } 单格
//   { header: true } 表头整幅；{ colFrom } 自该列至画布右端竖带 + 表头

//   （colFrom 左界取列左缘：列宽变化影响该列截断与右侧所有列位置，防加宽残影）

// 表头 ✓ 方框：与单元格 check（cell-painters.drawCheck）同规格互指（CHECK_* 共享
// 常量；状态机不同不强合，规格变更两处同步）

// 排序图标：th 内 absolute right: cell-padding、font-size 18px（table.scss
// .mu-sort-icon），viewBox 24 双三角 path（sort-icon.vue），caption 右侧预留 18px
const SORT_ICON_SIZE = 18
const SORT_ICON_RESERVE = 18

const FALLBACK_DPR = 1

// 本帧 region pass 实际绘制过内容的锚行集合（§5.3 trimItemHits keepRows）：paint()
// 入口置空集合、批次结束消费后复位；region pass 与 itemHits 收集同一次遍历产出，
// 不另行按 rowRegions 推导（避免双源漂移）
let spanKeepRows = null

// —— 文本测量缓存（theme.js createMeasureCache 消费方；模块级共享，主线程同步绘制） ——

let measuringCtx = null

const measureCached = createMeasureCache((text, font) => {
  measuringCtx.font = font
  return measuringCtx.measureText(text).width
})

function measureText (ctx, text, font) {
  measuringCtx = ctx

  try {
    return measureCached(text, font)
  } finally {
    measuringCtx = null
  }
}

function headerFontOf (theme) {
  const fontSize = theme?.fontSize || FONT_SIZE_FALLBACK

  return `500 ${fontSize}px ${theme?.fontFamily || FONT_FAMILY_FALLBACK}`
}

/** 表头测量回调：优先注入的 state.measure（与表体同一缓存）；未注入回退模块级缓存 */
function headerMeasureOf (ctx, state) {
  const injected = state?.measure

  if (typeof injected === 'function') return injected

  return (text, font) => measureText(ctx, text, font)
}

// —— 几何换算 ——

/** 读行集合：displayRows ?? records 缺省回退（中间态壳行为不变） */
function rowsOf (state) {
  return state.displayRows ?? state.records
}

/** 行记录 key（选中判定与树形列箭头展开判定共用） */
function recordKeyOf (state, record, row) {
  const { getRecordKey, keyField } = state

  return getRecordKey
    ? getRecordKey(record, row)
    : keyField
      ? record[keyField]
      : row
}

// 行几何直取 layout.rowGeometry（C4 删 WeakMap uniform 回退：layout 恒由
// relayout() 产出、恒携几何；缺失即 TypeError 快速暴露）

function viewportColX (layout, col) {
  return (layout.colLefts[col] || 0) - (col < layout.fixedCount ? 0 : layout.scrollLeft)
}

function viewportRowY (layout, row) {
  return layout.headHeight + layout.rowGeometry.topAt(row) - layout.scrollTop
}

/** 单元格视口矩形（interactions / editor / 自检共用；高度 = heightAt(row)） */
export function cellRectAt (layout, row, col) {
  return {
    x: viewportColX(layout, col),
    y: viewportRowY(layout, row),
    width: layout.colWidths?.[col] || 0,
    height: layout.rowGeometry.heightAt(row)
  }
}

function viewColsRange (layout) {
  return { from: layout.viewCols.start, to: layout.viewCols.end }
}

/** layout.viewRows {start,end,count} → 区间 {from,to}（paintCellRange 入参形状） */
function viewRowsRange (layout) {
  return { from: layout.viewRows.start, to: layout.viewRows.end }
}

// —— 选中判定（table.vue selectedRecKey/getRecordKey 语义） ——

function isSelectedRow (state, row) {
  const { selectedKey } = state

  if (selectedKey == null) return false

  const record = rowsOf(state)?.[row]

  return record != null && recordKeyOf(state, record, row) === selectedKey
}

/** 行背景优先级：选中（--mu-primary-faint）> 斑马偶行（--mu-bg-stripe）> 普通 */
function rowBackground (state, row) {
  if (isSelectedRow(state, row)) return state.theme.selectBg
  if (state.striped && row % 2 === 1) return state.theme.bgStripe

  return state.theme.bgNormal
}

// —— 排序方向（table.vue:144-153 同款解析） ——

function sortDirectionOf (orderBy) {
  if (!orderBy) return {}

  const [field, direction] = String(orderBy).replace(':', ' ').split(' ')

  return { [field]: direction === 'desc' ? 'down' : 'up' }
}

// —— clip / 擦除工具 ——

function withClip (ctx, rect, fn) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect[0], rect[1], rect[2], rect[3])
  ctx.clip()
  fn()
  ctx.restore()
}

/** 擦除当前 clip 区域为透明，使半透明行底色与覆盖层的混色起点与整幅绘制一致 */
function eraseClipRegion (ctx, rect) {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.fillRect(rect[0], rect[1], rect[2], rect[3])
  ctx.globalCompositeOperation = 'source-over'
}

// —— 分区 1：单元格区域（滚动区与固定区共用，含行背景） ——

function setItemHitGroup (itemHits, row, col, rects) {
  let inner = itemHits.get(row)

  if (!inner) {
    inner = new Map()
    itemHits.set(row, inner)
  }

  inner.set(col, rects)
}

/** 绘制批次结束按当前可视窗口行 [start, end) 裁剪（窗口外行删除，长滚不增长）。
    keepRows（§5.3）= 本帧 region pass 实际绘制过内容的锚行集合（与 itemHits 收集
    同一次遍历产出）：合并区域锚行滚出窗口时区域内 link/tag/button 仍可点 */
function trimItemHits (itemHits, viewRows, keepRows) {
  const { start, end } = viewRows

  for (const row of itemHits.keys()) {
    if (row < start || (row >= end && !(keepRows && keepRows.has(row)))) itemHits.delete(row)
  }
}

function isEmptyRange (range) {
  return !range || range.to <= range.from
}

function rowBandEndX (layout, cols, bandToX) {
  const last = cols.to - 1
  const x1 = viewportColX(layout, last) + (layout.colWidths[last] || 0)

  return Math.max(x1, bandToX ?? x1)
}

// 表体单行：行背景一条矩形覆盖列区间 + 逐格内容绘制；recordKey 行级求值一次
// （P1a：树关时为 null，drawTreeAffordance 不消费）
function paintBodyRow (ctx, state, records, columns, r, cols, x0, bandWidth, W, H) {
  const { layout } = state
  const geometry = layout.rowGeometry
  const rowHeight = geometry.heightAt(r)
  const y = layout.headHeight + geometry.topAt(r) - layout.scrollTop

  // 高度 = heightAt(r)；带右缘经 bandToX 扩展（见 paintCellRange 头注）
  ctx.fillStyle = rowBackground(state, r)
  ctx.fillRect(x0, y, bandWidth, rowHeight)

  const record = records?.[r]

  if (record == null) return

  const recordNumber = (state.recordsOffset || 0) + r + 1
  const recordKey = state.flatInfo ? recordKeyOf(state, record, r) : null

  for (let c = Math.max(cols.from, 0); c < cols.to; c++) {
    const col = columns?.[c]

    if (!col) continue

    const rect = {
      x: viewportColX(layout, c),
      y,
      width: layout.colWidths[c] || 0,
      height: rowHeight
    }

    drawCellClipped(ctx, state, col, record, recordNumber, rect, r, c, recordKey, W, H)
  }
}

// 表体单行（spans 分支 pass ①，§5.1）：行背景一条矩形覆盖列区间 + 非 covered/
// anchor 格内容（原循环去掉 span 格）；covered 格无内容且无命中（清残留 itemHits
// 组，防浮层下可点），锚格内容由 region pass 统一绘制
function paintBodyRowSpans (ctx, state, records, columns, r, cols, x0, bandWidth, W, H) {
  const { layout, spans } = state
  const geometry = layout.rowGeometry
  const rowHeight = geometry.heightAt(r)
  const y = layout.headHeight + geometry.topAt(r) - layout.scrollTop

  ctx.fillStyle = rowBackground(state, r)
  ctx.fillRect(x0, y, bandWidth, rowHeight)

  const record = records?.[r]

  if (record == null) return

  const recordNumber = (state.recordsOffset || 0) + r + 1
  const recordKey = state.flatInfo ? recordKeyOf(state, record, r) : null

  for (let c = Math.max(cols.from, 0); c < cols.to; c++) {
    const col = columns?.[c]

    if (!col) continue

    const kind = spanCellKindOf(spans, r, c)

    if (kind != null) {
      if (kind === 'covered' && state.itemHits) setItemHitGroup(state.itemHits, r, c, [])

      continue
    }

    const rect = {
      x: viewportColX(layout, c),
      y,
      width: layout.colWidths[c] || 0,
      height: rowHeight
    }

    drawCellClipped(ctx, state, col, record, recordNumber, rect, r, c, recordKey, W, H)
  }
}

// region pass（两遍式第②遍，§5.1）：遍历与 rows 相交的 region（经 rowRegions 查询，
// 判定 = 区域与 rows 参数相交，不是锚行 ∈ rows；再按 cols 过滤分区——固定列 pass
// 不画滚动区区域、反之亦然）。先以锚行背景色 fillRect 区域包围盒（统一 striped/
// 选中底色，§5.8 选中链路），再绘制主格内容：区域矩形 + 区域垂直锚 + 区域末列
// rightInset + itemHits 收集 + veil 判定。锚行不在 rows/窗口内照常绘制（region
// pass 存在的意义），窗口外由 clipIfPartial / 脏区 clip 自然裁剪
function paintSpanRegions (ctx, state, records, columns, rows, cols, W, H) {
  const { layout, spans } = state

  for (const region of regionsForRows(spans, rows.from, rows.to)) {
    if (region.colTo <= cols.from || region.colFrom >= cols.to) continue

    const rect = spanRegionRect(layout, region)

    ctx.fillStyle = rowBackground(state, region.row)
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

    const record = records?.[region.row]
    const col = columns?.[region.col]

    if (record == null || !col) continue

    if (spanKeepRows) spanKeepRows.add(region.row)

    drawCellClipped(
      ctx,
      state,
      col,
      record,
      (state.recordsOffset || 0) + region.row + 1,
      rect,
      region.row,
      region.col,
      state.flatInfo ? recordKeyOf(state, record, region.row) : null,
      W,
      H,
      { regionHeight: rect.height, rightInset: rightInsetOf(state, region.colTo - 1) }
    )
  }
}

// 单元格区域绘制（滚动区与固定区共用，含行背景）。bandToX：行背景带右缘视口 x
// 下限——滚动区调用点传 layout.stickyWidth（ΣcolWidths < 视口宽时行背景充满至
// 视口右缘）；固定列 pass 不传（带保持固定列区间，防覆盖已绘滚动区内容）。
// spans null 分支逐字保留原实现（无合并表格零回归，00-task 硬约束）；非 null 走
// 两遍式（§5.1）：①全行背景 + 非 span 格内容 → ②region pass 区域底色 + 主格内容
// ——三段式背景顺序保证区域底色不被下方行背景带重盖
function paintCellRange (ctx, state, rows, cols, bandToX) {
  if (isEmptyRange(rows) || isEmptyRange(cols)) return

  const { layout, columns } = state
  const records = rowsOf(state)
  const W = layout.stickyWidth
  const H = layout.stickyHeight
  const x0 = viewportColX(layout, cols.from)
  const bandWidth = rowBandEndX(layout, cols, bandToX) - x0

  if (!state.spans) {
    for (let r = Math.max(rows.from, 0); r < rows.to; r++) {
      paintBodyRow(ctx, state, records, columns, r, cols, x0, bandWidth, W, H)
    }

    return
  }

  for (let r = Math.max(rows.from, 0); r < rows.to; r++) {
    paintBodyRowSpans(ctx, state, records, columns, r, cols, x0, bandWidth, W, H)
  }

  paintSpanRegions(ctx, state, records, columns, rows, cols, W, H)
}

function isVeiledCell (state, row, colIndex) {
  const cell = state.editingCell

  return cell != null && cell.row === row && cell.col === colIndex
}

/** veil（问题 6）：编辑中格清空本格命中组并返回 true（调用方跳过内容绘制）——
    不清空会残留上一次绘制的条目矩形，浮层下方仍可点中 link/button */
function veilEditingCell (state, row, colIndex) {
  if (!isVeiledCell(state, row, colIndex)) return false

  if (state.itemHits) setItemHitGroup(state.itemHits, row, colIndex, [])

  return true
}

/** 本格右缘列线占用 px（问题 1）：非末列（或末列但有空白区）且 gridlines 含
    column 时为 1；blankTail = stickyWidth > contentWidth（三处消费点同派生式） */
function rightInsetOf (state, colIndex) {
  const { layout } = state
  const blankTail = layout.stickyWidth > (layout.contentWidth || 0)
  const showsColLine = (colIndex < layout.colWidths.length - 1) || blankTail

  return showsColLine && isGridlineMode(state.gridlines ?? 'all', 'column') ? 1 : 0
}

/** 条目悬停注入（问题 7）：仅 hover 格产出 { kind, index, disabled }，其余格 undefined */
function cellHoverItemOf (state, row, colIndex) {
  const hover = state.hoverItem

  if (!hover || hover.row !== row || hover.col !== colIndex) return undefined

  return { kind: hover.kind, index: hover.index, disabled: hover.disabled }
}

/** 视口边缘部分可见格 clip（完全可见格跳过 save/clip/restore，画布边界外像素
    本就被丢弃）；返回是否执行了 clip */
function clipIfPartial (ctx, rect, W, H) {
  const partial = rect.x < 0 || rect.y < 0 ||
    rect.x + rect.width > W || rect.y + rect.height > H

  if (!partial) return false

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.clip()

  return true
}

// 单元格内容绘制：完全可见格跳过 clip（A3 性能措施）；itemHits 按格收集（整组
// 替换）；veil 格跳过 drawCell；recordKey 由 paintBodyRow 行级注入（P1a）；
// onImageLoad 直传 (row, col) 处理器（P1b：闭包下沉 cell-painters img 分支）。
// spanOpts（region pass 专用，§5.1）：regionHeight = 区域矩形高（内容垂直居中与
// 行数上限）、rightInset 按区域末列取右缘列线占位（普通格缺省按本列求值）
function drawCellClipped (ctx, state, col, record, recordNumber, rect, row, colIndex, recordKey, W, H, spanOpts) {
  if (veilEditingCell(state, row, colIndex)) return

  const clipped = clipIfPartial(ctx, rect, W, H)

  let itemRects = null

  if (state.itemHits) itemRects = []

  drawCell(ctx, {
    col,
    record,
    recordNumber,
    emit: state.emit,
    rect,
    theme: state.theme,
    onImageLoad: state.onImageLoad,
    row,
    colIndex,
    flatInfo: state.flatInfo,
    expandedKeys: state.expandedKeys,
    recordKey,
    measure: state.measure,
    wrapCache: state.wrapCache,
    placeholder: state.placeholder,
    rightInset: spanOpts?.rightInset ?? rightInsetOf(state, colIndex),
    regionHeight: spanOpts?.regionHeight,
    hoverItem: cellHoverItemOf(state, row, colIndex),
    onItemRect: itemRects ? entry => itemRects.push(entry) : undefined
  })

  if (itemRects) setItemHitGroup(state.itemHits, row, colIndex, itemRects)

  if (clipped) ctx.restore()
}

// —— 分区 2：网格线（合并区域分段：内部行线/列线在区域包围盒区间内跳过，§5.1）——

/** 网格线模式含某向：all 全画，其余按 row / column 精确匹配（未知值不画线） */
function isGridlineMode (mode, kind) {
  return mode === 'all' || mode === kind
}

/** 行线 r（行 r-1 | 行 r 分界）被跨线区域占用的 x 区间（视口坐标，升序）：
    rowRegions O(1) 定位——区域登记于行 r 且 rowFrom < r 即跨过本分界线 */
function rowLineSkipIntervals (layout, spans, r) {
  const regions = spans.rowRegions.get(r)

  if (!regions) return null

  const intervals = []

  for (const region of regions) {
    if (region.rowFrom >= r) continue

    const lastCol = region.colTo - 1

    intervals.push({
      x0: viewportColX(layout, region.colFrom),
      x1: viewportColX(layout, lastCol) + (layout.colWidths[lastCol] || 0)
    })
  }

  if (!intervals.length) return null

  intervals.sort((a, b) => a.x0 - b.x0)

  return intervals
}

/** 横向分段绘制：跳过占用区间 [x0, x1)，其余整段补画（区间升序、可按 W 截断） */
function paintSegmentedHLine (ctx, y, W, intervals) {
  let x = 0

  for (const { x0, x1 } of intervals) {
    if (x0 > x) ctx.fillRect(x, y, Math.min(x0, W) - x, 1)
    if (x1 > x) x = Math.min(x1, W)
    if (x >= W) return
  }

  if (x < W) ctx.fillRect(x, y, W - x, 1)
}

/** 竖向分段绘制（paintSegmentedHLine 对称；区间按 y0 升序） */
function paintSegmentedVLine (ctx, x, yFrom, yTo, intervals) {
  let y = yFrom

  for (const { y0, y1 } of intervals) {
    if (y0 > y) ctx.fillRect(x, y, 1, Math.min(y0, yTo) - y)
    if (y1 > y) y = Math.min(y1, yTo)
    if (y >= yTo) return
  }

  if (y < yTo) ctx.fillRect(x, y, 1, yTo - y)
}

/** 列竖线被跨线区域占用的 y 区间（视口坐标，按分界线 b 分组）：竖线左缘线按其
    右侧列号索引（b ∈ (colFrom, colTo) 为区域内部分界）；一次遍历 regions 分组 */
function colLineSkipIntervals (layout, spans, cols) {
  const map = new Map()

  for (const region of spans.regions) {
    if (region.colTo <= cols.from + 1 || region.colFrom >= cols.to) continue

    const y0 = viewportRowY(layout, region.rowFrom)
    const y1 = viewportRowY(layout, region.rowTo)
    const from = Math.max(region.colFrom + 1, cols.from + 1)
    const to = Math.min(region.colTo, cols.to)

    for (let b = from; b < to; b++) {
      const list = map.get(b)

      if (list) list.push({ y0, y1 })
      else map.set(b, [{ y0, y1 }])
    }
  }

  // regions 构建序非 y0 升序（spanMethod 先于 autoRowSpan 各列），分段绘制须升序
  for (const list of map.values()) list.sort((a, b) => a.y0 - b.y0)

  return map
}

/** 行线：可视行区间每行下界 1px（首行顶线 r=0 由表头底边框承担）；跨线区域
    占用区间跳过（无相交区域时保持整条绘制原路径） */
function paintRowGridlines (ctx, state, rows, W) {
  const { layout, spans } = state

  for (let r = Math.max(rows.from, 1); r <= rows.to; r++) {
    const skips = spans ? rowLineSkipIntervals(layout, spans, r) : null

    if (!skips) {
      ctx.fillRect(0, viewportRowY(layout, r), W, 1)

      continue
    }

    paintSegmentedHLine(ctx, viewportRowY(layout, r), W, skips)
  }
}

/** 列线：列右缘 1px，遇末列终止（同 .last-col）；空白区时末列右缘补画 1px（问题 9）；
    区域内部竖线在区域 y 区间内跳过 */
function paintColGridlines (ctx, state, cols) {
  const { layout, spans } = state
  const n = layout.colWidths.length
  const blankTail = layout.stickyWidth > (layout.contentWidth || 0)
  const skipsByBoundary = spans ? colLineSkipIntervals(layout, spans, cols) : null

  for (let c = cols.from; c < cols.to; c++) {
    if (c >= n - 1 && !blankTail) break

    const x = viewportColX(layout, c) + (layout.colWidths[c] || 0) - 1
    const skips = skipsByBoundary?.get(c + 1)

    if (!skips) {
      ctx.fillRect(x, layout.headHeight, 1, layout.stickyHeight - layout.headHeight)

      continue
    }

    paintSegmentedVLine(ctx, x, layout.headHeight, layout.stickyHeight, skips)
  }
}

function paintGridlines (ctx, state, rows, cols, maxWidth) {
  const mode = state.gridlines ?? 'all'

  if (mode === 'none' || isEmptyRange(rows) || isEmptyRange(cols)) return

  const { layout, theme } = state
  const W = Math.min(maxWidth ?? layout.stickyWidth, layout.stickyWidth)

  ctx.fillStyle = theme.borderColorSoft

  if (isGridlineMode(mode, 'row')) paintRowGridlines(ctx, state, rows, W)

  if (isGridlineMode(mode, 'column')) paintColGridlines(ctx, state, cols)
}

// —— 分区 3：固定左列区 ——

/** 固定左列区：整高不透明底重绘盖住滚过的表体。rows 限定重绘行区间（P0-2）：
    行带/单格脏区入口只画与脏带相交的行；缺省整幅可视行 */
function paintFixedArea (ctx, state, rows) {
  const { layout, theme } = state

  if (!layout.fixedCount) return

  const range = rows ?? viewRowsRange(layout)

  // 整高不透明重绘，盖住滚过的表体（在脏区 clip 内被裁到脏带）
  ctx.fillStyle = theme.bgNormal
  ctx.fillRect(0, 0, layout.fixedWidth, layout.stickyHeight)

  paintCellRange(ctx, state, range, { from: 0, to: layout.fixedCount })
  paintGridlines(ctx, state, range, { from: 0, to: layout.fixedCount }, layout.fixedWidth)

  // 分界线：横向滚动后强化色覆盖（对齐 .mu-table--x-scrolled .last-fixed-col）
  if (layout.scrollLeft > 0.5) {
    ctx.fillStyle = theme.borderColorStrong
    ctx.fillRect(layout.fixedWidth - 1, layout.headHeight, 1, layout.stickyHeight - layout.headHeight)
  }
}

// —— 分区 4：表头区 ——

function headerColIndexes (layout) {
  const cols = []
  const fixed = Math.min(layout.fixedCount, layout.colWidths.length)

  for (let c = 0; c < fixed; c++) cols.push(c)

  for (let c = Math.max(layout.viewCols.start, fixed); c < layout.viewCols.end; c++) cols.push(c)

  return cols
}

function drawHeaderCheck (ctx, theme, x, centerY, checked) {
  const y = centerY - CHECK_SIZE / 2

  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, CHECK_SIZE - 1, CHECK_SIZE - 1, CHECK_RADIUS)
  ctx.strokeStyle = checked ? theme.borderColorStrong : theme.borderColor
  ctx.lineWidth = 1
  ctx.stroke()

  if (checked) {
    ctx.font = `600 ${CHECK_FONT_SIZE}px ${theme?.fontFamily || FONT_FAMILY_FALLBACK}`
    ctx.fillStyle = theme.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✓', x + CHECK_SIZE / 2, centerY)
  }
}

/** 排序图标：caption 右侧 18px 见方，上下双三角，激活方向主色、非激活灰（复刻） */
function drawSortIcon (ctx, state, col, ix, iy) {
  const { theme } = state
  const direction = sortDirectionOf(state.orderBy)[col.field]
  const k = SORT_ICON_SIZE / 24

  const drawTriangle = (points, active) => {
    ctx.beginPath()
    ctx.moveTo(ix + points[0][0] * k, iy + points[0][1] * k)
    ctx.lineTo(ix + points[1][0] * k, iy + points[1][1] * k)
    ctx.lineTo(ix + points[2][0] * k, iy + points[2][1] * k)
    ctx.closePath()
    ctx.fillStyle = active ? theme.primaryColor : theme.gray
    ctx.fill()
  }

  drawTriangle([[18, 10], [12, 4], [6, 10]], direction === 'up')
  drawTriangle([[18, 14], [12, 20], [6, 14]], direction === 'down')
}

/** check 表头 ✓ 判定（table.vue:22 同款：type=check + field + headerCheckbox + 受控态） */
function isHeaderCheckColumn (state, raw) {
  return !!(raw.type === 'check' && raw.field && raw.headerCheckbox && state.headerChecked)
}

function headerCaptionText (caption) {
  return caption != null ? String(caption) : ''
}

/** 表头文本锚点 x：check 列恒取 ✓ 后文本起点；否则按 align（right 贴右缘扣预留） */
function headerTextAnchorX (align, hasHeaderCheck, textX, x, width, padding, reserve) {
  if (hasHeaderCheck || align === 'left') return textX

  return align === 'right' ? x + width - padding - reserve : x + (width - reserve) / 2
}

function drawHeaderText (ctx, state, col, font, align, hasHeaderCheck, textX, maxTextWidth, centerY, x, width) {
  const { text: display } = ellipsize({
    text: headerCaptionText(col.caption),
    font,
    maxWidth: maxTextWidth,
    measure: headerMeasureOf(ctx, state)
  })

  if (!display) return

  const { theme } = state
  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const reserve = col.sortable ? SORT_ICON_RESERVE : 0

  ctx.font = font
  ctx.fillStyle = theme.textColor
  ctx.textAlign = hasHeaderCheck ? 'left' : align
  ctx.textBaseline = 'middle'
  ctx.fillText(display, headerTextAnchorX(align, hasHeaderCheck, textX, x, width, padding, reserve), centerY)
}

function drawHeaderCell (ctx, state, col, x, width) {
  const { layout, theme } = state
  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const centerY = layout.headHeight / 2
  const raw = col._raw ?? {}
  const sortable = !!col.sortable
  const align = col._align || 'left'
  const reserve = sortable ? SORT_ICON_RESERVE : 0
  const hasHeaderCheck = isHeaderCheckColumn(state, raw)

  const font = headerFontOf(theme)
  let textX = x + padding
  let maxTextWidth = width - padding * 2 - reserve

  if (hasHeaderCheck) {
    // 内容组（✓ + 可选 caption）按列 align 整体分布（对齐 DOM 版 th text-align）
    const checkTextWidth = width - padding * 2 - reserve - CHECK_SIZE - 6
    const { text: caption } = ellipsize({
      text: headerCaptionText(col.caption),
      font,
      maxWidth: Math.max(0, checkTextWidth),
      measure: headerMeasureOf(ctx, state)
    })
    const groupWidth = CHECK_SIZE + (caption ? 6 + headerMeasureOf(ctx, state)(caption, font) : 0)

    let startX = x + padding

    if (align === 'center') startX = x + (width - groupWidth) / 2
    else if (align === 'right') startX = x + width - padding - groupWidth

    drawHeaderCheck(ctx, theme, startX, centerY, !!state.headerChecked[raw.field])
    textX = startX + CHECK_SIZE + 6
    maxTextWidth = checkTextWidth
  }

  drawHeaderText(ctx, state, col, font, align, hasHeaderCheck, textX, maxTextWidth, centerY, x, width)

  if (sortable) {
    drawSortIcon(ctx, state, col, x + width - padding - SORT_ICON_SIZE, centerY - SORT_ICON_SIZE / 2)
  }
}

function showsHeaderColLine (mode, strong) {
  return strong || mode === 'all' || mode === 'column'
}

/** 单条表头列分隔线（.mu-table__th border-right 同款 1px）：固定分界线强化色 */
function paintHeaderColLine (ctx, theme, layout, c, strong) {
  ctx.fillStyle = strong ? theme.borderColorStrong : theme.borderColorSoft
  ctx.fillRect(viewportColX(layout, c) + (layout.colWidths[c] || 0) - 1, 0, 1, layout.headHeight - 1)
}

/** 表头列分隔线整批：可视列从左到右，遇末列终止；滚动列部分在固定区右缘
    clip 内（R1：部分滚入固定区下方的首可见列分隔线不绘入固定表头区） */
function paintHeaderColLines (ctx, state, layout, theme) {
  const mode = state.gridlines ?? 'all'
  const strongBoundary = layout.scrollLeft > 0.5

  if (!showsHeaderColLine(mode, strongBoundary)) return

  const cols = headerColIndexes(layout)
  const scrollStart = cols.findIndex(c => c >= layout.fixedCount)

  if (scrollStart < 0 || !layout.fixedCount) {
    paintHeaderColLineRange(ctx, state, theme, layout, cols, mode, strongBoundary)
    return
  }

  paintHeaderColLineRange(ctx, state, theme, layout, cols.slice(0, scrollStart), mode, strongBoundary)

  const rect = [layout.fixedWidth, 0, layout.stickyWidth - layout.fixedWidth, layout.headHeight]

  withClip(ctx, rect, () => {
    paintHeaderColLineRange(ctx, state, theme, layout, cols.slice(scrollStart), mode, strongBoundary)
  })
}

/** 表头列分隔线区间绘制；末列无线同 .last-col，空白区时末列右缘补画 1px（问题 9） */
function paintHeaderColLineRange (ctx, state, theme, layout, cols, mode, strongBoundary) {
  const n = layout.colWidths.length
  const blankTail = layout.stickyWidth > (layout.contentWidth || 0)

  for (const c of cols) {
    if (c >= n - 1 && !blankTail) break

    const strong = strongBoundary && c === layout.fixedCount - 1

    if (showsHeaderColLine(mode, strong)) paintHeaderColLine(ctx, theme, layout, c, strong)
  }
}

/** 表头单元格内容绘制（文字/check/排序图标）。R1：滚动列部分在固定区右缘
    clip 内绘制——不裁剪会绘入固定表头区形成残影（表头为最后分区须自裁剪） */
function paintHeaderCells (ctx, state) {
  const { layout } = state
  const cols = headerColIndexes(layout)
  const scrollStart = cols.findIndex(c => c >= layout.fixedCount)

  if (scrollStart < 0 || !layout.fixedCount) {
    for (const c of cols) {
      const col = state.columns?.[c]

      if (col) drawHeaderCell(ctx, state, col, viewportColX(layout, c), layout.colWidths[c] || 0)
    }

    return
  }

  for (const c of cols.slice(0, scrollStart)) {
    const col = state.columns?.[c]

    if (col) drawHeaderCell(ctx, state, col, viewportColX(layout, c), layout.colWidths[c] || 0)
  }

  const rect = [layout.fixedWidth, 0, layout.stickyWidth - layout.fixedWidth, layout.headHeight]

  withClip(ctx, rect, () => {
    for (const c of cols.slice(scrollStart)) {
      const col = state.columns?.[c]

      if (col) drawHeaderCell(ctx, state, col, viewportColX(layout, c), layout.colWidths[c] || 0)
    }
  })
}

function paintHeader (ctx, state) {
  const { layout, theme } = state
  const W = layout.stickyWidth
  const headHeight = layout.headHeight

  // 整宽不透明底，盖住下方所有层（A2 分区 4）
  ctx.fillStyle = theme.bgFill
  ctx.fillRect(0, 0, W, headHeight)

  paintHeaderCells(ctx, state)

  paintHeaderColLines(ctx, state, layout, theme)

  ctx.fillStyle = theme.borderColorSoft
  ctx.fillRect(0, headHeight - 1, W, 1)
}

// —— 分区 5：覆盖层 ——

/** 树箭头 hover 主色（A2.4）：hover 命中树形列父行格时，覆盖层以主色重画箭头
    三角盖住分区 1 的常态箭头；粒度为格级（槽位级命中需壳改动） */
function paintTreeArrowAccent (ctx, state) {
  const { hover, flatInfo, columns, theme } = state

  if (!hover || !flatInfo) return

  const column = columns?.[hover.col]

  if (!column?._isTreeColumn || !flatInfo.hasChildren?.[hover.row]) return

  const record = rowsOf(state)?.[hover.row]

  if (record == null) return

  const rowHeight = theme?.rowHeight || ROW_HEIGHT_FALLBACK
  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const level = flatInfo.levels?.[hover.row] ?? 0
  const x = viewportColX(state.layout, hover.col) + padding + level * TREE_INDENT
  // centerY = 首行行框槽位锚中点原式（cell-painters 内容锚四舍五入，差 0.5px）；
  // 不用 heightAt/2——超高行中两分区会错位出双层边
  const centerY = viewportRowY(state.layout, hover.row) + ROW_TOP_INSET + (rowHeight - ROW_TOP_INSET) / 2

  drawTreeArrow(
    ctx,
    x,
    centerY,
    isExpandedKey(state.expandedKeys, recordKeyOf(state, record, hover.row)),
    theme?.colors?.primary?.color ?? theme?.primaryColor
  )
}

function hoverModeShows (mode, kind) {
  return mode === kind || mode === 'cross'
}

function paintHoverRow (ctx, layout, row) {
  ctx.fillRect(0, viewportRowY(layout, row), layout.stickyWidth, layout.rowGeometry.heightAt(row))
}

function paintHoverCol (ctx, layout, col) {
  ctx.fillRect(
    viewportColX(layout, col),
    layout.headHeight,
    layout.colWidths[col] || 0,
    layout.stickyHeight - layout.headHeight
  )
}

/** hover 高亮矩形（fillStyle 由调用方预设为 hoverBg）：按模式与命中有效性。
    cell 模式经 spanRectOf 取区域矩形（合并区域整体高亮，§5.1）；row/column/cross
    维持物理行/列矩形不动（正交语义，写入文档 §2.5） */
function paintHoverHighlight (ctx, layout, hover, mode, rowValid, colValid, spans) {
  if (hoverModeShows(mode, 'row') && rowValid) paintHoverRow(ctx, layout, hover.row)

  if (hoverModeShows(mode, 'column') && colValid) paintHoverCol(ctx, layout, hover.col)

  if (mode === 'cell' && rowValid && colValid) {
    const rect = spanRectOf(layout, hover.row, hover.col, spans)

    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  }
}

/** 可编辑格 hover 感知（A5.3）：1px 主色描边，矩形与编辑浮层盒 import 同一
    editorRectOf 同源同位（贴格线内侧，合并区域按区域矩形 + 区域外缘格线内缩）；
    不占布局、随 hover 带重绘生效 */
function paintHoverEditorStroke (ctx, state, hover) {
  if (!state.editable || !state.isCellEditableFn) return

  const column = state.columns?.[hover.col]

  if (!column || !state.isCellEditableFn(column)) return

  const { layout, spans } = state
  const region = regionAt(spans, hover.row, hover.col)
  const rect = editorRectOf(
    spanRectOf(layout, hover.row, hover.col, spans),
    editorGridlineFlagsOf({
      rowIndex: hover.row,
      colIndex: hover.col,
      colCount: layout.colWidths.length,
      stickyWidth: layout.stickyWidth,
      contentWidth: layout.contentWidth,
      gridlines: state.gridlines,
      rowFrom: region?.rowFrom,
      colTo: region?.colTo
    })
  )

  ctx.strokeStyle = state.theme.primaryColor
  ctx.lineWidth = 1
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1)
}

/** 编辑按钮绘制（问题 5，覆盖层最上层）：hover 格所在列配 editorButton.icon 时，
    经 editorButtonRectOf 取区矩形（合并区域 = spanRectOf 区域矩形，§5.1）、
    requestIconImage 取图；仅 loaded 才 drawImage，onLoad 经 state.onImageLoad 转
    invalidateCell；hoverMode none 随覆盖层抑制 */
function paintEditorButton (ctx, state, hover) {
  const column = state.columns?.[hover.col]
  const icon = column?.editorButton?.icon

  if (!icon) return

  const { theme } = state
  const rect = editorButtonRectOf(
    spanRectOf(state.layout, hover.row, hover.col, state.spans),
    {
      padding: theme?.cellPadding || CELL_PADDING_FALLBACK,
      rowHeight: theme?.rowHeight || ROW_HEIGHT_FALLBACK
    }
  )
  const entry = requestIconImage(icon, theme.textColor, () => state.onImageLoad?.(hover.row, hover.col))

  if (entry.status !== 'loaded') return

  const size = EDITOR_BUTTON_ICON_SIZE
  const inset = (EDITOR_BUTTON_AREA - size) / 2

  ctx.drawImage(entry.image, rect.x + inset, rect.y + inset, size, size)
}

/** hover 叠加：高亮底色 → 可编辑格描边 → 树箭头主色 → 编辑按钮（顺序固定） */
function paintHoverOverlay (ctx, state, hover, mode) {
  const { layout, theme } = state
  const rowCount = rowsOf(state)?.length ?? 0
  const rowValid = hover.row >= 0 && hover.row < rowCount
  const colValid = hover.col >= 0 && hover.col < layout.colWidths.length

  ctx.fillStyle = theme.hoverBg

  paintHoverHighlight(ctx, layout, hover, mode, rowValid, colValid, state.spans)

  if (rowValid && colValid) {
    paintHoverEditorStroke(ctx, state, hover)

    paintTreeArrowAccent(ctx, state)

    paintEditorButton(ctx, state, hover)
  }
}

function paintOverlay (ctx, state) {
  const { layout, theme, hover } = state
  const mode = state.hoverMode || 'row'

  if (hover && mode !== 'none') paintHoverOverlay(ctx, state, hover, mode)

  // 调宽拖拽参考线：1px 主色、全高（A2 分区 5）
  if (state.resizeGuideX != null) {
    ctx.fillStyle = theme.primaryColor
    ctx.fillRect(Math.round(state.resizeGuideX), 0, 1, layout.stickyHeight)
  }
}

// —— 绘制入口与脏区调度 ——

function windowStats (layout) {
  return {
    rowStart: layout.viewRows.start,
    rowEnd: layout.viewRows.end,
    rowCount: layout.viewRows.count,
    colStart: layout.viewCols.start,
    colEnd: layout.viewCols.end
  }
}

function paintHeaderPass (ctx, state) {
  const { layout } = state
  const rect = [0, 0, layout.stickyWidth, layout.headHeight]

  withClip(ctx, rect, () => {
    eraseClipRegion(ctx, rect)
    paintHeader(ctx, state)
  })
}

/** 行横带：clip 纵向收敛到行带（y 不越过表头下缘），走 body/grid/fixed/overlay 完整管线 */
function paintRowBand (ctx, state, range) {
  const { layout } = state
  const from = Math.max(range?.[0] ?? 0, layout.viewRows.start)
  const to = Math.min(range?.[1] ?? 0, layout.viewRows.end)

  if (to <= from) return null

  const y0 = Math.max(viewportRowY(layout, from), layout.headHeight)
  const y1 = Math.min(viewportRowY(layout, to), layout.stickyHeight)

  if (y1 <= y0) return null

  const rect = [0, y0, layout.stickyWidth, y1 - y0]

  withClip(ctx, rect, () => {
    eraseClipRegion(ctx, rect)
    paintCellRange(ctx, state, { from, to }, viewColsRange(layout), layout.stickyWidth)
    paintGridlines(ctx, state, { from, to }, viewColsRange(layout), layout.stickyWidth)
    paintFixedArea(ctx, state, { from, to })
    paintOverlay(ctx, state)
  })

  return {
    rowStart: from,
    rowEnd: to,
    rowCount: to - from,
    colStart: layout.viewCols.start,
    colEnd: layout.viewCols.end
  }
}

/** 列竖带：clip 横向收敛到列带（表头下缘以下），固定区随管线整体重绘防分界残影 */
function paintColBand (ctx, state, range) {
  const { layout } = state
  const n = layout.colWidths.length
  const from = Math.max(range?.[0] ?? 0, 0)
  const to = Math.min(range?.[1] ?? 0, n)

  if (to <= from) return null

  const x0 = Math.max(viewportColX(layout, from), 0)
  const x1 = Math.min(viewportColX(layout, to - 1) + (layout.colWidths[to - 1] || 0), layout.stickyWidth)

  if (x1 <= x0) return null

  const rect = [x0, layout.headHeight, x1 - x0, layout.stickyHeight - layout.headHeight]

  withClip(ctx, rect, () => {
    eraseClipRegion(ctx, rect)
    paintCellRange(ctx, state, viewRowsRange(layout), { from, to }, layout.stickyWidth)
    paintGridlines(ctx, state, viewRowsRange(layout), { from, to }, layout.stickyWidth)
    paintFixedArea(ctx, state)
    paintOverlay(ctx, state)
  })

  return {
    rowStart: layout.viewRows.start,
    rowEnd: layout.viewRows.end,
    rowCount: layout.viewRows.count,
    colStart: from,
    colEnd: to
  }
}

/** 单格：clip 收敛到格矩形（右/下各扩 1px 覆盖格边框线；高度 = heightAt(row)） */
function paintCellRegion (ctx, state, cell) {
  const { layout } = state
  const { row, col } = cell ?? {}
  const rows = layout.viewRows
  const n = layout.colWidths.length

  if (!(row >= rows.start && row < rows.end)) return null
  if (!(col >= 0 && col < n)) return null
  if (!(col < layout.fixedCount || (col >= layout.viewCols.start && col < layout.viewCols.end))) return null

  const x = viewportColX(layout, col)
  const y = Math.max(viewportRowY(layout, row), layout.headHeight)
  const rect = [x, y, (layout.colWidths[col] || 0) + 1, layout.rowGeometry.heightAt(row) + 1]

  withClip(ctx, rect, () => {
    eraseClipRegion(ctx, rect)
    paintCellRange(ctx, state, { from: row, to: row + 1 }, { from: col, to: col + 1 }, layout.stickyWidth)
    paintGridlines(ctx, state, { from: row, to: row + 1 }, { from: col, to: col + 1 }, layout.stickyWidth)
    paintFixedArea(ctx, state, { from: row, to: row + 1 })
    paintOverlay(ctx, state)
  })

  return {
    rowStart: row,
    rowEnd: row + 1,
    rowCount: 1,
    colStart: col,
    colEnd: col + 1
  }
}

/** 调宽 move：表头整幅 + 自该列视口左缘至画布右端竖带（左界=列左缘防加宽残影） */
function paintResizeBand (ctx, state, colFrom) {
  const { layout } = state
  const n = layout.colWidths.length

  if (!(colFrom >= 0 && colFrom < n)) return null

  paintHeaderPass(ctx, state)

  const stats = {
    rowStart: layout.viewRows.start,
    rowEnd: layout.viewRows.end,
    rowCount: layout.viewRows.count,
    colStart: colFrom,
    colEnd: layout.viewCols.end
  }
  const x0 = Math.max(viewportColX(layout, colFrom), 0)

  if (x0 >= layout.stickyWidth) return stats

  const rect = [x0, layout.headHeight, layout.stickyWidth - x0, layout.stickyHeight - layout.headHeight]

  withClip(ctx, rect, () => {
    eraseClipRegion(ctx, rect)
    paintCellRange(ctx, state, viewRowsRange(layout), { from: colFrom, to: layout.viewCols.end }, layout.stickyWidth)
    paintGridlines(ctx, state, viewRowsRange(layout), { from: colFrom, to: layout.viewCols.end }, layout.stickyWidth)
    paintFixedArea(ctx, state)
    paintOverlay(ctx, state)
  })

  return stats
}

/** 无 region 或未识别的 region 形状（无任何已知字段）按整幅兜底（正确性优先） */
function isFullPaintRegion (region) {
  return !region ||
    (region.header !== true && region.rows == null && region.cols == null &&
      region.cell == null && region.colFrom == null)
}

function paintFull (ctx, state) {
  const { layout } = state

  ctx.clearRect(0, 0, layout.stickyWidth, layout.stickyHeight)
  paintCellRange(ctx, state, viewRowsRange(layout), viewColsRange(layout), layout.stickyWidth)
  paintGridlines(ctx, state, viewRowsRange(layout), viewColsRange(layout), layout.stickyWidth)
  paintFixedArea(ctx, state)
  paintHeader(ctx, state)
  paintOverlay(ctx, state)

  return windowStats(layout)
}

function paintRegion (ctx, state, region) {
  const { layout } = state

  if (region.header) {
    paintHeaderPass(ctx, state)

    return { rowStart: 0, rowEnd: 0, rowCount: 0, colStart: layout.viewCols.start, colEnd: layout.viewCols.end }
  }

  if (region.rows) return paintRowBand(ctx, state, region.rows)
  if (region.cols) return paintColBand(ctx, state, region.cols)
  if (region.cell) return paintCellRegion(ctx, state, region.cell)
  if (region.colFrom != null) return paintResizeBand(ctx, state, region.colFrom)

  return null
}

/** 绘制执行：setTransform DPR 直乘 → 分区管线 → lastPaint 统计；
    region 为 null/undefined 或未识别形状时整幅绘制（clearRect 起点复位） */
function paint (ctx, state, region) {
  const startedAt = performance.now()
  const dpr = state.dpr || window.devicePixelRatio || FALLBACK_DPR

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  spanKeepRows = state.spans ? new Set() : null

  const stats = isFullPaintRegion(region)
    ? paintFull(ctx, state)
    : paintRegion(ctx, state, region)

  if (stats) stats.elapsed = performance.now() - startedAt

  if (state.itemHits) trimItemHits(state.itemHits, state.layout.viewRows, spanKeepRows)

  spanKeepRows = null

  return stats
}

/** 整幅绘制入口（A2）：返回 lastPaint 统计 { rowStart, ..., elapsed } */
export function draw (ctx, state) {
  return paint(ctx, state, null)
}

/** 脏区绘制入口（A3 重绘表）：region 形状见模块头注释，未绘制返回 null */
export function drawRegion (ctx, state, region) {
  return paint(ctx, state, region)
}

function rowsRegionPaintable (region, viewRows) {
  return region.rows[1] > viewRows.start && region.rows[0] < viewRows.end
}

function colsRegionPaintable (region, colWidths) {
  return region.cols[1] > 0 && region.cols[0] < colWidths.length
}

function cellRegionPaintable (region, layout) {
  const { row, col } = region.cell
  const cols = layout.viewCols

  return row >= layout.viewRows.start && row < layout.viewRows.end &&
    (col < layout.fixedCount || (col >= cols.start && col < cols.end))
}

/** region 是否落在当前可视窗口内（img onload → invalidateCell 前的行窗口校验等） */
function isRegionPaintable (state, region) {
  if (!region) return true

  const { layout } = state

  if (region.header) return true

  if (region.colFrom != null) {
    return region.colFrom >= 0 && region.colFrom < layout.colWidths.length
  }

  if (region.rows) return rowsRegionPaintable(region, layout.viewRows)
  if (region.cols) return colsRegionPaintable(region, layout.colWidths)
  if (region.cell) return cellRegionPaintable(region, layout)

  return false
}

/** 合并脏区归一扩展（§5.2，顺序固定：归一 → 扩展，先于 isRegionPaintable 校验——
    否则锚行滚出窗口时行带/单格失效被 paintable 拒绝）：
 * - 归一：{cell} covered 格改写为主格坐标；
 * - 扩展：{cell} 命中区域 → 区域包围盒（rows+cols 带形状）；{rows} 与相交区域的
 *   行包围盒取并（覆盖行底色随动/残影链路）；
 * - {cols}/{header}/{colFrom} 不扩展：paintColBand 带高恒整高、行范围取整个
 *   viewRows，区域内可视行全部重画，region pass 按 rows 相交自然覆盖。
 */
function prepareSpansRegion (state, region) {
  const spans = state.spans

  if (!spans || !region) return region

  if (region.cell) {
    const { row, col } = region.cell
    const anchor = coveredAnchorOf(spans, row, col) ?? { row, col }
    const src = regionAt(spans, anchor.row, anchor.col)

    return src
      ? { rows: [src.rowFrom, src.rowTo], cols: [src.colFrom, src.colTo] }
      : { cell: { row: anchor.row, col: anchor.col } }
  }

  if (region.rows) {
    const [from, to] = region.rows
    let lo = from
    let hi = to

    for (const src of regionsForRows(spans, from, to)) {
      lo = Math.min(lo, src.rowFrom)
      hi = Math.max(hi, src.rowTo)
    }

    return lo === from && hi === to ? region : { rows: [lo, hi] }
  }

  return region
}

// 有状态绘制器：draw 记录最近 state，invalidate 系列以 rAF 合帧异步重绘（同帧
// 多区域合并为整幅，正确性优先）；img 加载完成后经 invalidateCell 联动重绘
//（行已滚出窗口自动跳过）

// - draw(state)：同步整幅，返回 lastPaint；取消挂起中的脏区任务
// - invalidate(region, { immediate, state })：受理返回 true；immediate 同步重绘，
//   否则入队 rAF 合帧；state 缺省用最近一次 draw 的 state

// - invalidateRow/Cell：行不在当前窗口返回 false 不重绘；dispose：取消 rAF 清队列
export function createPainter ({ canvas } = {}) {
  const ctx = canvas?.getContext?.('2d')

  if (!ctx) throw new TypeError('createPainter: 需要有效的 canvas 元素')

  let lastState = null
  let last = null
  let rafId = 0
  const pending = []

  const withImageRelay = state => ({
    ...state,
    onImageLoad: (row, col) => {
      state.onImageLoad?.(row, col)
      api.invalidateCell(row, col)
    }
  })

  const apply = (state, region) => {
    lastState = withImageRelay(state)
    last = region ? drawRegion(ctx, lastState, region) : draw(ctx, lastState)

    return last
  }

  const flush = () => {
    rafId = 0

    if (!lastState || !pending.length) return

    const regions = pending.splice(0)

    apply(lastState, regions.length === 1 ? regions[0] : null)
  }

  const api = {
    draw (state) {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }

      pending.length = 0

      return apply(state, null)
    },

    invalidate (region, { immediate = false, state } = {}) {
      const base = state ?? lastState

      if (!base) return false

      // 合并脏区归一扩展先于窗口校验（§5.2：锚行滚出窗口时按扩展后的 range 放行）
      const prepared = prepareSpansRegion(base, region)

      if (!isRegionPaintable(base, prepared)) return false

      if (immediate) return apply(base, prepared) != null

      pending.push(prepared)
      if (!rafId) rafId = requestAnimationFrame(flush)

      return true
    },

    invalidateRow (row, options) {
      return api.invalidate({ rows: [row, row + 1] }, options)
    },

    invalidateCell (row, col, options) {
      return api.invalidate({ cell: { row, col } }, options)
    },

    get lastPaint () {
      return last
    },

    dispose () {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = 0
      pending.length = 0
      lastState = null
      last = null
    }
  }

  return api
}
