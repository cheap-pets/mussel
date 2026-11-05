/**
 * table-ex 合并单元格（cell spans）纯函数模块（02-design.md §2/§3，P0+P1）。
 *
 * 职责：
 * - buildSpans 规范化：spanMethod 声明流（key 优先→field 匹配、'rest' 展开、
 *   固定列夹紧、重叠整条丢弃、树形/check 列丢弃、异常处置）+ autoRowSpan 三形态
 *   （true/string/Function）级联分段与树父链切断 → SpansIndex；
 * - 命中归一（resolveSpanCell）、区域矩形（spanRectOf / spanRegionRect）、
 *   行高分层数据链（spanHeightRoleOf，§5.6）。
 *
 * 行号为平铺行号（displayRows 下标，树开时与 painter/interactions 现行口径一致）。
 * 无任何有效区域时 buildSpans 返回 null（快路径标记），全部查询函数对 null spans
 * 短路——无合并表格零开销走原路径。零 DOM、零 canvas，不持有状态。
 */
import { warn } from '@/utils/warn'
import { applySpanMethod, createIndex } from './spans-method'
import { applyAutoRowSpan } from './spans-auto'

// SpansIndex（buildSpans 产物）：
// - anchors:    Map<row, Map<col, region>>  主格表
// - covered:    Map<row, Map<col, { row, col }>>  被覆盖格 → 主格坐标（命中归一）
// - regions:    Array<region> 构建序（调试/观测；rowFrom 有序但 rowTo 无序）
// - rowRegions: Map<row, Array<region>> 每行登记与之真正交叠的区域——窗口相交
//               查询、网格线分段、行带扩展、region pass 的唯一行维索引
//
// region = { rowFrom, rowTo, colFrom, colTo, row, col, rowspan, colspan }
// （rowTo/colTo 排他；row/col 为主格坐标；rowspan/colspan 为登记后的实际跨度）

// 构建链拆分：区域登记基础设施 + spanMethod 解析 → spans-method.js；
// autoRowSpan 级联分段 → spans-auto.js（本文件保留 buildSpans 编排与查询函数）

/** 构建期警告出口：同一 key 每次构建至多一条（跨构建由 utils/warn once 去重）；
    自检经 warn 参数注入捕获，缺省走组件统一 warn 通道 */
function createWarner (warnFn) {
  const seen = new Set()

  return (key, message) => {
    if (seen.has(key)) return

    seen.add(key)

    if (typeof warnFn === 'function') warnFn(message)
    else warn({ component: 'table-ex', message })
  }
}

/**
 * 构建 SpansIndex（§3.2 规范化）：先 spanMethod（行序、行内列序）后 autoRowSpan
 * 填补空位（被接管列跳过）。无 spanMethod 且无 autoRowSpan 列、无行、无有效区域
 * 时返回 null。
 *
 * @param {Object} [params]
 * @param {Array} [params.records] 平铺行记录（displayRows）
 * @param {Array} [params.columns] 已准备内部列（wiredColumns，消费 _autoRowSpan/
 *   _isTreeColumn/_value/_mapText/key/field/type）
 * @param {Function} [params.spanMethod] 表格级声明回调（§2.3）
 * @param {Object} [params.flatInfo] 树平铺信息 { levels, parentKeys }（树关 = null）
 * @param {Number} [params.fixedCount=0] 固定列数（colspan 分区边界）
 * @param {Number} [params.recordsOffset=0] 分页偏移（recordNumber 口径）
 * @param {String} [params.orderBy] 当前排序（非空且存在 autoRowSpan → 警告一次）
 * @param {Function} [params.warn] dev 警告出口（缺省 utils/warn 统一通道）
 * @returns {SpansIndex|null}
 */
export function buildSpans ({
  records,
  columns,
  spanMethod,
  flatInfo = null,
  fixedCount = 0,
  recordsOffset = 0,
  orderBy,
  warn: warnFn
} = {}) {
  const list = records ?? []
  const cols = columns ?? []
  const rowCount = list.length
  const colCount = cols.length

  if (!rowCount || !colCount) return null

  const hasAutoRowSpan = cols.some(col => col?._autoRowSpan != null)

  if (typeof spanMethod !== 'function' && !hasAutoRowSpan) return null

  const fixed = Math.min(Math.max(Math.floor(fixedCount) || 0, 0), colCount)
  const index = createIndex()
  const occupied = new Map()
  const emitWarn = createWarner(warnFn)
  const takenOver = new Set()
  const ctx = {
    records: list,
    columns: cols,
    spanMethod,
    rowCount,
    fixed,
    recordsOffset,
    orderBy,
    flatInfo,
    emitWarn,
    takenOver
  }

  if (typeof spanMethod === 'function') applySpanMethod(ctx, index, occupied)

  applyAutoRowSpan(ctx, index, occupied)

  return index.regions.length ? index : null
}

