/** 横排条目绘制与命中矩形：check/tag/img/icon/link/text 条目、条目色板 */
import {
  CHECK_SIZE,
  CHECK_RADIUS,
  CHECK_FONT_SIZE,
  TAG_HEIGHT,
  TAG_PADDING_X,
  TAG_RADIUS
} from '../shared/constants'
import { ellipsize, cellFontOf } from '../shared/text-wrap'
import { fontFamilyOf, measureOf, centeredTextAnchor, centeredGlyphAnchor, linkUnderlineY, cellLineHeightOf } from './cell-text'
import { requestImage, drawIconGlyph } from './icon-image'

// 条目字体 12px（镜像 tag.scss font-size；单文件消费，不入 constants）
const TAG_FONT_SIZE = 12

// —— items 落地 ——

export function itemClassOf (item) {
  const cls = item.attrs?.class

  return Array.isArray(cls) ? cls.join(' ') : String(cls ?? '')
}

/** 条目落地类别：canvas 产物自带 kind（link/tag）；check/img/link/tag 走 is/class
    回退；未识别 is 且 text != null 按文本绘制，无文本的未知条目忽略 */
export function resolveItemKind (item) {
  if (item.kind) return item.kind

  const cls = itemClassOf(item)

  if (cls.includes('mu-table__cell-check')) return 'check'
  if (item.is === 'img') return 'img'
  if (item.is === 'a') return 'link'
  if (cls.includes('mu-tag')) return 'tag'

  return item.text != null ? 'text' : null
}

/** link 条目色板解析：item.color 色名查表优先，item.danger 回退（老式自定义
    kind:'link' 条目）；无 color/danger 返回 null */
function linkPaletteOf (item, theme) {
  const palette = item.color ? theme?.colors?.[item.color] : null

  if (palette) return palette

  return item.danger ? theme?.colors?.danger : null
}

/** link 条目文本色：disabled → muted；color 色名查表（danger 回退）；无 color 时
    非 link 项（list 纯文本条目 link:false）取 textColor，其余取 colors.primary 谱系 */
export function linkTextColorOf (item, theme) {
  if (isTruthyAttr(item.disabled)) return theme?.textColorMuted || theme?.gray

  if (item.link === false) return theme?.textColor

  const palette = linkPaletteOf(item, theme) ?? theme?.colors?.primary

  return palette?.color ?? theme?.primaryColor
}

/** link 条目悬停色：disabled → muted；color 色名查表 hover 谱系（danger 回退）；
    无 color 时非 link 项 textColor（hover 门控下不达，防御回退），其余
    colors.primary 谱系 hover ?? color ?? primaryColor */
export function linkHoverColorOf (item, theme) {
  if (isTruthyAttr(item.disabled)) return theme?.textColorMuted || theme?.gray

  if (item.link === false) return theme?.textColor

  const palette = linkPaletteOf(item, theme) ?? theme?.colors?.primary

  return palette?.hover ?? palette?.color ?? theme?.primaryColor
}

// items 行绘制：超出右缘的条目丢弃；link/tag 条目矩形经 onItemRect 回报
// （painter itemHits 命中来源）
export function drawItems (ctx, rect, items, {
  align, padding, theme, onImageLoad, onItemRect, measure, centerY, rightInset, hoverItem, row, colIndex
}) {
  const gap = padding
  const contentWidth = rect.width - padding * 2

  const hooks = { contentWidth, contentHeight: rect.height, padding, theme, onImageLoad, measure, row, colIndex }
  const widths = items.map(item => measureItem(ctx, item, hooks))

  const { positions, offset, visible } = layoutItemPositions(items, widths, gap)

  // 内容超宽时回退左对齐（溢出部分被右缘丢弃，不向两侧外溢）
  const start = itemsStartX(rect, align, padding, offset, visible, contentWidth, rightInset)
  const rightBound = rect.x + rect.width - padding

  for (let i = 0; i < items.length; i++) {
    if (positions[i] == null) continue

    const x = start + positions[i]

    if (x >= rightBound) break

    const width = Math.min(widths[i], rightBound - x)

    drawItem(ctx, items[i], x, centerY, {
      maxWidth: rightBound - x,
      contentHeight: rect.height,
      padding,
      theme,
      onImageLoad,
      measure,
      index: i,
      hoverItem,
      row,
      colIndex
    })

    // 命中矩形 = 绘制区域（纵向随条目形态，横向随实绘宽）
    if (onItemRect) reportHitRect(onItemRect, items[i], i, x, width, centerY, theme)
  }
}

/** 逐条目横向起点：测量失败条目 null 跳过不占位 */
function layoutItemPositions (items, widths, gap) {
  const positions = []
  let offset = 0
  let visible = false

  for (let i = 0; i < items.length; i++) {
    if (widths[i] == null) {
      positions.push(null)
      continue
    }

    if (visible) offset += gap

    positions.push(offset)
    offset += widths[i]
    visible = true
  }

  return { positions, offset, visible }
}

