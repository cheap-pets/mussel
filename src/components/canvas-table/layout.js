/**
 * canvas-table 布局计算（02-design.md A2/A3/A5）。
 *
 * 本模块全部为纯函数：不持有状态、不触 DOM、不写回入参。
 * - 探针尺寸变量（rowHeight / headHeight 等）由 theme.js 读取后经参数传入；
 * - __sticky / __spacer 的 DOM 尺寸同步、widthOverrides 的存放与清空
 *   （columns 引用替换时清空）由组件壳（canvas-table.vue）负责；
 * - 可视窗口口径（decisions「[I1 前]④」全链统一，含 lastPaint 断言口径）：
 *   viewH = clientHeight − headHeight、viewW = clientWidth − fixedWidth；
 * - 行几何（02-design.md A2.2）：computeViewRows / rowAt / relayout 均要求
 *   rowGeometry 必传（C4 删 uniform 等高回退——生产路径 relayout() 恒产几何；
 *   自检/手织 layout 夹具统一经 createUniformRowGeometry 构造）。
 */
import { getPixelNumber } from '../table/utils'
import { resolveColumnType } from '../table/column-types'

/** 滚动虚拟窗口上下各多绘的行数（02-design.md A3） */
export const OVERSCAN = 2

/** 调宽手柄命中距离：距列缘 <= 4px（02-design.md A5） */
export const RESIZE_HANDLE = 4

/**
 * 预设类型默认宽度与最小宽度双值表（02-design.md A3.2，意见 3 + 人工 2 意见 1）。
 *
 * 仅 canvas-table 消费（不改 table/column-types/*.js 的 width 字段——那会改变
 * 现有 DOM table 默认列宽，被拒绝备选 #9）；仅在 solveWidths 弹性分支作初始宽
 * 与最小宽基线：定宽链 widthOverrides ?? col.width ?? type.width 与定宽分支
 * clamp(px, getPixelNumber(col.minWidth) ?? 0, max) 完全不动（check/rec_no 的
 * type.width 50px 仍为定宽）。col.minWidth 显式值覆盖类型最小宽。
 * 无 type/空 type 列回退 text 条目（resolveColumnType(undefined) 同样回退
 * TextColumn）；对象/函数自定义类型、未知类型字符串回退 _fallback。
 */
export const TYPE_DEFAULT_WIDTHS = {
  text: { width: 160, minWidth: 80 },
  number: { width: 100, minWidth: 60 },
  currency: { width: 110, minWidth: 60 },
  date: { width: 125, minWidth: 80 },
  datetime: { width: 160, minWidth: 100 },
  enum: { width: 100, minWidth: 60 },
  bool: { width: 60, minWidth: 40 },
  link: { width: 140, minWidth: 80 },
  tag: { width: 140, minWidth: 80 },
  img: { width: 80, minWidth: 40 },
  image: { width: 80, minWidth: 40 },
  progress: { width: 120, minWidth: 60 },
  button: { width: 140, minWidth: 80 },
  _fallback: { width: 80, minWidth: 40 }
}

/** 列类型名（弹性分支基线与调宽下限共用的归一化）：字符串 type（空串→text）/
    无 type → text（resolveColumnType(undefined) 同回退 TextColumn，A3.2）/
    对象/函数自定义类型 → _fallback */
function typeNameOf (col) {
  if (typeof col.type === 'string') return col.type || 'text'

  return col.type == null ? 'text' : '_fallback'
}

/**
 * 类型最小宽（评审 6 P2）：调宽拖拽下限缺省值，消费点 = 组件壳 startResize
 * 传参 `getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`
 * （真正 clamp 位置在 interactions.resolveResizeWidth，本模块不 clamp）。
 * 不含 40 兜底；col.minWidth 显式值的优先级组合在壳侧，本函数恒返回类型最小宽。
 */
export function resolveTypeMinWidth (col) {
  return TYPE_DEFAULT_WIDTHS[typeNameOf(col)]?.minWidth
}

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * 列 key：widthOverrides / 调宽结果的定位键。
 * 组件壳列准备阶段生成 _key（table.vue 同款 el.key ?? 自动序号）；
 * 本函数对未准备列兜底 col.key ?? col._key ?? 下标。
 */
function getColumnKey (col, index) {
  return col.key ?? col._key ?? index
}

/**
 * 定宽解析：widthOverrides[key] ?? col.width ?? type.width 经 getPixelNumber 取 px，
 * 可解析时 clamp 到 [min, max]，不可解析返回 null（转弹性分支）。
 * 覆盖值不可解析为 px 时按未覆盖处理，回退列定义（decisions「[I1 前]⑥」）。
 */
