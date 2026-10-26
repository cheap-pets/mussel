/**
 * canvas-table 行几何策略（02-design.md A2.2 / A2.3，评审 6 P6/P8）。
 *
 * 等高/变高双模式统一接口：painter / layout / interactions / editor 全部经
 * 几何接口取行坐标，不感知模式。
 * - uniform：O(1) 算式，visibleRange 与 layout.computeViewRows 恒等（现状路径）；
 * - variable：Float64Array + 内部 Fenwick 树（前缀和/单点加/偏移定位 O(log n)）。
 *
 * 行高来源 = 主动计算（A2.2）：computeRowHeights 全量快速估高（O(n) 纯算术，
 * 数组值/link 条目计数真值、字符串估 1 行下界）+ ensureRowMeasured 进窗精算
 * （wrapLines 折行 + maxLines 钳制）。measure/wrapCache 经参数注入（theme.js
 * createTextMeasurer 工厂产物），行高计算与绘制折行同一函数同一缓存。
 */
import { estimateLineCount, wrapLines } from './text-wrap'

/** 主题快照缺字段时的容错回退（与 --row-height / --cell-padding / --cell-line-height 缺省一致） */
const ROW_HEIGHT_FALLBACK = 36
const PADDING_FALLBACK = 8
const LINE_HEIGHT_FALLBACK = 18
const FONT_SIZE_FALLBACK = 14
const FONT_FAMILY_FALLBACK = 'sans-serif'

/** maxItems 缺省上限（人工 2 意见 2：缺省 10） */
const DEFAULT_MAX_ITEMS = 10

/** 树形列缩进常量（镜像 tree.scss --mu-tree_node-indent: 16px；组件探针不可达取常量） */
export const TREE_INDENT = 16

/**
 * 恒单行高的列类型（图形/条目列，不参与多行行高；A3.5 列分类）。
 * link 为条目列但行数 = 条目数，单独走 render 计数路径。
 */
const SINGLE_LINE_TYPES = new Set(['tag', 'button', 'check', 'img', 'image', 'progress', 'rec_no'])

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** link 条目列判定（render 产物计数决定行数；A3.5） */
function isLinkColumn (col) {
  return col.type === 'link'
}

/** 文本呈现列判定（text/enum/date/.../无 type/自定义 text 输出，不含 link 与恒单行图形列；A2.2/A3.5 列分类） */
function isTextPresentingColumn (col) {
  if (isLinkColumn(col)) return false

  return typeof col.type === 'string' ? !SINGLE_LINE_TYPES.has(col.type) : true
}

function cellFontOf (theme) {
  const fontSize = theme?.fontSize || FONT_SIZE_FALLBACK

  return { font: `${fontSize}px ${theme?.fontFamily || FONT_FAMILY_FALLBACK}`, fontSize }
}

/** 单列内容区宽（列宽 − 2×padding − 树形列 inset；实施约束 6） */
function contentWidthOf (colWidth, padding, inset) {
  return (colWidth || 0) - padding * 2 - inset
}

function resolveMaxLinesOf (col, record) {
  if (typeof col._resolveMaxLines === 'function') return col._resolveMaxLines(record)
  if (col._maxLines != null) return col._maxLines

  return 1
}

/** 字段取值（resolveCellContent 同款：_value(record) ?? record[field]） */
function valueOf (col, record) {
  const fromFn = typeof col._value === 'function' ? col._value(record) : undefined

  return fromFn ?? (col.field ? record?.[col.field] : undefined)
}

/**
 * 单列行数求值（A2.2 行高公式的列级展开）。
 *
 * @returns {Number} 行数（0 = 无内容）
 */
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

  // 数组值（文本呈现列）：每元素一行，min(length, maxItems) 真值，不测量
  if (Array.isArray(value)) return Math.min(value.length, maxItems)

  // link 条目列：render 求值 items 计数（轻量数组构造，与绘制期同款调用）后 min(count, maxItems)
  if (isLinkColumn(col)) {
    const rendered = col._render?.({ record, recordNumber, value, emit })
    const count = Array.isArray(rendered?.items)
      ? rendered.items.length
      : (rendered ? 1 : 0)

    return Math.min(count, maxItems)
  }

  const text = value == null ? '' : String(value)

  if (!text) return 0

  const maxLines = resolveMaxLinesOf(col, record)

  // 单行省略（含 maxLines == 1）：恒 1 行，不参与变高
  if (!(maxLines > 1)) return 1

  // 估高：字符串一律估 1 行（下界；短路命中即真值——两者数值相同），标记待精
  if (!precise) return 1

  // 精算：estimateLineCount 短路（len × fontSize ≤ width → 1，无测量），否则 wrapLines 精算
  if (estimateLineCount({ text, fontSize, maxWidth: width }) === 1) return 1
  if (typeof measure !== 'function') return 1

  return wrapLines({ text, font, maxWidth: width, measure, cache: wrapCache, maxLines }).lineCount
}

/** 单行行高（行数 → max(基础行高, padding×2 + lines×lineHeight)；A6.2） */
function rowHeightOf (lines, { rowHeight, padding, lineHeight }) {
  return Math.max(rowHeight, padding * 2 + lines * lineHeight)
}

function rowMetricsOf (theme) {
  return {
    rowHeight: theme?.rowHeight || ROW_HEIGHT_FALLBACK,
    padding: theme?.cellPadding || PADDING_FALLBACK,
    lineHeight: theme?.cellLineHeight || LINE_HEIGHT_FALLBACK
  }
}

/** 树形列 inset（treeIndents(colIndex, row) 回调；无树传 null/undefined 零成本） */
function insetOf (treeIndents, colIndex, row) {
  return treeIndents ? treeIndents(colIndex, row) || 0 : 0
}

