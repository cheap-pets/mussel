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

// SpansIndex（buildSpans 产物）：
// - anchors:    Map<row, Map<col, region>>  主格表
// - covered:    Map<row, Map<col, { row, col }>>  被覆盖格 → 主格坐标（命中归一）
// - regions:    Array<region> 构建序（调试/观测；rowFrom 有序但 rowTo 无序）
// - rowRegions: Map<row, Array<region>> 每行登记与之真正交叠的区域——窗口相交
//               查询、网格线分段、行带扩展、region pass 的唯一行维索引
//
// region = { rowFrom, rowTo, colFrom, colTo, row, col, rowspan, colspan }
// （rowTo/colTo 排他；row/col 为主格坐标；rowspan/colspan 为登记后的实际跨度）

function isEmptyKey (key) {
  return key == null || key === ''
}

/** 列显示值（row-geometry valueOf 同款取值链：_value → field，映射列经 _mapText；
    autoRowSpan true 形态的分组键，含 mappings 映射显示值） */
function displayValueOf (col, record) {
  const fromFn = typeof col._value === 'function' ? col._value(record) : undefined
  const value = fromFn ?? (col.field ? record?.[col.field] : undefined)

  if (col._mapText) {
    const mapped = col._mapText(value)

    if (mapped != null) return mapped
  }

  return value
}

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

function createIndex () {
  return {
    anchors: new Map(),
    covered: new Map(),
    regions: [],
    rowRegions: new Map()
  }
}

function isOccupied (occupied, row, col) {
  return occupied.get(row)?.has(col) ?? false
}

function isRectOccupied (occupied, rowFrom, rowTo, colFrom, colTo) {
  for (let r = rowFrom; r < rowTo; r++) {
    const cells = occupied.get(r)

    if (!cells) continue

    for (let c = colFrom; c < colTo; c++) {
      if (cells.has(c)) return true
    }
  }

  return false
}

function occupyRect (occupied, rowFrom, rowTo, colFrom, colTo) {
  for (let r = rowFrom; r < rowTo; r++) {
    let cells = occupied.get(r)

    if (!cells) {
      cells = new Set()
      occupied.set(r, cells)
    }

    for (let c = colFrom; c < colTo; c++) cells.add(c)
  }
}

/** 登记区域（§3.2：越界截断 → 跨度 < 2 静默丢弃 → 重叠整条丢弃 → 四表回填 +
    占用集回填）。返回 region 或 null */
function registerRegion (index, occupied, { row, col, rowspan, colspan }, rowCount, emitWarn, warnKey) {
  const rowTo = Math.min(row + rowspan, rowCount)
  const colTo = col + colspan

  // 截断/夹紧后跨度 < 2 无合并意义：静默丢弃（不警告）
  if (rowTo - row < 2 && colTo - col < 2) return null

  if (isRectOccupied(occupied, row, rowTo, col, colTo)) {
    emitWarn(
      `${warnKey}|overlap`,
      `spanMethod 声明 (${row}, ${col}) 与已登记合并区域重叠，整条丢弃`
    )

    return null
  }

  const region = {
    rowFrom: row,
    rowTo,
    colFrom: col,
    colTo,
    row,
    col,
    rowspan: rowTo - row,
    colspan: colTo - col
  }

  let anchorRow = index.anchors.get(row)

  if (!anchorRow) {
    anchorRow = new Map()
    index.anchors.set(row, anchorRow)
  }

  anchorRow.set(col, region)

  fillCoveredCells(index, region)
  index.regions.push(region)
  fillRowRegions(index, region)
  occupyRect(occupied, row, rowTo, col, colTo)

  return region
}

/** covered 表回填：主格以外的覆盖格 → 主格坐标（§3.2 四表回填之一） */
function fillCoveredCells (index, { row, col, rowTo, colTo }) {
  for (let r = row; r < rowTo; r++) {
    for (let c = col; c < colTo; c++) {
      if (r === row && c === col) continue

      let inner = index.covered.get(r)

      if (!inner) {
        inner = new Map()
        index.covered.set(r, inner)
      }

      inner.set(c, { row, col })
    }
  }
}

/** rowRegions 表回填：与区域真正交叠的每一行挂区域引用（窗口查询的行维索引） */
function fillRowRegions (index, region) {
  for (let r = region.row; r < region.rowTo; r++) {
    const list = index.rowRegions.get(r)

    if (list) list.push(region)
    else index.rowRegions.set(r, [region])
  }
}

