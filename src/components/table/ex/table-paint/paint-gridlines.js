/** 分区 2 网格线（含合并区域分段） */
import { viewportColX, viewportRowY, contentRightXOf, contentBottomYOf, isEmptyRange } from './paint-utils'

// —— 分区 2：网格线（合并区域分段：内部行线/列线在区域包围盒区间内跳过）——

/** 网格线模式含某向：all 全画，其余按 row / column 精确匹配（未知值不画线） */
export function isGridlineMode (mode, kind) {
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
    右侧列号索引（b ∈ (colFrom, colTo) 为区域内部分界）。上界取 cols.to + 1：
    列带重绘的画线范围含末列右缘线 b = cols.to，该线落在区域内部时同为内部线，
    须登记跳段——否则列带重绘走无 skips 分支整条补画，区域内部格线残留 */
function colLineSkipIntervals (layout, spans, cols) {
  const map = new Map()

  for (const region of spans.regions) {
    if (region.colTo <= cols.from + 1 || region.colFrom >= cols.to) continue

    const y0 = viewportRowY(layout, region.rowFrom)
    const y1 = viewportRowY(layout, region.rowTo)
    const from = Math.max(region.colFrom + 1, cols.from + 1)
    const to = Math.min(region.colTo, cols.to + 1)

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

/** 列线：列右缘 1px，遇末列终止（同 .last-col）；空白区时末列右缘补画 1px；
    区域内部竖线在区域 y 区间内跳过 */
function paintColGridlines (ctx, state, cols) {
  const { layout, spans } = state
  const n = layout.colWidths.length
  const blankTail = layout.stickyWidth > (layout.contentWidth || 0)
  const skipsByBoundary = spans ? colLineSkipIntervals(layout, spans, cols) : null

  // 列线下界截断：行高之和 < 容器高时止于末行底部视口 y（contentBottomYOf 共享
  // 式）；空表 0 行列线保留全高（rowCount > 0 门控）
  const contentBottomY = contentBottomYOf(layout)

  for (let c = cols.from; c < cols.to; c++) {
    if (c >= n - 1 && !blankTail) break

    const x = viewportColX(layout, c) + (layout.colWidths[c] || 0) - 1
    const skips = skipsByBoundary?.get(c + 1)

    if (!skips) {
      ctx.fillRect(x, layout.headHeight, 1, contentBottomY - layout.headHeight)

      continue
    }

    paintSegmentedVLine(ctx, x, layout.headHeight, contentBottomY, skips)
  }
}

export function paintGridlines (ctx, state, rows, cols, maxWidth) {
  const mode = state.gridlines ?? 'all'

  if (mode === 'none' || isEmptyRange(rows) || isEmptyRange(cols)) return

  const { layout, theme } = state
  const W = Math.min(maxWidth ?? layout.stickyWidth, layout.stickyWidth)

  // 行线右界截断：列宽之和 < 容器宽时 cap 至末列右缘视口 x（contentRightXOf
  // 共享式，与表头末线/背景、hover 带、选中带同源；固定区 pass 传
  // maxWidth = fixedWidth 时 cap 同样无操作）
  const contentRightX = contentRightXOf(layout)
  const rowLineW = Math.min(W, contentRightX)

  ctx.fillStyle = theme.borderColorSoft

  if (isGridlineMode(mode, 'row')) paintRowGridlines(ctx, state, rows, rowLineW)

  if (isGridlineMode(mode, 'column')) paintColGridlines(ctx, state, cols)
}
