/** table-ex 绘制管线：单 canvas 分区绘制 + 脏区重绘。
    分区顺序固定（后区不透明覆盖前区）：1 表体滚动区（可视行 × 滚动区可视列，
    逐格背景→内容）→ 2 网格线 → 3 固定左列区（整高不透明重绘）→ 4 表头区（整宽）
    → 5 覆盖层（hover/编辑感知）；脏区绘制先在 clip 内擦除为透明再走同一分区管线
    （半透明行底色直接叠画会重复混色）；选中/斑马底色在分区 1/3 画行背景时直接
    取值，不做覆盖层。
    关键 state 契约（table-ex.vue 持有并传入）：dpr 每次绘制 setTransform 直乘；
    layout = relayout() 快照（含 rowGeometry 引用）；spans（合并单元格
    buildSpans 产物 | null）null 走逐行单遍原路径，非 null 走两遍式 + 网格线分段
    + 脏区归一扩展；itemHits = Map<row, Map<col, rects>> 条目命中矩形，按格整组
    替换收集、批次结束按可视行裁剪（veil 格整组清空）；onImageLoad (row, col) 由
    createPainter 接管为 invalidateCell（行窗口校验在 invalidate 内）；树关 =
    flatInfo null（含 parentKeys 平行数组，spans 树父链切断数据源）。
    脏区 region 形状：{ rows: [from, to) } 行横带 / { cols: [from, to) } 列竖带 /
    { cell } 单格 / { header: true } 表头整幅 / { colFrom } 自该列至画布右端竖带 +
    表头（左界取列左缘：列宽变化影响该列截断与右侧所有列位置，防加宽残影） */
import { beginSpanFrame, endSpanFrame, paintCellRange, paintFixedArea } from './paint-body.js'
import { paintGridlines } from './paint-gridlines.js'
import { paintHeader } from './paint-header.js'
import { paintOverlay } from './paint-overlay.js'
import {
  FALLBACK_DPR,
  viewportColX,
  viewportRowY,
  viewRowsRange,
  viewColsRange,
  withClip,
  eraseClipRegion
} from './paint-utils.js'
import { coveredAnchorOf, regionAt, regionsForRows } from '../spans/spans.js'

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

/** 单格：clip 收敛到格矩形（右/下各扩 1px 覆盖格边框线） */
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

/** 调宽 move：表头整幅 + 自该列至画布右端竖带 */
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

/** 无 region 或未识别形状（无任何已知字段）按整幅兜底（正确性优先） */
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

  beginSpanFrame(state.spans)

  const stats = isFullPaintRegion(region)
    ? paintFull(ctx, state)
    : paintRegion(ctx, state, region)

  if (stats) stats.elapsed = performance.now() - startedAt

  if (state.itemHits) endSpanFrame(state.itemHits, state.layout.viewRows)

  return stats
}

/** 整幅绘制入口：返回 lastPaint 统计 { rowStart, ..., elapsed } */
export function draw (ctx, state) {
  return paint(ctx, state, null)
}

/** 脏区绘制入口：region 形状见模块头注释，未绘制返回 null */
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

/** 合并脏区归一扩展（顺序固定：归一 → 扩展，先于 isRegionPaintable 校验——
    否则锚行滚出窗口时行带/单格失效被 paintable 拒绝）：
    归一：{cell} covered 格改写为主格坐标；扩展：{cell} 命中区域 → 区域包围盒
    （rows+cols 带形状），{rows} 与相交区域的行包围盒取并（覆盖行底色随动/残影
    链路）；{cols}/{header}/{colFrom} 不扩展——paintColBand 带高恒整高、行范围取
    整个 viewRows，区域内可视行全部重画，region pass 按 rows 相交自然覆盖 */
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

// 有状态绘制器：draw(state) 同步整幅、记录最近 state 并取消挂起中的脏区任务；
// invalidate(region, { immediate, state }) 受理返回 true，以 rAF 合帧异步重绘
// （同帧多区域合并为整幅，正确性优先），state 缺省用最近一次 draw 的 state；
// dispose 取消 rAF 清队列
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
