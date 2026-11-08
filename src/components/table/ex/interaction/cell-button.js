/** 格按钮命中判定（pointer 光标覆盖与 click 派发共用）：列配 cellButton.icon
    且 resolveIconEntry 查表命中（未注册名两边一致判失败——不绘制、不命中）且
    指针落在 cellButtonRectOf 区矩形内（半开区间，与 click-resolve isItemRectHit
    同口径）；区矩形 = spanRectOf（合并区域为区域矩形），为 painter 绘制与
    壳命中共用的单一事实源。编辑态门控（A3）：编辑中格与同手势内刚 commit 的
    被编辑格均不命中（按钮未绘制，点击让位既有选中/编辑链；其余格不受影响） */
import { resolveIconEntry } from '../../column-types/icon'
import { cellButtonRectOf } from '../editing/editor-geometry'
import { isEditingCell } from './hit-test'
import { spanRectOf } from '../spans/spans'

/**
 * @param {Object} hit hitTest 产出（消费 x/y/rowIndex/colIndex）
 * @param {Object} col 命中列（wiredColumns 项）
 * @param {Object} deps { layout, spans, snapshot, editingCell, committedEditCell }：
 *   壳侧 layout.value / spans.value / themeWatcher?.snapshot；editingCell 为壳
 *   editingCellRef 快照（编辑中格不命中）；committedEditCell 为本手势 pointerdown
 *   commit 的被编辑格快照（click 决策链专用，光标路径不传）
 */
export function isCellButtonHit (hit, col, { layout, spans, snapshot, editingCell, committedEditCell }) {
  if (isEditingCell(editingCell, hit)) return false
  if (isEditingCell(committedEditCell, hit)) return false
  if (!resolveIconEntry(col?.cellButton?.icon)) return false

  const rect = cellButtonRectOf(
    spanRectOf(layout, hit.rowIndex, hit.colIndex, spans),
    {
      padding: snapshot?.cellPadding,
      rowHeight: snapshot?.rowHeight
    }
  )

  return (
    hit.x >= rect.x && hit.x < rect.x + rect.width &&
    hit.y >= rect.y && hit.y < rect.y + rect.height
  )
}
