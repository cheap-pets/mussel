/** canvasKind 分发绘制：progress 条 + button 组（pill/link 两形态） */
import { resolveColorName } from '../column-types/button'
import { resolveIconEntry } from '../column-types/icon'
import {
  TAG_HEIGHT,
  TAG_PADDING_X,
  TAG_RADIUS,
  BUTTON_ICON_SIZE,
  CONTROL_HEIGHT_SMALL_FALLBACK
} from './constants'
import { ellipsize, cellFontOf } from './text-wrap'
import { fontFamilyOf, measureOf, centeredTextAnchor, linkUnderlineY } from './cell-text'
import { tagFontOf, itemsStartX, isTruthyAttr } from './item-painters'
import { drawIconGlyph } from './icon-image'

// progress 条规格（单文件消费，不入 constants）
const PROGRESS_TRACK_HEIGHT = 8
const PROGRESS_RADIUS = 4
const PROGRESS_FONT_SIZE = 12

// button 组条目缺省占位（共享单例替代循环内逐次 {} 分配）
export const EMPTY_BUTTON = {}

// —— progress 绘制与 button 组绘制（A3.3 canvasKind 分发；button 已入列类型
// 注册表，canvas 产物同走本节 drawCanvasKindContent） ——

/** progress 条：轨道 bgStrong 8px 圆角 4 + 填充 colors[color].color + 百分比文本 */
export function drawProgress (ctx, rect, content, { padding, theme, record, measure, centerY }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const option = content.progressOption ?? {}
  const numeric = Number(content.value)
  const value = Number.isFinite(numeric) ? Math.min(Math.max(numeric, 0), 100) : 0
  const colorName = resolveColorName(option.color, record)
  const color = theme?.colors?.[colorName]?.color ?? theme?.primaryColor
  const showText = option.showText !== false

  let trackWidth = contentWidth

  if (showText) {
    const label = Math.round(value) + '%'
    const labelFont = `${PROGRESS_FONT_SIZE}px ${fontFamilyOf(theme)}`
    const labelWidth = measureOf(ctx, measure)(label, labelFont) + 6

    ctx.font = labelFont
    ctx.fillStyle = theme?.textColor
    ctx.textAlign = 'right'

    const anchor = centeredTextAnchor(ctx, centerY)

    ctx.textBaseline = anchor.baseline

    // 极窄列文本放不下时退化为仅轨道
    if (contentWidth - labelWidth > 0) {
      trackWidth = contentWidth - labelWidth

      ctx.fillText(label, rect.x + rect.width - padding, anchor.y)
    }
  }

  // 轨道（bgStrong 缺失时回退 hoverBg，与 check disabled 底衬同款回退链）
  ctx.beginPath()
  ctx.roundRect(
    rect.x + padding + 0.5, centerY - PROGRESS_TRACK_HEIGHT / 2 + 0.5,
    trackWidth - 1, PROGRESS_TRACK_HEIGHT - 1, PROGRESS_RADIUS
  )
  ctx.fillStyle = theme?.bgStrong || theme?.hoverBg
  ctx.fill()

  const fillWidth = trackWidth * value / 100

  if (fillWidth > 0.5) {
    ctx.beginPath()
    ctx.roundRect(
      rect.x + padding + 0.5, centerY - PROGRESS_TRACK_HEIGHT / 2 + 0.5,
      Math.max(1, fillWidth - 1), PROGRESS_TRACK_HEIGHT - 1, PROGRESS_RADIUS
    )
    ctx.fillStyle = color
    ctx.fill()
  }
}

/** button 条目悬停判定（drawButton 循环内两形态共用，isLinkEntryHovered 同款模式） */
function isButtonHovered (hoverItem, index) {
  return hoverItem?.kind === 'button' && hoverItem.index === index
}

/** button pill 高度（20261105 二轮，--mu-control-height-small）：主题快照读取、
    缺字段容错回退镜像常量（快照消费侧回退，与 rowHeight 同模式） */
export function buttonHeightOf (theme) {
  return theme?.controlHeightSmall || CONTROL_HEIGHT_SMALL_FALLBACK
}

/** button 组第一遍测宽（对齐布局前置）：x 恒从左缘起逐条省略计宽（截断/哨兵
    行为与左对齐基线一致——对齐平移仅发生在未超宽时，全宽条目平移后仍放得下，
    不改变截断结果）；返回绘制条目（含原始 index 与省略产物）与累计偏移
    （含尾随 gap，计入对齐总宽前扣除，itemsStartX 口径） */
