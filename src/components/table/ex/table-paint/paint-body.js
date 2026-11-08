/** 分区 1 单元格区域 + 分区 3 固定列 + spanKeepRows 帧机制 */
import { drawCell } from '../cell-paint/cell-painters.js'
import {
  rowBackground,
  contentRightXOf,
  recordKeyOf,
  rowsOf,
  viewportColX,
  viewRowsRange,
  isEmptyRange
} from './paint-utils'
import { regionsForRows, spanRegionRect, spanCellKindOf } from '../spans/spans.js'
import { isGridlineMode, paintGridlines } from './paint-gridlines'
import { recordNumberOf } from '../shared/cell-identity'

// spanKeepRows：本帧 region pass 实际绘制过内容的锚行集合，与 itemHits 收集同一
// 次遍历产出（避免双源漂移）；经 begin/endSpanFrame 封装读写，时序为
// 置空 → 收集 → 消费 → 复位
let spanKeepRows = null

/** paint 入口帧开始：spans 非 null 时建本帧锚行集合，否则复位 null */
export function beginSpanFrame (spans) {
  spanKeepRows = spans ? new Set() : null
}

/** paint 入口帧结束：按可视窗口裁剪 itemHits（keepRows = 本帧锚行集合）并复位 */
export function endSpanFrame (itemHits, viewRows) {
  if (itemHits) trimItemHits(itemHits, viewRows, spanKeepRows)

  spanKeepRows = null
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

/** 绘制批次结束按当前可视窗口行 [start, end) 裁剪（窗口外行删除，长滚不增长）；
    keepRows = 本帧锚行集合，合并区域锚行滚出窗口后区域内 link/tag/button 仍可点 */
function trimItemHits (itemHits, viewRows, keepRows) {
  const { start, end } = viewRows

  for (const row of itemHits.keys()) {
    if (row < start || (row >= end && !(keepRows && keepRows.has(row)))) itemHits.delete(row)
  }
}

function rowBandEndX (layout, cols, bandToX) {
  const last = cols.to - 1
  const x1 = viewportColX(layout, last) + (layout.colWidths[last] || 0)

  return Math.max(x1, bandToX ?? x1)
}

/** 行背景带绘制（paintBodyRow / paintBodyRowSpans 单一事实源）：行底色带整宽，
    斑马/选中底色 cap 至末列右缘视口 x（列内容区右边界），cap 掉的延伸区统一补
    bgNormal 表格底色——ΣcolWidths < 视口宽时斑马色不出列内容区。bandToX 扩展
    语义见 paintCellRange 头注 */
function paintRowBandBackground (ctx, state, r, x0, bandEnd, rowHeight) {
  const layout = state.layout
  const y = layout.headHeight + layout.rowGeometry.topAt(r) - layout.scrollTop
  const capEnd = Math.min(bandEnd, contentRightXOf(layout))

  ctx.fillStyle = rowBackground(state, r)
  ctx.fillRect(x0, y, capEnd - x0, rowHeight)

  if (capEnd < bandEnd) {
    ctx.fillStyle = state.theme.bgNormal
    ctx.fillRect(capEnd, y, bandEnd - capEnd, rowHeight)
  }
}

// 表体单行：行背景一条矩形覆盖列区间 + 逐格内容绘制；recordKey 行级求值一次
// （树关时为 null，drawTreeAffordance 不消费）
function paintBodyRow (ctx, state, records, columns, r, cols, x0, bandWidth, W, H) {
  const { layout } = state
  const geometry = layout.rowGeometry
  const rowHeight = geometry.heightAt(r)
  const y = layout.headHeight + geometry.topAt(r) - layout.scrollTop

  const bandEnd = x0 + bandWidth

  paintRowBandBackground(ctx, state, r, x0, bandEnd, rowHeight)

  const record = records?.[r]

  if (record == null) return

  const recordNumber = recordNumberOf(state.recordsOffset, r)
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

// 表体单行（spans 分支 pass ①）：行背景一条矩形覆盖列区间 + 非 span 格内容；
// covered 格清残留 itemHits 组（防浮层下可点），锚格内容由 region pass 统一绘制
function paintBodyRowSpans (ctx, state, records, columns, r, cols, x0, bandWidth, W, H) {
  const { layout, spans } = state
  const geometry = layout.rowGeometry
  const rowHeight = geometry.heightAt(r)
  const y = layout.headHeight + geometry.topAt(r) - layout.scrollTop

  const bandEnd = x0 + bandWidth

  paintRowBandBackground(ctx, state, r, x0, bandEnd, rowHeight)

  const record = records?.[r]

  if (record == null) return

  const recordNumber = recordNumberOf(state.recordsOffset, r)
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

// region pass（两遍式第②遍）：遍历与 rows 相交的 region（经 rowRegions 查询，
// 判定 = 区域与 rows 参数相交，不是锚行 ∈ rows；再按 cols 过滤分区——固定列 pass
// 不画滚动区区域、反之亦然）。先以锚行背景色 fillRect 区域包围盒（统一 striped/
// 选中底色），再绘制主格内容：区域矩形 + 区域垂直锚 + 区域末列 rightInset +
// itemHits 收集 + veil 判定。锚行不在 rows/窗口内照常绘制（region pass 存在的
// 意义），窗口外由 clipIfPartial / 脏区 clip 自然裁剪
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
      recordNumberOf(state.recordsOffset, region.row),
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
// 延伸区行底色分口径见 paintRowBandBackground。
// spans 非 null 走两遍式：①全行背景 + 非 span 格内容 → ②region pass 区域底色 +
// 主格内容——三段式背景顺序保证区域底色不被下方行背景带重盖
export function paintCellRange (ctx, state, rows, cols, bandToX) {
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

/** veil：编辑中格清空本格命中组并返回 true（调用方跳过内容绘制）——不清空会
    残留上一次绘制的条目矩形，浮层下方仍可点中 link/button */
function veilEditingCell (state, row, colIndex) {
  if (!isVeiledCell(state, row, colIndex)) return false

  if (state.itemHits) setItemHitGroup(state.itemHits, row, colIndex, [])

  return true
}

/** 本格右缘列线占用 px：非末列（或末列但有空白区）且 gridlines 含 column 时为 1；
    blankTail = stickyWidth > contentWidth（三处消费点同派生式） */
function rightInsetOf (state, colIndex) {
  const { layout } = state
  const blankTail = layout.stickyWidth > (layout.contentWidth || 0)
  const showsColLine = (colIndex < layout.colWidths.length - 1) || blankTail

  return showsColLine && isGridlineMode(state.gridlines ?? 'all', 'column') ? 1 : 0
}

/** 条目悬停注入：仅 hover 格产出 { kind, index, disabled }，其余格 undefined */
function cellHoverItemOf (state, row, colIndex) {
  const hover = state.hoverItem

  if (!hover || hover.row !== row || hover.col !== colIndex) return undefined

  return { kind: hover.kind, index: hover.index, disabled: hover.disabled }
}

/** 视口边缘部分可见格 clip（完全可见格跳过 save/clip/restore，画布外像素本被
    丢弃）；返回是否执行了 clip */
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

// 单元格内容绘制。spanOpts（region pass 专用）：regionHeight = 区域矩形高
// （内容垂直居中与行数上限）、rightInset 按区域末列取右缘列线占位
// （普通格缺省按本列求值）
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

// —— 分区 3：固定左列区 ——

/** 固定左列区：整高不透明底重绘盖住滚过的表体。rows 限定重绘行区间（行带/单格
    脏区入口只画与脏带相交的行）；缺省整幅可视行 */
export function paintFixedArea (ctx, state, rows) {
  const { layout, theme } = state

  if (!layout.fixedCount) return

  const range = rows ?? viewRowsRange(layout)

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
