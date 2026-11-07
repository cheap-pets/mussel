/** table-ex 行几何策略：等高/变高双模式统一接口，painter / layout /
    interactions / editor 全部经几何接口取行坐标，不感知模式 */
import { estimateLineCount, wrapLines, cellFontOf } from '../shared/text-wrap'
import { CELL_PADDING_FALLBACK } from '../shared/constants'
import { spanHeightRoleOf } from '../spans/spans'
import { createFenwick } from './fenwick'

/** 主题快照缺字段时的容错回退（与 --row-height / --cell-line-height 缺省一致） */
const ROW_HEIGHT_FALLBACK = 36
const LINE_HEIGHT_FALLBACK = 18
const FONT_SIZE_FALLBACK = 14

const DEFAULT_MAX_ITEMS = 10

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** link/list 条目列判定（行数来自 render 产物计数；link 为委托 list 的兼容壳，
    col.type 字符串保持不变） */
function isLinkColumn (col) {
  return col.type === 'link' || col.type === 'list'
}

/** 条目列判定导出别名（表级短路谓词消费；实现同 isLinkColumn） */
export const isEntryColumn = isLinkColumn

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

/** 字段取值（resolveCellContent 同款链，估高/精算与绘制同源）：映射列经
    _mapText 按显示文本取值（mapper 返回对象取 .text）；数组原值穿透 */
function valueOf (col, record) {
  const fromFn = typeof col._value === 'function' ? col._value(record) : undefined
  const value = fromFn ?? (col.field ? record?.[col.field] : undefined)

  if (col._mapText) {
    const mapped = col._mapText(value)

    if (mapped != null) return mapped.text
  }

  return value
}

function linkItemCountOf (col, record, recordNumber, value, emit, maxItems) {
  // 计数通道：compile canvas 产物附加 .count（与渲染共享闭包，语义 =
  // items.length 免构建等价）——估高/进窗精算/编辑单行重估三条路径共用本
  // 函数。自定义类型/手写 _render 无 .count → 回落全产物路径
  if (typeof col._render?.count === 'function') {
    return Math.min(col._render.count(record, value) || 0, maxItems)
  }

  const rendered = col._render?.({ record, recordNumber, value, emit })
  const count = Array.isArray(rendered?.items)
    ? rendered.items.length
    : (rendered ? 1 : 0)

  return Math.min(count, maxItems)
}

// 图形列清单：估高行数恒 1、免 valueOf（tag/check/img/icon 横排、progress/
// button 走 canvas 专属绘制，均单行垂直居中不折行）；不含条目列 link/list；
// 数组值横排呈现恒 1 行，不参与变高模式判定
const GRAPHIC_ITEM_TYPES = new Set(['tag', 'button', 'check', 'img', 'image', 'progress', 'icon'])

/** 列级估高描述表（循环前预计算）：isEntry = link/list 条目列；graphicItem =
    图形呈现列（估高行数恒 1，免 valueOf）；maxItems 仅条目列消费 */
function estimateColumnDescOf (col) {
  const isEntry = isLinkColumn(col)
  const graphicItem =
    !isEntry && typeof col.type === 'string' && GRAPHIC_ITEM_TYPES.has(col.type)

  return { isEntry, graphicItem, maxItems: col._maxItems ?? DEFAULT_MAX_ITEMS }
}

/** 文本精算行数：estimateLineCount 短路（len × fontSize ≤ width → 1，无测量） */
function measuredLineCountOf (text, width, font, fontSize, measure, wrapCache, maxLines) {
  if (estimateLineCount({ text, fontSize, maxWidth: width }) === 1) return 1
  if (typeof measure !== 'function') return 1

  return wrapLines({ text, font, maxWidth: width, measure, cache: wrapCache, maxLines }).lineCount
}

/** 文本列行数：空值 0；单行省略与估高恒 1 行（下界），precise 时走精算。
    估高提前于 maxLines 求值（_resolveMaxLines/lineClamp 回调不被消费，仅省
    回调次数）；条目列与数组路径不经本函数（columnLineCount 先行返回） */
function textLineCountOf (col, record, value, width, precise, font, fontSize, measure, wrapCache) {
  const text = value == null ? '' : String(value)

  if (!text) return 0

  if (!precise) return 1

  const maxLines = resolveMaxLinesOf(col, record)

  if (!(maxLines > 1)) return 1

  return measuredLineCountOf(text, width, font, fontSize, measure, wrapCache, maxLines)
}

