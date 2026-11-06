/** 绘制共享工具：视口换算 / 行背景 / 排序解析 / clip（painter 簇共享层） */

export const FALLBACK_DPR = 1

// —— 几何换算 ——

/** 读行集合：displayRows ?? records 缺省回退（中间态壳行为不变） */
export function rowsOf (state) {
  return state.displayRows ?? state.records
}

/** 行记录 key（选中判定与树形列箭头展开判定共用） */
export function recordKeyOf (state, record, row) {
  const { getRecordKey, keyField } = state

  return getRecordKey
    ? getRecordKey(record, row)
    : keyField
      ? record[keyField]
      : row
}

// 行几何直取 layout.rowGeometry（C4 删 WeakMap uniform 回退：layout 恒由
// relayout() 产出、恒携几何；缺失即 TypeError 快速暴露）

export function viewportColX (layout, col) {
  return (layout.colLefts[col] || 0) - (col < layout.fixedCount ? 0 : layout.scrollLeft)
}

export function viewportRowY (layout, row) {
  return layout.headHeight + layout.rowGeometry.topAt(row) - layout.scrollTop
}

/** 单元格视口矩形（interactions / editor / 自检共用；高度 = heightAt(row)） */
export function cellRectAt (layout, row, col) {
  return {
    x: viewportColX(layout, col),
    y: viewportRowY(layout, row),
    width: layout.colWidths?.[col] || 0,
    height: layout.rowGeometry.heightAt(row)
  }
}

/** 有效内容右缘视口 x（末列右缘；n=0 时 0）——格线/表头/hover/选中 cap 同源式
    （20261106-column-link-hover-button-value 轮 1 内联式收敛单一定义） */
export function contentRightXOf (layout) {
  const n = layout.colWidths.length

  return n ? viewportColX(layout, n - 1) + (layout.colWidths[n - 1] || 0) : 0
}

/** 有效内容底缘视口 y（末行底部；行满/溢出时 ≥ stickyHeight，min() 无操作；
    空表维持 stickyHeight 现状，decisions.md 裁定） */
export function contentBottomYOf (layout) {
  return layout.rowGeometry.rowCount > 0
    ? Math.min(
      layout.stickyHeight,
      layout.headHeight + layout.rowGeometry.totalHeight - layout.scrollTop
    )
    : layout.stickyHeight
}

export function viewColsRange (layout) {
  return { from: layout.viewCols.start, to: layout.viewCols.end }
}

/** layout.viewRows {start,end,count} → 区间 {from,to}（paintCellRange 入参形状） */
export function viewRowsRange (layout) {
  return { from: layout.viewRows.start, to: layout.viewRows.end }
}

// —— 选中判定（table.vue selectedRecKey/getRecordKey 语义） ——

export function isSelectedRow (state, row) {
  const { selectedKey } = state

  if (selectedKey == null) return false

  const record = rowsOf(state)?.[row]

  return record != null && recordKeyOf(state, record, row) === selectedKey
}

/** 非选中口径行底色（斑马/普通）——选中带延伸区补底与 rowBackground 共用，
    避免优先级链双源漂移（追加轮 2 需求 C） */
export function baseRowBackground (state, row) {
  return state.striped && row % 2 === 1 ? state.theme.bgStripe : state.theme.bgNormal
}

/** 行背景优先级：选中（--mu-primary-faint）> 斑马偶行（--mu-bg-stripe）> 普通 */
export function rowBackground (state, row) {
  if (isSelectedRow(state, row)) return state.theme.selectBg

  return baseRowBackground(state, row)
}

// —— 排序方向（table.vue:144-153 同款解析） ——

export function sortDirectionOf (orderBy) {
  if (!orderBy) return {}

  const [field, direction] = String(orderBy).replace(':', ' ').split(' ')

  return { [field]: direction === 'desc' ? 'down' : 'up' }
}

// —— clip / 擦除工具 ——

export function withClip (ctx, rect, fn) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect[0], rect[1], rect[2], rect[3])
  ctx.clip()
  fn()
  ctx.restore()
}

/** 擦除当前 clip 区域为透明，使半透明行底色与覆盖层的混色起点与整幅绘制一致 */
export function eraseClipRegion (ctx, rect) {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.fillRect(rect[0], rect[1], rect[2], rect[3])
  ctx.globalCompositeOperation = 'source-over'
}

export function isEmptyRange (range) {
  return !range || range.to <= range.from
}