/** spanMethod(info) 载荷构造（§2.3）：record/recordIndex/recordNumber/prev/next/columns */
function buildSpanInfo (records, columns, row, rowCount, recordsOffset) {
  return {
    record: records[row],
    recordIndex: row,
    recordNumber: (recordsOffset || 0) + row + 1,
    prevRecord: row > 0 ? records[row - 1] : null,
    nextRecord: row < rowCount - 1 ? records[row + 1] : null,
    columns
  }
}

/**
 * 键解析（§2.3）：先 column.key 精确匹配；否则 field 匹配全部列（命中多列警告
 * 一次/键，无匹配列忽略 + 警告一次/键——warnedKeys 键级去重）。返回命中的列下标数组。
 */
function resolveDeclColumns (columns, name, warnedKeys, emitWarn) {
  const byKey = []

  for (let i = 0; i < columns.length; i++) {
    if (columns[i]?.key === name) byKey.push(i)
  }

  if (byKey.length) return byKey

  const byField = []

  for (let i = 0; i < columns.length; i++) {
    if (columns[i]?.field === name) byField.push(i)
  }

  if (!byField.length) {
    if (!warnedKeys.has(name)) {
      warnedKeys.add(name)
      emitWarn(`key:${name}:none`, `spanMethod 键 "${name}" 无匹配列，声明忽略`)
    }

    return byField
  }

  if (byField.length > 1 && !warnedKeys.has(name)) {
    warnedKeys.add(name)
    emitWarn(
      `key:${name}:multi`,
      `spanMethod 键 "${name}" 按 field 命中 ${byField.length} 列（field 定位不可靠），作用于全部匹配列`
    )
  }

  return byField
}

/** 值形态归一（§2.3 规则 3）：number → { rowspan: n } 糖；对象取 rowspan/colspan
    （colspan 支持 'rest' 透传）；其余形态警告后返回 null（整条丢弃） */
function normalizeSpanValue (raw, row, colIndex, emitWarn) {
  if (typeof raw === 'number') return { rowspan: raw, colspan: 1 }

  if (raw != null && typeof raw === 'object') {
    return {
      rowspan: raw.rowspan ?? 1,
      colspan: raw.colspan != null ? (raw.colspan === 'rest' ? 'rest' : raw.colspan) : 1
    }
  }

  emitWarn(`${row}|${colIndex}|invalid`, `spanMethod 声明值形态无效（${row}, ${colIndex}），整条丢弃`)

  return null
}

/** 跨度校验：rowspan / colspan（非 'rest'）均须 ≥1 整数，否则警告后返回 null */
function validateSpanSize ({ rowspan, colspan }, row, colIndex, emitWarn) {
  if (!Number.isInteger(rowspan) || rowspan < 1) {
    emitWarn(
      `${row}|${colIndex}|rowspan`,
      `spanMethod rowspan=${rowspan} 非 ≥1 整数（${row}, ${colIndex}），整条丢弃`
    )

    return null
  }

  if (colspan !== 'rest' && (!Number.isInteger(colspan) || colspan < 1)) {
    emitWarn(
      `${row}|${colIndex}|colspan`,
      `spanMethod colspan=${colspan} 非 ≥1 整数（${row}, ${colIndex}），整条丢弃`
    )

    return null
  }

  return { rowspan, colspan }
}

/** 值形态解析（§2.3 规则 3 组合）：归一 → 校验；任一失败整条丢弃（警告） */
function parseSize (raw, row, colIndex, emitWarn) {
  const normalized = normalizeSpanValue(raw, row, colIndex, emitWarn)

  return normalized ? validateSpanSize(normalized, row, colIndex, emitWarn) : null
}

/** 'rest' 展开与固定列边界夹紧（§3.2 规则 2，占用检查之前完成）：主格在固定列区
    → 展开到 fixedCount，滚动区 → 总末列；固定区内越界夹紧 + clamp 警告 */
function resolveDeclaredColspan (size, colIndex, fixed, colCount, row, emitWarn) {
  const partitionEnd = colIndex < fixed ? fixed : colCount

  if (size.colspan === 'rest') return partitionEnd - colIndex

  if (colIndex + size.colspan > partitionEnd) {
    if (colIndex < fixed) {
      emitWarn(
        `${row}|${colIndex}|clamp`,
        `spanMethod colspan=${size.colspan} 跨固定列边界（${row}, ${colIndex}），夹紧到固定区末列`
      )
    }

    return partitionEnd - colIndex
  }

  return size.colspan
}

