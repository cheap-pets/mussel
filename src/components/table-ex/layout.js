/** table-ex 布局计算（02-design.md A2/A3/A5）：全纯函数，不持状态、不触 DOM、不写回入参 */
import { getPixelNumber } from '../table/utils'
import { resolveColumnType } from '../table/column-types'

/** 滚动虚拟窗口上下各多绘的行数（02-design.md A3） */
export const OVERSCAN = 2

/** 调宽手柄命中距离：距列缘 <= 4px（02-design.md A5） */
export const RESIZE_HANDLE = 4

// 预设类型默认宽度与最小宽度双值表（A3.2）。仅 table-ex 消费（不改
// table/column-types/*.js 的 width 字段）；仅在 solveWidths 弹性分支作初始宽与
// 最小宽基线，定宽链 widthOverrides ?? col.width ?? type.width 与 clamp 不动

// 无 type/空 type 列回退 text 条目；对象/函数自定义类型与未知类型字符串回退 _fallback
export const TYPE_DEFAULT_WIDTHS = {
  text: { width: 160, minWidth: 80 },
  number: { width: 100, minWidth: 60 },
  currency: { width: 110, minWidth: 60 },
  date: { width: 125, minWidth: 80 },
  datetime: { width: 160, minWidth: 100 },
  bool: { width: 60, minWidth: 40 },
  link: { width: 140, minWidth: 80 },
  tag: { width: 140, minWidth: 80 },
  img: { width: 80, minWidth: 40 },
  image: { width: 80, minWidth: 40 },
  progress: { width: 120, minWidth: 60 },
  button: { width: 140, minWidth: 80 },
  _fallback: { width: 80, minWidth: 40 }
}

/** 列类型名归一化：字符串 type（空串→text）/ 无 type → text；对象/函数自定义类型 → _fallback */
function typeNameOf (col) {
  if (typeof col.type === 'string') return col.type || 'text'

  return col.type == null ? 'text' : '_fallback'
}

/** 类型最小宽（评审 6 P2）：调宽拖拽下限缺省值；真正 clamp 位置在
    interactions.resolveResizeWidth，本模块不 clamp */
export function resolveTypeMinWidth (col) {
  return TYPE_DEFAULT_WIDTHS[typeNameOf(col)]?.minWidth
}

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** 列 key：widthOverrides / 调宽结果的定位键（组件壳生成 _key，兜底 col.key ?? 下标） */
function getColumnKey (col, index) {
  return col.key ?? col._key ?? index
}

// 定宽解析：widthOverrides[key] ?? col.width ?? type.width 取 px，可解析时 clamp
// 到 [min, max]，不可解析返回 null（转弹性分支）；覆盖值不可解析按未覆盖处理
function resolveFixedWidth (col, index, widthOverrides, min, max) {
  const overridePx = getPixelNumber(widthOverrides?.[getColumnKey(col, index)])
  const px = getPixelNumber(
    overridePx != null ? overridePx : col.width ?? resolveColumnType(col.type).width
  )

  return px != null ? clamp(px, min, max) : null
}

/** 弹性初始宽（A3.2）：类型默认宽 clamp 到 [min ?? 类型 minWidth, max] */
function resolveFlexWidth (col, min, max) {
  const base = TYPE_DEFAULT_WIDTHS[typeNameOf(col)] ?? TYPE_DEFAULT_WIDTHS._fallback

  return clamp(base.width, col.minWidth == null ? base.minWidth : min, max)
}

/** 余量摊派：remain 均摊给未封顶弹性列，被 clamp 消耗的宽度下一轮再摊（上限 3 轮） */
function distributeRemain (widths, maxes, flexes, remain) {
  let open = flexes.filter(i => widths[i] < maxes[i])

  for (let round = 0; round < 3 && remain > 0 && open.length; round++) {
    const share = remain / open.length
    let consumed = 0
    const uncapped = []

    for (const i of open) {
      const grown = Math.min(widths[i] + share, maxes[i])

      consumed += grown - widths[i]
      widths[i] = grown

      if (grown < maxes[i]) uncapped.push(i)
    }

    remain -= consumed
    open = uncapped

    if (consumed <= 0) break
  }
}

// 宽度求解（02-design.md A3）：
// 1. 定宽列：widthOverrides[key] ?? col.width ?? type.width 取 px 后 clamp（现状不动）

// 2. 未定宽列初始宽 clamp(TYPE_DEFAULT_WIDTHS[type].width, minWidth ?? 类型
//    minWidth, maxWidth)；下限复用循环头部已解析的 min（字符串 '80px' 防 NaN）

