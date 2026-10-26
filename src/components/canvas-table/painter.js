/**
 * canvas-table 绘制管线（02-design.md A2 图层划分 / A3 按需重绘与 lastPaint / A8）。
 *
 * 单 canvas 分区绘制，分区顺序固定（后区不透明覆盖前区）：
 *   1 表体滚动区（可视行 × 滚动区可视列，逐格背景→内容）
 *   2 网格线（按 gridlines；固定区线由分区 3 自绘）
 *   3 固定左列区（整高不透明重绘，盖住滚过的表体；x-scrolled 右缘强化色分界）
 *   4 表头区（整宽不透明重绘：底色/caption/排序图标/check 表头/列分隔线/底边框）
 *   5 覆盖层（hover 高亮、可编辑格描边、树箭头 hover 主色、调宽拖拽参考线）
 * 选中底色与斑马纹在分区 1/3 画行背景时直接取值，不做覆盖层。
 *
 * 入口（设计命名 draw(state) 的 ctx 前置纯函数形式）：
 * - draw(ctx, state)                 整幅绘制，返回 lastPaint 统计
 * - drawRegion(ctx, state, region)   脏区绘制（save/clip/restore 调度），返回 lastPaint 统计
 * - cellRectAt(layout, row, col)     单元格视口矩形
 * 有状态封装（S1 组件壳一次接线）：
 * - createPainter({ canvas })        rAF 合帧异步失效、img onload → invalidateCell 联动
 *                                    （重绘前校验行仍在窗口内）、lastPaint 存取、dispose 清理
 *
 * state 契约（canvas-table.vue 持有并传入）：
 * - dpr            devicePixelRatio，每次绘制 ctx.setTransform(dpr, 0, 0, dpr, 0, 0)（A2 标准直乘）
 * - layout         layout.js relayout() 返回的布局快照（含 rowGeometry 引用；画布 css
 *                  宽高取 stickyWidth/Height。行坐标经 rowGeometry.topAt/heightAt 取值，
 *                  缺失时按 uniform 等高回退——等高算式恒等）
 * - theme          theme.js readSnapshot() 快照
 * - records        行数据（与 layout 的 rowCount 同源；G2 起被 displayRows 取代时保留兜底）
 * - displayRows    读行集合（02-design.md A2.1）：树开 = 平铺行数组、树关 = records 原序；
 *                  组件壳 G3 起组装。painter 一律经 rowsOf(state) = displayRows ?? records
 *                  取行（实施约束 1：中间态壳未组装 displayRows 时行为不变）
 * - columns        cell-painters.prepareColumn() 后的内部列数组
 * - recordsOffset  rec_no 起始序号偏移（缺省 0；recordNumber = recordsOffset + 行号 + 1）
 * - emit           透传列类型 render
 * - keyField / getRecordKey / selectedKey
 *                  选中行判定 getRecordKey(record, 行号) === selectedKey；getRecordKey 缺省时
 *                  keyField ? record[keyField] : 行号（无 keyField 且数组结构不变时与
 *                  autoIncrementKeyBuilder 同序）。selectedKey 由组件壳按
 *                  selectedRecordKey ?? selectedRecord?.[keyField || '_key'] 解析后传入
 * - headerChecked  check 表头受控态 { [field]: Boolean }（null/undefined = 不绘制表头 ✓）
 * - gridlines / hoverMode / striped / orderBy   渲染 props 原样传入
 * - hover          { row, col } | null 视口命中索引（interactions 产出）
 * - resizeGuideX   调宽拖拽参考线视口 x | null
 * - onImageLoad    (row, col) => void，纯函数绘制的 img 加载完成回调；
 *                  createPainter 内部自动接管为 invalidateCell(row, col)
 * - itemHits       条目命中矩形集合（A3.3）：Map<row, Map<col, Array<{kind,index,rect}>>>，
 *                  paintCellRange 绘制 items 时按 (row, col) 粒度整组替换收集，
 *                  每次绘制批次结束按当前可视窗口行裁剪（组件壳创建传入，可选）
 * - flatInfo / expandedKeys
 *                  树形列绘制（A2.4）：{ levels, hasChildren } 平行数组 + 展开 key 集合
 *                  （树关 = flatInfo null，无树形缩进）；可选
 * - editable / isCellEditableFn
 *                  hover 编辑感知（A5.3）：可编辑格 hover 画 1px 主色内描边；可选
 * - measure / wrapCache
 *                  文本测量注入（A2.2）：theme.js createTextMeasurer/createWrapCache
 *                  产物，经 drawCell 透传 drawText 多行折行（与行高计算同源）；可选
 *
 * 脏区 region 形状（A3 重绘表）：
 *   { rows: [from, to] }   行横带（to 排他）——hover 行/选中行/编辑提交与 check 点击整行
 *   { cols: [from, to] }   列竖带（to 排他）——列 hover
 *   { cell: { row, col } } 单格——invalidateCell 精细重绘
 *   { header: true }       表头整幅——headerChecked 变化
 *   { colFrom }            自该列视口左缘至画布右端竖带 + 表头整幅——列宽拖拽 move
 *                          （左界取列左缘：列宽变化影响该列截断与右侧所有列位置，防加宽残影）
 * 脏区绘制先在 clip 内擦除为透明再走同一分区管线（行底色为半透明变量，
 * 直接叠画会在旧帧上重复混色；整幅绘制由 clearRect 保证同一起点）。
 */