/** 被覆盖格 → 主格坐标（无/非 covered 返回 null） */
export function coveredAnchorOf (spans, row, col) {
  return spans?.covered.get(row)?.get(col) ?? null
}

/** (row, col) 所在区域：主格或被覆盖格 → region，否则 null */
export function regionAt (spans, row, col) {
  if (!spans) return null

  const direct = spans.anchors.get(row)?.get(col)

  if (direct) return direct

  const anchor = coveredAnchorOf(spans, row, col)

  return anchor ? (spans.anchors.get(anchor.row)?.get(anchor.col) ?? null) : null
}

/** 格的合并形态（painter pass 1 跳格判定）：'covered' | 'anchor' | null */
export function spanCellKindOf (spans, row, col) {
  if (!spans) return null

  if (spans.covered.get(row)?.has(col)) return 'covered'

  return spans.anchors.get(row)?.has(col) ? 'anchor' : null
}

/** 与行窗口 [from, to) 相交的全部区域（rowRegions 逐行取并集去重；含锚行在窗口
    上方/下方的跨行长区域——rowTo 无序问题不存在） */
export function regionsForRows (spans, from, to) {
  if (!spans) return []

  const result = []
  const seen = new Set()

  for (let r = Math.max(from, 0); r < to; r++) {
    const list = spans.rowRegions.get(r)

    if (!list) continue

    for (const region of list) {
      if (!seen.has(region)) {
        seen.add(region)
        result.push(region)
      }
    }
  }

  return result
}

/**
 * 命中归一（§5.4，组件壳 hitAt 出口单一接入点）：covered 格 hit 改写为主格坐标。
 * 浅拷贝仅覆盖 rowIndex/colIndex——cellX 语义绑定原始命中列内容区偏移、x/y/
 * beyondCols/resizeCol 原样保留；anchor/普通格/表头/null spans 短路原样返回。
 *
 * @param {SpansIndex|null} spans
 * @param {Object|null} hit hitTest 产出
 * @returns {Object} 归一后 hit（或原引用）
 */
export function resolveSpanCell (spans, hit) {
  if (!spans || !hit) return hit

  if (hit.isHeader || hit.rowIndex < 0 || hit.colIndex < 0) return hit

  const anchor = coveredAnchorOf(spans, hit.rowIndex, hit.colIndex)

  if (!anchor) return hit

  return { ...hit, rowIndex: anchor.row, colIndex: anchor.col }
}

function viewportXOf (layout, col) {
  return (layout.colLefts[col] || 0) - (col < layout.fixedCount ? 0 : layout.scrollLeft)
}

function viewportYOf (layout, row) {
  return layout.headHeight + layout.rowGeometry.topAt(row) - layout.scrollTop
}

/** 区域包围盒视口矩形（等高/变高经 rowGeometry，等高单行区域与 cellRectAt 退化一致） */
export function spanRegionRect (layout, region) {
  const lastCol = region.colTo - 1

  return {
    x: viewportXOf(layout, region.colFrom),
    y: viewportYOf(layout, region.rowFrom),
    width:
      viewportXOf(layout, lastCol) + (layout.colWidths[lastCol] || 0) -
      viewportXOf(layout, region.colFrom),
    height: viewportYOf(layout, region.rowTo) - viewportYOf(layout, region.rowFrom)
  }
}

/** (row, col) 所在格视口矩形：区域格 → 区域包围盒；普通格 → cellRectAt 同式。
    hover 高亮 / 可编辑描边 / 编辑按钮区 / 编辑浮层盒的统一矩形来源（§5.1/§5.5） */
export function spanRectOf (layout, row, col, spans) {
  const region = regionAt(spans, row, col)

  if (region) return spanRegionRect(layout, region)

  return {
    x: viewportXOf(layout, col),
    y: viewportYOf(layout, row),
    width: layout.colWidths?.[col] || 0,
    height: layout.rowGeometry.heightAt(row)
  }
}

/** 行高分层数据链（§5.6，row-geometry 消费）：
 * - 'excluded'：covered 格 / rowspan > 1 主格——不参与行高，也不得触发
 *   hasArrayValues 变高模式升级（被排除格持有数组值不得升级）；
 * - region：rowspan === 1 的 colspan 主格——按区域宽（Σ colWidths[colFrom..colTo)）
 *   参与本行行高与模式判定；
 * - null：普通格（单列宽，原路径）。
 */
export function spanHeightRoleOf (spans, row, col) {
  if (!spans) return null

  if (spans.covered.get(row)?.has(col)) return 'excluded'

  const region = spans.anchors.get(row)?.get(col)

  if (!region) return null

  return region.rowspan > 1 ? 'excluded' : region
}