// 3. remain = containerWidth − 全部已定宽：> 0 时经 distributeRemain 摊派，
//    <= 0 保持初始宽（总宽超出容器 → 横向滚动）
export function solveWidths ({ columns, containerWidth = 0, widthOverrides } = {}) {
  const cols = columns ?? []
  const widths = new Array(cols.length)
  const maxes = new Array(cols.length)
  const flexes = []
  let determined = 0

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i] ?? {}
    const min = getPixelNumber(col.minWidth) ?? 0
    const max = getPixelNumber(col.maxWidth) ?? Infinity

    maxes[i] = max

    const px = resolveFixedWidth(col, i, widthOverrides, min, max)

    if (px != null) {
      widths[i] = px
    } else {
      widths[i] = resolveFlexWidth(col, min, max)
      flexes.push(i)
    }

    determined += widths[i]
  }

  distributeRemain(widths, maxes, flexes, containerWidth - determined)

  return widths
}

/** 列前缀和：colLefts[i] = 第 i 列左缘 x（colLefts[0] = 0），colsWidth = 列总宽 */
export function computePrefixSums (colWidths) {
  const widths = colWidths ?? []
  const colLefts = new Array(widths.length)
  let colsWidth = 0

  for (let i = 0; i < widths.length; i++) {
    colLefts[i] = colsWidth
    colsWidth += widths[i] || 0
  }

  return { colLefts, colsWidth }
}

/** 可视行窗口（含上下缘跨行与 OVERSCAN），委托 rowGeometry.visibleRange */
export function computeViewRows ({ scrollTop = 0, viewH = 0, rowGeometry } = {}) {
  return rowGeometry.visibleRange(scrollTop, viewH, OVERSCAN)
}

/** 可视列窗口（滚动区，固定列区域由绘制层单独处理）：contentX ∈
    [scrollLeft + fixedWidth, scrollLeft + fixedWidth + viewW] */
export function computeViewCols ({ scrollLeft = 0, viewW = 0, colLefts, fixedLeftColumns = 0 }) {
  const lefts = colLefts ?? []
  const n = lefts.length
  const fixed = clamp(Math.floor(fixedLeftColumns) || 0, 0, n)

  if (!n || !(viewW > 0)) return { start: 0, end: 0, count: 0 }

  const fixedWidth = fixed < n ? lefts[fixed] : Infinity
  const windowLeft = Math.max(0, scrollLeft) + fixedWidth

  // 起点：包含左缘跨窗的列，但不低于固定列数（固定列由固定区绘制）
  const start = clamp(lastIndexAtMost(lefts, windowLeft), fixed, n)
  // 终点（排他）：第一个左缘达到窗口右缘的列
  const end = clamp(firstIndexAtLeast(lefts, windowLeft + viewW), start, n)

  return { start, end, count: end - start }
}