import { drawCell } from './cell-painters.js'
import { EDITOR_GAP } from './editor.js'
import { createMeasureCache, withAlpha } from './theme.js'
import { createUniformRowGeometry, TREE_INDENT } from './row-geometry.js'

// 表头 ✓ 方框（镜像 .mu-table__cell-check，与 cell-painters 单元格 check 同规格）
const CHECK_SIZE = 16
const CHECK_RADIUS = 4
const CHECK_FONT_SIZE = 12

// 排序图标：th 内 absolute right: cell-padding、font-size 18px（table.scss .mu-sort-icon），
// viewBox 24 双三角 path M18 10l-6 -6l-6 6h12 / M18 14l-6 6l-6 -6h12（sort-icon.vue），
// caption 右侧预留 18px（A5）
const SORT_ICON_SIZE = 18
const SORT_ICON_RESERVE = 18

const FALLBACK_DPR = 1
const FALLBACK_FONT_SIZE = 14
const FALLBACK_FONT_FAMILY = 'sans-serif'
const FALLBACK_PADDING = 8

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
  const fontSize = theme?.fontSize || FALLBACK_FONT_SIZE

  return `500 ${fontSize}px ${theme?.fontFamily || FALLBACK_FONT_FAMILY}`
}

/** 超宽截断加省略号（A7 单行省略；溢出字符 '...' 按实施约束 4 统一）；放不下一个字符时返回空串 */
function ellipsizeText (ctx, text, maxWidth, font) {
  if (!(maxWidth > 0)) return ''
  if (measureText(ctx, text, font) <= maxWidth) return text

  let end = text.length

  while (end > 0 && measureText(ctx, text.slice(0, end) + '...', font) > maxWidth) end--

  return end > 0 ? text.slice(0, end) + '...' : ''
}

// —— 几何换算 ——

/** 读行集合（实施约束 1）：displayRows ?? records 缺省回退——中间态壳行为不变 */
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

/** 展开 key 集合命中（镜像 cell-painters.isExpandedKey：Set/Array 双形态） */
function isExpandedKey (expandedKeys, key) {
  if (expandedKeys == null || key == null) return false

  if (typeof expandedKeys.has === 'function') return expandedKeys.has(key)

  return typeof expandedKeys.includes === 'function' ? expandedKeys.includes(key) : false
}

