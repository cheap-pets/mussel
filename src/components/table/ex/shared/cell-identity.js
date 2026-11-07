/** 单元格身份与行序号共享纯函数（02-design.md O5 同源归一）。零内部依赖 */

/** 格身份相等（{ row, col } 两字段；双侧 null 归一——同 null 相等、单侧 null 不等）。
    单一事实源：use-pointer.isSameHover（hover 高亮去重）与 use-cell-tooltip.isSameCell
    （tooltip 去重）原逐字同源实现收敛至此。isSameHoverItem（use-pointer）比
    kind/index/disabled 五字段，语义不同，不并入本谓词 */
export function isSamePoint (prev, next) {
  if (prev == null || next == null) return (prev == null) === (next == null)

  return prev.row === next.row && prev.col === next.col
}

/** rec_no 行序号（1 起计）：偏移缺省归零 + 行号 + 1。单一事实源：原 10 处内联式
    `(recordsOffset || 0) + row + 1`（use-cell-click / use-cell-tooltip / paint-body /
    row-geometry-controller / cell-selection / spans-method）收敛至此；签名取数值
    偏移（调用侧 props / state / getter / 参数四形态，调用方先归一或传原值均可） */
export function recordNumberOf (recordsOffset, row) {
  return (recordsOffset || 0) + row + 1
}
