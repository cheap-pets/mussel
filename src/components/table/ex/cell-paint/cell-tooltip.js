/** 单元格 tooltip 求值（title 列协议） */
import {
  CHECK_SIZE,
  TAG_PADDING_X,
  BUTTON_ICON_SIZE,
  CELL_PADDING_FALLBACK
} from '../shared/constants'
import { cellFontOf, wrapLines } from '../shared/text-wrap'
import { resolveCellContent, capMaxLinesOf } from './cell-content'
import { resolveItemKind, itemClassOf, tagFontOf, imageLayoutSize } from './item-painters'
import { getImageEntry } from './icon-image'
import { resolveIconEntry } from '../../column-types/icon'
import { buttonHeightOf, EMPTY_BUTTON } from './canvas-kind-painters'

// 触发期惰性求值（绘制热路径零改动）：组件壳在 TOOLTIP_SHOW_DELAY 定时器内调用
// resolveCellTooltip，复用与绘制同一套原语（resolveCellContent / wrapLines /
// capMaxLinesOf / 测量与 wrapCache），溢出判定与绘制行为逐项等价，不引入第二套
// 测量式；img 条目只读缓存（getImageEntry），判定期不调用 requestImage、不发起加载

const TOOLTIP_NOOP = () => {}

/** tooltip 全文串：逐项 String 化、过滤空串后 '；' 连接（文本路径直接 String 化） */
function joinTooltipText (parts) {
  return parts.map(part => String(part ?? '')).filter(part => part !== '').join('；')
}

/** 条目宽（tooltip 只读口径，与 measureItem 同式）：check 计 CHECK_SIZE、tag 计
    pill 内边距、img 仅已加载计宽（未加载/失败/无 src 为 null，不计宽不计间隙）、
    未知条目为 null 不占位；每项 min(宽, contentWidth) */
function tooltipItemWidthOf (item, { contentWidth, contentHeight, padding, theme, measure }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return CHECK_SIZE

  if (kind === 'img') {
    const entry = getImageEntry(item.attrs?.src)

    return entry && entry.status === 'loaded'
      ? imageLayoutSize(entry.image, contentHeight - padding, contentWidth).width
      : null
  }

  if (kind == null) return null

  const text = String(item.text ?? '')
  const width =
    measure(text, kind === 'tag' ? tagFontOf(theme) : cellFontOf(theme)) +
    (kind === 'tag' ? TAG_PADDING_X * 2 : 0)

  return Math.min(width, contentWidth)
}

/** 横排条目溢出（drawItems 丢弃/截断行为等价式）：Σ 可见条目宽 +
    (可见条目数 − 1) × padding > 内容宽 */
function horizontalItemsOverflowOf (items, params) {
  const widths = items
    .map(item => tooltipItemWidthOf(item, params))
    .filter(width => width != null)
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    (widths.length > 1 ? (widths.length - 1) * params.padding : 0)

  return total > params.contentWidth
}

/** button 组溢出（drawButton 逐 pill 累加等价式）：x 越右缘 break / caption 空且
    无有效 icon 哨兵终止（其后仍有按钮 = 内容被丢弃）——形态互斥：caption 非空 →
    caption-only（icon 忽略不解析、零查表零 warn，计宽 = 内距 + caption 全文，
    超剩余即截断计溢出）；caption 空 → icon-only 固定宽（pill = controlHeightSmall
    快照 / link = 图标本体 12），放不下该条目不绘制终止计溢出；link 形态无 pill
    内边距、字体取正文（drawButton 同式切换） */
function buttonsOverflowOf (buttons, { contentWidth, padding, theme, measure, link }) {
  const font = link ? cellFontOf(theme) : tagFontOf(theme)
  const padX = link ? 0 : TAG_PADDING_X
  const buttonHeight = buttonHeightOf(theme)
  let consumed = 0

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i] ?? EMPTY_BUTTON
    const caption = String(button.caption ?? '')

    if (consumed >= contentWidth) return true

    if (caption !== '') {
      const width = padX * 2 + measure(caption, font)

      if (width > contentWidth - consumed) return true

      consumed += width + padding

      continue
    }

    const icon = button.icon ? resolveIconEntry(button.icon) : null

    if (!icon) return i < buttons.length - 1

    const width = link ? BUTTON_ICON_SIZE : buttonHeight

    if (consumed + width > contentWidth) return true

    consumed += width + padding
  }

  return false
}

/** 文本路径全文与溢出判定（drawTextValue 同式，source 恒为字符串——数组值已在
    resolveCellContent 门控）：按 maxLines 分多行 wrapLines clamped / 单行 measure
    对比（contentWidth ≤ 0 按溢出返回，绘制层不画的格子允许提示） */
