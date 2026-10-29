/** table-ex 行几何策略（02-design.md A2.2/A2.3）：等高/变高双模式统一接口，
    painter / layout / interactions / editor 全部经几何接口取行坐标，不感知模式 */
import { estimateLineCount, wrapLines, cellFontOf } from './text-wrap'
import { CELL_PADDING_FALLBACK } from './constants'
import { spanHeightRoleOf } from './spans'

// uniform：O(1) 算式（topAt = i×h、visibleRange 与 layout.computeViewRows 恒等）；
// variable：Float64Array + 内部 Fenwick 树（前缀和/单点加/偏移定位 O(log n)）

// 行高来源 = 主动计算（A2.2）：computeRowHeights 全量快速估高（O(n) 纯算术，文本列
// 数组值 /link 条目计数真值、字符串估 1 行下界）+ ensureRowMeasured 进窗精算（wrapLines
// 折行 + maxLines 钳制）；measure/wrapCache 经参数注入，与绘制折行同函数同缓存

/** 主题快照缺字段时的容错回退（与 --row-height / --cell-line-height 缺省一致） */
const ROW_HEIGHT_FALLBACK = 36
const LINE_HEIGHT_FALLBACK = 18
const FONT_SIZE_FALLBACK = 14

const DEFAULT_MAX_ITEMS = 10

/** 图形/条目列类型（pill/方块/图片/轨道，不产生可折行文本；数组值横排呈现不触发
    变高模式）。成员按渲染形态判定而非实际行数——文本输出列（text/number/bool/
    date/rec_no/...）即使缺省单行也不入此表，其数组值按每元素一行呈现、可触发变高 */
const GRAPHIC_ITEM_TYPES = new Set(['tag', 'button', 'check', 'img', 'image', 'progress'])

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** link 条目列判定（render 产物计数决定行数） */
function isLinkColumn (col) {
  return col.type === 'link'
}

/** 文本呈现列判定（text/date/bool/.../无 type/自定义 text 输出，不含 link 与图形/条目列） */
function isTextPresentingColumn (col) {
  if (isLinkColumn(col)) return false

  return typeof col.type === 'string' ? !GRAPHIC_ITEM_TYPES.has(col.type) : true
}

function cellFontSizeOf (theme) {
  return theme?.fontSize || FONT_SIZE_FALLBACK
}

function contentWidthOf (colWidth, padding, inset) {
  return (colWidth || 0) - padding * 2 - inset
}

function resolveMaxLinesOf (col, record) {
  if (typeof col._resolveMaxLines === 'function') return col._resolveMaxLines(record)
  if (col._maxLines != null) return col._maxLines

  return 1
}

/** 字段取值（resolveCellContent 同款链），映射列经 _mapText 按显示文本取值
    （估高/精算与绘制同源）；数组原值穿透，数组路径不受影响 */
function valueOf (col, record) {
  const fromFn = typeof col._value === 'function' ? col._value(record) : undefined
  const value = fromFn ?? (col.field ? record?.[col.field] : undefined)

  if (col._mapText) {
    const mapped = col._mapText(value)

    if (mapped != null) return mapped
  }

  return value
}

function linkItemCountOf (col, record, recordNumber, value, emit, maxItems) {
  const rendered = col._render?.({ record, recordNumber, value, emit })
  const count = Array.isArray(rendered?.items)
    ? rendered.items.length
    : (rendered ? 1 : 0)

  return Math.min(count, maxItems)
}

/** 文本精算行数：estimateLineCount 短路（len × fontSize ≤ width → 1，无测量） */
function measuredLineCountOf (text, width, font, fontSize, measure, wrapCache, maxLines) {
  if (estimateLineCount({ text, fontSize, maxWidth: width }) === 1) return 1
  if (typeof measure !== 'function') return 1

  return wrapLines({ text, font, maxWidth: width, measure, cache: wrapCache, maxLines }).lineCount
}