// layout 快照缺失 rowGeometry 时的 uniform 回退缓存（cellRectAt 等外部消费方
// 传入手织 layout 的容错路径；等高算式恒等，WeakMap 防每帧重建）
const geometryFallbacks = new WeakMap()

function rowGeometryOf (layout) {
  if (layout.rowGeometry) return layout.rowGeometry

  let geometry = geometryFallbacks.get(layout)

  if (!geometry) {
    geometry = createUniformRowGeometry({ rowHeight: layout.rowHeight, rowCount: 0 })
    geometryFallbacks.set(layout, geometry)
  }

  return geometry
}

/** 列视口 x：固定列不随滚动位移，滚动区列减 scrollLeft */
function viewportColX (layout, col) {
  return (layout.colLefts[col] || 0) - (col < layout.fixedCount ? 0 : layout.scrollLeft)
}

/** 行视口 y（表头下缘起算，随 scrollTop 位移；变高行经 rowGeometry.topAt） */
function viewportRowY (layout, row) {
  return layout.headHeight + rowGeometryOf(layout).topAt(row) - layout.scrollTop
}

/** 单元格视口矩形（interactions / editor / 自检共用；高度 = heightAt(row)，变高行适配） */
export function cellRectAt (layout, row, col) {
  return {
    x: viewportColX(layout, col),
    y: viewportRowY(layout, row),
    width: layout.colWidths?.[col] || 0,
    height: rowGeometryOf(layout).heightAt(row)
  }
}

function viewColsRange (layout) {
  return { from: layout.viewCols.start, to: layout.viewCols.end }
}

/** layout.viewRows {start,end,count} → 区间 {from,to}（paintCellRange/paintGridlines 入参形状） */
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

/** 行背景优先级：选中（--mu-primary-faint）> 斑马偶行（--mu-bg-stripe，nth-child(even) 同序）> 普通 */
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

/**
 * 擦除当前 clip 区域为透明（destination-out 在 clip 内精确生效，语义无歧义），
 * 使半透明行底色与覆盖层的混色起点与整幅绘制一致。
 */
function eraseClipRegion (ctx, rect) {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.fillRect(rect[0], rect[1], rect[2], rect[3])
  ctx.globalCompositeOperation = 'source-over'
}

// —— 分区 1：单元格区域（滚动区与固定区共用，含行背景） ——

/** itemHits (row, col) 组写入（A3.3 内层按 (row,col) 键整组替换） */
function setItemHitGroup (itemHits, row, col, rects) {
  let inner = itemHits.get(row)

  if (!inner) {
    inner = new Map()
    itemHits.set(row, inner)
  }

  inner.set(col, rects)
}

/** 每次绘制批次结束按当前可视窗口行 [start, end) 裁剪（窗口外行删除，长滚不增长） */
function trimItemHits (itemHits, viewRows) {
  const { start, end } = viewRows

  for (const row of itemHits.keys()) {
    if (row < start || row >= end) itemHits.delete(row)
  }
}

/**
 * 单元格区域绘制（滚动区与固定区共用，含行背景）。
 * bandToX（R1/人工 3 意见 1，A2.1）：行背景带右缘视口 x 下限——带右缘 =
 * max(所绘列区间右缘 x1, bandToX ?? x1)。滚动区调用点传 layout.stickyWidth
 * （ΣcolWidths < 视口宽时行背景充满至视口右缘；Σ ≥ 视口宽时 x1 已越界、超界
 * 部分被画布自然裁剪）；固定列 pass（paintFixedArea）不传——带保持固定列区间
 * [0, fixedWidth]，防固定 pass 行底色覆盖已绘滚动区内容（遮挡由分区顺序承担）。
 */
