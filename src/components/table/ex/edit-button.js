/** 编辑按钮命中判定（pointer 光标覆盖与 click 派发共用，20261027 问题 5，
    20261105 收敛注册名图标）：列配 editButton.icon 且 resolveIconEntry 查表命中
    （未注册名两边一致判失败——不绘制、不命中）且指针落在 editButtonRectOf 区矩形
    内（半开区间，与 interactions.isItemRectHit 同口径）；区矩形 = spanRectOf
    （合并区域为区域矩形，§5.3），为 painter 绘制与壳命中共用的单一事实源 */
import { resolveIconEntry } from '../column-types/icon'
import { editButtonRectOf } from './editor'
import { spanRectOf } from './spans'

/**
 * @param {Object} hit hitTest 产出（消费 x/y/rowIndex/colIndex）
 * @param {Object} col 命中列（wiredColumns 项）
 * @param {Object} deps { layout, spans, snapshot }：壳侧 layout.value /
 *   spans.value / themeWatcher?.snapshot（原壳作用域直读改参数注入，逻辑逐字保留）
 */
export function isEditButtonHit (hit, col, { layout, spans, snapshot }) {
  if (!resolveIconEntry(col?.editButton?.icon)) return false

  const rect = editButtonRectOf(
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
