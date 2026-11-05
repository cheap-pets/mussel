/** table-ex 单元格绘制适配器：复用 table 列类型体系，把列类型 render 产物（text / items）落地为 canvas 绘制 */
import {
  TREE_INDENT,
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK
} from '../shared/constants'
import { cellFontOf } from '../shared/text-wrap'
import { expandableAt, isExpandedKey } from '../shared/tree'
import { resolveCellContent, capMaxLinesOf } from './cell-content'
import { drawTextValue } from './cell-text'
import { drawItems, itemClassOf } from './item-painters'
import { drawLinkItems } from './link-items'
import { drawProgress, drawButton } from './canvas-kind-painters'

// —— 视觉常量（镜像现有 DOM 规格，非新增设计值）——
// check 方框 —— column-types/style.scss .mu-table__cell-check（与表头
// painter.drawHeaderCheck 同规格，规格变更两处同步）；tag pill / button 图标
// 规格常量见 constants.js（拆分后跨文件共享）

// —— canvas 落地 ——

// 绘制单个单元格内容（背景/网格线/hover 由 painter 负责此函数只画内容）：
// onImageLoad 为 (row, colIndex) => void 处理器，仅 img 消费分支内创建闭包（P1b）
export function drawCell (ctx, {
  col,
  record,
  recordNumber,
  emit,
  rect,
  theme,
  onImageLoad,
  row,
  colIndex,
  flatInfo,
  expandedKeys,
  recordKey,
  measure,
  wrapCache,
  onItemRect,
  placeholder,
  rightInset = 0,
  hoverItem,
  regionHeight
}) {
  const content = resolveCellContent(col, { record, recordNumber, emit })

  if (isSkippableRect(rect)) return content

  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const rowHeight = theme?.rowHeight || ROW_HEIGHT_FALLBACK

  // 首行行框槽位（问题 1）：行线占用本格矩形顶部 1px；宽度不减（与估高同式）；
  // rightInset 不扣宽度，只参与水平居中锚
  const box = { ...rect, y: rect.y + ROW_TOP_INSET, height: rect.height - ROW_TOP_INSET }

  // 槽位中心（全文唯一垂直锚公式）：中点四舍五入取整（.5 恒向上，+0.01 浮点
  // 容差）；不使用 rect.height（超高行贴行顶）。合并区域主格传 regionHeight
  // （§5.1 垂直居中于区域矩形，单行退化与原式一致），普通格仍按行高
  const centerY = Math.round(box.y + ((regionHeight ?? rowHeight) - ROW_TOP_INSET) / 2 + 0.01)

  // 合并主格内容行数上限（§5.1）：min(maxLines, floor((regionH − padding×2) /
  // lineHeight))，绘制期求值（矩形已知），普通格不钳制
  const maxLines = capMaxLinesOf(col, record, regionHeight, padding, theme)

  ctx.font = cellFontOf(theme)
  ctx.textBaseline = 'middle'

  // 树形列（A2.4/A3.4）：内容区前置 level×16 缩进 + 16px 箭头槽
  const inset = drawTreeAffordance(ctx, box, {
    col,
    row,
    flatInfo,
    expandedKeys,
    recordKey,
    padding,
    theme,
    centerY
  })

  const contentRect = inset
    ? { ...box, x: box.x + inset, width: box.width - inset }
    : box

  // canvas 专属分发（A3.3）：progress / button 真实绘制，非 items 产物
  if (drawCanvasKindContent(
    ctx, contentRect, content, col, padding, theme, record, measure, onItemRect, centerY, hoverItem, rightInset,
    onImageLoad, row, colIndex
  )) {
    return content
  }

  if (Array.isArray(content.items) && content.items.length) {
    drawContentItems(
      ctx, contentRect, content, col, record,
      padding, theme, measure, wrapCache, onItemRect, onImageLoad,
      centerY, rightInset, hoverItem, row, colIndex, maxLines
    )

    return content
  }

  drawDisplayText(
    ctx, contentRect, content, col, record, placeholder,
    padding, theme, measure, wrapCache, centerY, rightInset, maxLines
  )

  return content
}

/** 矩形缺失 / 零尺寸（NaN 尺寸照常进入绘制，与原实现一致）时跳过内容绘制 */
function isSkippableRect (rect) {
  return !rect || rect.width <= 0 || rect.height <= 0
}