/** items 整体起点：未超宽按列 align 分布（center 扣 rightInset），超宽回退左对齐 */
export function itemsStartX (rect, align, padding, offset, visible, contentWidth, rightInset) {
  let start = rect.x + padding

  if (visible && offset < contentWidth) {
    if (align === 'center') start = rect.x + (rect.width - rightInset - offset) / 2
    else if (align === 'right') start = rect.x + rect.width - padding - offset
  }

  return start
}

// tag/link 条目命中矩形回报（其余类别不回报）：命中区 = 绘制区（tag pill 区、
// link 首行行框）；disabled 随条目回报（isTruthyAttr 同口径）；link 附 link 门控
// 布尔（item.link !== false，interactions 光标/悬停消费，与 isLinkEntryHovered 同谓词）
function reportHitRect (onItemRect, item, index, x, width, centerY, theme) {
  const kind = resolveItemKind(item)
  let rect = null

  if (kind === 'tag') {
    rect = { x, y: centerY - TAG_HEIGHT / 2, width, height: TAG_HEIGHT }
  } else if (kind === 'link') {
    const lineHeight = cellLineHeightOf(theme)

    rect = { x, y: centerY - lineHeight / 2, width, height: lineHeight }
  }

  if (rect) {
    onItemRect({
      kind,
      index,
      rect,
      disabled: isTruthyAttr(item.disabled),
      ...(kind === 'link' ? { link: item.link !== false } : null)
    })
  }
}

/** img 条目宽：空 src / 加载中 / 失败不占位（null）；加载完成计等比布局宽
    （请求与回调闭包同 drawCellImage） */
function measureImageItem (item, { contentWidth, contentHeight, padding, onImageLoad, row, colIndex }) {
  const src = item.attrs?.src

  // 空 src 不发起请求（与绘制端 drawCellImage 同款守卫）
  if (!src) return null

  const entry = requestImage(src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)

  // 加载中 / 失败不占位；加载完成后经回调触发重绘
  if (entry.status !== 'loaded') return null

  return imageLayoutSize(entry.image, contentHeight - padding, contentWidth).width
}

function measureItem (ctx, item, { contentWidth, contentHeight, padding, theme, onImageLoad, measure, row, colIndex }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return CHECK_SIZE

  if (kind === 'img') {
    return measureImageItem(item, { contentWidth, contentHeight, padding, onImageLoad, row, colIndex })
  }

  if (kind === 'icon') {
    // 方形宽 = 高 = min(size, contentWidth)；加载中仍占位（不返回 null，避免
    // 加载完成后横向跳动）
    return Math.min(item.size, contentWidth)
  }

  if (kind == null) return null

  const text = String(item.text ?? '')
  const width = measureOf(ctx, measure)(text, kind === 'tag' ? tagFontOf(theme) : cellFontOf(theme)) +
    (kind === 'tag' ? TAG_PADDING_X * 2 : 0)

  return Math.min(width, contentWidth)
}

/** icon 条目落地：size 收进右缘剩余（measureItem 同式） */
function drawIconItem (ctx, item, x, centerY, { maxWidth, theme, onImageLoad, row, colIndex }) {
  if (maxWidth <= 0) return

  drawIconGlyph(ctx, item.icon, {
    x,
    centerY,
    size: Math.min(item.size, maxWidth),
    // 色名查表，缺省/未知回退 textColor（drawDisplayText 同口径）
    color: (item.color && theme?.colors?.[item.color]?.color) || theme?.textColor,
    onLoad: onImageLoad ? () => onImageLoad(row, colIndex) : undefined
  })
}

function drawItem (ctx, item, x, centerY, {
  maxWidth, contentHeight, padding, theme, onImageLoad, measure, index, hoverItem, row, colIndex
}) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return drawCheck(ctx, item, x, centerY, theme)

  if (kind === 'img') {
    return drawCellImage(ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad, row, colIndex })
  }

  if (kind === 'tag') return drawTag(ctx, item, x, centerY, { maxWidth, theme, measure })

  if (kind === 'icon') return drawIconItem(ctx, item, x, centerY, { maxWidth, theme, onImageLoad, row, colIndex })

  if (kind == null) return

  // link 条目悬停：命中 hoverItem 时色变 hover 谱系 + 下划线
  const hovered = kind === 'link' && isLinkEntryHovered(hoverItem, item, index)

  drawItemText(ctx, item, x, centerY, {
    maxWidth,
    theme,
    measure,
    hovered,
    color: kind === 'link'
      ? (hovered ? linkHoverColorOf(item, theme) : linkTextColorOf(item, theme))
      : theme?.textColor
  })
}

/** link 条目悬停判定（横排与竖排 drawLinkItems 共用防口径漂移）：
    item.link !== false 门控——list 纯文本条目（link:false）可点击不悬停；
    老式自定义 kind:'link' 条目无 link 字段（undefined ≠ false）行为不变 */
export function isLinkEntryHovered (hoverItem, item, index) {
  return hoverItem?.kind === 'link' &&
    hoverItem.index === index &&
    item.link !== false &&
    !isTruthyAttr(item.disabled)
}