function paintCellRange (ctx, state, rows, cols, bandToX) {
  if (!rows || !cols || rows.to <= rows.from || cols.to <= cols.from) return

  const { layout, columns } = state
  const records = rowsOf(state)
  const geometry = rowGeometryOf(layout)
  const W = layout.stickyWidth
  const H = layout.stickyHeight
  const last = cols.to - 1

  for (let r = Math.max(rows.from, 0); r < rows.to; r++) {
    const rowHeight = geometry.heightAt(r)
    const y = layout.headHeight + geometry.topAt(r) - layout.scrollTop
    const x0 = viewportColX(layout, cols.from)
    const x1 = viewportColX(layout, last) + (layout.colWidths[last] || 0)

    // 行背景一条矩形覆盖列区间（选中/斑马纹按行取值，A2 分区 1；高度 = heightAt(r)）；
    // 带右缘经 bandToX 扩展（见函数头注）
    ctx.fillStyle = rowBackground(state, r)
    ctx.fillRect(x0, y, Math.max(x1, bandToX ?? x1) - x0, rowHeight)

    const record = records?.[r]

    if (record == null) continue

    const recordNumber = (state.recordsOffset || 0) + r + 1

    for (let c = Math.max(cols.from, 0); c < cols.to; c++) {
      const col = columns?.[c]

      if (!col) continue

      const rect = {
        x: viewportColX(layout, c),
        y,
        width: layout.colWidths[c] || 0,
        height: rowHeight
      }

      drawCellClipped(ctx, state, col, record, recordNumber, rect, r, c, W, H)
    }
  }
}

/**
 * 单元格内容绘制：完全可见格跳过 save/clip/restore（A3 性能措施，kaka P0），
 * 视口边缘部分可见格才 clip（画布边界外像素本就被丢弃，clip 兜底内容外溢）。
 * itemHits 存在时按 (row, col) 粒度收集本格条目矩形（整组替换，A3.3）。
 */
function drawCellClipped (ctx, state, col, record, recordNumber, rect, row, colIndex, W, H) {
  const partial = rect.x < 0 || rect.y < 0 ||
    rect.x + rect.width > W || rect.y + rect.height > H

  if (partial) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, H)
    ctx.clip()
  }

  let itemRects = null

  if (state.itemHits) itemRects = []

  drawCell(ctx, {
    col,
    record,
    recordNumber,
    emit: state.emit,
    rect,
    theme: state.theme,
    onImageLoad: state.onImageLoad ? () => state.onImageLoad(row, colIndex) : undefined,
    row,
    flatInfo: state.flatInfo,
    expandedKeys: state.expandedKeys,
    recordKey: recordKeyOf(state, record, row),
    measure: state.measure,
    wrapCache: state.wrapCache,
    onItemRect: itemRects ? entry => itemRects.push(entry) : undefined
  })

  if (itemRects) setItemHitGroup(state.itemHits, row, colIndex, itemRects)

  if (partial) ctx.restore()
}

// —— 分区 2：网格线 ——

function paintGridlines (ctx, state, rows, cols, maxWidth) {
  const mode = state.gridlines ?? 'all'

  if (mode === 'none' || !rows || !cols || rows.to <= rows.from || cols.to <= cols.from) return

  const { layout, theme } = state
  const W = Math.min(maxWidth ?? layout.stickyWidth, layout.stickyWidth)
  const H = layout.stickyHeight

  ctx.fillStyle = theme.borderColorSoft

  // 行线：行界 1px（首行顶线由表头底边框承担，同 .mu-table td border-top 首行无线）
  if (mode === 'all' || mode === 'row') {
    for (let r = Math.max(rows.from, 1); r <= rows.to; r++) {
      ctx.fillRect(0, viewportRowY(layout, r), W, 1)
    }
  }

  // 列线：列右缘 1px（末列无线，同 .last-col；固定区分界线由固定区强化色覆盖）
  if (mode === 'all' || mode === 'column') {
    const n = layout.colWidths.length

    for (let c = cols.from; c < cols.to; c++) {
      if (c >= n - 1) break

      ctx.fillRect(viewportColX(layout, c) + (layout.colWidths[c] || 0) - 1, layout.headHeight, 1, H - layout.headHeight)
    }
  }
}