function layoutButtonEntries (buttons, rect, rightBound, padding, font, measureFn, link, buttonHeight) {
  const entries = []
  let offset = 0

  for (let i = 0, x = rect.x + padding; i < buttons.length && x < rightBound; i++) {
    const button = buttons[i] ?? EMPTY_BUTTON
    const ellipsized = ellipsizeButton(button, x, rightBound, font, measureFn, link, buttonHeight)

    // ellipsize 空文本 → null 哨兵（原 -1 同义），停止绘制后续按钮
    if (!ellipsized) break

    entries.push({ button, index: i, ...ellipsized })
    offset += ellipsized.width + padding
    x += ellipsized.width + padding
  }

  return { entries, offset }
}

// button 组轻量按钮：横排，底 translucent + 边框/文字 colors[color].color；
// disabled 置灰；超宽丢弃；条目矩形回报 itemHits（kind 'button'，命中区 = pill 区，
// 高 = controlHeightSmall 快照）。link 形态（column.link）改走正文字体纯文字链，
// 宽度/字体随之切换。对齐两遍式（drawItems 同构）：测宽后按列 align 平移起点
// （center 扣 rightInset，超宽回退左对齐）
export function drawButton (ctx, rect, content, {
  align, padding, theme, record, onItemRect, measure, centerY, hoverItem, rightInset,
  onImageLoad, row, colIndex
}) {
  const buttons = content.buttons
  const link = content.link === true

  if (!Array.isArray(buttons) || !buttons.length) return

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const rightBound = rect.x + rect.width - padding
  const font = link ? cellFontOf(theme) : tagFontOf(theme)
  const measureFn = measureOf(ctx, measure)
  const buttonHeight = buttonHeightOf(theme)
  const { entries, offset } = layoutButtonEntries(buttons, rect, rightBound, padding, font, measureFn, link, buttonHeight)

  if (!entries.length) return

  let x = itemsStartX(rect, align, padding, offset - padding, true, contentWidth, rightInset)

  // svg 图标异步加载后 invalidate 该格（drawItems 同款钩子闭包）
  const onLoad = onImageLoad ? () => onImageLoad(row, colIndex) : undefined

  for (const { button, index, text, width, icon } of entries) {
    const hovered = isButtonHovered(hoverItem, index)

    if (link) {
      drawButtonLink(ctx, button, text, width, x, centerY, record, theme, font, hovered, icon, onLoad)
    } else {
      drawButtonPill(ctx, button, text, width, x, centerY, record, theme, font, hovered, icon, onLoad, buttonHeight)
    }

    // 命中矩形：pill 形态高 = 快照值（y = centerY − h/2）；link 形态无 pill 几何，
    // 沿用 TAG_HEIGHT 高度框现状（与 caption-only link 同口径）
    const hitHeight = link ? TAG_HEIGHT : buttonHeight

    onItemRect?.({
      kind: 'button',
      index,
      rect: { x, y: centerY - hitHeight / 2, width, height: hitHeight },
      disabled: isTruthyAttr(button.disabled)
    })

    x += width + padding
  }
}

/** button 三色（底/边框/文字）解析：disabled 置灰回退链，正常走 colors[name] 色板 */
function buttonFillOf (theme, colored, disabled) {
  return disabled
    ? (theme?.bgDisabled || theme?.hoverBg)
    : (colored?.translucent ?? theme?.hoverBg)
}

function buttonBorderOf (theme, colored, disabled) {
  return disabled ? theme?.borderColor : (colored?.color ?? theme?.borderColor)
}

function buttonTextOf (theme, colored, disabled) {
  return disabled
    ? (theme?.textColorMuted || theme?.gray)
    : (colored?.color ?? theme?.textColor)
}

/** caption 省略与占用宽预处理（pill/link 两形态共用；20261105 二轮形态互斥）：
    源头判定（互斥短路）——caption 非空 → caption-only（icon 键完全忽略：不解析、
    不绘制、不 warn，ellipsize 只作用 caption），省略结果空串（右缘放不下）→
    return null 不绘制且终止后续（不得落空文本条目，否则会绘制无文字 pill 并继续
    推进 x——verify-终-2 失败项 1 裁剪检查顺序缺陷随降级路径删除结构性消解，
    右缘剩余统一判据前置）；caption 空 → icon-only 候选，resolveIconEntry 解析
    （未注册 dev warn 在 resolve 内），无有效 icon → null 哨兵；icon-only 固定宽
    不省略（pill = controlHeightSmall 快照 / link = 图标本体），右缘剩余 < 宽 →
    不绘制且终止 */
