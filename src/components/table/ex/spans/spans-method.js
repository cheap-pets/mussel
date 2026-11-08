import { recordNumberOf } from '../shared/cell-identity'

export function createIndex () {
  return {
    anchors: new Map(),
    covered: new Map(),
    regions: [],
    rowRegions: new Map()
  }
}

export function isOccupied (occupied, row, col) {
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

/** 登记区域：行侧越界截断至 rowCount → 截断后两维跨度均 < 2（1x1）静默丢弃 →
    重叠整条丢弃 → 四表回填 + 占用集回填。返回 region 或 null */
export function registerRegion (index, occupied, { row, col, rowspan, colspan }, rowCount, emitWarn, warnKey) {
  const rowTo = Math.min(row + rowspan, rowCount)
  const colTo = col + colspan

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

/** covered 表回填：主格以外的覆盖格 → 主格坐标 */
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

/** spanMethod(info) 载荷构造。recordIndex 为 0 基平铺行号（不含偏移），
    recordNumber = recordsOffset + 行号 + 1（分页 1 基序号），两口径勿混 */
function buildSpanInfo (records, columns, row, rowCount, recordsOffset) {
  return {
    record: records[row],
    recordIndex: row,
    recordNumber: recordNumberOf(recordsOffset, row),
    prevRecord: row > 0 ? records[row - 1] : null,
    nextRecord: row < rowCount - 1 ? records[row + 1] : null,
    columns
  }
}

/** 键解析：先 column.key 精确匹配；否则 field 匹配全部列（命中多列警告一次/键，
    无匹配列忽略 + 警告一次/键——warnedKeys 键级去重）。返回命中的列下标数组 */
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

/** 值形态归一：number → { rowspan: n } 糖；对象取 rowspan/colspan（colspan
    支持 'rest' 透传）；其余形态警告后返回 null（整条丢弃） */
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

/** 值形态解析：归一 → 校验；任一失败整条丢弃（警告） */
function parseSize (raw, row, colIndex, emitWarn) {
  const normalized = normalizeSpanValue(raw, row, colIndex, emitWarn)

  return normalized ? validateSpanSize(normalized, row, colIndex, emitWarn) : null
}

/** 'rest' 展开与固定列边界夹紧（占用检查之前完成）：主格在固定列区 → 展开到
    fixedCount，滚动区 → 总末列；固定区内越界夹紧 + clamp 警告 */
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

/** 入口 B —— 表格级 spanMethod：每行调用一次（O(rows)），返回该行作为主行的
    声明；键解析 key 优先→field（多列命中作用全部 + 警告）、值形态解析、
    'rest' 展开 / 固定列夹紧、树形/check 列丢弃、异常按 null 处置 */
/** 单行声明落地：逐键解析列（key 优先→field）→ 列级接管 → 树形/check 列丢弃 →
    跨度解析与 'rest' 展开 → 区域登记 */
function registerRowDeclarations (declared, spanCtx, index, occupied, warnedKeys, row) {
  const { columns, fixed, rowCount, emitWarn, takenOver } = spanCtx

  for (const name of Object.keys(declared)) {
    for (const colIndex of resolveDeclColumns(columns, name, warnedKeys, emitWarn)) {
      // 列级接管（语义见 spans-auto collectAutoRowSpanColumns）
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

export function applySpanMethod (spanCtx, index, occupied) {
  const { records, columns, spanMethod, recordsOffset, rowCount, emitWarn } = spanCtx
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

    // 数组形态单列拦截：Object.keys 会把下标当列键，走「无匹配列」警告误导排查
    if (Array.isArray(declared)) {
      emitWarn(
        'spanMethod:array',
        'spanMethod 返回值须为 { 列键: 跨度 } 对象，收到数组，返回值忽略（同类不再重复提示）'
      )

      continue
    }

    registerRowDeclarations(declared, spanCtx, index, occupied, warnedKeys, row)
  }
}
