/** link/list 列竖排绘制 */
import { ellipsize, cellFontOf } from '../shared/text-wrap'
import { ELLIPSIS } from '../shared/constants'
import { measureOf, centeredTextAnchor, linkUnderlineY, cellLineHeightOf } from './cell-text'
import { isLinkEntryHovered, isTruthyAttr, linkHoverColorOf, linkTextColorOf } from './item-painters'

// —— link 列竖排（条目列，A3.5） ——

/** 竖排单条起点：按列 align 各自对齐（center 扣 rightInset、right 缘贴 padding，
    与 textAnchorX 同口径；对齐语义对齐 DOM 版 td 的 text-{align} 作用于每行
    inline 条目） */
function alignedEntryX (rect, align, width, padding, rightInset) {
  if (align === 'center') return rect.x + (rect.width - rightInset - width) / 2
  if (align === 'right') return rect.x + rect.width - padding - width
  return rect.x + padding
}

/** 单条 link 文本绘制（省略预处理产物入参，x 由调用方按 align 定位）：返回绘制
    宽度；hovered 时补画 1px 下划线 */
function drawLinkEntry (ctx, display, width, x, y, maxWidth, theme, color, hovered) {
  if (!display) return 0

  const drawn = Math.min(width, Math.max(0, maxWidth))

  ctx.font = cellFontOf(theme)
  ctx.fillStyle = color
  ctx.textAlign = 'left'

  const anchor = centeredTextAnchor(ctx, y)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(display, x, anchor.y)

  if (hovered) {
    ctx.fillRect(x, linkUnderlineY(anchor.y), drawn, 1)
  }

  return drawn
}

// link 列竖排（数组每条一行）：单条超宽省略；条目数 > maxItems 时第 maxItems 条
// 显示 '...'；首行槽位锚 + 后续行 += lineHeight；每条按列 align 各自对齐；
// 条目矩形（含 dots）经 onItemRect 回报（kind 'link'，携带 disabled）
export function drawLinkItems (ctx, rect, items, {
  align, padding, theme, maxItems, onItemRect, measure, centerY, hoverItem, rightInset
}) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !items.length) return

  const lineHeight = cellLineHeightOf(theme)
  const measureFn = measureOf(ctx, measure)
  const overflow = items.length > maxItems
  const shown = overflow ? items.slice(0, maxItems - 1) : items

  let y = centerY

  // 列内条目 link 门控基线（列级 column.link 语义：整列同值）；绘制层 dots 条目
  // 无 item，随列取首条目值（空集缺省 true，老式自定义条目集行为不变）
  const columnEntryLink = items.length ? items[0].link !== false : true

  const report = (index, x, width, disabled, entryLink) => {
    onItemRect?.({
      kind: 'link',
      index,
      rect: { x, y: y - lineHeight / 2, width, height: lineHeight },
      disabled,
      // link 门控布尔（item.link !== false 同 isLinkEntryHovered 谓词，光标/悬停消费）
      link: entryLink
    })
  }

  // 单条绘制：先省略测宽再按 align 定位（对齐需实宽参与），命中矩形 x 随对齐
  const drawEntry = (text, index, color, hovered, disabled, entryLink) => {
    const { text: display, width } = ellipsize({
      text,
      font: cellFontOf(theme),
      maxWidth: contentWidth,
      measure: measureFn
    })

    if (!display) return

    const x = alignedEntryX(rect, align, Math.min(width, contentWidth), padding, rightInset)
    const drawn = drawLinkEntry(ctx, display, width, x, y, contentWidth, theme, color, hovered)

    if (drawn > 0) report(index, x, drawn, disabled, entryLink)
  }

  for (let i = 0; i < shown.length; i++) {
    const item = shown[i]
    const hovered = isLinkEntryHovered(hoverItem, item, i)

    drawEntry(
      String(item.text ?? ''),
      i,
      hovered ? linkHoverColorOf(item, theme) : linkTextColorOf(item, theme),
      hovered,
      isTruthyAttr(item.disabled),
      item.link !== false
    )

    y += lineHeight
  }

  if (overflow) {
    drawEntry(ELLIPSIS, maxItems - 1, theme?.primaryColor, false, false, columnEntryLink)
  }
}
