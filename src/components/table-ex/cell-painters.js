/** table-ex 单元格绘制适配器：复用 table 列类型体系，把列类型 render 产物（text / items）落地为 canvas 绘制 */
import { ensureFn } from '../table/utils'
import { resolveColumnType } from '../table/column-types'
import { wrapLines, ellipsize, cellFontOf, MAX_LINES_LIMIT } from './text-wrap'
import { isMappableColumnType, createDisplayMapper } from './mappings'
import { isExpandedKey } from './tree'
import {
  TREE_INDENT,
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK,
  FONT_SIZE_FALLBACK,
  CHECK_SIZE,
  CHECK_RADIUS,
  CHECK_FONT_SIZE,
  ELLIPSIS,
  FONT_FAMILY_FALLBACK
} from './constants'

// 取值链（table.vue:164-178 列准备、table-row.vue:44-69 取值同款）：
// - 列准备：resolveColumnType → _text/_value 均 ensureFn → _render（compile | render | 类型本身）；
//   另挂 _maxLines/_maxItems/_resolveMaxLines/_isTreeColumn/_mapText/_plainText

// - 取值：_text(record) 非 null 直接作为显示文本；否则 value = _value(record) ?? record[field]，
//   映射列经 _mapText 求显示文本，其余调 _render；class/style/title 为 DOM 通道字段忽略

// 绘制锚（Q2 统一垂直锚，与 lineHeight 解耦）：centerY = Math.round(rect.y +
// ROW_TOP_INSET + (rowHeight − ROW_TOP_INSET)/2 + 0.01)（行线间空白中点四舍五入，
// .5 恒向上，+0.01 浮点容差），多行后续行 += lineHeight；水平居中锚扣 rightInset

// 模块隔离（A8）：不 import theme.js / layout.js；主题色与 colors 经 drawCell 的
// theme 快照参数传入；mappings.js 为零依赖共享模块，editor 侧共用不违反禁令

// —— 视觉常量（镜像现有 DOM 规格，非新增设计值）——
// check 方框 —— table/column-types/style.scss .mu-table__cell-check（与表头
// painter.drawHeaderCheck 同规格，规格变更两处同步）

// tag pill / button —— styles/tag.scss .mu-tag（height 20 / padding 0 8 / font-size
// 12 / 圆角 4px）；button 为 tag 同构轻量按钮（A3.3）
const TAG_HEIGHT = 20
const TAG_PADDING_X = 8
const TAG_FONT_SIZE = 12
const TAG_RADIUS = 4
// progress 条（A3.3）：轨道 8px 圆角 4、百分比文本 12px
const PROGRESS_TRACK_HEIGHT = 8
const PROGRESS_RADIUS = 4
const PROGRESS_FONT_SIZE = 12

// img 缓存上限（超限整体清空，同 theme.js 测量缓存策略）
const IMAGE_CACHE_LIMIT = 200

// 生产路径 theme 快照必含以下字段（readSnapshot）；缺省值仅为容错
const FALLBACK_LINE_HEIGHT = 18

// button 组条目缺省占位（共享单例替代循环内逐次 {} 分配）
const EMPTY_BUTTON = {}

// canvas 专属类型（A3.3）：不入 table 列类型注册表，prepareColumn 在
// resolveColumnType 之前分发，drawCell 按 canvasKind 走 drawProgress/drawButton
const CANVAS_ONLY_TYPES = { progress: true, button: true }

// —— img 异步加载缓存：src → { image, status: 'loading' | 'loaded' | 'failed' } ——

const imageCache = new Map()

/** 读取某 src 的缓存条目（self-check only：img 缓存行为的自检观测窗口） */
export function getImageEntry (src) {
  return (src && imageCache.get(src)) || null
}

