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
import { drawItems, itemClassOf, isLinkEntryHovered, linkHoverColorOf, linkTextColorOf } from './item-painters'
import { drawLinkItems } from './link-items'
import { drawProgress, drawButton } from './canvas-kind-painters'

// 视觉常量镜像 DOM 规格：check 方框 = column-types/style.scss .mu-table__cell-check
// （与表头 paint-header.js drawHeaderCheck 同规格，规格变更两处同步）；tag pill / button 图标规格常量见 constants.js

// —— canvas 落地 ——

// 绘制单个单元格内容（背景/网格线/hover 由 painter 负责，此函数只画内容）：
// onImageLoad 为 (row, colIndex) => void 处理器
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

  // 首行行框槽位：行线占用本格矩形顶部 1px，宽度不减（与估高同式）；
  // rightInset 不扣宽度，只参与水平居中锚
  const box = { ...rect, y: rect.y + ROW_TOP_INSET, height: rect.height - ROW_TOP_INSET }

  // 槽位中心（全文唯一垂直锚公式）：中点四舍五入取整（.5 恒向上，+0.01 浮点
  // 容差）；不使用 rect.height（超高行贴行顶）。合并区域主格传 regionHeight
  // 垂直居中于区域矩形，普通格仍按行高
  const centerY = Math.round(box.y + ((regionHeight ?? rowHeight) - ROW_TOP_INSET) / 2 + 0.01)

  // 合并主格内容行数上限绘制期求值（矩形已知），普通格不钳制
  const maxLines = capMaxLinesOf(col, record, regionHeight, padding, theme)

  ctx.font = cellFontOf(theme)
  ctx.textBaseline = 'middle'

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

  // canvas 专属分发：progress / button 真实绘制，非 items 产物
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
    padding, theme, measure, wrapCache, centerY, rightInset, maxLines,
    hoverItem, onItemRect
  )

  return content
}

/** 矩形缺失 / 零尺寸时跳过内容绘制（NaN 尺寸比较为 false，照常进入绘制） */
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
      onImageLoad,
      row,
      colIndex
    })
    return true
  }

  return false
}

// items 数组落地：单 item + line-clamp class 形态改道 drawText 多行（DOM 风格
// 兼容）；link 列 = 条目列竖排；其余横排。maxLines 由 drawCell 求值传入
// （合并主格已按区域行数钳制）
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

// text.link 格伪条目（isLinkEntryHovered 谓词入参：无 disabled、link !== false
// 恒真——门控已在 compile 产物 link === true 处完成）
const CELL_LINK_ITEM = { link: true }

// 纯文本格落地（text / 空组 button 占位等）。text.link 格与 DOM
// mu-table__cell-link 同口径：hover 时谱系悬停色 + 1px 下划线，恒回报
// kind:'link' 命中矩形（itemHits → updateHoverItem → applyItemCursor pointer；
// hoverMode 'none' 时 updateHoverItem 恒 null 自动抑制）；点击仍走 cell-click
// （text 格无 items，emitDomItemClick 判空短路，不发 cell-item-click）
function drawDisplayText (
  ctx, rect, content, col, record, placeholder,
  padding, theme, measure, wrapCache, centerY, rightInset, maxLines,
  hoverItem, onItemRect
) {
  const display = content.text ?? col.placeholder ?? placeholder

  if (display != null) {
    const isCellLink = content.link === true
    const hovered = isCellLink && isLinkEntryHovered(hoverItem, CELL_LINK_ITEM, 0)

    // link 格走条目口径取色（compile 已缺省 color || 'primary'）；非 link 路径：
    // 17 色板名 → colors 查表，未知名/缺省回退 textColor
    const color = isCellLink
      ? (hovered ? linkHoverColorOf : linkTextColorOf)({ color: content.color, link: true }, theme)
      : content.color && theme?.colors?.[content.color]?.color

    const block = drawTextValue(ctx, rect, display, col._align, {
      padding,
      theme,
      color,
      measure,
      wrapCache,
      maxLines,
      centerY,
      rightInset,
      underline: hovered
    })

    // 命中矩形恒发生（非仅 hover 时），矩形 = 实绘文本块行框（drawTextValue 返回值）
    if (isCellLink && block) {
      onItemRect?.({ kind: 'link', index: 0, rect: block, disabled: false, link: true })
    }
  }
}

// —— 树形列 ——

/** 树箭头三角绘制（形状单一事实源）：常态与 hover 两色共用 */
export function drawTreeArrow (ctx, x, centerY, expanded, color) {
  ctx.beginPath()

  if (expanded) {
    ctx.moveTo(x + 2, centerY - 3.5)
    ctx.lineTo(x + 10, centerY - 3.5)
    ctx.lineTo(x + 6, centerY + 3.5)
  } else {
    ctx.moveTo(x + 3, centerY - 5)
    ctx.lineTo(x + 3, centerY + 5)
    ctx.lineTo(x + 10, centerY)
  }

  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

// 树形列缩进与箭头：内容区前置 level×16 缩进 + 16px 箭头槽（可展开行三角 =
// hasChildren 或 isLeaf:false 懒节点；叶行空槽）；返回内容区应右移的 inset px
// （与行高估高扣减口径一致），非树形列/树关返回 0
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
