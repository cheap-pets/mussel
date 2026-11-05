/** 分区 4 表头 + 表头测量缓存 */
import { createMeasureCache } from '../shared/theme.js'
import { ellipsize } from '../shared/text-wrap.js'
import {
  CELL_PADDING_FALLBACK,
  CHECK_SIZE,
  CHECK_RADIUS,
  CHECK_FONT_SIZE,
  FONT_SIZE_FALLBACK,
  FONT_FAMILY_FALLBACK
} from '../shared/constants.js'
import { viewportColX, withClip, sortDirectionOf } from './paint-utils'

// 排序图标：th 内 absolute right: cell-padding、font-size 18px（table.scss
// .mu-sort-icon），viewBox 24 双三角 path（sort-icon.vue），caption 右侧预留 18px
const SORT_ICON_SIZE = 18
const SORT_ICON_RESERVE = 18

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

export function paintHeader (ctx, state) {
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
