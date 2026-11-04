/** table-ex 单元格绘制适配器：复用 table 列类型体系，把列类型 render 产物（text / items）落地为 canvas 绘制 */
import { ensureFn } from '@/utils/type'
import { resolveColumnType } from '../column-types'
import { wrapLines, ellipsize, cellFontOf, MAX_LINES_LIMIT } from './text-wrap'
import { createDisplayMapper } from '../mappings'
import { EnumColumn } from '../column-types/enum'
import { expandableAt, isExpandedKey } from './tree'
import {
  TREE_INDENT,
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK,
  CHECK_SIZE,
  CHECK_RADIUS,
  CHECK_FONT_SIZE,
  ELLIPSIS,
  FONT_FAMILY_FALLBACK
} from './constants'

// 取值链（与 DOM 版同款：base/table.vue internalColumns 列准备、base/table-row.vue cells 取值）：
// - 列准备：resolveColumnType → _text/_value 均 ensureFn → _render（compile | render | 类型本身）；
//   另挂 _maxLines/_maxItems/_resolveMaxLines/_isTreeColumn/_mapText/_plainText

// - 取值：_text(record) 非 null 直接作为显示文本；否则 value = _value(record) ?? record[field]，
//   纯文本列短路免 render，其余调 _render；class/style 为 DOM 通道字段忽略，canvas 通道
//   条目自带 kind 协议字段（link/tag），颜色经平铺 color/danger 直取不走 class 解析
//   （column.title 经 _title 由 resolveCellTooltip 消费，tooltip 求值见模块尾）

// - _mapText 为 enum 类型独有（EnumColumn.compile 内 mapper 为双端单一事实源，此处仅供
//   row-geometry 估高取显示文本，不参与绘制取值）

// 绘制锚（Q2 统一垂直锚，与 lineHeight 解耦）：centerY = Math.round(rect.y +
// ROW_TOP_INSET + (rowHeight − ROW_TOP_INSET)/2 + 0.01)（行线间空白中点四舍五入，
// .5 恒向上，+0.01 浮点容差），多行后续行 += lineHeight；水平居中锚扣 rightInset

// 模块隔离（A8）：不 import theme.js / layout.js；主题色与 colors 经 drawCell 的
// theme 快照参数传入；table/mappings.js 为零依赖共享模块（mu-table 同源），不违反禁令

// —— 视觉常量（镜像现有 DOM 规格，非新增设计值）——
// check 方框 —— column-types/style.scss .mu-table__cell-check（与表头
// painter.drawHeaderCheck 同规格，规格变更两处同步）

// tag pill / button —— components/tag/tag.scss .mu-tag（height 20 / padding 0 8 /
// font-size 12 / 圆角 4px）；button 为 tag 同构轻量按钮（A3.3），column.link = true
// 时整列改纯文字链形态（正文字体、无 pill 内边距）
const TAG_HEIGHT = 20
const TAG_PADDING_X = 8
const TAG_FONT_SIZE = 12
const TAG_RADIUS = 4
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

    // link 形态标志列级声明（column.link），整列统一生效不落单条 button
    return ({ record }) => ({
      canvasKind: 'button',
      buttons: getButtons(record) ?? [],
      link: column.link === true || null
    })
  }

  return type.compile ? type.compile(column) : (type.render || type)
}

/** 行数上限求值闭包构建（maxLines 常量优先 → multiline+lineClamp 行级求值 → 单行）：
    产物 _resolveMaxLines(record) 为 drawText、行高计算、editor textarea 判定同源；
    不在列准备期求值（无 record，行高/绘制分裂） */
function resolveMaxLinesBuilder (column, maxLines) {
  if (maxLines != null) return () => maxLines

  if (column.multiline) {
    const getLineClamp = ensureFn(column.lineClamp)

    return record => clampLimit(getLineClamp(record) ?? MAX_LINES_LIMIT, MAX_LINES_LIMIT)
  }

  return () => 1
}