// —— 分区 3：固定左列区 ——

function paintFixedArea (ctx, state) {
  const { layout, theme } = state

  if (!layout.fixedCount) return

  // 整高不透明重绘，盖住滚过的表体（A2 分区 3）
  ctx.fillStyle = theme.bgNormal
  ctx.fillRect(0, 0, layout.fixedWidth, layout.stickyHeight)

  paintCellRange(ctx, state, viewRowsRange(layout), { from: 0, to: layout.fixedCount })
  paintGridlines(ctx, state, viewRowsRange(layout), { from: 0, to: layout.fixedCount }, layout.fixedWidth)

  // 分界线：横向滚动后强化色覆盖（对齐 table.scss .mu-table--x-scrolled .last-fixed-col，
  // 不受 gridlines 模式约束；表头部分由表头区自绘）
  if (layout.scrollLeft > 0.5) {
    ctx.fillStyle = theme.borderColorStrong
    ctx.fillRect(layout.fixedWidth - 1, layout.headHeight, 1, layout.stickyHeight - layout.headHeight)
  }
}

// —— 分区 4：表头区 ——

/** 表头可见列：固定列 [0, fixedCount) ∪ 滚动区可视列（固定列视口坐标不随滚动） */
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
    ctx.font = `600 ${CHECK_FONT_SIZE}px ${theme?.fontFamily || FALLBACK_FONT_FAMILY}`
    ctx.fillStyle = theme.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✓', x + CHECK_SIZE / 2, centerY)
  }
}

/** 排序图标：caption 右侧 18px 见方，上下双三角，激活方向主色、非激活灰（sort-icon.vue 复刻） */
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

function drawHeaderCell (ctx, state, col, x, width) {
  const { layout, theme } = state
  const padding = theme?.cellPadding || FALLBACK_PADDING
  const centerY = layout.headHeight / 2
  const raw = col._raw ?? {}
  const sortable = !!col.sortable
  const align = col._align || 'left'
  const reserve = sortable ? SORT_ICON_RESERVE : 0
  // check 表头 ✓：table.vue:22 同款条件（type=check + field + headerCheckbox + headerChecked 受控态）
  const hasHeaderCheck = raw.type === 'check' && raw.field && raw.headerCheckbox && state.headerChecked

  const font = headerFontOf(theme)
  let textX = x + padding
  let maxTextWidth = width - padding * 2 - reserve
  let checked = false

  if (hasHeaderCheck) {
    checked = !!state.headerChecked[raw.field]
    drawHeaderCheck(ctx, theme, x + padding, centerY, checked)
    textX = x + padding + CHECK_SIZE + 6
    maxTextWidth -= CHECK_SIZE + 6
  }

  const display = ellipsizeText(ctx, col.caption != null ? String(col.caption) : '', maxTextWidth, font)

  if (display) {
    ctx.font = font
    ctx.fillStyle = theme.textColor
    ctx.textAlign = hasHeaderCheck ? 'left' : align
    ctx.textBaseline = 'middle'

    let anchorX = textX

    if (!hasHeaderCheck && align !== 'left') {
      anchorX = align === 'right'
        ? x + width - padding - reserve
        : x + (width - reserve) / 2
    }

    ctx.fillText(display, anchorX, centerY)
  }

  if (sortable) {
    drawSortIcon(ctx, state, col, x + width - padding - SORT_ICON_SIZE, centerY - SORT_ICON_SIZE / 2)
  }
}

