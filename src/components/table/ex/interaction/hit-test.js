/**
 * table-ex 指针命中域决策：hitTest 命中检测 + resolveCursor 光标判定 +
 * resolvePointerdown 按下决策 + resolveTooltipTarget tooltip 门控。只含纯
 * 决策函数，不绑定任何事件——DOM 接线（监听、emit 执行、重绘）由组件壳
 * （table-ex.vue）完成；click 分支决策见 click-resolve.js，调宽 clamp 见
 * resize-resolve.js。
 *
 * 坐标口径（与 layout.js 一致）：x/y 为相对 canvas 视口的坐标
 * （getBoundingClientRect 差值换算，不用 offsetX）。
 */
import { colAt, findResizeColumn, rowAt } from '../geometry/layout'
import { expandableAt } from '../shared/tree'
import { TREE_INDENT, CELL_PADDING_FALLBACK } from '../shared/constants'

/** 列区右缘视口 x（scrollLeft=0 且总宽 < 视口宽时，右侧有格线的行背景空白延伸区） */
function contentRightEdgeX (colLefts, colWidths, scrollLeft) {
  const n = colLefts.length

  if (!n) return 0

  return colLefts[n - 1] + (colWidths[n - 1] || 0) - scrollLeft
}

/**
 * 命中检测：指针坐标 → 表头/行列/调宽手柄。调宽手柄仅在表头区检测，
 * 固定列排除与列级 resizable 判定在 findResizeColumn 内。
 *
 * 合并单元格归一不在本模块——组件壳在 hitAt 出口统一调 spans.resolveSpanCell
 * （cellX/x/y 契约见 spans.js）；本模块决策函数消费归一后与原始 hit 均等价，
 * 树槽判定按壳契约用原始 hit。
 *
 * @param {Number} [params.headHeight=0] y < headHeight 判入表头区
 * @param {Number} [params.scrollTop=0] 垂直滚动偏移（rowAt 行定位）
 * @param {Number} [params.scrollLeft=0] 水平滚动偏移（滚动区列位移）
 * @param {Number[]} params.colLefts 列前缀和
 * @param {Number[]} params.colWidths 列宽数组（beyondCols 空白延伸区判定）
 * @param {Array} params.columns 列定义（读取列级 resizable）
 * @param {Number} [params.fixedLeftColumns=0] 固定列数（固定列不随滚动位移）
 * @param {Boolean} [params.resizable=false] 表格级调宽开关
 * @param {Number} [params.cellPadding=8] 内容区 padding（cellX 扣减）
 * @param {Object} params.rowGeometry 行几何实例，必传（行定位一律经几何
 *   offsetToRow，无等高回退）
 * @returns {{ isHeader: Boolean, colIndex: Number, rowIndex: Number, resizeCol: Number,
 *   x: Number, y: Number, cellX: Number|null, beyondCols: Boolean }}
 *   colIndex/rowIndex 越界（表头区/数据区外）为 -1；resizeCol 无手柄为 -1；
 *   x/y 为输入指针坐标透传（resolveItemClick 条目矩形反查用）；cellX = 指针相对
 *   命中列【内容区左缘】的偏移（列缘偏移再减 padding——树槽判定
 *   cellX < level×16+16 与绘制侧 padding 起画同口径），colIndex < 0 时为 null；
 *   beyondCols = 表体行有效但 x 越出列区右缘（列宽总和小于表格宽时的空白
 *   延伸区，该区域行 hover 高亮与点击选中经此放行）
 */
export function hitTest ({
  x,
  y,
  headHeight = 0,
  scrollTop = 0,
  scrollLeft = 0,
  colLefts,
  colWidths,
  columns,
  fixedLeftColumns = 0,
  resizable = false,
  cellPadding = CELL_PADDING_FALLBACK,
  rowGeometry
}) {
  const isHeader = y < headHeight
  const colIndex = colAt(x, { scrollLeft, colLefts, colWidths, fixedLeftColumns })
  const rowIndex = rowAt(y, { headHeight, scrollTop, rowGeometry })
  const resizeCol = isHeader
    ? findResizeColumn({ x, scrollLeft, colLefts, colWidths, columns, fixedLeftColumns, resizable })
    : -1

  // 与 painter viewportColX 同式
  const cellX = colIndex >= 0
    ? x - (colLefts[colIndex] - (colIndex < fixedLeftColumns ? 0 : scrollLeft)) - cellPadding
    : null

  const beyondCols = !isHeader && rowIndex >= 0 && colIndex < 0 &&
    x >= contentRightEdgeX(colLefts ?? [], colWidths ?? [], scrollLeft)

  return { isHeader, colIndex, rowIndex, resizeCol, x, y, cellX, beyondCols }
}

/**
 * 树箭头槽命中判定（resolveTreeToggle 与 resolveCursor 共用）：树平铺中 +
 * 命中列为树形列 + 该行可展开（hasChildren 或 isLeaf:false 懒节点）+
 * hit.cellX 在箭头槽内（cellX < level×16+16，内容区相对口径）。
 *
 * @param {Object} params.hit hitTest 产出（消费 cellX）
 * @param {Array} params.columns 已准备内部列（消费 _isTreeColumn 标记）
 * @param {Object|null} [params.flatInfo] 树平铺信息 { levels, expandable }（树关 = null；
 *   旧形态无 expandable 时回退 hasChildren）
 * @returns {Boolean}
 */