/** 纯文本直渲短路判定（P2）：非 multiline 原生 text 列且无 color（带 color 列必须
    走 compile 产 color，短路直渲产物只有 { text }，染色会丢失）；text.link 列
    （column.link === true）同样排除——链色需 compile 产 color，直渲会丢 */
function isPlainTextColumn (column, canvasOnlyKind) {
  return !column.text && !column.multiline && !canvasOnlyKind &&
    column.color == null && column.link !== true &&
    (column.type == null || column.type === '' || column.type === 'text')
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
  // title 列协议（tooltip 求值闭包，base/table.vue internalColumns 的 _title 同款；
  // 原始字段经 {...column} 保留，resolveTooltipTarget 按其真值做门控）
  col._title = ensureFn(column.title)

  // 多行/条目上限（clampLimit 钳制 1–10，非法值回退）
  col._maxLines = column.maxLines != null ? clampLimit(column.maxLines, null) : null
  col._maxItems = clampLimit(column.maxItems ?? MAX_LINES_LIMIT, MAX_LINES_LIMIT)
  col._isTreeColumn = column.treeNode === true
  // 合并单元格列级声明（02-design.md §2.2）：true（显示值键）| string 字段键 |
  // Function 键，spans.buildSpans 消费（spans.js 不 import 本模块，取值链自持）
  col._autoRowSpan = column.autoRowSpan
  col._resolveMaxLines = resolveMaxLinesBuilder(column, col._maxLines)

  const canvasOnlyKind = CANVAS_ONLY_TYPES[column.type] ? column.type : null

  col._render = createColumnRender(column, type, canvasOnlyKind)

  // 显示映射 enum 类型独有（EnumColumn.compile 内 mapper 为双端单一事实源，此处仅供
  // row-geometry 估高取显示文本）；无映射源不挂恒等 mapper
  col._mapText = !column.text && type === EnumColumn &&
    (column.mappings != null || column.options != null)
    ? createDisplayMapper(column)
    : null
  col._plainText = isPlainTextColumn(column, canvasOnlyKind)

  col.placeholder ??= placeholder

  return col
}

/** A9 统一数组门控（decisions）：数组值仅条目列（link/list/tag/button——tag/button
    的值本身即条目数组）与非字符串 type 自定义列消费；其余列（type null/''/其他
    字符串：text/number/date/bool/enum/check/img/progress 等）落空内容 → 占位链 */
function isArrayValueRejected (col, value) {
  if (!Array.isArray(value)) return false

  const t = col.type

  return (t == null || t === '' || typeof t === 'string') &&
    t !== 'link' && t !== 'list' && t !== 'tag' && t !== 'button'
}

// 单元格内容解析（table-row.vue cells computed 的纯函数等价物）：返回 { text } /
// { items } / { canvasKind, ... }（皆空 = 空内容，绘制落 placeholder）
export function resolveCellContent (col, { record, recordNumber, emit }) {
  const text = col._text(record)

  if (text != null) return { text }

  // value 传字符串等非函数值经 ensureFn 包装后恒为函数，不会抛错
  const value = col._value(record) ?? (col.field ? record[col.field] : undefined)

  // A9 门控置于 _plainText 短路之前，直渲路径一并覆盖
  if (isArrayValueRejected(col, value)) return {}

  // P2 短路：纯文本列免 render 调用与中间对象（无 color 才短路，染色列走 compile 产 color）
  if (col._plainText) return { text: value }

  const { class: _class, style: _style, title: _title, ...params } =
    col._render({ record, recordNumber, value, emit }) || {}

  return params
}

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
    ctx, contentRect, content, col, padding, theme, record, measure, onItemRect, centerY, hoverItem, rightInset
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

/** 行数上限（§5.1）：regionHeight 缺省（普通格）恒 maxLines；合并主格按区域可用
    行数钳制——内容超出区域高度按区域行数省略，不回流行高 */