// —— Fenwick 树（BIT，Float64Array；A2.3 选型） ——

/** O(n) 构建：tree[i] 管辖区间和由子节点累加 */
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

/**
 * 等高行几何（O(1) 算式；topAt(i)=i×h、offsetToRow=floor(y/h)、
 * visibleRange 与 layout.computeViewRows 算式恒等——02-design.md A2.2）。
 */
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

    /** 行集合变化（records 替换 / 树 toggle）后整体重建：仅行数变化，高度恒 rowHeight */
    rebuild (heights) {
      count = heights ? heights.length : 0
    }
  }
}

/**
 * 变高行几何（Float64Array + Fenwick：topAt/totalHeight/offsetToRow O(log n)、
 * updateHeight 单点加 O(log n) 返回 Δ、rebuild O(n)；02-design.md A2.2/A2.3）。
 */
export function createVariableRowGeometry ({ initialHeights } = {}) {
  let heights = Float64Array.from(initialHeights ?? [])
  let fenwick = createFenwick(heights)

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

/**
 * 滚动锚定补偿：精算回填导致锚行上方总高变化 Δ = 新 topAt − 旧 topAt，
 * scrollTop += Δ 同步写入（A2.2 管线 4；Δ 按锚行上方合计一次补偿）。
 */
export function computeAnchorShift ({ prevTopAtAnchor, nextTopAtAnchor }) {
  return (nextTopAtAnchor ?? 0) - (prevTopAtAnchor ?? 0)
}

/**
 * 全量快速估高（A2.2 管线 1，O(n) 纯算术无测量）：
 * - 数组值列 → min(length, maxItems) 真值；
 * - link 条目列 → render 求值计数后 min(count, maxItems) 真值；
 * - 字符串值列 → 估 1 行（下界，进窗后 ensureRowMeasured 精算）。
 * 本遍同时产出 hasArrayValues（uniform/variable 模式判定输入）。
 *
 * @param {Object} params
 * @param {Array} params.records 行记录（树模式 = 平铺行数组）
 * @param {Array} params.columns 已准备内部列（含 _value/_render/_maxLines/_maxItems/_resolveMaxLines）
 * @param {Number[]} params.colWidths 列宽数组
 * @param {Object} [params.theme] 主题快照（rowHeight/cellPadding/cellLineHeight/fontSize/fontFamily）
 * @param {Function} [params.measure] 测量回调（估高路径不测量，透传保留签名一致）
 * @param {Object} [params.wrapCache] 折行缓存（估高路径不消费）
 * @param {Function} [params.treeIndents] 树形列缩进回调 (colIndex, row) => px（评审 6 P8）
 * @returns {{ heights: Number[], hasArrayValues: Boolean }}
 */
export function computeRowHeights ({
  records,
  columns,
  colWidths,
  theme,
  measure,
  wrapCache,
  treeIndents
} = {}) {
  const list = records ?? []
  const cols = columns ?? []
  const widths = colWidths ?? []
  const metrics = rowMetricsOf(theme)
  const { font, fontSize } = cellFontOf(theme)
  const heights = new Array(list.length)
  let hasArrayValues = false

  for (let row = 0; row < list.length; row++) {
    const record = list[row]
    let lines = 0

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i] ?? {}
      const value = valueOf(col, record)
      const width = contentWidthOf(widths[i], metrics.padding, insetOf(treeIndents, i, row))
      const count = columnLineCount({
        col,
        record,
        recordNumber: row,
        value,
        width,
        precise: false,
        font,
        fontSize,
        measure,
        wrapCache,
        emit: undefined
      })

      if (count > lines) lines = count

      // 模式判定输入（A2.2）：文本呈现列（不含 link）数组值 / link 条目数 > 1
      // （link 复用计数结果，不重复调用 render——render 为轻量数组构造但仍应单次）
      if (!hasArrayValues) {
        if (Array.isArray(value) && isTextPresentingColumn(col)) {
          hasArrayValues = true
        } else if (isLinkColumn(col) && count > 1) {
          hasArrayValues = true
        }
      }
    }

    heights[row] = rowHeightOf(lines, metrics)
  }

  return { heights, hasArrayValues }
}

/**
 * 单行精算（A2.2 管线 2，进窗逐行调用）：待精字符串经 estimateLineCount 短路
 * （无测量）→ wrapLines 折行 + maxLines 钳制得精确行数，返回精确行高。
 * 与绘制共用同一 wrapLines + wrapCache，行高与折行必然一致。
 *
 * @param {Object} params
 * @param {Object} params.record 行记录
 * @param {Number} [params.recordNumber=0] 平铺行号（render recordNumber 透传）
 * @param {Array} params.columns 已准备内部列
 * @param {Number[]} params.colWidths 列宽数组
 * @param {Object} [params.theme] 主题快照
 * @param {Function} [params.measure] 测量回调（theme.js createTextMeasurer 产物）
 * @param {Object} [params.wrapCache] 折行缓存
 * @param {Function} [params.treeIndents] 树形列缩进回调 (colIndex, row) => px
 * @param {Number} [params.row=0] 行号（treeIndents 回调入参）
 * @returns {Number} 精确行高 px
 */
export function ensureRowMeasured ({
  record,
  recordNumber = 0,
  columns,
  colWidths,
  theme,
  measure,
  wrapCache,
  treeIndents,
  row = 0
} = {}) {
  const cols = columns ?? []
  const widths = colWidths ?? []
  const metrics = rowMetricsOf(theme)
  const { font, fontSize } = cellFontOf(theme)
  let lines = 0

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i] ?? {}
    const width = contentWidthOf(widths[i], metrics.padding, insetOf(treeIndents, i, row))
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
