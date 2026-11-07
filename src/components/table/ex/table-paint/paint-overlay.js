/** 分区 5 覆盖层（hover 编辑感知/不可编辑灰描边/单元格选中描边/树箭头主色/编辑按钮） */
import { drawTreeArrow } from '../cell-paint/cell-painters.js'
import { drawIconGlyph } from '../cell-paint/icon-image.js'
import { editorRectOf, editorGridlineFlagsOf, editButtonRectOf } from '../editing/editor-geometry.js'
import { resolveIconEntry } from '../../column-types/icon'
import { expandableAt, isExpandedKey } from '../shared/tree.js'
import {
  TREE_INDENT,
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK,
  EDIT_BUTTON_AREA,
  EDIT_BUTTON_ICON_SIZE
} from '../shared/constants.js'
import { viewportColX, viewportRowY, contentRightXOf, contentBottomYOf, rowsOf, recordKeyOf, withClip } from './paint-utils'
import { regionAt, spanRectOf } from '../spans/spans.js'

// —— 分区 5：覆盖层 ——

/** 树箭头 hover 主色（A2.4）：hover 命中树形列父行格时，覆盖层以主色重画箭头
    三角盖住分区 1 的常态箭头；粒度为格级（槽位级命中需壳改动） */
function paintTreeArrowAccent (ctx, state) {
  const { hover, flatInfo, columns, theme } = state

  if (!hover || !flatInfo) return

  const column = columns?.[hover.col]

  if (!column?._isTreeColumn || !expandableAt(flatInfo, hover.row)) return

  const record = rowsOf(state)?.[hover.row]

  if (record == null) return

  const rowHeight = theme?.rowHeight || ROW_HEIGHT_FALLBACK
  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const level = flatInfo.levels?.[hover.row] ?? 0
  const x = viewportColX(state.layout, hover.col) + padding + level * TREE_INDENT
  // centerY = 首行行框槽位锚中点原式（cell-painters 内容锚四舍五入，差 0.5px）；
  // 不用 heightAt/2——超高行中两分区会错位出双层边
  const centerY = viewportRowY(state.layout, hover.row) + ROW_TOP_INSET + (rowHeight - ROW_TOP_INSET) / 2

  drawTreeArrow(
    ctx,
    x,
    centerY,
    isExpandedKey(state.expandedKeys, recordKeyOf(state, record, hover.row)),
    theme?.colors?.primary?.color ?? theme?.primaryColor
  )
}

function hoverModeShows (mode, kind) {
  return mode === kind || mode === 'cross'
}

// 行 hover 带（追加轮 2 需求 B）：宽 cap 至末列右缘视口 x——列少时不绘入末列
// 右缘以右的空白延伸区（R5 命中放行不变，仅收缩绘制矩形；列满/溢出时
// contentRightX >= stickyWidth，min() 无操作）。
// 合并区域（20261106-ex-fixed-select-hover-span 缺陷 2）：y/高取 hover 格
// spanRectOf 矩形（rowspan 区域 = 区域行区间；普通格退化 = 原式）
function paintHoverRow (ctx, layout, row, cellRect) {
  ctx.fillRect(0, cellRect ? cellRect.y : viewportRowY(layout, row),
    Math.min(layout.stickyWidth, contentRightXOf(layout)),
    cellRect ? cellRect.height : layout.rowGeometry.heightAt(row))
}

// 列 hover 带（追加轮 2 需求 B）：高 cap 至末行底部视口 y——行少时不绘入末行
// 底部以下（与格线 contentBottomY 同源式；行 hover 状态前提 rowCount > 0，
// contentBottomYOf 空表门控在此路径恒走有效分支）。
// 合并区域（缺陷 2 同上）：x/宽取 hover 格 spanRectOf 矩形（colspan 区域 = 区域
// 列区间；普通格退化 = viewportColX + colWidths 原式）
function paintHoverCol (ctx, layout, col, cellRect) {
  const yTo = contentBottomYOf(layout)

  ctx.fillRect(
    cellRect ? cellRect.x : viewportColX(layout, col),
    layout.headHeight,
    cellRect ? cellRect.width : (layout.colWidths[col] || 0),
    yTo - layout.headHeight
  )
}

/** hover 高亮矩形（fillStyle 由调用方预设为 hoverBg）：按模式与命中有效性。
    hover 格视口矩形统一取 spanRectOf（合并区域 = 区域包围盒，普通格退化 =
    cellRectAt 同式）：cell 模式整体高亮（§5.1）；row/column/cross 带几何随区域
    扩展（20261106-ex-fixed-select-hover-span 缺陷 2，带语义不变——row = 区域
    行全宽、column = 区域列全高，行带宽 cap 至末列右缘、列带高 cap 至末行底部
    维持，追加轮 2 需求 B） */