function resolveTooltipText (col, record, source, {
  contentWidth, regionHeight, padding, theme, measure, wrapCache
}) {
  if (source == null) return null

  const text = String(source)

  if (text === '') return null

  const maxLines = capMaxLinesOf(col, record, regionHeight, padding, theme)
  const overflow = maxLines > 1
    ? wrapLines({
      text,
      font: cellFontOf(theme),
      maxWidth: contentWidth,
      measure,
      cache: wrapCache,
      maxLines
    }).clamped
    : measure(text, cellFontOf(theme)) > contentWidth

  return { content: text, overflowOnly: true, overflow }
}

/** true 形态 canvasKind button：全文 = caption join，溢出 = buttonsOverflowOf 逐 pill
    累加式（link 形态计宽随 content.link 切换） */
function resolveTooltipButtons (content, params) {
  const list = Array.isArray(content.buttons) ? content.buttons : []
  const text = joinTooltipText(list.map(button => button?.caption))

  if (text === '') return null

  return {
    content: text,
    overflowOnly: true,
    overflow: buttonsOverflowOf(list, { ...params, link: content.link === true })
  }
}

/** true 形态条目路径（drawContentItems 同分支序）：单条 line-clamp 改道文本 →
    link 列竖排 → 条目横排 */
function resolveTooltipItems (col, record, items, params) {
  const only = items[0]

  if (items.length === 1 && itemClassOf(only).includes('line-clamp') && only.text != null) {
    return resolveTooltipText(col, record, only.text, params)
  }

  const text = joinTooltipText(items.map(item => item?.text))

  if (text === '') return null

  if (col.type === 'link' || col.type === 'list') {
    return {
      content: text,
      overflowOnly: true,
      overflow:
        items.length > col._maxItems ||
        items.some(item => params.measure(String(item?.text ?? ''), cellFontOf(params.theme)) > params.contentWidth)
    }
  }

  return {
    content: text,
    overflowOnly: true,
    overflow: horizontalItemsOverflowOf(items, params)
  }
}

/** String | Function title：hover 即显示该文本（空串不显示，恒不判溢出） */
function resolveTooltipCustomTitle (col, record) {
  const text = String(col._title(record) ?? '')

  return text === '' ? null : { content: text, overflowOnly: false }
}

/**
 * 单元格 tooltip 求值（title 列协议）。内部先 resolveCellContent（只读，emit 传 noop）。
 * @param {Object} col prepareColumn 产物（读 col.title / col._title / col._maxItems /
 *   col._maxLines / col._resolveMaxLines / col.type）
 * @param {Object} params
 * @param {*} params.record 命中行记录（合并区域 = 锚行记录，hit 已归一）
 * @param {Number} params.recordNumber 含 recordsOffset 的显示行号
 * @param {Number} params.contentWidth 内容区宽（格宽 − padding×2 − 树列缩进，壳预算）
 * @param {Number} params.contentHeight 内容区高（格矩形高 − ROW_TOP_INSET，drawCell box 同式；
 *   仅 img 条目宽 imageLayoutSize 消费）
 * @param {Number|null} [params.regionHeight] 合并区域矩形高（钳制 maxLines，与绘制同式）
 * @param {Function} params.measure 测量回调（measureFn，走缓存）
 * @returns {{ content: String, overflowOnly: Boolean, overflow: Boolean } | null}
 *   无 title 配置 / progress・check・img / 全文为空 → null
 */
export function resolveCellTooltip (
  col,
  { record, recordNumber, contentWidth, contentHeight, regionHeight, theme, measure, wrapCache }
) {
  const raw = col.title

  // falsy（false/''/0/null/undefined）不生效（对齐 DOM 版 title 只对 truthy 生效，
  // 不得被 String(false) 成 'false'）
  if (!raw) return null

  if (raw !== true) return resolveTooltipCustomTitle(col, record)

  // true = 溢出才显示单元格全文：无可提示文本源的类型直接排除
  if (col.type === 'check') return null

  const content = resolveCellContent(col, { record, recordNumber, emit: TOOLTIP_NOOP })

  // 进度条无文本源（button 另行归一）
  if (content.canvasKind === 'progress') return null

  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const overflowParams = { contentWidth, contentHeight, padding, theme, measure }

  if (content.canvasKind === 'button') {
    return resolveTooltipButtons(content, overflowParams)
  }

  if (Array.isArray(content.items) && content.items.length) {
    return resolveTooltipItems(col, record, content.items, { ...overflowParams, regionHeight, wrapCache })
  }

  return resolveTooltipText(col, record, content.text, { ...overflowParams, regionHeight, wrapCache })
}