/** 文本列行数：空值 0；单行省略与估高恒 1 行（下界），precise 时走精算 */
function textLineCountOf (col, record, value, width, precise, font, fontSize, measure, wrapCache) {
  const text = value == null ? '' : String(value)

  if (!text) return 0

  const maxLines = resolveMaxLinesOf(col, record)

  // 单行省略（含 maxLines == 1）：恒 1 行，不参与变高
  if (!(maxLines > 1)) return 1

  // 估高：字符串一律估 1 行（下界），标记待精
  if (!precise) return 1

  return measuredLineCountOf(text, width, font, fontSize, measure, wrapCache, maxLines)
}

/** 单列行数求值（A2.2 列级展开）：link 条目列 render 计数（数组值同样经 render，
    与绘制及 linkOption.max 截断同口径）；文本呈现列数组值按每元素一行
    （min(length, maxItems)，与 drawArrayLines 同口径）；图形/条目列数组值横排
    呈现恒 1 行（drawItems 不换行，超出右缘丢弃）；其余走 textLineCountOf */
function columnLineCount ({
  col,
  record,
  recordNumber,
  value,
  width,
  precise,
  font,
  fontSize,
  measure,
  wrapCache,
  emit
}) {
  const maxItems = col._maxItems ?? DEFAULT_MAX_ITEMS

  if (isLinkColumn(col)) return linkItemCountOf(col, record, recordNumber, value, emit, maxItems)

  if (Array.isArray(value)) {
    return isTextPresentingColumn(col) ? Math.min(value.length, maxItems) : 1
  }

  return textLineCountOf(col, record, value, width, precise, font, fontSize, measure, wrapCache)
}

function rowHeightOf (lines, { rowHeight, padding, lineHeight }) {
  return Math.max(rowHeight, padding * 2 + lines * lineHeight)
}

function rowMetricsOf (theme) {
  return {
    rowHeight: theme?.rowHeight || ROW_HEIGHT_FALLBACK,
    padding: theme?.cellPadding || CELL_PADDING_FALLBACK,
    lineHeight: theme?.cellLineHeight || LINE_HEIGHT_FALLBACK
  }
}

/** 树形列 inset（treeIndents(colIndex, row) 回调；无树传 null/undefined 零成本） */
function insetOf (treeIndents, colIndex, row) {
  return treeIndents ? treeIndents(colIndex, row) || 0 : 0
}

// —— Fenwick 树（BIT，Float64Array；A2.3 选型） ——

function buildFenwick (values) {
  const n = values.length
  const tree = new Float64Array(n + 1)

  for (let i = 1; i <= n; i++) {
    tree[i] += values[i - 1]
    const parent = i + (i & -i)

    if (parent <= n) tree[parent] += tree[i]
  }

  return tree
}

function createFenwick (values) {
  const n = values.length
  let tree = buildFenwick(values)
  // 倍增下降的最高 2 幂
  let power = 1

  while (power * 2 <= n) power *= 2

  return {
    add (index, delta) {
      for (let k = index + 1; k <= n; k += k & -k) tree[k] += delta
    },
    /** 前 count 项和（count = 行数） */
    prefix (count) {
      let sum = 0

      for (let k = Math.min(count, n); k > 0; k -= k & -k) sum += tree[k]

      return sum
    },
    /** 偏移定位（倍增下降）：前 pos 项和 ≤ offset 的最大 pos（∈ [0, n]） */
    findRowAtOffset (offset) {
      let pos = 0
      let remaining = offset

      for (let step = power; step > 0; step >>= 1) {
        const next = pos + step

        if (next <= n && tree[next] <= remaining) {
          pos = next
          remaining -= tree[next]
        }
      }

      return pos
    },
    rebuild (nextValues) {
      tree = buildFenwick(nextValues)
    }
  }
}