function ellipsizeButton (button, x, rightBound, font, measureFn, link, buttonHeight) {
  const padX = link ? 0 : TAG_PADDING_X
  const remaining = rightBound - x

  if (String(button.caption ?? '') !== '') {
    const { text, width: textWidth } = ellipsize({
      text: String(button.caption ?? ''),
      font,
      maxWidth: Math.max(0, remaining - padX * 2),
      measure: measureFn
    })

    // 空文本（右缘放不下）→ 不绘制且终止——d 条款，不得落空文本条目
    if (!text) return null

    return { text, icon: null, width: Math.min(padX * 2 + textWidth, remaining) }
  }

  const icon = button.icon ? resolveIconEntry(button.icon) : null

  // 空哨兵（含未注册，warn 在 resolve 内）：不绘制且终止后续
  if (!icon) return null

  const width = link ? BUTTON_ICON_SIZE : buttonHeight

  return remaining < width ? null : { text: null, width, icon }
}

/** link 形态单条按钮（列级 column.link）：无底无边框纯文字链，常态
    colors[name].color、hover 变 colors[name].hover 谱系 + 1px 下划线（下划线式与
    link 条目同源）；disabled 恒置灰不悬停。形态互斥（20261105 二轮）：
    icon-only（caption 空）图标于条目起点 x、centerY 垂直锚，宽 = 图标本体
    （无 pill 几何）；caption-only（icon 恒 null）文字于条目起点 x，路径不变 */
function drawButtonLink (ctx, button, text, width, x, centerY, record, theme, font, hovered, icon, onLoad) {
  const disabled = isTruthyAttr(button.disabled)
  const colored = theme?.colors?.[resolveColorName(button.color, record)]
  const textColor = disabled
    ? (theme?.textColorMuted || theme?.gray)
    : (hovered
        ? (colored?.hover ?? colored?.color ?? theme?.primaryColor)
        : (colored?.color ?? theme?.primaryColor))

  if (icon) {
    drawIconGlyph(ctx, icon, { x, centerY, size: BUTTON_ICON_SIZE, color: textColor, onLoad })
    // drawIconGlyph（cls 路径）改写 font，文本度量/绘制前重设
    ctx.font = font
  }

  ctx.fillStyle = textColor
  ctx.textAlign = 'left'

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline

  if (text) {
    ctx.fillText(text, x, anchor.y)
  }

  if (hovered && !disabled) {
    ctx.fillRect(x, linkUnderlineY(anchor.y), width, 1)
  }
}

// 单个 button pill 绘制（省略预处理产物入参）：hovered 且非 disabled 时反转
// （底/边框 = colors[name].color、文字 = bgNormal）；disabled 置灰。pill 高 =
// controlHeightSmall 快照（buttonHeightOf，20261105 二轮）；icon-only（caption
// 空）图标 12px 在 pill 内水平垂直居中（x = x + (h − 12)/2、centerY 锚），色 =
// 同一文本色变量（常态 buttonTextOf、hover 反转 bgNormal）；caption-only
// （icon 恒 null）文字路径不变（pill 内 TAG_PADDING_X 内距）
function drawButtonPill (ctx, button, text, width, x, centerY, record, theme, font, hovered, icon, onLoad, buttonHeight) {
  const disabled = isTruthyAttr(button.disabled)
  const colored = theme?.colors?.[resolveColorName(button.color, record)]
  const y = centerY - buttonHeight / 2
  const inverted = hovered && !disabled

  ctx.font = font
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, buttonHeight - 1, TAG_RADIUS)
  ctx.fillStyle = inverted
    ? (colored?.color ?? theme?.primaryColor)
    : buttonFillOf(theme, colored, disabled)
  ctx.fill()
  ctx.strokeStyle = inverted
    ? (colored?.color ?? theme?.primaryColor)
    : buttonBorderOf(theme, colored, disabled)
  ctx.lineWidth = 1
  ctx.stroke()

  const textColor = inverted ? theme?.bgNormal : buttonTextOf(theme, colored, disabled)

  if (icon) {
    drawIconGlyph(ctx, icon, {
      x: x + (buttonHeight - BUTTON_ICON_SIZE) / 2,
      centerY,
      size: BUTTON_ICON_SIZE,
      color: textColor,
      onLoad
    })
    // drawIconGlyph（cls 路径）改写 font，文本度量/绘制前重设
    ctx.font = font
  }

  if (!text) return

  ctx.fillStyle = textColor
  ctx.textAlign = 'left'

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(text, x + TAG_PADDING_X, anchor.y)
}