export function isTreeArrowSlot ({ hit, columns, flatInfo }) {
  if (!flatInfo || !hit || hit.isHeader || hit.colIndex < 0 || hit.rowIndex < 0) return false
  if (!columns?.[hit.colIndex]?._isTreeColumn) return false
  if (!expandableAt(flatInfo, hit.rowIndex)) return false

  const level = flatInfo.levels?.[hit.rowIndex] ?? 0

  return hit.cellX != null && hit.cellX < level * TREE_INDENT + TREE_INDENT
}

/** 表头可排序列命中（排序 pointer 判定用） */
function isSortableHeader (hit, columns) {
  return hit.isHeader && hit.colIndex >= 0 && Boolean(columns?.[hit.colIndex]?.sortable)
}

/** 表体可编辑格命中：editable 开 + 该列存在 + isCellEditableFn 判定可编辑 */
function isEditableCell (hit, columns, deps) {
  if (hit.isHeader || hit.colIndex < 0 || !deps.editable) return false

  const column = columns?.[hit.colIndex]

  return Boolean(column && deps.isCellEditableFn?.(column))
}

/**
 * 指针光标判定：手柄 col-resize > 可排序列/树箭头槽 pointer > 可编辑格 text >
 * default。deps 缺省时行为与两参签名一致（回归安全）。
 *
 * @param {Object} hit hitTest 产出（含 cellX）
 * @param {Array} columns 列定义（读取列级 sortable / _isTreeColumn）
 * @param {Object} [deps] { flatInfo, editable, isCellEditableFn }
 * @returns {String} 'col-resize' | 'pointer' | 'text' | 'default'
 */
export function resolveCursor (hit, columns, deps = {}) {
  if (hit.resizeCol >= 0) return 'col-resize'
  if (isSortableHeader(hit, columns)) return 'pointer'
  if (isTreeArrowSlot({ hit, columns, flatInfo: deps.flatInfo })) return 'pointer'
  if (isEditableCell(hit, columns, deps)) return 'text'

  return 'default'
}

/**
 * 画布 pointerdown 决策：editing 中不屏蔽命中——先同步 commit 当前编辑再继续
 * 正常命中处理（点击其他单元格一步完成「提交 + 选中新行」）；startResize =
 * 命中表头调宽手柄（壳据此绑 window 级 pointermove/pointerup）；committedEditCell
 * = commit 前被编辑格快照（editingCellRef 由 veil 清理 watcher 在微任务中清空，
 * 晚于本决策的同手势 click 链须凭本快照抑制被编辑格格按钮，A3）。
 *
 * @param {Object} [params.editing] 当前编辑状态（编辑中为非空）
 * @param {Object|null} [params.editingCell] 编辑格行列 { row, col }（壳 editingCellRef）
 * @param {Object} params.hit hitTest 产出
 * @returns {{ commitEditing: Boolean, committedEditCell: Object|null, startResize: Boolean }}
 */
export function resolvePointerdown ({ editing, editingCell, hit }) {
  return {
    commitEditing: Boolean(editing),
    committedEditCell: editing ? editingCell ?? null : null,
    startResize: Boolean(hit?.resizeCol >= 0)
  }
}

/** 表体有效格命中（非表头且行列均有效；beyondCols 的 col=-1 不算） */
function isBodyCellHit (hit) {
  return Boolean(hit) && !hit.isHeader && hit.colIndex >= 0 && hit.rowIndex >= 0
}

/** 格编辑中判定（editingCell 为壳持有的编辑格行列 { row, col }；消费方：tooltip
    门控与格按钮命中门控 cell-button.js） */
export function isEditingCell (editingCell, hit) {
  return Boolean(editingCell) &&
    editingCell.row === hit.rowIndex &&
    editingCell.col === hit.colIndex
}

/**
 * tooltip 触发门控（title 列协议）：hoverMode 'none' / 拖拽中 / 表头 / 行列越界
 * （含 beyondCols 的 col=-1）/ 命中列无 truthy title / 编辑中格 → null；否则
 * { row, col }（hit 已经 resolveSpanCell 归一，合并区域即锚格）。
 *
 * @param {Object} params.hit hitTest 产出（hitAt 出口归一后的 hit）
 * @param {Array} params.columns 已准备内部列（wiredColumns，读取列级 title）
 * @param {String} [params.hoverMode] hoverMode prop（'none' 时 hover 通道同门控抑制）
 * @param {Object|null} [params.editingCell] 编辑中格 { row, col }（编辑格不提示）
 * @param {Boolean} [params.resizing=false] 列宽拖拽中
 * @returns {{ row: Number, col: Number } | null}
 */
export function resolveTooltipTarget ({ hit, columns, hoverMode, editingCell, resizing = false } = {}) {
  if (!isBodyCellHit(hit) || hoverMode === 'none' || resizing) return null
  if (isEditingCell(editingCell, hit)) return null
  if (!columns?.[hit.colIndex]?.title) return null

  return { row: hit.rowIndex, col: hit.colIndex }
}
