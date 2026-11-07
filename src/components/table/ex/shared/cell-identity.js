/** 单元格身份与行序号共享纯函数。零内部依赖 */

/** 格身份相等（{ row, col } 两字段；双侧 null 归一——同 null 相等、单侧 null 不等）。
    单一事实源：use-pointer.isSameHover（hover 去重）与 use-cell-tooltip.isSameCell
    （tooltip 去重）收敛至此；isSameHoverItem 比五字段语义不同，不并入 */
export function isSamePoint (prev, next) {
  if (prev == null || next == null) return (prev == null) === (next == null)

  return prev.row === next.row && prev.col === next.col
}

/** rec_no 行序号（1 起计）：偏移缺省归零 + 行号 + 1。单一事实源：原 10 处内联式
    `(recordsOffset || 0) + row + 1` 收敛至此；偏移取数值，调用方先归一或传原值均可 */
export function recordNumberOf (recordsOffset, row) {
  return (recordsOffset || 0) + row + 1
}