/** 单列行数求值：link/list 条目列 render 计数（数组值同样经 render，与绘制及
    listOption.max 截断同口径）；其余列数组值恒 1 行（渲染门控落占位，渲染链路
    不再逐元素拆行）；其余走 textLineCountOf */
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

  if (Array.isArray(value)) return 1

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

      // end = 第一个 topAt ≥ scrollTop + viewH 的行：从窗口首行按 heights 直加
      // 至覆盖 viewH（O(window) 直加，与 Fenwick 分组求和仅 ~1e-15 末位浮点差，
      // 整数高度精确一致）
      let end = first
      const target = y + Math.max(0, viewH ?? 0)
      let acc = geometry.topAt(first)

      while (end < n && acc < target) {
        acc += heights[end]
        end++
      }

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

/** 模式判定输入：仅 link/list 条目数 > 1（文本列数组值不再拆行）；hasArrayValues
    语义随之收窄：true = 存在 link/list 多条目格 */
function indicatesVariableMode (col, value, count) {
  return isLinkColumn(col) && count > 1
}

/** 区域宽（rowspan === 1 的 colspan 主格按区域宽参与本行） */
function regionWidthOf (region, widths) {
  let sum = 0

  for (let c = region.colFrom; c < region.colTo; c++) sum += widths[c] || 0

  return sum
}

/** 全量快速估高（O(n) 纯算术无测量）：link/list 条目列取真值，其余列数组值
    恒 1 行、字符串列估 1 行下界；同时产出 hasArrayValues（模式判定输入，
    true = 存在 link/list 多条目格）。估高对文本内容与宽度零消费——图形列免
    valueOf、列级描述表预计算、宽/inset 免算，measure/wrapCache/colWidths/
    treeIndents 仅保留入参兼容（precise 精算路径不经此处）。spans 分层数据链
    （缺省 null 零成本）：covered 格与 rowspan>1 主格整格排除（不参与行高，
    也不得触发变高模式升级） */
// 每行热路径：拆分引入参数打包与调用开销，复杂度收益低于回归风险
// eslint-disable-next-line complexity
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
  const metrics = rowMetricsOf(theme)
  const descs = cols.map(estimateColumnDescOf)
  const heights = new Array(list.length)
  let hasArrayValues = false

  // 免取值 fast path：度量满足 rowHeight ≥ 2×padding + lineHeight（缺省 36 ≥ 34）
  // 时非条目列 count ∈ {0, 1} 两值行高等价（rowHeightOf 的 max 项被 rowHeight
  // 覆盖），跳过 valueOf（_value 回调不执行）；不满足走逐格取值。判定与
  // rowHeightOf/rowMetricsOf 同源——行高公式或度量变量含义变化时须同批修改
  const flat = metrics.rowHeight >= metrics.padding * 2 + metrics.lineHeight

  for (let row = 0; row < list.length; row++) {
    const record = list[row]
    let lines = 0

    for (let i = 0; i < cols.length; i++) {
      const col = columnAt(cols, i)

      const spanRole = spans ? spanHeightRoleOf(spans, row, i) : null

      if (spanRole === 'excluded') continue

      const desc = descs[i]
      let count
      let value

      if (desc.graphicItem) {
        // 行数恒 1：与空值计数 0 在 rowHeight ≥ 2×padding + lineHeight 配置下
        // 等价（默认主题 36 ≥ 34），免 valueOf（_value 回调不执行）
        count = 1
      } else if (desc.isEntry) {
        // 条目列：render 计数真值（估高/精算同路径，不折行）
        value = valueOf(col, record)
        count = linkItemCountOf(col, record, row, value, undefined, desc.maxItems)
      } else if (flat) {
        // flat 免取值：非条目列 count 记 0（与 1 在 flat 度量下行高等价）、
        // 免 valueOf；非条目列 hasArrayValues 恒 false（indicatesVariableMode
        // 仅 link/list 列为真），模式判定不受影响
        count = 0
      } else {
        // 非条目列内联三分支（与 columnLineCount !precise 路径等价，免
        // textLineCountOf/resolveMaxLinesOf 求值）：数组恒 1 行、空值 0、
        // 非空 1（估高下界）；文本列 _value 仍必须执行（数组占位与空值判定）
        value = valueOf(col, record)
        count = Array.isArray(value)
          ? 1
          : (value == null || String(value) === '' ? 0 : 1)
      }

      if (count > lines) lines = count

      if (!hasArrayValues) hasArrayValues = indicatesVariableMode(col, value, count)
    }

    heights[row] = rowHeightOf(lines, metrics)
  }

  return { heights, hasArrayValues }
}

/** 单行精算（进窗逐行调用）：estimateLineCount 短路 → wrapLines 折行 +
    maxLines 钳制；与绘制共用同一 wrapLines + wrapCache，行高与折行一致。
    spans 分层（缺省 null 零成本）：covered 格与 rowspan>1 主格排除，
    rowspan===1 的 colspan 主格按区域宽折行（row 须为行集合中的真实下标） */
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