/** 错误消息兜底：Error.message / 原值串化（throw 警告文案内嵌） */
function errorMessageOf (err) {
  return err?.message ?? err
}

/** 入口 B —— 表格级 spanMethod（§2.3）：每行调用一次（O(rows)），返回该行作为
    主行的声明；键解析 key 优先→field（多列命中作用全部 + 警告）、值形态解析、
    'rest' 展开 / 固定列夹紧、树形/check 列丢弃、异常按 null 处置 */
function applySpanMethod (ctx, index, occupied) {
  const { records, columns, spanMethod, recordsOffset, rowCount, fixed, emitWarn, takenOver } = ctx
  const warnedKeys = new Set()

  for (let row = 0; row < rowCount; row++) {
    let declared = null

    try {
      declared = spanMethod(buildSpanInfo(records, columns, row, rowCount, recordsOffset))
    } catch (err) {
      emitWarn(
        `spanMethod:${row}:throw`,
        `spanMethod 行 ${row} 抛出异常（${errorMessageOf(err)}），该行按 null 处理`
      )

      continue
    }

    if (declared == null || typeof declared !== 'object') continue

    for (const name of Object.keys(declared)) {
      for (const colIndex of resolveDeclColumns(columns, name, warnedKeys, emitWarn)) {
        // 列级接管（§2.4）：返回某列键即接管，该列 autoRowSpan 对全表失效
        takenOver.add(colIndex)

        const col = columns[colIndex]

        if (col?._isTreeColumn || col?.type === 'check') {
          emitWarn(
            `${row}|${colIndex}|reserved`,
            `spanMethod 声明落在树形列/check 列（${row}, ${colIndex}），丢弃（缩进槽/每行勾选框与合并语义冲突）`
          )

          continue
        }

        const size = parseSize(declared[name], row, colIndex, emitWarn)

        if (!size) continue

        const colspan = resolveDeclaredColspan(size, colIndex, fixed, columns.length, row, emitWarn)

        registerRegion(
          index,
          occupied,
          { row, col: colIndex, rowspan: size.rowspan, colspan },
          rowCount,
          emitWarn,
          `${row}|${colIndex}`
        )
      }
    }
  }
}

/** autoRowSpan 键提取（§2.2 三形态）：true → 显示值（含 mappings）；string → 字段值；
    Function → 行级求值 */
function autoSpanKeyOf (col, mode, record) {
  if (mode === true) return displayValueOf(col, record)

  return typeof mode === 'function' ? mode(record) : record?.[mode]
}

/** 收集启用中的 autoRowSpan 列下标（takenOver 过滤 + info/orderBy 警告一次） */
function collectAutoRowSpanColumns (ctx) {
  const { columns, emitWarn, takenOver } = ctx
  const autoCols = []

  for (let i = 0; i < columns.length; i++) {
    const mode = columns[i]?._autoRowSpan

    if (mode == null) continue

    // 列级接管（§2.4/§7）：spanMethod 在任一行返回了该列键 → autoRowSpan 全表失效
    // （info 一次/列；同一列一部分自动、一部分手写会产出不可预期的缺口，禁止混用）
    if (takenOver.has(i)) {
      emitWarn(
        `takenOver:${i}`,
        `（info）spanMethod 已返回列 ${i}${columns[i].field ? `（${columns[i].field}）` : ''} 的声明，该列 autoRowSpan 对全表失效`
      )

      continue
    }

    autoCols.push(i)
  }

  if (autoCols.length && ctx.orderBy) {
    emitWarn(
      'orderBy:autoRowSpan',
      'orderBy 非空且存在启用中的 autoRowSpan：合并依赖当前行序，排序后的合并块可能无意义（不自动关闭排序）'
    )
  }

  return autoCols
}

/** 树父链切断判定（§2.2 规则 4）：树关或首行早退；层级变化或父链（parentKeys
    祖先链）不同的相邻行处切断（parentKeys 由 tree.js buildFlatRows 产出） */
function isTreeBoundary (levels, parentKeys, row) {
  if (levels == null || row === 0) return false

  return levels[row] !== levels[row - 1] ||
    !Object.is(parentKeys?.[row], parentKeys?.[row - 1])
}

/** 级联分段判定（§2.2 规则 3）：右侧列的分段在左侧任一 autoRowSpan 列的分段
    起点处强制切断（autoCols 升序处理，左列起点已定） */