function drawItemText (ctx, item, x, centerY, { maxWidth, theme, measure, color, hovered }) {
  const { text, width } = ellipsize({
    text: String(item.text ?? ''),
    font: cellFontOf(theme),
    maxWidth: Math.max(0, maxWidth),
    measure: measureOf(ctx, measure)
  })

  if (!text) return

  ctx.font = cellFontOf(theme)
  ctx.fillStyle = color
  ctx.textAlign = 'left'

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(text, x, anchor.y)

  if (hovered) {
    const underlineWidth = Math.min(width, Math.max(0, maxWidth))

    ctx.fillRect(x, linkUnderlineY(anchor.y), underlineWidth, 1)
  }
}

/** attrs 存在性判定（disabled / data-checked 与交互命中同口径：非 null 且非 false） */
export function isTruthyAttr (value) {
  return value != null && value !== false
}

function drawCheck (ctx, item, x, centerY, theme) {
  const attrs = item.attrs ?? {}
  const checked = isTruthyAttr(attrs['data-checked'])
  const disabled = isTruthyAttr(attrs.disabled)

  const y = centerY - CHECK_SIZE / 2

  if (disabled) {
    // 置灰底衬：--mu-bg-strong（缺该变量时回退 hoverBg 现状等效色）
    ctx.beginPath()
    ctx.roundRect(x + 0.5, y + 0.5, CHECK_SIZE - 1, CHECK_SIZE - 1, CHECK_RADIUS)
    ctx.fillStyle = theme?.bgStrong || theme?.hoverBg
    ctx.fill()
  }

  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, CHECK_SIZE - 1, CHECK_SIZE - 1, CHECK_RADIUS)

  // DOM 规格：checked 边框 --mu-border-color-strong，否则 --mu-border-color-normal
  ctx.strokeStyle = disabled
    ? theme?.borderColor
    : (checked ? theme?.borderColorStrong : theme?.borderColor)
  ctx.lineWidth = 1
  ctx.stroke()

  if (checked) {
    ctx.font = `${CHECK_FONT_SIZE}px ${fontFamilyOf(theme)}`
    ctx.textAlign = 'center'

    // 字形墨迹锚：✓ 墨迹偏 em 框上部，文本 CJK 探针半差不适用
    const anchor = centeredGlyphAnchor(ctx, '✓', centerY)

    ctx.textBaseline = anchor.baseline
    ctx.fillStyle = disabled ? theme?.gray : theme?.textColor
    ctx.fillText('✓', x + CHECK_SIZE / 2, anchor.y)
  }

  return CHECK_SIZE
}

export function tagFontOf (theme) {
  return `${TAG_FONT_SIZE}px ${fontFamilyOf(theme)}`
}

/** tag pill 落地：直读条目 color（17 色板名）→ 底 translucent + 边框/文字同色
    （对齐 dom currentColor）；缺省 gray（colors 无 gray 键，走快照 gray/hoverBg） */
function drawTag (ctx, item, x, centerY, { maxWidth, theme, measure }) {
  const font = tagFontOf(theme)
  const { text, width: textWidth } = ellipsize({
    text: String(item.text ?? ''),
    font,
    maxWidth: Math.max(0, maxWidth - TAG_PADDING_X * 2),
    measure: measureOf(ctx, measure)
  })
  const width = textWidth + TAG_PADDING_X * 2

  if (!text) return width

  const name = item.color || 'gray'
  const palette = name === 'gray' ? null : theme?.colors?.[name]
  const borderColor = palette?.color ?? theme?.gray
  const fillColor = palette?.color ?? theme?.gray
  const trackFill = palette?.translucent ?? theme?.hoverBg
  const y = centerY - TAG_HEIGHT / 2

  ctx.font = font
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, TAG_HEIGHT - 1, TAG_RADIUS)
  ctx.fillStyle = trackFill
  ctx.fill()
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = fillColor
  ctx.textAlign = 'left'

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(text, x + TAG_PADDING_X, anchor.y)

  return width
}

/** 图片等比布局尺寸：不放大，clamp 到 maxH × maxW 内 */
export function imageLayoutSize (image, maxH, maxW) {
  const width = image.naturalWidth || 1
  const height = image.naturalHeight || 1
  const scale = Math.min(1, maxH / height, maxW / width)

  return { width: width * scale, height: height * scale }
}

function drawCellImage (
  ctx, item, x, centerY,
  { maxWidth, contentHeight, padding, theme, onImageLoad, row, colIndex }
) {
  const src = item.attrs?.src

  if (!src) return

  const entry = requestImage(src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)

  // 加载中 / 失败不绘；onload 后经回调触发该格重绘
  if (entry.status !== 'loaded') return

  // 高度收进单元格内边距内，宽度再受右缘剩余空间约束
  const { width, height } = imageLayoutSize(entry.image, contentHeight - padding, maxWidth)

  ctx.drawImage(entry.image, x, centerY - height / 2, width, height)

  return width
}
