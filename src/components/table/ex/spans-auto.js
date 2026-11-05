/** autoRowSpan 级联分段（入口 A，§2.2）：spans.js 入口按关注点拆出 */
import { isOccupied, registerRegion } from './spans-method'

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
export function applyAutoRowSpan (ctx, index, occupied) {
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