/** 等高行几何（O(1) 算式；visibleRange 与 layout.computeViewRows 算式恒等） */
export function createUniformRowGeometry ({ rowHeight, rowCount }) {
  const h = rowHeight
  let count = rowCount

  return {
    mode: 'uniform',

    get rowCount () {
      return count
    },

    heightAt () {
      return h
    },

    topAt (i) {
      return i * h
    },

    bottomAt (i) {
      return (i + 1) * h
    },

    get totalHeight () {
      return count * h
    },

    offsetToRow (contentY) {
      if (!(h > 0)) return 0

      return Math.floor(Math.max(0, contentY ?? 0) / h)
    },

    visibleRange (scrollTop = 0, viewH = 0, overscan = 0) {
      if (!(h > 0) || !(count > 0)) return { start: 0, end: 0, count: 0 }

      const start = clamp(Math.floor(scrollTop / h), 0, count)
      const end = clamp(Math.ceil((scrollTop + viewH) / h) + overscan, start, count)

      return { start, end, count: end - start }
    },

    /** 等高模式行高不可变：no-op 返回 0（接口对齐） */
    updateHeight () {
      return 0
    },

    /** 行集合变化后整体重建：仅行数变化，高度恒 rowHeight */
    rebuild (heights) {
      count = heights ? heights.length : 0
    }
  }
}

/** 变高行几何（Float64Array + Fenwick：topAt/offsetToRow O(log n)、rebuild O(n)） */
export function createVariableRowGeometry ({ initialHeights } = {}) {
  let heights = Float64Array.from(initialHeights ?? [])
  const fenwick = createFenwick(heights)

  const geometry = {
    mode: 'variable',

    get rowCount () {
      return heights.length
    },

    heightAt (i) {
      return heights[i] ?? 0
    },

    topAt (i) {
      return i > 0 ? fenwick.prefix(i) : 0
    },

    bottomAt (i) {
      return geometry.topAt(i) + (heights[i] ?? 0)
    },

    get totalHeight () {
      return fenwick.prefix(heights.length)
    },

    offsetToRow (contentY) {
      if (!heights.length) return 0

      return fenwick.findRowAtOffset(Math.max(0, contentY ?? 0))
    },

    visibleRange (scrollTop = 0, viewH = 0, overscan = 0) {
      const n = heights.length

      if (!(n > 0)) return { start: 0, end: 0, count: 0 }

      const y = Math.max(0, scrollTop ?? 0)
      const first = fenwick.findRowAtOffset(y)
      const start = clamp(first - overscan, 0, n)

      // 从窗口首行累加至覆盖 viewH（end = 第一个 topAt ≥ scrollTop + viewH 的行）
      let end = first
      const target = y + Math.max(0, viewH ?? 0)

      while (end < n && geometry.topAt(end) < target) end++

      end = clamp(end + overscan, start, n)

      return { start, end, count: end - start }
    },

    /** 写 heights + Fenwick add(Δ)，返回 Δ（调用方累计锚定补偿） */
    updateHeight (i, h) {
      if (!(i >= 0) || i >= heights.length) return 0

      const delta = h - heights[i]

      if (delta) {
        heights[i] = h
        fenwick.add(i, delta)
      }

      return delta
    },

    /** 行集合变化后整体重建 O(n)（records 替换 / 树展开收起 / 调宽失效重估） */
    rebuild (nextHeights) {
      heights = Float64Array.from(nextHeights ?? [])
      fenwick.rebuild(heights)
    }
  }

  return geometry
}

/** 滚动锚定补偿：精算回填导致锚行上方总高变化 Δ，scrollTop 同步 += Δ */
export function computeAnchorShift ({ prevTopAtAnchor, nextTopAtAnchor }) {
  return (nextTopAtAnchor ?? 0) - (prevTopAtAnchor ?? 0)
}

function columnAt (cols, i) {
  return cols[i] ?? {}
}

/** 模式判定输入（A2.2）：文本呈现列数组值 / link 条目数 > 1（计数结果复用） */
function indicatesVariableMode (col, value, count) {
  return (Array.isArray(value) && isTextPresentingColumn(col)) || (isLinkColumn(col) && count > 1)
}