function paintHeader (ctx, state) {
  const { layout, theme } = state
  const W = layout.stickyWidth
  const headHeight = layout.headHeight

  // 整宽不透明底，盖住下方所有层（A2 分区 4）
  ctx.fillStyle = theme.bgFill
  ctx.fillRect(0, 0, W, headHeight)

  for (const c of headerColIndexes(layout)) {
    const col = state.columns?.[c]

    if (col) drawHeaderCell(ctx, state, col, viewportColX(layout, c), layout.colWidths[c] || 0)
  }

  // 表头列分隔线（.mu-table__th border-right 同款：末列无线、固定分界线 x-scrolled 强化）
  const mode = state.gridlines ?? 'all'
  const n = layout.colWidths.length
  const strongBoundary = layout.scrollLeft > 0.5

  if (mode === 'all' || mode === 'column' || strongBoundary) {
    for (const c of headerColIndexes(layout)) {
      if (c >= n - 1) break

      const strong = strongBoundary && c === layout.fixedCount - 1

      if (!strong && mode !== 'all' && mode !== 'column') continue

      ctx.fillStyle = strong ? theme.borderColorStrong : theme.borderColorSoft
      ctx.fillRect(viewportColX(layout, c) + (layout.colWidths[c] || 0) - 1, 0, 1, headHeight - 1)
    }
  }

  // 底边框（--head-border-bottom: 1px solid var(--mu-border-color-soft)）
  ctx.fillStyle = theme.borderColorSoft
  ctx.fillRect(0, headHeight - 1, W, 1)
}

// —— 分区 5：覆盖层 ——

/**
 * 树箭头 hover 主色（A2.4「hover 主色」，S1 遗留收尾）：hover 命中树形列父行格时，
 * 在覆盖层以主色重画箭头三角盖住分区 1 的常态 textColor 箭头（取色 = 快照
 * colors.primary.color，缺 colors 时回退 primaryColor）。三角几何与展开判定镜像
 * cell-painters drawTreeAffordance（x + padding + level×16 槽内 2..10，±3.5 / ±5），
 * 该处形状变更需同步。
 *
 * 粒度说明：壳的 hover 载荷为 { row, col }（hitTest 的 hit.cellX 未入 paintState，
 * 且同格内槽位进出不触发重绘）——槽位级命中需壳改动，本处为格级粒度：
 * hover 停留在树形列父行格上即主色，移出该格随行带重绘还原。
 */
function paintTreeArrowAccent (ctx, state) {
  const { hover, flatInfo, columns, theme } = state

  if (!hover || !flatInfo) return

  const column = columns?.[hover.col]

  if (!column?._isTreeColumn || !flatInfo.hasChildren?.[hover.row]) return

  const record = rowsOf(state)?.[hover.row]

  if (record == null) return

  const geometry = rowGeometryOf(state.layout)
  const padding = theme?.cellPadding || FALLBACK_PADDING
  const level = flatInfo.levels?.[hover.row] ?? 0
  const x = viewportColX(state.layout, hover.col) + padding + level * TREE_INDENT
  const centerY = viewportRowY(state.layout, hover.row) + geometry.heightAt(hover.row) / 2

  ctx.beginPath()

  if (isExpandedKey(state.expandedKeys, recordKeyOf(state, record, hover.row))) {
    // 展开 ▾（下指三角）
    ctx.moveTo(x + 2, centerY - 3.5)
    ctx.lineTo(x + 10, centerY - 3.5)
    ctx.lineTo(x + 6, centerY + 3.5)
  } else {
    // 收起 ▸（右指三角）
    ctx.moveTo(x + 3, centerY - 5)
    ctx.lineTo(x + 3, centerY + 5)
    ctx.lineTo(x + 10, centerY)
  }

  ctx.closePath()
  ctx.fillStyle = theme?.colors?.primary?.color ?? theme?.primaryColor
  ctx.fill()
}