function paintHoverHighlight (ctx, layout, hover, mode, rowValid, colValid, spans) {
  const cellRect = rowValid && colValid
    ? spanRectOf(layout, hover.row, hover.col, spans)
    : null

  if (hoverModeShows(mode, 'row') && rowValid) paintHoverRow(ctx, layout, hover.row, cellRect)

  if (hoverModeShows(mode, 'column') && colValid) paintHoverCol(ctx, layout, hover.col, cellRect)

  if (mode === 'cell' && rowValid && colValid) {
    ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height)
  }
}

/** 可编辑格 hover 感知（A5.3）：1px 主色描边，矩形与编辑浮层盒 import 同一
    editorRectOf 同源同位（贴格线内侧，合并区域按区域矩形 + 区域外缘格线内缩）；
    不占布局、随 hover 带重绘生效 */
function paintHoverEditorStroke (ctx, state, hover) {
  if (!state.editable || !state.isCellEditableFn) return

  const column = state.columns?.[hover.col]

  if (!column || !state.isCellEditableFn(column)) return

  const { layout, spans } = state
  const region = regionAt(spans, hover.row, hover.col)
  const rect = editorRectOf(
    spanRectOf(layout, hover.row, hover.col, spans),
    editorGridlineFlagsOf({
      rowIndex: hover.row,
      colIndex: hover.col,
      colCount: layout.colWidths.length,
      stickyWidth: layout.stickyWidth,
      contentWidth: layout.contentWidth,
      gridlines: state.gridlines,
      rowFrom: region?.rowFrom,
      colTo: region?.colTo
    })
  )

  ctx.strokeStyle = state.theme.primaryColor
  ctx.lineWidth = 1
  // hover 描边固定列裁剪（20261106-ex-fixed-select-hover-span 人工修订 1 / 验收 4）：
  // 与 paintCellSelection 同源——滚动区格（col ≥ fixedCount）裁掉 [0, fixedWidth)，
  // 部分滚入固定列覆盖区时描边仅可见段绘制；y 取表体区（与外层 paintHoverOverlay
  // clip 交集冗余，独立成立）。合并区域恒不跨固定列边界，锚列归类即区域归类
  const clipX0 = hover.col < layout.fixedCount ? 0 : layout.fixedWidth

  withClip(
    ctx,
    [clipX0, layout.headHeight, layout.stickyWidth - clipX0, layout.stickyHeight - layout.headHeight],
    () => {
      ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1)
    }
  )
}

/** 不可编辑格 hover 感知（20261105-table-ex-cell-select 验收 1a）：1px 浅灰
    （borderColorSoft）描边，矩形链与 paintHoverEditorStroke 逐字同源；谓词与其
    绘制条件严格互补（可编辑格走蓝描边、此处不画灰，恒不同时触发，勿改写）——
    editable 全局关闭 = 全部列不可编辑，全格落灰描边；hoverMode none 随覆盖层抑制 */
function paintHoverPlainStroke (ctx, state, hover) {
  const column = state.columns?.[hover.col]

  if (state.editable && state.isCellEditableFn && column && state.isCellEditableFn(column)) return

  const { layout, spans } = state
  const region = regionAt(spans, hover.row, hover.col)
  const rect = editorRectOf(
    spanRectOf(layout, hover.row, hover.col, spans),
    editorGridlineFlagsOf({
      rowIndex: hover.row,
      colIndex: hover.col,
      colCount: layout.colWidths.length,
      stickyWidth: layout.stickyWidth,
      contentWidth: layout.contentWidth,
      gridlines: state.gridlines,
      rowFrom: region?.rowFrom,
      colTo: region?.colTo
    })
  )

  ctx.strokeStyle = state.theme.borderColorSoft
  ctx.lineWidth = 1
  // 固定列裁剪与 paintHoverEditorStroke 逐字同源（验收 4：灰描边同样仅可见段绘制）
  const clipX0 = hover.col < layout.fixedCount ? 0 : layout.fixedWidth

  withClip(
    ctx,
    [clipX0, layout.headHeight, layout.stickyWidth - clipX0, layout.stickyHeight - layout.headHeight],
    () => {
      ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1)
    }
  )
}

/** 选中格主色描边（20261105-table-ex-cell-select 验收 1b）：state.selectedCell 为
    锚格坐标（合并区域经 spanRectOf 取区域矩形 + 区域外缘格线内缩，与 hover 描边
    同源同位）；独立于 hover 反馈——hoverMode none 仅抑制 hover 覆盖层，选中照画；
    与 hover 描边同格叠加时本函数后画覆盖，最终观感为蓝；row/col 越界守卫
    （就地 splice 删行悬空索引不崩溃，行为与 hover 一致） */