function isCascadeBoundary (segStartByCol, autoCols, colIndex, row) {
  for (const earlier of autoCols) {
    if (earlier >= colIndex) break

    if (segStartByCol.get(earlier) === row) return true
  }

  return false
}

/** true 形态取到非原始值判定（tag/link/button 等图形/条目列丢弃依据） */
function isNonPrimitiveSpanKey (mode, key) {
  return mode === true && typeof key === 'object'
}

/** true 形态取到数组/对象等非原始值（tag/link/button 等图形/条目列）的警告：
    Object.is 恒不相等，不会产生任何合并 + 警告一次/列（trueWarned 去重） */
function warnNonPrimitiveKey (col, colIndex, trueWarned, emitWarn) {
  if (trueWarned.has(colIndex)) return

  trueWarned.add(colIndex)
  emitWarn(
    `autoRowSpan:true:${colIndex}`,
    `列 ${colIndex}${col.field ? `（${col.field}）` : ''} autoRowSpan true 形态取到非原始值，不会产生任何合并，请改用 string 或 Function 键`
  )
}

/** 段推进（§2.2 键比较）：与当前段键不同 → 闭合当前段（close 回调）；
    未开段（含刚闭合）→ 开段并记录分段起点。seg 每列创建一次（非每行分配） */
function advanceSegment (seg, key, row, segStartByCol, colIndex, close) {
  if (seg.openFrom >= 0 && !Object.is(key, seg.openKey)) close(row)

  if (seg.openFrom < 0) {
    seg.openFrom = row
    seg.openKey = key
    segStartByCol.set(colIndex, row)
  }
}

/** 入口 A —— 列级 autoRowSpan（§2.2）：true（显示值含 mappings）/ string 字段键 /
    Function 键；Object.is 键比较；空值不参与且为分段边界；级联分段（右侧列分段在
    左侧列分段起点处切断）；树父链切断（levels 变化或 parentKeys 不同）；
    spanMethod 占用格切断且分段不跨过 */
function applyAutoRowSpan (ctx, index, occupied) {
  const { records, columns, rowCount, flatInfo, emitWarn } = ctx
  const autoCols = collectAutoRowSpanColumns(ctx)

  if (!autoCols.length) return

  const levels = flatInfo?.levels
  const parentKeys = flatInfo?.parentKeys

  // 各 autoRowSpan 列最近一次分段起点（列序处理，右侧列级联切断的判定源；
  // close 后保留——分段起点不因段结束而消失，即使段长 1 也成立）
  const segStartByCol = new Map()
  const trueWarned = new Set()

  for (const colIndex of autoCols) {
    const col = columns[colIndex]
    const mode = col._autoRowSpan
    const seg = { openFrom: -1, openKey: undefined }

    const close = endRowExclusive => {
      if (seg.openFrom >= 0 && endRowExclusive - seg.openFrom >= 2) {
        registerRegion(
          index,
          occupied,
          { row: seg.openFrom, col: colIndex, rowspan: endRowExclusive - seg.openFrom, colspan: 1 },
          rowCount,
          emitWarn,
          `${seg.openFrom}|${colIndex}`
        )
      }

      seg.openFrom = -1
    }

    for (let row = 0; row < rowCount; row++) {
      // 占用格切断（§2.2 规则 6）：spanMethod 已声明的格不参与自动分段，分段在
      // 占用格处切断、不跨过（该行跳过，后续行自动开启新段）
      if (isOccupied(occupied, row, colIndex)) {
        close(row)

        continue
      }

      // 树父链切断（§2.2 规则 4）
      if (isTreeBoundary(levels, parentKeys, row)) close(row)

      // 级联分段（§2.2 规则 3）
      if (isCascadeBoundary(segStartByCol, autoCols, colIndex, row)) close(row)

      const key = autoSpanKeyOf(col, mode, records[row])

      // 空值（null/undefined/''）不参与合并，同时作为分段边界（小计行隔离）
      if (isEmptyKey(key)) {
        close(row)

        continue
      }

      // true 形态非原始值：不产生任何合并 + 警告一次/列
      if (isNonPrimitiveSpanKey(mode, key)) {
        warnNonPrimitiveKey(col, colIndex, trueWarned, emitWarn)
        close(row)

        continue
      }

      // Object.is 键比较：与当前段键不同 → 闭合当前段；未开段 → 开段（advanceSegment 全程）
      advanceSegment(seg, key, row, segStartByCol, colIndex, close)
    }

    close(rowCount)
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