function requestImage (src, onLoad) {
  let entry = imageCache.get(src)

  if (!entry) {
    if (imageCache.size >= IMAGE_CACHE_LIMIT) imageCache.clear()

    const image = new Image()

    entry = { image, status: 'loading' }
    imageCache.set(src, entry)

    // crossOrigin=anonymous：跨域无 CORS 头的图加载失败，避免污染画布
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      entry.status = 'loaded'
      // 同一 src 只回调一次；重绘范围由 painter 侧回调决定
      onLoad?.()
    }
    image.onerror = () => {
      entry.status = 'failed'
    }
    image.src = src
  }

  return entry
}

/** 编辑按钮图标加载：SVG 标记串着色后转 data URL（缓存键含着色串，主题色变自然分键），
    非 SVG 串按图片 src 直通；委托 requestImage 单一管线 */
export function requestIconImage (icon, color, onLoad) {
  const src = typeof icon === 'string' && icon.includes('<svg')
    ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(icon).replace(/currentColor/gi, color))
    : icon

  return requestImage(src, onLoad)
}

// —— 列准备（table.vue internalColumns 的 canvas 等价物，仅保留绘制所需字段） ——

/** maxLines/maxItems 配置值钳制（1–10；非法值回退 fallback） */
function clampLimit (value, fallback) {
  const n = Math.round(Number(value))

  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_LINES_LIMIT) : fallback
}

// _render 构建：canvas 专属类型（progress/button）不经 resolveColumnType 产物
// （回退 TextColumn 会绘制文本），直接产出 canvasKind render；普通类型 compile 优先，
// 其次类型对象/函数自身作为 render
function createColumnRender (column, type, canvasOnlyKind) {
  if (canvasOnlyKind === 'progress') {
    const getProgressOption = ensureFn(column.progressOption)

    return ({ record, value }) => ({
      canvasKind: 'progress',
      value,
      progressOption: getProgressOption(record) ?? {}
    })
  }

  if (canvasOnlyKind === 'button') {
    const getButtons = ensureFn(column.buttons)

    return ({ record }) => ({ canvasKind: 'button', buttons: getButtons(record) ?? [] })
  }

  return type.compile ? type.compile(column) : (type.render || type)
}

// 列定义 → 内部列：解析缺省 align、ensureFn 化 text/value、构建 render、canvas 专属
// 类型分发、挂 maxLines/maxItems/树形列标记与映射字段；placeholder 继承表格级
export function prepareColumn (column, { placeholder } = {}) {
  const col = { ...column, _raw: column }

  const type = resolveColumnType(column.type)

  const { align = type.align } = column

  col._align = align ?? 'left'
  col._text = ensureFn(column.text)
  col._value = ensureFn(column.value)

  // 多行/条目上限：_resolveMaxLines(record) 行级求值闭包（drawText、行高计算、
  // editor textarea 判定同源）；不在列准备期求值（无 record，行高/绘制分裂）
  col._maxLines = column.maxLines != null ? clampLimit(column.maxLines, null) : null
  col._maxItems = clampLimit(column.maxItems ?? MAX_LINES_LIMIT, MAX_LINES_LIMIT)
  col._isTreeColumn = column.treeNode === true

  if (col._maxLines != null) {
    col._resolveMaxLines = () => col._maxLines
  } else if (column.multiline) {
    const getLineClamp = ensureFn(column.lineClamp)

    col._resolveMaxLines = record => clampLimit(getLineClamp(record) ?? MAX_LINES_LIMIT, MAX_LINES_LIMIT)
  } else {
    col._resolveMaxLines = () => 1
  }

  // canvas 专属类型分发：progress/button 不经 resolveColumnType
  const canvasOnlyKind = CANVAS_ONLY_TYPES[column.type] ? column.type : null

  col._render = createColumnRender(column, type, canvasOnlyKind)

  // 显示映射（mappings 优先，仅 options 时由其转换；column.text 显示优先不参与
  // 映射——valueOf 无 _text 分支，挂映射会行高与文本分裂）
  col._mapText = !column.text && isMappableColumnType(column.type) ? createDisplayMapper(column) : null
  // 纯文本直渲短路标记（P2）：非 multiline 原生 text 列，compile 产物恒
  // ({value}) => ({text: value})，可跳过 render 调用
  col._plainText = !column.text && !column.multiline && !canvasOnlyKind &&
    (column.type == null || column.type === '' || column.type === 'text')

  col.placeholder ??= placeholder

  return col
}

