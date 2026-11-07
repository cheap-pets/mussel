/** 编辑几何纯函数（editor.js 按关注点拆出，02-design.md O4）：编辑盒矩形 /
    格线占位标志 / 编辑按钮区矩形 / 浮层定位——paint（paint-overlay）与
    interaction（edit-button）层消费的跨模块共享原语。零 vue / form 依赖，
    仅镜像常量（constants.js）；定位所需布局数据由调用方传入 */
import {
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK,
  EDIT_BUTTON_AREA
} from '../shared/constants'

/** 编辑浮层盒矩形（单一事实源：hover 描边与浮层盒同源，painter import 同一函数）。
    按格线占位内缩：topGridline/rightGridline 标示本格被行线/列线占用，占用则盒缘退至格线内侧 1px */
export function editorRectOf (rect, { topGridline = false, rightGridline = false } = {}) {
  const topInset = topGridline ? 1 : 0
  const rightInset = rightGridline ? 1 : 0

  return {
    left: rect.x,
    top: rect.y + topInset,
    width: rect.width - rightInset,
    height: rect.height - topInset
  }
}

/** 本格格线占位标志（editorRectOf 入参；painter hover 描边与 computeEditorStyle 共用）。
    topGridline = rowFrom ≥ 1 且含 row（合并区域传区域首行，缺省回退 rowIndex——
    锚行即 rowFrom，显式化防锚点定义将来变化）；rightGridline = colTo 非末列
    （colspan 区域传区域右缘列号 colTo，缺省回退 colIndex + 1——区域右缘在末列时
    按锚列判定会误缩 1px，浮层与格线错位）（或末列但有空白区）且含 column */
export function editorGridlineFlagsOf ({
  rowIndex, colIndex, colCount, stickyWidth = 0, contentWidth = 0, gridlines, rowFrom, colTo
} = {}) {
  const mode = gridlines ?? 'all'
  const topAnchor = rowFrom ?? rowIndex
  const rightAnchor = colTo ?? (colIndex + 1)

  return {
    topGridline: topAnchor > 0 && (mode === 'all' || mode === 'row'),
    rightGridline: (rightAnchor < colCount || stickyWidth > (contentWidth || 0)) &&
      (mode === 'all' || mode === 'column')
  }
}

/** 编辑按钮区矩形（单一事实源：painter 绘制与壳命中共用）。右缘贴格内容区右缘，
    垂直中心 = 行线间空白中点原式（与单元格文字垂直锚同一槽位公式，不使用 rect.height） */
export function editButtonRectOf (
  rect,
  { padding = CELL_PADDING_FALLBACK, rowHeight = ROW_HEIGHT_FALLBACK } = {}
) {
  const centerY = rect.y + ROW_TOP_INSET + (rowHeight - ROW_TOP_INSET) / 2

  return {
    x: rect.x + rect.width - padding - EDIT_BUTTON_AREA,
    y: centerY - EDIT_BUTTON_AREA / 2,
    width: EDIT_BUTTON_AREA,
    height: EDIT_BUTTON_AREA
  }
}

/** 编辑浮层定位（矩形相对 __overlay 原点 = canvas 视口原点）：全编辑器类型共用同一
    矩形（与 hover 描边同源同位）；固定列不随滚动偏移；bordered：switch false / textarea true / 其余 border !== false。
    cellRect（§5.5）：合并区域主格由组件壳经 spans.spanRectOf 传入区域矩形（浮层
    覆盖整个合并区域），缺省按 colIndex/rowIndex 构造单格矩形（本模块不 import
    spans.js，保持模块隔离）；rowFrom/colTo 透传 editorGridlineFlagsOf（格线内缩按
    区域外缘） */
export function computeEditorStyle ({
  colIndex,
  rowIndex,
  colLefts,
  colWidths,
  headHeight = 0,
  scrollTop = 0,
  scrollLeft = 0,
  fixedCount = 0,
  rowGeometry,
  editorType = 'input',
  border = true,
  gridlines,
  stickyWidth = 0,
  contentWidth = 0,
  cellRect,
  rowFrom,
  colTo
} = {}) {
  const bordered = editorType === 'switch'
    ? false
    : (editorType === 'textarea' ? true : border !== false)

  const baseRect = cellRect ?? {
    x: colLefts[colIndex] - (colIndex < fixedCount ? 0 : scrollLeft),
    y: headHeight + rowGeometry.topAt(rowIndex) - scrollTop,
    width: colWidths[colIndex],
    height: rowGeometry.heightAt(rowIndex)
  }
  const rect = editorRectOf(baseRect, editorGridlineFlagsOf({
    rowIndex,
    colIndex,
    colCount: colWidths.length,
    stickyWidth,
    contentWidth,
    gridlines,
    rowFrom,
    colTo
  }))

  return {
    left: rect.left,
    top: rect.top,
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0),
    bordered
  }
}