function paintOverlay (ctx, state) {
  const { layout, theme, hover } = state
  const mode = state.hoverMode || 'row'
  const H = layout.stickyHeight
  const W = layout.stickyWidth
  const geometry = rowGeometryOf(layout)
  const rowCount = rowsOf(state)?.length ?? 0
  const colCount = layout.colWidths.length

  if (hover && mode !== 'none') {
    const { row, col } = hover
    const rowValid = row >= 0 && row < rowCount
    const colValid = col >= 0 && col < colCount

    ctx.fillStyle = theme.hoverBg

    if ((mode === 'row' || mode === 'cross') && rowValid) {
      ctx.fillRect(0, viewportRowY(layout, row), W, geometry.heightAt(row))
    }

    if ((mode === 'column' || mode === 'cross') && colValid) {
      ctx.fillRect(viewportColX(layout, col), layout.headHeight, layout.colWidths[col] || 0, H - layout.headHeight)
    }

    if (mode === 'cell' && rowValid && colValid) {
      ctx.fillRect(viewportColX(layout, col), viewportRowY(layout, row), layout.colWidths[col] || 0, geometry.heightAt(row))
    }

    // 可编辑格 hover 感知（A5.3，R1/人工 3 意见 2）：1px 主色内描边，矩形 =
    // cellRectAt 内缩 EDITOR_GAP（与 editor.js 编辑浮层矩形逐边相等——import 同一
    // 常量单一事实源，与单元格边框四周 4px 间距）；不占布局、随 hover 带重绘生效；
    // hoverMode none 时不画（用户显式关闭 hover 反馈）
    if (rowValid && colValid && state.editable && state.isCellEditableFn) {
      const column = state.columns?.[col]

      if (column && state.isCellEditableFn(column)) {
        const rect = cellRectAt(layout, row, col)

        ctx.strokeStyle = withAlpha(theme.primaryColor, 0.45)
        ctx.lineWidth = 1
        ctx.strokeRect(
          rect.x + EDITOR_GAP + 0.5,
          rect.y + EDITOR_GAP + 0.5,
          rect.width - EDITOR_GAP * 2 - 1,
          rect.height - EDITOR_GAP * 2 - 1
        )
      }
    }

    // 树箭头 hover 主色（A2.4）：hover 命中树形列父行格时箭头覆盖主色（同受
    // hoverMode none 抑制——用户显式关闭 hover 反馈时不画）
    if (rowValid && colValid) paintTreeArrowAccent(ctx, state)
  }

  // 调宽拖拽参考线：1px 主色、全高（A2 分区 5）
  if (state.resizeGuideX != null) {
    ctx.fillStyle = theme.primaryColor
    ctx.fillRect(Math.round(state.resizeGuideX), 0, 1, H)
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
    paintFixedArea(ctx, state)
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
  const rect = [x, y, (layout.colWidths[col] || 0) + 1, rowGeometryOf(layout).heightAt(row) + 1]

  withClip(ctx, rect, () => {
    eraseClipRegion(ctx, rect)
    paintCellRange(ctx, state, { from: row, to: row + 1 }, { from: col, to: col + 1 }, layout.stickyWidth)
    paintGridlines(ctx, state, { from: row, to: row + 1 }, { from: col, to: col + 1 }, layout.stickyWidth)
    paintFixedArea(ctx, state)
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

/** 调宽 move：表头整幅 + 自该列视口左缘至画布右端竖带（A3 重绘表，左界=列左缘防加宽残影） */
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

/**
 * 绘制执行：setTransform DPR 直乘 → 分区管线 → lastPaint 统计。
 * region 为 null/undefined 时整幅绘制（clearRect 起点复位）。
 */
function paint (ctx, state, region) {
  const startedAt = performance.now()
  const { layout } = state
  const dpr = state.dpr || window.devicePixelRatio || FALLBACK_DPR
  const W = layout.stickyWidth
  const H = layout.stickyHeight

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 无 region 或空 region = 整幅；未识别的 region 形状按整幅兜底（正确性优先）
  const isFullPaint = !region ||
    (region.header !== true && region.rows == null && region.cols == null &&
      region.cell == null && region.colFrom == null)

  let stats = null

  if (isFullPaint) {
    ctx.clearRect(0, 0, W, H)
    paintCellRange(ctx, state, viewRowsRange(layout), viewColsRange(layout), layout.stickyWidth)
    paintGridlines(ctx, state, viewRowsRange(layout), viewColsRange(layout), W)
    paintFixedArea(ctx, state)
    paintHeader(ctx, state)
    paintOverlay(ctx, state)
    stats = windowStats(layout)
  } else if (region.header) {
    paintHeaderPass(ctx, state)
    stats = { rowStart: 0, rowEnd: 0, rowCount: 0, colStart: layout.viewCols.start, colEnd: layout.viewCols.end }
  } else if (region.rows) {
    stats = paintRowBand(ctx, state, region.rows)
  } else if (region.cols) {
    stats = paintColBand(ctx, state, region.cols)
  } else if (region.cell) {
    stats = paintCellRegion(ctx, state, region.cell)
  } else if (region.colFrom != null) {
    stats = paintResizeBand(ctx, state, region.colFrom)
  }

  if (stats) stats.elapsed = performance.now() - startedAt

  // 条目命中集合窗口裁剪（A3.3）：按当前可视窗口行 [start, end) 删除窗口外行
  if (state.itemHits) trimItemHits(state.itemHits, layout.viewRows)

  return stats
}

/** 整幅绘制入口（A2）：返回 lastPaint 统计 { rowStart, rowEnd, rowCount, colStart, colEnd, elapsed } */
export function draw (ctx, state) {
  return paint(ctx, state, null)
}

/** 脏区绘制入口（A3 重绘表）：region 形状见模块头注释，返回本次实际绘制统计（未绘制返回 null） */
export function drawRegion (ctx, state, region) {
  return paint(ctx, state, region)
}

/** region 是否落在当前可视窗口内（img onload → invalidateCell 前的行窗口校验等） */
function isRegionPaintable (state, region) {
  if (!region) return true

  const { layout } = state

  if (region.header) return true

  if (region.colFrom != null) {
    return region.colFrom >= 0 && region.colFrom < layout.colWidths.length
  }

  const rows = layout.viewRows

  if (region.rows) {
    return region.rows[1] > rows.start && region.rows[0] < rows.end
  }

  if (region.cols) {
    return region.cols[1] > 0 && region.cols[0] < layout.colWidths.length
  }

  if (region.cell) {
    const { row, col } = region.cell
    const cols = layout.viewCols

    return row >= rows.start && row < rows.end &&
      (col < layout.fixedCount || (col >= cols.start && col < cols.end))
  }

  return false
}

/**
 * 有状态绘制器：draw 记录最近 state，invalidate 系列以 rAF 合帧异步重绘
 * （同帧多区域合并为整幅，正确性优先）；img 列图片异步加载完成后经
 * invalidateCell 联动重绘，行已滚出窗口则自动跳过（02-design.md 风险表）。
 *
 * - draw(state)                        同步整幅，返回 lastPaint；取消挂起中的脏区任务
 * - invalidate(region, { immediate, state })
 *                                      受理返回 true：immediate 同步重绘（并更新基线 state），
 *                                      否则入队 rAF 合帧；state 缺省用最近一次 draw 的 state
 *                                      （组件以持久 state 对象原地变更后调用即可）
 * - invalidateRow(row) / invalidateCell(row, col)
 *                                      行不在当前窗口（或格不在可视列空间）返回 false 不重绘
 * - lastPaint                          最近一次绘制统计（getLayoutInfo 断言来源）
 * - dispose()                          取消挂起 rAF、清空队列
 */
export function createPainter ({ canvas } = {}) {
  const ctx = canvas?.getContext?.('2d')

  if (!ctx) throw new TypeError('createPainter: 需要有效的 canvas 元素')

  let lastState = null
  let last = null
  let rafId = 0
  const pending = []

  // img onload 联动：接管 state.onImageLoad → invalidateCell（行窗口校验在 invalidate 内）
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

      if (!base || !isRegionPaintable(base, region)) return false

      if (immediate) return apply(base, region) != null

      pending.push(region)
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