/** colLefts 中最后一个 <= value 的下标，无则 -1（colLefts 升序） */
function lastIndexAtMost (lefts, value) {
  let lo = 0
  let hi = lefts.length - 1
  let found = -1

  while (lo <= hi) {
    const mid = (lo + hi) >> 1

    if (lefts[mid] <= value) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return found
}

/** colLefts 中第一个 >= value 的下标，无则 length（colLefts 升序） */
function firstIndexAtLeast (lefts, value) {
  let lo = 0
  let hi = lefts.length
  let found = lefts.length

  while (lo < hi) {
    const mid = (lo + hi) >> 1

    if (lefts[mid] >= value) {
      found = mid
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  return found
}

/** 画布 y 坐标 → 行号（A5 命中检测）：表头区与数据区之外返回 -1 */
export function rowAt (y, { headHeight = 0, scrollTop = 0, rowGeometry } = {}) {
  if (y < headHeight) return -1

  const index = rowGeometry.offsetToRow(y - headHeight + scrollTop)

  return index >= 0 && index < rowGeometry.rowCount ? index : -1
}

/** 固定列区右边界：第 fixed 列左缘（fixed >= 列数时为 Infinity，全区按固定列处理） */
function fixedLeftEdge (lefts, fixed) {
  return fixed < lefts.length ? lefts[fixed] : Infinity
}

/** 固定列区域线性命中：返回命中列号或 -1（固定列不随滚动位移，按视口坐标） */
function findFixedColumn (x, lefts, widths, fixed) {
  for (let i = 0; i < fixed; i++) {
    if (x < lefts[i] + (widths[i] || 0)) return x >= lefts[i] ? i : -1
  }

  return -1
}

/** 滚动区命中：contentX = x + scrollLeft 二分定位列，越出该列右缘返回 -1 */
function scrollRegionColAt (x, scrollLeft, lefts, widths) {
  const contentX = x + scrollLeft
  const index = lastIndexAtMost(lefts, contentX)

  if (index < 0) return -1

  return contentX < lefts[index] + (widths[index] || 0) ? index : -1
}

/** 画布 x 坐标 → 列号：固定列区域按视口坐标线性查前 N 列，滚动区二分查找 */
export function colAt (x, { scrollLeft = 0, colLefts, colWidths, fixedLeftColumns = 0 }) {
  const lefts = colLefts ?? []
  const widths = colWidths ?? []
  const n = lefts.length
  const fixed = clamp(Math.floor(fixedLeftColumns) || 0, 0, n)

  if (!n || x < 0) return -1

  if (x < fixedLeftEdge(lefts, fixed)) return findFixedColumn(x, lefts, widths, fixed)

  return scrollRegionColAt(x, scrollLeft, lefts, widths)
}

/** 调宽候选：距命中列右缘 <= RESIZE_HANDLE 取该列，距左缘 <= 取左邻列，否则 -1 */
function resizeCandidate (hit, left, right, x) {
  if (right - x <= RESIZE_HANDLE) return hit

  return x - left <= RESIZE_HANDLE ? hit - 1 : -1
}

/** 固定列排除与列级 resizable 判定：候选 < 0、任一 < fixed、resizable === false */
function isResizeBlocked (candidate, hit, fixed, columns) {
  if (candidate < 0) return true

  return hit < fixed || candidate < fixed || columns?.[candidate]?.resizable === false
}

/** 调宽手柄检测（A5）：右缘 <= RESIZE_HANDLE 取命中列，左缘 <= 取左邻列；
    固定列区域整体排除；列级 resizable === false 返回 -1 */
export function findResizeColumn ({
  x,
  scrollLeft = 0,
  colLefts,
  colWidths,
  columns,
  fixedLeftColumns = 0,
  resizable = false
}) {
  if (!resizable) return -1

  const lefts = colLefts ?? []
  const widths = colWidths ?? []
  const n = lefts.length
  const fixed = clamp(Math.floor(fixedLeftColumns) || 0, 0, n)
  const hit = colAt(x, { scrollLeft, colLefts: lefts, colWidths: widths, fixedLeftColumns: fixed })

  if (hit < 0) return -1

  // 命中列的视口左/右缘：固定列不随滚动位移
  const left = lefts[hit] - (hit < fixed ? 0 : scrollLeft)
  const right = left + (widths[hit] || 0)
  const candidate = resizeCandidate(hit, left, right, x)

  if (isResizeBlocked(candidate, hit, fixed, columns)) return -1

  return candidate
}

/** 统一布局重算（A2 relayout() 计算部分，纯函数）；探针尺寸重读与 __sticky /
    __spacer 的 DOM 同步由组件壳执行（以返回的 sticky/spacer 尺寸落 DOM） */
export function relayout ({
  columns,
  rowCount = 0,
  containerWidth = 0,
  containerHeight = 0,
  fixedLeftColumns = 0,
  rowHeight = 0,
  headHeight = 0,
  scrollTop = 0,
  scrollLeft = 0,
  widthOverrides,
  rowGeometry
} = {}) {
  const geometry = rowGeometry
  const colWidths = solveWidths({ columns, containerWidth, widthOverrides })
  const { colLefts, colsWidth } = computePrefixSums(colWidths)
  const n = colWidths.length
  const fixedCount = clamp(Math.floor(fixedLeftColumns) || 0, 0, n)
  const fixedWidth = fixedCount < n ? colLefts[fixedCount] : colsWidth
  const viewH = Math.max(0, containerHeight - headHeight)
  const viewW = Math.max(0, containerWidth - fixedWidth)
  const contentHeight = headHeight + geometry.totalHeight

  return {
    colWidths,
    colLefts,
    colsWidth,
    fixedCount,
    fixedWidth,
    contentWidth: colsWidth,
    contentHeight,
    rowHeight,
    headHeight,
    rowGeometry: geometry,
    stickyWidth: containerWidth,
    stickyHeight: containerHeight,
    spacerWidth: Math.max(colsWidth, containerWidth),
    spacerHeight: Math.max(0, contentHeight - containerHeight),
    viewH,
    viewW,
    viewRows: computeViewRows({ scrollTop, viewH, rowGeometry: geometry }),
    viewCols: computeViewCols({ scrollLeft, viewW, colLefts, fixedLeftColumns: fixedCount }),
    scrollTop,
    scrollLeft
  }
}