/** 区域宽（rowspan === 1 的 colspan 主格按区域宽参与本行，§5.6） */
function regionWidthOf (region, widths) {
  let sum = 0

  for (let c = region.colFrom; c < region.colTo; c++) sum += widths[c] || 0

  return sum
}

/** 全量快速估高（A2.2 管线 1，O(n) 纯算术无测量）：文本列数组值/link 条目列取
    真值（图形/条目列数组值恒 1 行），字符串列估 1 行下界；同时产出
    hasArrayValues（模式判定输入）。spans（§5.6 分层数据链，缺省 null 零成本）：
    covered 格与 rowspan>1 主格整格排除（不参与行高，也不得触发 hasArrayValues
    变高模式升级），rowspan===1 的 colspan 主格按区域宽参与 */
export function computeRowHeights ({
  records,
  columns,
  colWidths,
  theme,
  measure,
  wrapCache,
  treeIndents,
  spans
} = {}) {
  const list = records ?? []
  const cols = columns ?? []
  const widths = colWidths ?? []
  const metrics = rowMetricsOf(theme)
  const font = cellFontOf(theme)
  const fontSize = cellFontSizeOf(theme)
  const heights = new Array(list.length)
  let hasArrayValues = false

  for (let row = 0; row < list.length; row++) {
    const record = list[row]
    let lines = 0

    for (let i = 0; i < cols.length; i++) {
      const col = columnAt(cols, i)

      // 合并分层（§5.6）：'excluded'（covered 格 / rowspan>1 主格）整格跳过——
      // 不参与行高、其数组值也不得触发变高模式升级；region（rowspan===1 的
      // colspan 主格）按区域宽参与
      const spanRole = spans ? spanHeightRoleOf(spans, row, i) : null

      if (spanRole === 'excluded') continue

      const value = valueOf(col, record)
      const count = columnLineCount({
        col,
        record,
        recordNumber: row,
        value,
        width: contentWidthOf(
          spanRole ? regionWidthOf(spanRole, widths) : widths[i],
          metrics.padding,
          insetOf(treeIndents, i, row)
        ),
        precise: false,
        font,
        fontSize,
        measure,
        wrapCache,
        emit: undefined
      })

      if (count > lines) lines = count

      // 模式判定输入（命中后不再重复判定）
      if (!hasArrayValues) hasArrayValues = indicatesVariableMode(col, value, count)
    }

    heights[row] = rowHeightOf(lines, metrics)
  }

  return { heights, hasArrayValues }
}

/** 单行精算（A2.2 管线 2，进窗逐行调用）：estimateLineCount 短路 → wrapLines
    折行 + maxLines 钳制；与绘制共用同一 wrapLines + wrapCache，行高与折行一致。
    spans（§5.6 分层数据链，缺省 null 零成本）：covered 格与 rowspan>1 主格排除，
    rowspan===1 的 colspan 主格按区域宽折行（row 须为该行在行集合中的真实下标） */
export function ensureRowMeasured ({
  record,
  recordNumber = 0,
  columns,
  colWidths,
  theme,
  measure,
  wrapCache,
  treeIndents,
  row = 0,
  spans
} = {}) {
  const cols = columns ?? []
  const widths = colWidths ?? []
  const metrics = rowMetricsOf(theme)
  const font = cellFontOf(theme)
  const fontSize = cellFontSizeOf(theme)
  let lines = 0

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i] ?? {}
    const spanRole = spans ? spanHeightRoleOf(spans, row, i) : null

    if (spanRole === 'excluded') continue

    const width = contentWidthOf(
      spanRole ? regionWidthOf(spanRole, widths) : widths[i],
      metrics.padding,
      insetOf(treeIndents, i, row)
    )
    const count = columnLineCount({
      col,
      record,
      recordNumber,
      value: valueOf(col, record),
      width,
      precise: true,
      font,
      fontSize,
      measure,
      wrapCache,
      emit: undefined
    })

    if (count > lines) lines = count
  }

  return rowHeightOf(lines, metrics)
}