function paintCellSelection (ctx, state) {
  const selected = state.selectedCell

  if (!selected) return

  const { layout, spans } = state
  const rowCount = rowsOf(state)?.length ?? 0
  const rowValid = selected.row >= 0 && selected.row < rowCount
  const colValid = selected.col >= 0 && selected.col < layout.colWidths.length

  if (!rowValid || !colValid) return

  const region = regionAt(spans, selected.row, selected.col)
  const rect = editorRectOf(
    spanRectOf(layout, selected.row, selected.col, spans),
    editorGridlineFlagsOf({
      rowIndex: selected.row,
      colIndex: selected.col,
      colCount: layout.colWidths.length,
      stickyWidth: layout.stickyWidth,
      contentWidth: layout.contentWidth,
      gridlines: state.gridlines,
      rowFrom: region?.rowFrom,
      colTo: region?.colTo
    })
  )

  ctx.strokeStyle = state.theme.primaryColor
  ctx.lineWidth = 1
  // 选中描边裁剪（20261106-ex-fixed-select-hover-span 缺陷 1）：overlay（分区 5）
  // 晚于固定列区（分区 3）绘制，滚动区选中格水平滚入固定列覆盖区后描边会压在固
  // 定列上——滚动区格（col ≥ fixedCount）裁掉 [0, fixedWidth)，固定列格 x0=0 不
  // 裁固定区；y 自 headHeight 起（选中格垂直滚入表头区为同类缺口，一并收敛，对
  // 齐 paintHoverOverlay 既有表体区 clip）
  const clipX0 = selected.col < layout.fixedCount ? 0 : layout.fixedWidth

  withClip(
    ctx,
    [clipX0, layout.headHeight, layout.stickyWidth - clipX0, layout.stickyHeight - layout.headHeight],
    () => {
      ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1)
    }
  )
}

/** 编辑按钮绘制（问题 5，覆盖层最上层）：hover 格所在列配 editButton.icon（注册
    名，resolveIconEntry 查表，未注册不绘制）时，经 editButtonRectOf 取区矩形
    （合并区域 = spanRectOf 区域矩形，§5.1）、drawIconGlyph 绘制（svg 走
    requestIconImage 缓存管线、cls 直绘注册表 glyph；色 = theme.textColor，尺寸 =
    EDIT_BUTTON_ICON_SIZE，x 左对齐区内 16px 槽、centerY = 区矩形中心），onLoad 经
    state.onImageLoad 转 invalidateCell；hoverMode none 随覆盖层抑制 */
function paintEditButton (ctx, state, hover) {
  const column = state.columns?.[hover.col]
  const icon = resolveIconEntry(column?.editButton?.icon)

  if (!icon) return

  const { theme } = state
  const rect = editButtonRectOf(
    spanRectOf(state.layout, hover.row, hover.col, state.spans),
    {
      padding: theme?.cellPadding || CELL_PADDING_FALLBACK,
      rowHeight: theme?.rowHeight || ROW_HEIGHT_FALLBACK
    }
  )

  drawIconGlyph(ctx, icon, {
    x: rect.x + (EDIT_BUTTON_AREA - EDIT_BUTTON_ICON_SIZE) / 2,
    centerY: rect.y + rect.height / 2,
    size: EDIT_BUTTON_ICON_SIZE,
    color: theme.textColor,
    onLoad: () => state.onImageLoad?.(hover.row, hover.col)
  })
}

/** hover 叠加：高亮底色 → 可编辑格描边（蓝）→ 不可编辑格描边（浅灰，谓词互补）→
    树箭头主色 → 编辑按钮（顺序固定）。
    统一裁剪到表体区：高亮矩形按视口 y 起画，行滚入表头后整幅绘制无外层收敛，
    半透明 hover 底色会叠上表头底色形成变色带（行带/列带/单格脏区路径外层 clip
    已收敛到表体区，此处裁剪对它们为冗余交集）；调宽参考线不在此函数，全高不受影响 */
function paintHoverOverlay (ctx, state, hover, mode) {
  const { layout, theme } = state
  const rowCount = rowsOf(state)?.length ?? 0
  const rowValid = hover.row >= 0 && hover.row < rowCount
  const colValid = hover.col >= 0 && hover.col < layout.colWidths.length

  ctx.fillStyle = theme.hoverBg

  withClip(ctx, [0, layout.headHeight, layout.stickyWidth, layout.stickyHeight - layout.headHeight], () => {
    paintHoverHighlight(ctx, layout, hover, mode, rowValid, colValid, state.spans)

    if (rowValid && colValid) {
      paintHoverEditorStroke(ctx, state, hover)

      paintHoverPlainStroke(ctx, state, hover)

      paintTreeArrowAccent(ctx, state)

      paintEditButton(ctx, state, hover)
    }
  })
}

export function paintOverlay (ctx, state) {
  const { layout, theme, hover } = state
  const mode = state.hoverMode || 'row'

  if (hover && mode !== 'none') paintHoverOverlay(ctx, state, hover, mode)

  // 选中格主色描边（独立于 hover 反馈；自带表体区裁剪）
  paintCellSelection(ctx, state)

  // 调宽拖拽参考线：1px 主色、全高（A2 分区 5）
  if (state.resizeGuideX != null) {
    ctx.fillStyle = theme.primaryColor
    ctx.fillRect(Math.round(state.resizeGuideX), 0, 1, layout.stickyHeight)
  }
}
