/**
 * 单元格选中纯逻辑：复制排除类型清单 / 复制文本提取 / 方向键 clamp /
 * 选中格可见性滚动量。全纯函数、无壳状态（壳编排见 use-cell-select.js）。
 */
import { resolveCellContent } from '../cell-paint/cell-content'
import { recordNumberOf } from '../shared/cell-identity'

/** 复制排除类型（图形列无文本语义）：check / button / progress / img・image /
    icon。bool 列不入清单——canvas 渲染为文字（是/否），有可复制文本；
    图形列仍可选中，仅 Ctrl+C 不写剪贴板 */
export const CELL_COPY_EXCLUDED_TYPES = ['check', 'button', 'progress', 'img', 'image', 'icon']

/** 只读求值出口（cell-tooltip.js TOOLTIP_NOOP 同款）：复制不得触发列 render 内 emit */
const COPY_NOOP = () => {}

/**
 * 单元格复制文本：resolveCellContent 只读求值（emit noop），全文与 tooltip
 * content 同源。条目路径（tag/link/list）条目 text 以 '\n' 连接（与视觉行对应，
 * 含超限 dots）；多行文本不经 maxLines 截断。
 * @param {Object} params
 * @param {Array} params.columns prepareColumn 产物（壳 wiredColumns）
 * @param {Array} params.rows 行记录（壳 displayRows）
 * @param {Number} [params.recordsOffset=0] 含偏移的显示行号（recordNumber 同源）
 * @returns {String|null} null = 不写剪贴板（排除类型 / canvasKind / 空内容）
 */
export function resolveCellCopyText ({ columns, rows, row, col, recordsOffset = 0 }) {
  const column = columns?.[col]

  // 类型清单必须先于取值链：check 列 items 带 text: '✓'，只靠 items 分支会把图形列的 ✓ 复制出去
  if (!column || CELL_COPY_EXCLUDED_TYPES.includes(column.type)) return null

  const record = rows?.[row]

  if (record == null) return null

  const content = resolveCellContent(column, {
    record,
    recordNumber: recordNumberOf(recordsOffset, row),
    emit: COPY_NOOP
  })

  // canvasKind（progress / button 兜底形态）无文本语义
  if (content.canvasKind) return null

  if (Array.isArray(content.items)) {
    return content.items
      .map(item => item?.text)
      .filter(text => text != null && String(text) !== '')
      .map(String)
      .join('\n') || null
  }

  return content.text != null && String(content.text) !== '' ? String(content.text) : null
}

/** 方向键位移表（键面 → [dRow, dCol]） */
const MOVE_DELTAS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1]
}

/**
 * 方向键移动：clamp 到 [0, rowCount-1] × [0, colCount-1]，首末行列原地不动
 * （不环绕、不换行）；合并区域归一在壳 selectCell（归一后与当前相同即幂等返回）。
 * @param {Object} params
 * @param {String} params.key 键面（ArrowUp/Down/Left/Right，其余 → null）
 * @param {Number} params.rowCount 行数（≤ 0 → null）
 * @param {Number} params.colCount 列数（≤ 0 → null）
 * @returns {{ row: Number, col: Number } | null} null = 无操作
 */
export function resolveSelectionMove ({ row, col, key, rowCount, colCount }) {
  const delta = MOVE_DELTAS[key]

  if (!delta || !(rowCount > 0) || !(colCount > 0)) return null

  const nextRow = Math.min(Math.max(row + delta[0], 0), rowCount - 1)
  const nextCol = Math.min(Math.max(col + delta[1], 0), colCount - 1)

  return nextRow === row && nextCol === col ? null : { row: nextRow, col: nextCol }
}

/**
 * 选中格可见性滚动量：已可见返回 null；否则返回待赋值的
 * { scrollTop?, scrollLeft? }（非负，调用方直接赋 scrollEl）。
 * layout 为调用方传入的快照（host.layout.value 叠加 el 实时 scrollTop/scrollLeft，
 * 见 use-cell-select 契约——防连按时 layout 滚动值滞后误判「已可见」）；
 * 判定与取值为绝对式（不依赖当前 scroll 的增量）。
 * 固定列（col < fixedCount）恒可见，不产 scrollLeft。
 * @param {Object} layout relayout 产物快照（rowGeometry/colLefts/colWidths/
 *   fixedCount/fixedWidth/stickyWidth/viewH/scrollTop/scrollLeft）
 * @param {Number} row 目标行
 * @param {Number} col 目标列
 * @returns {Object|null}
 */
export function resolveSelectionScroll (layout, row, col) {
  if (!layout) return null

  const { scrollTop = 0, scrollLeft = 0, viewH = 0, stickyWidth = 0, fixedWidth = 0 } = layout
  const { fixedCount = 0, colLefts = [], colWidths = [] } = layout
  const top = layout.rowGeometry.topAt(row)
  const height = layout.rowGeometry.heightAt(row)
  const result = {}

  if (top < scrollTop) {
    result.scrollTop = top
  } else if (top + height > scrollTop + viewH) {
    result.scrollTop = Math.max(0, top + height - viewH)
  }

  if (col >= fixedCount) {
    const left = colLefts[col] || 0
    const width = colWidths[col] || 0
    const vx = left - scrollLeft

    if (vx < fixedWidth) {
      result.scrollLeft = Math.max(0, left - fixedWidth)
    } else if (vx + width > stickyWidth) {
      result.scrollLeft = Math.max(0, left + width - stickyWidth)
    }
  }

  return Object.keys(result).length ? result : null
}