function resolveFixedWidth (col, index, widthOverrides, min, max) {
  const overridePx = getPixelNumber(widthOverrides?.[getColumnKey(col, index)])
  const px = getPixelNumber(
    overridePx != null ? overridePx : col.width ?? resolveColumnType(col.type).width
  )

  return px != null ? clamp(px, min, max) : null
}

/**
 * 弹性初始宽（A3.2）：类型默认宽 clamp 到 [min ?? 类型 minWidth, max]；
 * col.minWidth 显式值覆盖类型最小宽。
 */
function resolveFlexWidth (col, min, max) {
  const base = TYPE_DEFAULT_WIDTHS[typeNameOf(col)] ?? TYPE_DEFAULT_WIDTHS._fallback

  return clamp(base.width, col.minWidth == null ? base.minWidth : min, max)
}

/**
 * 余量摊派（A3「宽度求解」步骤 3）：remain 均摊给未封顶弹性列，被 clamp 消耗的
 * 宽度下一轮再摊，迭代至无消耗或剩余列空（上限 3 轮，未收敛列保持当前值）。
 * 就地写 widths，不返回余量（调用方不消费）。
 */
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

/**
 * 宽度求解（02-design.md A3「宽度求解」）：
 * 1. 定宽列：widthOverrides[key] ?? col.width ?? type.width，经 getPixelNumber 取 px，
 *    clamp 到 [minWidth ?? 0, maxWidth ?? Infinity]（现状定宽链，完全不动——评审 6 P5）
 * 2. 未定宽列初始宽 clamp(TYPE_DEFAULT_WIDTHS[type].width, minWidth ?? 类型 minWidth,
 *    maxWidth ?? Infinity)（A3.2：类型感知双值基线，同位替换 COL_FALLBACK 与 80px
 *    隐式下限；下限复用循环头部已解析的 min——不传原始 col.minWidth，字符串 '80px'
 *    经 Math.max 会得 NaN；col.minWidth 存在但不可解析时按现状语义用 0）
 * 3. remain = containerWidth − 全部已定宽（定宽列 + 未定宽列初始宽）：
 *    remain > 0 时均摊给未封顶的未定宽列（各列 + remain/未封顶数），摊入后逐列 clamp 到
 *    maxWidth，被 clamp 消耗的宽度下一轮再摊，迭代至无消耗或剩余列空（上限 3 轮，
 *    未收敛列保持当前值）；remain <= 0 保持初始宽（总宽超出容器 → 横向滚动）。
 *
 * @param {Object} params
 * @param {Array} params.columns 列定义（原始或已准备，均不改写）
 * @param {Number} [params.containerWidth=0] 容器 clientWidth
 * @param {Object} [params.widthOverrides] 拖拽列宽（按列 key），优先于列定义 width，
 *   不写回 props；存放与清空由组件壳负责
 * @returns {Number[]} 与 columns 等长的列宽数组
 */
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

/**
 * 列前缀和：colLefts[i] = 第 i 列左缘 x（colLefts[0] = 0），colsWidth = 列总宽。
 *
 * @param {Number[]} colWidths 列宽数组
 * @returns {{ colLefts: Number[], colsWidth: Number }}
 */
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

/**
 * 可视行窗口（含上下缘跨行与 OVERSCAN），委托 rowGeometry.visibleRange。
 *
 * @param {Object} params
 * @param {Number} [params.scrollTop=0]
 * @param {Number} [params.viewH=0] 可视高 = clientHeight − headHeight（口径见模块头注释）
 * @param {Object} params.rowGeometry 行几何实例（row-geometry.js 产物，必传）
 * @returns {{ start: Number, end: Number, count: Number }} end 为排他边界
 */
export function computeViewRows ({ scrollTop = 0, viewH = 0, rowGeometry } = {}) {
  return rowGeometry.visibleRange(scrollTop, viewH, OVERSCAN)
}

/**
 * 可视列窗口（滚动区，固定列区域由绘制层单独处理）。
 * 窗口按滚动区口径计算：contentX ∈ [scrollLeft + fixedWidth, scrollLeft + fixedWidth + viewW]，
 * 其中 viewW = clientWidth − fixedWidth（decisions「[I1 前]④」）。
 *
 * @param {Object} params
 * @param {Number} [params.scrollLeft=0]
 * @param {Number} [params.viewW=0] 可视宽 = clientWidth − fixedWidth
 * @param {Number[]} params.colLefts 列前缀和
 * @param {Number} [params.fixedLeftColumns=0] 固定列数
 * @returns {{ start: Number, end: Number, count: Number }} end 为排他边界，start ≥ 固定列数
 */
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