function drawCanvasKindContent (
  ctx, rect, content, col, padding, theme, record, measure, onItemRect, centerY, hoverItem, rightInset,
  onImageLoad, row, colIndex
) {
  if (content.canvasKind === 'progress') {
    drawProgress(ctx, rect, content, { padding, theme, record, measure, centerY })
    return true
  }

  if (content.canvasKind === 'button') {
    drawButton(ctx, rect, content, {
      align: col._align,
      padding,
      theme,
      record,
      onItemRect,
      measure,
      centerY,
      hoverItem,
      rightInset,
      // svg 图标异步加载后 invalidate 该格（与 drawItems 同款钩子透传）
      onImageLoad,
      row,
      colIndex
    })
    return true
  }

  return false
}

// items 数组落地：单 item + line-clamp class 形态改道 drawText 多行（A3.5 DOM 风格
// 兼容）；link 列 = 条目列竖排；其余横排。maxLines 由 drawCell 求值传入
// （合并主格已按区域行数钳制，§5.1）
function drawContentItems (
  ctx, rect, content, col, record,
  padding, theme, measure, wrapCache, onItemRect, onImageLoad,
  centerY, rightInset, hoverItem, row, colIndex, maxLines
) {
  if (content.items.length === 1) {
    const only = content.items[0]

    if (itemClassOf(only).includes('line-clamp') && only.text != null) {
      drawTextValue(ctx, rect, only.text, col._align, {
        padding,
        theme,
        measure,
        wrapCache,
        maxLines,
        centerY,
        rightInset
      })

      return
    }
  }

  // link/list 条目列竖排（list 兼容链路：canvas 产物 kind 恒 'link'，绘制零新增分支）
  if (col.type === 'link' || col.type === 'list') {
    drawLinkItems(ctx, rect, content.items, {
      align: col._align,
      padding,
      theme,
      maxItems: col._maxItems,
      onItemRect,
      measure,
      centerY,
      hoverItem,
      rightInset
    })

    return
  }

  drawItems(ctx, rect, content.items, {
    align: col._align,
    padding,
    theme,
    onImageLoad,
    onItemRect,
    measure,
    centerY,
    rightInset,
    hoverItem,
    row,
    colIndex
  })
}

function drawDisplayText (
  ctx, rect, content, col, record, placeholder,
  padding, theme, measure, wrapCache, centerY, rightInset, maxLines
) {
  const display = content.text ?? col.placeholder ?? placeholder

  if (display != null) {
    // canvas 通道 color 直取（17 色板名 → colors 查表）；未知名/缺省回退 textColor
    const color = content.color && theme?.colors?.[content.color]?.color

    drawTextValue(ctx, rect, display, col._align, {
      padding,
      theme,
      color,
      measure,
      wrapCache,
      maxLines,
      centerY,
      rightInset
    })
  }
}

// —— 树形列（A2.4/A3.4） ——

/** 树箭头三角绘制（形状单一事实源）：常态 textColor 与 hover 主色（painter 分区 5）共用 */
export function drawTreeArrow (ctx, x, centerY, expanded, color) {
  ctx.beginPath()

  if (expanded) {
    // 展开 ▾（下指三角）
    ctx.moveTo(x + 2, centerY - 3.5)
    ctx.lineTo(x + 10, centerY - 3.5)
    ctx.lineTo(x + 6, centerY + 3.5)
  } else {
    // 收起 ▸（右指三角）
    ctx.moveTo(x + 3, centerY - 5)
    ctx.lineTo(x + 3, centerY + 5)
    ctx.lineTo(x + 10, centerY)
  }

  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

// 树形列缩进与箭头：内容区前置 level×16 缩进 + 16px 箭头槽（可展开行三角——
// hasChildren 或 isLeaf:false 懒节点，20261029 问题 3；叶行空槽）；
// 返回内容区应右移的 inset px（与行高估高扣减口径一致），非树形列/树关返回 0
function drawTreeAffordance (ctx, rect, { col, row, flatInfo, expandedKeys, recordKey, padding, theme, centerY }) {
  if (!col._isTreeColumn || !flatInfo) return 0

  const level = flatInfo.levels?.[row] ?? 0

  if (expandableAt(flatInfo, row)) {
    drawTreeArrow(
      ctx,
      rect.x + padding + level * TREE_INDENT,
      centerY,
      isExpandedKey(expandedKeys, recordKey),
      theme?.textColor
    )
  }

  return level * TREE_INDENT + TREE_INDENT
}

// —— 簇内拆分后的导出面（demo 自检 / painter / table-ex.vue 消费路径不变）——

export { prepareColumn, resolveCellContent, capMaxLinesOf } from './cell-content'
export { getImageEntry, requestIconImage, drawIconGlyph } from './icon-image'
export { linkHoverColorOf } from './item-painters'
export { resolveCellTooltip } from './cell-tooltip'