// 单元格内容解析（table-row.vue cells computed 的纯函数等价物）：返回 { text } /
// { items } / { canvasKind, ... }（皆空 = 空内容，绘制落 placeholder）
export function resolveCellContent (col, { record, recordNumber, emit }) {
  const text = col._text(record)

  if (text != null) return { text }

  // value 传字符串等非函数值经 ensureFn 包装后恒为函数，不会抛错
  const value = col._value(record) ?? (col.field ? record[col.field] : undefined)

  // P2 短路：纯文本列免 render 调用与中间对象（映射命中/未命中均终结于此）
  if (col._plainText) return { text: col._mapText ? col._mapText(value) : value }

  // 映射器返回非 null（命中 / default / 原值回退）即终结，number 列不再走 Intl
  if (col._mapText) {
    const mapped = col._mapText(value)

    if (mapped != null) return { text: mapped }
  }

  const { class: _class, style: _style, title: _title, ...params } =
    col._render({ record, recordNumber, value, emit }) || {}

  return params
}

/** maxLines 行级求值（优先 _resolveMaxLines 闭包，其次 _maxLines） */
function maxLinesOf (col, record) {
  if (typeof col._resolveMaxLines === 'function') return col._resolveMaxLines(record)

  return col._maxLines ?? 1
}

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
  hoverItem
}) {
  const content = resolveCellContent(col, { record, recordNumber, emit })

  if (isSkippableRect(rect)) return content

  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK
  const rowHeight = theme?.rowHeight || ROW_HEIGHT_FALLBACK

  // 首行行框槽位（问题 1）：行线占用本格矩形顶部 1px；宽度不减（与估高同式）；
  // rightInset 不扣宽度，只参与水平居中锚
  const box = { ...rect, y: rect.y + ROW_TOP_INSET, height: rect.height - ROW_TOP_INSET }

  // 槽位中心（全文唯一垂直锚公式）：中点四舍五入取整（.5 恒向上，+0.01 浮点
  // 容差）；不使用 rect.height（超高行贴行顶）
  const centerY = Math.round(box.y + (rowHeight - ROW_TOP_INSET) / 2 + 0.01)

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
    ctx, contentRect, content, padding, theme, record, measure, onItemRect, centerY, hoverItem
  )) {
    return content
  }

  if (Array.isArray(content.items) && content.items.length) {
    drawContentItems(
      ctx, contentRect, content, col, record,
      padding, theme, measure, wrapCache, onItemRect, onImageLoad,
      centerY, rightInset, hoverItem, row, colIndex
    )

    return content
  }

  drawDisplayText(
    ctx, contentRect, content, col, record, placeholder,
    padding, theme, measure, wrapCache, centerY, rightInset
  )

  return content
}

/** 矩形缺失 / 零尺寸（NaN 尺寸照常进入绘制，与原实现一致）时跳过内容绘制 */
function isSkippableRect (rect) {
  return !rect || rect.width <= 0 || rect.height <= 0
}

/** canvas 专属分发（A3.3）：progress / button 真实绘制；命中返回 true */
function drawCanvasKindContent (
  ctx, rect, content, padding, theme, record, measure, onItemRect, centerY, hoverItem
) {
  if (content.canvasKind === 'progress') {
    drawProgress(ctx, rect, content, { padding, theme, record, measure, centerY })
    return true
  }

  if (content.canvasKind === 'button') {
    drawButton(ctx, rect, content.buttons, {
      padding,
      theme,
      record,
      onItemRect,
      measure,
      centerY,
      hoverItem
    })
    return true
  }

  return false
}