function capMaxLinesOf (col, record, regionHeight, padding, theme) {
  const maxLines = maxLinesOf(col, record)

  if (regionHeight == null) return maxLines

  return Math.min(maxLines, Math.floor((regionHeight - padding * 2) / cellLineHeightOf(theme)))
}

/** 矩形缺失 / 零尺寸（NaN 尺寸照常进入绘制，与原实现一致）时跳过内容绘制 */
function isSkippableRect (rect) {
  return !rect || rect.width <= 0 || rect.height <= 0
}

function drawCanvasKindContent (
  ctx, rect, content, col, padding, theme, record, measure, onItemRect, centerY, hoverItem, rightInset
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
      rightInset
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

/** 测量回调解析：注入 measure 优先（theme.js 测量缓存）；未注入回退 ctx 直测无缓存 */
function measureOf (ctx, measure) {
  if (typeof measure === 'function') return measure

  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

// —— 文本光学居中锚（20261029 问题 1） ——
// canvas 'middle' 基线按 em 方框中点定位，与 DOM 行框（字体 ascent/descent，
// 如 .mu-tag 的 inline-flex + line-height:1）居中口径不同，CJK 字形群系统性
// 偏上（实测 12px 雅黑链偏 1~2px）。改以 alphabetic 基线 + fontBoundingBox
// 度量半差补偿，使字形框中点对齐槽位 centerY（与 DOM 行框居中同口径）。
// 偏移按 font 串缓存取整（主题字体有限，无需淘汰；与既有整数锚一致防亚像素模糊）。
// 度量不可得（fontBoundingBoxAscent/Descent 缺失或 ctx 无 measureText——自检
// width-only stub ctx）时回退 { y: centerY, baseline: 'middle' }，行为等同修复前。
// 注意一：fontBoundingBox 口径随 ctx.textBaseline 当前值变化（middle 状态下返回
// 相对 em 中点的换算值而非 ascent/descent 本身），测量必须在 alphabetic 状态下取。
// 注意二：缓存键并入 ctx 实例级「可度量」能力位——真 canvas 与 width-only stub
// 同 font 串时能力不同，防止真 ctx 条目污染 stub 的回退路径。
const textAnchorCache = new Map()

/**
 * ctx 可度量探测（实例级一次）：measureText('') 在 alphabetic 状态下能取到
 * 有限 fontBoundingBoxAscent/Descent 才走补偿路径。
 */
function probeTextMetricsCapable (ctx) {
  if (typeof ctx.measureText !== 'function') return false

  const prevBaseline = ctx.textBaseline

  ctx.textBaseline = 'alphabetic'
  const metrics = ctx.measureText('')
  ctx.textBaseline = prevBaseline

  return Number.isFinite(metrics?.fontBoundingBoxAscent) && Number.isFinite(metrics?.fontBoundingBoxDescent)
}

/**
 * 文本光学居中锚：全部单元格文本 fillText 站点共用（槽位 centerY 的字形
 * 光学居中换算）。
 * @param {CanvasRenderingContext2D} ctx 已设 ctx.font 的绘制上下文
 * @param {Number} centerY 槽位中心（drawCell 槽位锚）
 * @returns {{ y: Number, baseline: 'alphabetic' | 'middle' }}
 */
function centeredTextAnchor (ctx, centerY) {
  if (ctx.__muTextAnchorCapable == null) {
    ctx.__muTextAnchorCapable = probeTextMetricsCapable(ctx)
  }

  const key = ctx.__muTextAnchorCapable ? ctx.font : `stub:${ctx.font}`
  let offset = textAnchorCache.get(key)

  if (offset === undefined) {
    offset = null

    if (ctx.__muTextAnchorCapable) {
      const prevBaseline = ctx.textBaseline

      ctx.textBaseline = 'alphabetic'
      const metrics = ctx.measureText('')
      ctx.textBaseline = prevBaseline
      offset = Math.round((metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2)
    }

    textAnchorCache.set(key, offset)
  }

  // 度量缺失（null）→ 'middle' 原行为
  return offset == null
    ? { y: centerY, baseline: 'middle' }
    : { y: centerY + offset, baseline: 'alphabetic' }
}

/** 文本水平锚点：center 锚扣本格右缘列线占用 rightInset（painter 注入），left/right 不动 */
function textAnchorX (rect, align, padding, rightInset) {
  return align === 'right'
    ? rect.x + rect.width - padding
    : align === 'center'
      ? rect.x + (rect.width - rightInset) / 2
      : rect.x + padding
}

// 文本取值落地（A3.5 统一规则；A9 后无数组形态——数组值在 resolveCellContent
// 门控落占位，不会进入本函数）：
// - 字符串 + maxLines>1 → wrapLines 多行（与 row-geometry 同一函数与缓存；
//   measure 未注入时回退单行省略），首行槽位锚起排
// - 其余 → 单行省略（垂直锚 = 槽位中心 centerY，与多行首行同式）
// color 为 canvas 通道色名查表产物（drawDisplayText 直取 content.color）
function drawTextValue (ctx, rect, display, align, {
  padding, theme, color, measure, wrapCache, maxLines, centerY, rightInset
}) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const text = String(display)
  const lineHeight = cellLineHeightOf(theme)

  if (maxLines > 1 && typeof measure === 'function' && text) {
    const { lines } = wrapLines({
      text, font: cellFontOf(theme), maxWidth: contentWidth, measure, cache: wrapCache, maxLines
    })

    ctx.fillStyle = color || theme?.textColor
    ctx.textAlign = align

    // 首行光学居中锚（问题 1），后续行 += lineHeight
    const anchor = centeredTextAnchor(ctx, centerY)

    ctx.textBaseline = anchor.baseline

    let y = anchor.y

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

  ctx.fillStyle = color || theme?.textColor
  ctx.textAlign = align

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(single, textAnchorX(rect, align, padding, rightInset), anchor.y)
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

// —— items 落地 ——

function itemClassOf (item) {
  const cls = item.attrs?.class

  return Array.isArray(cls) ? cls.join(' ') : String(cls ?? '')
}

/** 条目落地类别：canvas 通道产物自带 kind（link/tag）；check/img 无 dom 参数改造，
    走 is/class 回退；未识别 is 且 text != null 的条目按文本绘制；无文本的未知条目忽略 */
function resolveItemKind (item) {
  if (item.kind) return item.kind

  const cls = itemClassOf(item)

  if (cls.includes('mu-table__cell-check')) return 'check'
  if (item.is === 'img') return 'img'
  if (item.is === 'a') return 'link'
  if (cls.includes('mu-tag')) return 'tag'

  return item.text != null ? 'text' : null
}

/** link 条目色板解析：color 色名查表优先（list/link 条目平铺色名），
    item.danger 回退保留（老式自定义 kind:'link' 条目）；无 color/danger 返回 null */
function linkPaletteOf (item, theme) {
  const palette = item.color ? theme?.colors?.[item.color] : null

  if (palette) return palette

  return item.danger ? theme?.colors?.danger : null
}

/** link 条目文本色：disabled → muted；color 色名查表（danger 回退保留）；无 color
    时非 link 项（list 纯文本条目 link:false）正文色 textColor、其余（含老式自定义
    kind:'link' 条目）colors.primary 谱系（R1-1b：谱系回退与真实主题同源） */
function linkTextColorOf (item, theme) {
  if (isTruthyAttr(item.disabled)) return theme?.textColorMuted || theme?.gray

  if (item.link === false) return theme?.textColor

  const palette = linkPaletteOf(item, theme) ?? theme?.colors?.primary

  return palette?.color ?? theme?.primaryColor
}

/** link 条目悬停色：disabled → muted；color 色名查表 hover 谱系（danger 回退
    保留）；无 color 时非 link 项 textColor（hover 门控下不达，防御回退）、其余
    colors.primary 谱系 hover ?? color ?? primaryColor（R1-1b：恢复 HEAD 老式
    自定义 kind:'link' 条目悬停谱系，丢失 .hover 层属实现回归） */
export function linkHoverColorOf (item, theme) {
  if (isTruthyAttr(item.disabled)) return theme?.textColorMuted || theme?.gray

  if (item.link === false) return theme?.textColor

  const palette = linkPaletteOf(item, theme) ?? theme?.colors?.primary

  return palette?.hover ?? palette?.color ?? theme?.primaryColor
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
// 绘制区，link 为首行行框；disabled 随条目回报（与取色/点击同口径 isTruthyAttr）；
// link 条目附 link 门控布尔（item.link !== false，interactions 光标/悬停消费——
// list 非 link 列条目无指针反馈，与 isLinkEntryHovered 同谓词）
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

function measureItem (ctx, item, { contentWidth, contentHeight, padding, theme, onImageLoad, measure, row, colIndex }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return CHECK_SIZE

  if (kind === 'img') {
    const src = item.attrs?.src

    // 空 src 不发起请求（绘制端 drawCellImage 同款守卫，:1265）
    if (!src) return null

    // img 分支内建 onImageLoad 闭包（P1b：其余格零闭包分配）
    const entry = requestImage(src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)

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

  // link 条目色经平铺 danger/disabled 直取（恒两色：primary / danger）
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

/** link 悬停下划线 y（drawLinkEntry 与 drawItemText 共用单函数防公式漂移）：
    基线（alphabetic 锚，问题 1）下 2px——CJK descent ≈ 0.12em < 2px，不下穿字形 */
function linkUnderlineY (anchorY) {
  return anchorY + 2
}

/** 行框高（--cell-line-height 快照缺省回退 18）：三条文本绘制路径同源 */
function cellLineHeightOf (theme) {
  return theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
}

/** link 条目悬停判定（横排 drawItem 与竖排 drawLinkItems 共用防口径漂移）：
    item.link !== false 门控——list 纯文本条目（link:false）可点击不悬停（A6）；
    老式自定义 kind:'link' 条目无 link 字段（undefined ≠ false）行为不变 */
function isLinkEntryHovered (hoverItem, item, index) {
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

  // link 悬停下划线（问题 7）：1px，宽 = 实绘文本宽（省略后）
  if (hovered) {
    const underlineWidth = Math.min(width, Math.max(0, maxWidth))

    ctx.fillRect(x, linkUnderlineY(anchor.y), underlineWidth, 1)
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

    const anchor = centeredTextAnchor(ctx, centerY)

    ctx.textBaseline = anchor.baseline
    ctx.fillStyle = disabled ? theme?.gray : theme?.textColor
    ctx.fillText('✓', x + CHECK_SIZE / 2, anchor.y)
  }

  return CHECK_SIZE
}

function tagFontOf (theme) {
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
function drawLinkItems (ctx, rect, items, {
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

// —— canvas 专属类型（A3.3） ——

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

/** button 组第一遍测宽（对齐布局前置）：x 恒从左缘起逐条省略计宽（截断/哨兵
    行为与左对齐基线一致——对齐平移仅发生在未超宽时，全宽条目平移后仍放得下，
    不改变截断结果）；返回绘制条目（含原始 index 与省略产物）与累计偏移
    （含尾随 gap，计入对齐总宽前扣除，itemsStartX 口径） */
function layoutButtonEntries (buttons, rect, rightBound, padding, font, measureFn, link) {
  const entries = []
  let offset = 0

  for (let i = 0, x = rect.x + padding; i < buttons.length && x < rightBound; i++) {
    const button = buttons[i] ?? EMPTY_BUTTON
    const ellipsized = ellipsizeButton(button, x, rightBound, font, measureFn, link)

    // ellipsize 空文本 → null 哨兵（原 -1 同义），停止绘制后续按钮
    if (!ellipsized) break

    entries.push({ button, index: i, ...ellipsized })
    offset += ellipsized.width + padding
    x += ellipsized.width + padding
  }

  return { entries, offset }
}

// button 组（tag 同构轻量按钮）：横排，底 translucent + 边框/文字 colors[color].color；
// disabled 置灰；超宽丢弃；条目矩形回报 itemHits（kind 'button'，命中区 = pill 区）。
// link 形态（column.link）改走正文字体纯文字链，宽度/字体随之切换。
// 对齐两遍式（drawItems 同构）：测宽后按列 align 平移起点（center 扣 rightInset，
// 超宽回退左对齐）
function drawButton (ctx, rect, content, {
  align, padding, theme, record, onItemRect, measure, centerY, hoverItem, rightInset
}) {
  const buttons = content.buttons
  const link = content.link === true

  if (!Array.isArray(buttons) || !buttons.length) return

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const rightBound = rect.x + rect.width - padding
  const font = link ? cellFontOf(theme) : tagFontOf(theme)
  const measureFn = measureOf(ctx, measure)
  const { entries, offset } = layoutButtonEntries(buttons, rect, rightBound, padding, font, measureFn, link)

  if (!entries.length) return

  let x = itemsStartX(rect, align, padding, offset - padding, true, contentWidth, rightInset)

  for (const { button, index, text, width } of entries) {
    const hovered = isButtonHovered(hoverItem, index)

    if (link) {
      drawButtonLink(ctx, button, text, width, x, centerY, record, theme, font, hovered)
    } else {
      drawButtonPill(ctx, button, text, width, x, centerY, record, theme, font, hovered)
    }

    onItemRect?.({
      kind: 'button',
      index,
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

/** caption 省略与占用宽预处理（pill/link 两形态共用）：padX = pill 内边距（link
    形态 0）；空文本返回 null 哨兵不绘制且终止后续按钮；占用宽 = min(全宽, 右缘剩余) */
function ellipsizeButton (button, x, rightBound, font, measureFn, link) {
  const padX = link ? 0 : TAG_PADDING_X
  const { text, width: textWidth } = ellipsize({
    text: String(button.caption ?? ''),
    font,
    maxWidth: Math.max(0, rightBound - x - padX * 2),
    measure: measureFn
  })

  if (!text) return null

  return { text, width: Math.min(textWidth + padX * 2, rightBound - x) }
}

/** link 形态单条按钮（列级 column.link）：无底无边框纯文字链，常态
    colors[name].color、hover 变 colors[name].hover 谱系 + 1px 下划线（下划线式与
    link 条目同源）；disabled 恒置灰不悬停 */
function drawButtonLink (ctx, button, text, width, x, centerY, record, theme, font, hovered) {
  const disabled = isTruthyAttr(button.disabled)
  const colored = theme?.colors?.[colorNameOf(button.color, record)]

  ctx.font = font
  ctx.fillStyle = disabled
    ? (theme?.textColorMuted || theme?.gray)
    : (hovered
        ? (colored?.hover ?? colored?.color ?? theme?.primaryColor)
        : (colored?.color ?? theme?.primaryColor))
  ctx.textAlign = 'left'

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(text, x, anchor.y)

  if (hovered && !disabled) {
    ctx.fillRect(x, linkUnderlineY(anchor.y), width, 1)
  }
}

// 单个 button pill 绘制（省略预处理产物入参）：hovered 且非 disabled 时反转
// （底/边框 = colors[name].color、文字 = bgNormal）；disabled 置灰
function drawButtonPill (ctx, button, text, width, x, centerY, record, theme, font, hovered) {
  const disabled = isTruthyAttr(button.disabled)
  const colored = theme?.colors?.[colorNameOf(button.color, record)]
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

  const anchor = centeredTextAnchor(ctx, centerY)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(text, x + TAG_PADDING_X, anchor.y)
}

/** 图片等比布局尺寸：不放大，clamp 到 maxH × maxW 内 */
function imageLayoutSize (image, maxH, maxW) {
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

  // img 分支内建 onImageLoad 闭包（P1b）
  const entry = requestImage(src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)

  // 加载中 / 失败按空格处理；onload 后经回调触发该格重绘（painter 侧）
  if (entry.status !== 'loaded') return

  // 高度收进单元格内边距内，宽度再受右缘剩余空间约束
  const { width, height } = imageLayoutSize(entry.image, contentHeight - padding, maxWidth)

  ctx.drawImage(entry.image, x, centerY - height / 2, width, height)

  return width
}

// —— 单元格 tooltip 求值（title 列协议，02-design.md 20261030-table-ex-cell-tooltip） ——
//
// 触发期惰性求值（绘制热路径零改动）：组件壳在 TOOLTIP_SHOW_DELAY 定时器内调用
// resolveCellTooltip，复用与绘制同一套原语（resolveCellContent / wrapLines /
// capMaxLinesOf / 测量与 wrapCache），溢出判定与绘制行为逐项等价（矩阵口径见
// 02-design.md 接口节，不引入第二套测量式）；img 条目只读缓存条目（getImageEntry），
// 判定期不调用 requestImage、不发起加载。

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

/** button 组溢出（drawButton 逐 pill 累加等价式）：x 越右缘 break / 空 caption 哨兵
    终止（其后仍有按钮 = 内容被丢弃）/ pill 文本区放不下整体不绘制 / pill 截断均计
    溢出；link 形态无 pill 内边距、字体取正文（drawButton 同式切换） */
function buttonsOverflowOf (buttons, { contentWidth, padding, theme, measure, link }) {
  const font = link ? cellFontOf(theme) : tagFontOf(theme)
  const padX = link ? 0 : TAG_PADDING_X
  let consumed = 0

  for (let i = 0; i < buttons.length; i++) {
    const caption = String(buttons[i]?.caption ?? '')

    if (consumed >= contentWidth) return true

    // ellipsize 空文本 → -1 哨兵（drawButtonPill 同式）：该按钮不绘制且终止后续
    if (caption === '') return i < buttons.length - 1

    const remaining = contentWidth - consumed

    // pill 文本区放不下（maxWidth ≤ 0 → ellipsize 空文本 → -1 → break）：该按钮整体不绘制
    if (remaining - padX * 2 <= 0) return true

    // pill 宽 = min(全宽, 右缘剩余)：全宽超剩余即截断（caption 部分丢失）→ 溢出
    const width = measure(caption, font) + padX * 2

    if (width > remaining) return true

    consumed += width + padding
  }

  return false
}

/** 文本路径全文与溢出判定（drawTextValue 同式；A9 后无数组形态——数组值在
    resolveCellContent 门控落占位，source 恒为字符串）：按 maxLines 分多行 wrapLines
    clamped / 单行 measure 对比（contentWidth ≤ 0 按溢出返回，绘制层不画的格子允许提示） */
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

  // 单 item + line-clamp 形态改道 drawText 多行 → 按文本求值
  if (items.length === 1 && itemClassOf(only).includes('line-clamp') && only.text != null) {
    return resolveTooltipText(col, record, only.text, params)
  }

  const text = joinTooltipText(items.map(item => item?.text))

  if (text === '') return null

  // link/list 条目列竖排口径（list 与 link 共用，20261104-table-column-type）
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
 * @param {Object} params.theme 主题快照（themeWatcher.snapshot）
 * @param {Function} params.measure 测量回调（measureFn，走缓存）
 * @param {Object} params.wrapCache 折行缓存
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

  // String | Function：hover 即显示该文本（空串不显示）
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

  // 文本路径（A9 后 content.text 恒为字符串或缺失；null/undefined 无文本源 → null）
  return resolveTooltipText(col, record, content.text, { ...overflowParams, regionHeight, wrapCache })
}