/**
 * 画布 y 坐标 → 行号（02-design.md A5 命中检测）。
 * 表头区（y < headHeight）与数据区之外返回 -1。
 *
 * @param {Number} y 相对 canvas 的 y
 * @param {Object} params
 * @param {Number} [params.headHeight=0]
 * @param {Number} [params.scrollTop=0]
 * @param {Object} params.rowGeometry 行几何实例（row-geometry.js 产物，必传）
 * @returns {Number} 行号或 -1
 */
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

/**
 * 画布 x 坐标 → 列号。固定列区域按视口坐标线性查前 N 列（固定列不随滚动位移），
 * 滚动区按 contentX = x + scrollLeft 二分查找。
 *
 * @param {Number} x 相对 canvas 的 x
 * @param {Object} params
 * @param {Number} [params.scrollLeft=0]
 * @param {Number[]} params.colLefts 列前缀和
 * @param {Number[]} params.colWidths 列宽数组
 * @param {Number} [params.fixedLeftColumns=0]
 * @returns {Number} 列号或 -1
 */
export function colAt (x, { scrollLeft = 0, colLefts, colWidths, fixedLeftColumns = 0 }) {
  const lefts = colLefts ?? []
  const widths = colWidths ?? []
  const n = lefts.length
  const fixed = clamp(Math.floor(fixedLeftColumns) || 0, 0, n)

  if (!n || x < 0) return -1

  if (x < fixedLeftEdge(lefts, fixed)) return findFixedColumn(x, lefts, widths, fixed)

  return scrollRegionColAt(x, scrollLeft, lefts, widths)
}

/** 调宽候选：距命中列右缘 <= RESIZE_HANDLE 取该列，距左缘 <= RESIZE_HANDLE 取左邻列，否则 -1 */
function resizeCandidate (hit, left, right, x) {
  if (right - x <= RESIZE_HANDLE) return hit

  return x - left <= RESIZE_HANDLE ? hit - 1 : -1
}

/** 固定列排除与列级 resizable 判定：候选 < 0、命中列/候选任一 < fixed、列 resizable === false */
function isResizeBlocked (candidate, hit, fixed, columns) {
  if (candidate < 0) return true

  return hit < fixed || candidate < fixed || columns?.[candidate]?.resizable === false
}

/**
 * 调宽手柄检测（02-design.md A5）：命中列右缘 <= RESIZE_HANDLE 返回命中列，
 * 命中列左缘 <= RESIZE_HANDLE 返回其左邻列；否则 -1。
 * 固定列区域整体排除：命中列或候选列任一 index < fixedLeftColumns（含分界两侧）返回 -1；
 * 列级 resizable === false 同样返回 -1。
 *
 * @param {Object} params
 * @param {Number} params.x 相对 canvas 的 x
 * @param {Number} [params.scrollLeft=0]
 * @param {Number[]} params.colLefts 列前缀和
 * @param {Number[]} params.colWidths 列宽数组
 * @param {Array} params.columns 列定义（读取列级 resizable）
 * @param {Number} [params.fixedLeftColumns=0]
 * @param {Boolean} [params.resizable=false] 表格级调宽开关
 * @returns {Number} 可拖拽调整宽度的列号或 -1
 */
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

/**
 * 统一布局重算（02-design.md A2 relayout() 的计算部分，纯函数）。
 * 探针尺寸变量重读（theme.js）与 __sticky / __spacer 的 DOM 同步由组件壳执行：
 * 组件壳以本函数返回的 stickyWidth/Height、spacerWidth/Height 落 DOM。
 *
 * @param {Object} [params]
 * @param {Array} [params.columns=[]] 列定义（原始或已准备，均不改写）
 * @param {Number} [params.rowCount=0] 记录总数
 * @param {Number} [params.containerWidth=0] 滚动容器 clientWidth
 * @param {Number} [params.containerHeight=0] 滚动容器 clientHeight
 * @param {Number} [params.fixedLeftColumns=0]
 * @param {Number} [params.rowHeight=0] 探针解析行高（theme 快照）
 * @param {Number} [params.headHeight=0] 探针解析表头高（theme 快照）
 * @param {Number} [params.scrollTop=0]
 * @param {Number} [params.scrollLeft=0]
 * @param {Object} [params.widthOverrides] 拖拽列宽（按列 key），见 solveWidths
 * @param {Object} params.rowGeometry 行几何实例（row-geometry.js 产物，必传——
 *   生产路径组件壳恒传；uniform 模式传 createUniformRowGeometry 产物）
 * @returns {Object} 布局快照（含 rowGeometry 引用，字段见实现返回值）
 */
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