// items 数组落地：单 item + line-clamp class 形态改道 drawText 多行（A3.5 DOM 风格
// 兼容）；link 列 = 条目列竖排；其余横排
function drawContentItems (
  ctx, rect, content, col, record,
  padding, theme, measure, wrapCache, onItemRect, onImageLoad,
  centerY, rightInset, hoverItem, row, colIndex
) {
  if (content.items.length === 1) {
    const only = content.items[0]

    if (itemClassOf(only).includes('line-clamp') && only.text != null) {
      drawTextValue(ctx, rect, only.text, col._align, {
        padding,
        theme,
        measure,
        wrapCache,
        maxLines: maxLinesOf(col, record),
        maxItems: col._maxItems,
        centerY,
        rightInset
      })

      return
    }
  }

  // link 列 = 条目列（A3.5）：数组竖排每条一行（单条超宽省略）+ maxItems 钳制
  if (col.type === 'link') {
    drawLinkItems(ctx, rect, content.items, {
      padding,
      theme,
      maxItems: col._maxItems,
      onItemRect,
      measure,
      centerY,
      hoverItem
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

/** 空内容落占位文本（content.text ?? col.placeholder ?? 表格级 placeholder） */
function drawDisplayText (
  ctx, rect, content, col, record, placeholder,
  padding, theme, measure, wrapCache, centerY, rightInset
) {
  const display = content.text ?? col.placeholder ?? placeholder

  if (display != null) {
    drawTextValue(ctx, rect, display, col._align, {
      padding,
      theme,
      measure,
      wrapCache,
      maxLines: maxLinesOf(col, record),
      maxItems: col._maxItems,
      centerY,
      rightInset
    })
  }
}

/** 测量回调解析：注入 measure 优先（theme.js 测量缓存）；未注入回退 ctx 直测无缓存 */
function measureOf (ctx, measure) {
  if (typeof measure === 'function') return measure

  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

/** 文本水平锚点：center 锚扣本格右缘列线占用 rightInset（painter 注入），left/right 不动 */
function textAnchorX (rect, align, padding, rightInset) {
  return align === 'right'
    ? rect.x + rect.width - padding
    : align === 'center'
      ? rect.x + (rect.width - rightInset) / 2
      : rect.x + padding
}

// 文本取值落地（A3.5 统一规则）：
// - 数组值 → 每元素一行（逐元素 String 化）、首行槽位锚，行数 > maxItems 时
//   第 maxItems 行显示 '...'（dots 字面，DOM link.js:47/tag.js:46 同款）

// - 字符串 + maxLines>1 → wrapLines 多行（与 row-geometry 同一函数与缓存；
//   measure 未注入时回退单行省略），首行槽位锚起排
// - 其余 → 单行省略（垂直锚 = 槽位中心 centerY，与多行首行同式）
function drawTextValue (ctx, rect, display, align, {
  padding, theme, measure, wrapCache, maxLines, maxItems, centerY, rightInset
}) {
  if (Array.isArray(display)) {
    drawArrayLines(ctx, rect, display, align, { padding, theme, maxItems, measure, centerY, rightInset })
    return
  }

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const text = String(display)
  const lineHeight = cellLineHeightOf(theme)

  if (maxLines > 1 && typeof measure === 'function' && text) {
    const { lines } = wrapLines({
      text, font: cellFontOf(theme), maxWidth: contentWidth, measure, cache: wrapCache, maxLines
    })

    ctx.fillStyle = theme?.textColor
    ctx.textAlign = align

    // 首行槽位锚：后续行 += lineHeight
    let y = centerY

    for (const line of lines) {
      ctx.fillText(line, textAnchorX(rect, align, padding, rightInset), y)
      y += lineHeight
    }

    return
  }

  // 单行省略：截断经注入 measure 走缓存（P0-1）
  const { text: single } = ellipsize({
    text,
    font: cellFontOf(theme),
    maxWidth: contentWidth,
    measure: measureOf(ctx, measure)
  })

  if (!single) return

  ctx.fillStyle = theme?.textColor
  ctx.textAlign = align
  ctx.fillText(single, textAnchorX(rect, align, padding, rightInset), centerY)
}

/** 数组值多行（文本呈现列）：每元素一行、首行槽位锚、超限第 maxItems 行 '...' */
function drawArrayLines (ctx, rect, values, align, { padding, theme, maxItems, measure, centerY, rightInset }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !values.length) return

  const lineHeight = cellLineHeightOf(theme)
  const shown = values.length > maxItems
    ? values.slice(0, maxItems - 1).concat(ELLIPSIS)
    : values
  const font = cellFontOf(theme)
  const measureFn = measureOf(ctx, measure)

  ctx.fillStyle = theme?.textColor
  ctx.textAlign = align

  let y = centerY

  for (const element of shown) {
    const { text: line } = ellipsize({ text: String(element ?? ''), font, maxWidth: contentWidth, measure: measureFn })

    if (line) ctx.fillText(line, textAnchorX(rect, align, padding, rightInset), y)

    y += lineHeight
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

// 树形列缩进与箭头：内容区前置 level×16 缩进 + 16px 箭头槽（父行三角、叶行空槽）；
// 返回内容区应右移的 inset px（与行高估高扣减口径一致），非树形列/树关返回 0
function drawTreeAffordance (ctx, rect, { col, row, flatInfo, expandedKeys, recordKey, padding, theme, centerY }) {
  if (!col._isTreeColumn || !flatInfo) return 0

  const level = flatInfo.levels?.[row] ?? 0
  const hasChildren = !!flatInfo.hasChildren?.[row]

  if (hasChildren) {
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

// —— items 落地 ——

function itemClassOf (item) {
  const cls = item.attrs?.class

  return Array.isArray(cls) ? cls.join(' ') : String(cls ?? '')
}

/** 条目落地类别：以列类型写入的 DOM class 标记区分（mu-table__cell-check / mu-tag / line-clamp） */
function resolveItemKind (item) {
  const cls = itemClassOf(item)

  if (cls.includes('mu-table__cell-check')) return 'check'
  if (item.is === 'img') return 'img'
  if (item.is === 'a') return 'link'
  if (cls.includes('mu-tag')) return 'tag'

  // 未识别 is 且 text != null 的条目按文本绘制；无文本的未知条目忽略
  return item.text != null ? 'text' : null
}

/** mu-{tag|link}--{color} class 色名解析（17 色板名；无 class/未知名返回 null） */
function colorClassOf (item, prefix) {
  const match = new RegExp(`mu-${prefix}--(\\S+)`).exec(itemClassOf(item))

  return match?.[1] ?? null
}

/** link 条目文本色：disabled → textColorMuted；mu-link--{color} → colors[name].color；未知名 → primaryColor */
function linkTextColorOf (item, theme) {
  const attrs = item.attrs ?? {}

  if (attrs.disabled != null && attrs.disabled !== false) {
    return theme?.textColorMuted || theme?.gray
  }

  const name = colorClassOf(item, 'link')
  const colored = name && theme?.colors?.[name]?.color

  return colored || theme?.primaryColor
}

/** link 条目悬停色（问题 7）：语义色名 → colors[name].hover（缺字段回退 color）；彩色名同色；disabled muted */
export function linkHoverColorOf (item, theme) {
  const attrs = item.attrs ?? {}

  if (attrs.disabled != null && attrs.disabled !== false) {
    return theme?.textColorMuted || theme?.gray
  }

  const name = colorClassOf(item, 'link')
  const colored = name ? theme?.colors?.[name] : null

  return colored?.hover ?? colored?.color ?? theme?.primaryColor
}

// items 行绘制：先测各条目宽度，按列 align 分布整体起点，再逐条目绘制；超出右缘
// 的条目丢弃；link/tag 条目矩形经 onItemRect 回报（painter itemHits 命中来源）
function drawItems (ctx, rect, items, {
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

/** 逐条目横向起点（可见条目间以 gap 分隔；测量失败条目 null 跳过不占位） */
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
function itemsStartX (rect, align, padding, offset, visible, contentWidth, rightInset) {
  let start = rect.x + padding

  if (visible && offset < contentWidth) {
    if (align === 'center') start = rect.x + (rect.width - rightInset - offset) / 2
    else if (align === 'right') start = rect.x + rect.width - padding - offset
  }

  return start
}

// tag/link 条目命中矩形回报（其余类别不回报）。命中区 = 绘制区域：tag 为 pill
// 绘制区，link 为首行行框；disabled 随条目回报（与取色/点击同口径 isTruthyAttr）
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
      disabled: isTruthyAttr(item.attrs?.disabled)
    })
  }
}

function measureItem (ctx, item, { contentWidth, contentHeight, padding, theme, onImageLoad, measure, row, colIndex }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return CHECK_SIZE

  if (kind === 'img') {
    // img 分支内建 onImageLoad 闭包（P1b：其余格零闭包分配）
    const entry = requestImage(item.attrs?.src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)

    // 加载中 / 失败按空格处理（不占位；加载完成后经回调触发重绘）
    if (entry.status !== 'loaded') return null

    return imageLayoutSize(entry.image, contentHeight - padding, contentWidth).width
  }

  if (kind == null) return null

  const text = String(item.text ?? '')
  const width = measureOf(ctx, measure)(text, kind === 'tag' ? tagFontOf(theme) : cellFontOf(theme)) +
    (kind === 'tag' ? TAG_PADDING_X * 2 : 0)

  return Math.min(width, contentWidth)
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

  if (kind == null) return

  // link 条目悬停（问题 7）：命中 hoverItem 时色变 hover 谱系 + 下划线
  const hovered = kind === 'link' && isLinkEntryHovered(hoverItem, item, index)

  // link 条目色经 class 解析（mu-link--{color} → theme.colors 查表）
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

/** link 悬停下划线 y（drawLinkEntry 与 drawItemText 共用单函数防公式漂移） */
function linkUnderlineY (anchorY, fontSize) {
  return anchorY + Math.round(fontSize * 0.35) + 2
}

/** 行框高（--cell-line-height 快照缺省回退 18）：三条文本绘制路径同源 */
function cellLineHeightOf (theme) {
  return theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
}

/** link 条目悬停判定（横排 drawItem 与竖排 drawLinkItems 共用防口径漂移） */
function isLinkEntryHovered (hoverItem, item, index) {
  return hoverItem?.kind === 'link' &&
    hoverItem.index === index &&
    !isTruthyAttr(item.attrs?.disabled)
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
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, centerY)

  // link 悬停下划线（问题 7）：1px，宽 = 实绘文本宽（省略后）
  if (hovered) {
    const underlineWidth = Math.min(width, Math.max(0, maxWidth))

    ctx.fillRect(x, linkUnderlineY(centerY, theme?.fontSize || FONT_SIZE_FALLBACK), underlineWidth, 1)
  }
}

/** attrs 存在性判定（disabled / data-checked 与交互命中同口径：非 null 且非 false） */
function isTruthyAttr (value) {
  return value != null && value !== false
}

/** 字体族回退（theme 快照缺 fontFamily 时用兜底族；check/tag/progress 同源） */
function fontFamilyOf (theme) {
  return theme?.fontFamily || FONT_FAMILY_FALLBACK
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
    ctx.textBaseline = 'middle'
    ctx.fillStyle = disabled ? theme?.gray : theme?.textColor
    ctx.fillText('✓', x + CHECK_SIZE / 2, centerY)
  }

  return CHECK_SIZE
}

function tagFontOf (theme) {
  return `${TAG_FONT_SIZE}px ${fontFamilyOf(theme)}`
}

/** tag pill 落地：mu-tag--{color} class → 底 translucent + 边框/文字 color（缺省灰底） */
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

  const name = colorClassOf(item, 'tag')
  const colored = name ? theme?.colors?.[name] : null
  const y = centerY - TAG_HEIGHT / 2

  ctx.font = font
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, TAG_HEIGHT - 1, TAG_RADIUS)
  ctx.fillStyle = colored?.translucent ?? theme?.hoverBg
  ctx.fill()
  ctx.strokeStyle = colored?.color ?? theme?.borderColor
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = colored?.color ?? theme?.textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + TAG_PADDING_X, centerY)

  return width
}

// —— link 列竖排（条目列，A3.5） ——

/** 单条 link 文本绘制：单行省略，返回绘制宽度；hovered 时补画 1px 下划线 */
function drawLinkEntry (ctx, text, x, y, maxWidth, theme, color, measure, hovered) {
  const { text: display, width } = ellipsize({
    text,
    font: cellFontOf(theme),
    maxWidth: Math.max(0, maxWidth),
    measure: measureOf(ctx, measure)
  })

  if (!display) return 0

  ctx.font = cellFontOf(theme)
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(display, x, y)

  if (hovered) {
    ctx.fillRect(x, linkUnderlineY(y, theme?.fontSize || FONT_SIZE_FALLBACK), Math.min(width, Math.max(0, maxWidth)), 1)
  }

  return Math.min(width, maxWidth)
}

// link 列竖排（数组每条一行）：单条超宽省略；条目数 > maxItems 时第 maxItems 条
// 显示 '...'；首行槽位锚 + 后续行 += lineHeight；条目矩形（含 dots）经 onItemRect
// 回报（kind 'link'，携带 disabled）
function drawLinkItems (ctx, rect, items, { padding, theme, maxItems, onItemRect, measure, centerY, hoverItem }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !items.length) return

  const lineHeight = cellLineHeightOf(theme)
  const x = rect.x + padding
  const overflow = items.length > maxItems
  const shown = overflow ? items.slice(0, maxItems - 1) : items

  let y = centerY

  const report = (index, width, disabled) => {
    onItemRect?.({
      kind: 'link',
      index,
      rect: { x, y: y - lineHeight / 2, width, height: lineHeight },
      disabled
    })
  }

  for (let i = 0; i < shown.length; i++) {
    const item = shown[i]
    const hovered = isLinkEntryHovered(hoverItem, item, i)
    const width = drawLinkEntry(
      ctx,
      String(item.text ?? ''),
      x,
      y,
      contentWidth,
      theme,
      hovered ? linkHoverColorOf(item, theme) : linkTextColorOf(item, theme),
      measure,
      hovered
    )

    if (width > 0) report(i, width, isTruthyAttr(item.attrs?.disabled))

    y += lineHeight
  }

  if (overflow) {
    const width = drawLinkEntry(ctx, ELLIPSIS, x, y, contentWidth, theme, theme?.primaryColor, measure)

    if (width > 0) report(maxItems - 1, width, false)
  }
}

// —— canvas 专属类型（A3.3） ——

/** 色板名解析（color 支持 (record)=>name） */
function colorNameOf (value, record) {
  const name = typeof value === 'function' ? value(record) : value

  return typeof name === 'string' && name ? name : 'primary'
}

/** progress 条：轨道 bgStrong 8px 圆角 4 + 填充 colors[color].color + 百分比文本 */
function drawProgress (ctx, rect, content, { padding, theme, record, measure, centerY }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const option = content.progressOption ?? {}
  const numeric = Number(content.value)
  const value = Number.isFinite(numeric) ? Math.min(Math.max(numeric, 0), 100) : 0
  const colorName = colorNameOf(option.color, record)
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
    ctx.textBaseline = 'middle'

    // 极窄列文本放不下时退化为仅轨道
    if (contentWidth - labelWidth > 0) {
      trackWidth = contentWidth - labelWidth

      ctx.fillText(label, rect.x + rect.width - padding, centerY)
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

  // 填充（pct × 轨道宽）
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

// button 组（tag 同构轻量按钮）：横排，底 translucent + 边框/文字 colors[color].color；
// disabled 置灰；超宽丢弃；条目矩形回报 itemHits（kind 'button'，命中区 = pill 区）
function drawButton (ctx, rect, buttons, {
  padding, theme, record, onItemRect, measure, centerY, hoverItem
}) {
  if (!Array.isArray(buttons) || !buttons.length) return

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const rightBound = rect.x + rect.width - padding
  const font = tagFontOf(theme)
  const measureFn = measureOf(ctx, measure)

  let x = rect.x + padding

  for (let i = 0; i < buttons.length; i++) {
    if (x >= rightBound) break

    const button = buttons[i] ?? EMPTY_BUTTON
    const width = drawButtonPill(
      ctx, button, x, centerY, rightBound, record, theme, font, measureFn,
      hoverItem?.kind === 'button' && hoverItem.index === i
    )

    // ellipsize 空文本 → -1 哨兵，停止绘制后续按钮
    if (width < 0) break

    onItemRect?.({
      kind: 'button',
      index: i,
      rect: { x, y: centerY - TAG_HEIGHT / 2, width, height: TAG_HEIGHT },
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

// 单个 button pill 绘制：返回占用宽度；空文本返回 -1 哨兵不绘制；hovered 且非
// disabled 时反转（底/边框 = colors[name].color、文字 = bgNormal）；disabled 置灰
function drawButtonPill (ctx, button, x, centerY, rightBound, record, theme, font, measureFn, hovered) {
  const { text, width: textWidth } = ellipsize({
    text: String(button.caption ?? ''),
    font,
    maxWidth: Math.max(0, rightBound - x - TAG_PADDING_X * 2),
    measure: measureFn
  })

  if (!text) return -1

  const disabled = isTruthyAttr(button.disabled)
  const colorName = colorNameOf(button.color, record)
  const colored = theme?.colors?.[colorName]
  const width = Math.min(textWidth + TAG_PADDING_X * 2, rightBound - x)
  const y = centerY - TAG_HEIGHT / 2
  const inverted = hovered && !disabled

  ctx.font = font
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, TAG_HEIGHT - 1, TAG_RADIUS)
  ctx.fillStyle = inverted
    ? (colored?.color ?? theme?.primaryColor)
    : buttonFillOf(theme, colored, disabled)
  ctx.fill()
  ctx.strokeStyle = inverted
    ? (colored?.color ?? theme?.primaryColor)
    : buttonBorderOf(theme, colored, disabled)
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = inverted ? theme?.bgNormal : buttonTextOf(theme, colored, disabled)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + TAG_PADDING_X, centerY)

  return width
}

/** 图片等比布局尺寸：不放大，clamp 到 maxH × maxW 内 */
function imageLayoutSize (image, maxH, maxW) {
  const width = image.naturalWidth || 1
  const height = image.naturalHeight || 1
  const scale = Math.min(1, maxH / height, maxW / width)

  return { width: width * scale, height: height * scale }
}

function drawCellImage (ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad, row, colIndex }) {
  const src = item.attrs?.src

  if (!src) return

  // img 分支内建 onImageLoad 闭包（P1b）
  const entry = requestImage(src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)

  // 加载中 / 失败按空格处理；onload 后经回调触发该格重绘（painter 侧）
  if (entry.status !== 'loaded') return

  // 高度收进单元格内边距内，宽度再受右缘剩余空间约束
  const { width, height } = imageLayoutSize(entry.image, contentHeight - padding, maxWidth)

  ctx.drawImage(entry.image, x, centerY - height / 2, width, height)

  return width
}
