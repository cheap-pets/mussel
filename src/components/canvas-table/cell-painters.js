/**
 * canvas-table 单元格绘制适配器：复用现有 table 列类型体系，把列类型 render
 * 产物（text / items）落地为 canvas 绘制（02-design.md A3/A4 取值与渲染管线 / A3.5）。
 *
 * 取值链与 table.vue:164-178（列准备）、table-row.vue:44-69（取值）同款：
 * - 列准备：resolveColumnType → _text/_value 均 ensureFn → _render（compile | render | 类型本身）；
 *   canvas 专属类型（progress/button）经 CANVAS_ONLY_TYPES 在 resolveColumnType 之前
 *   分发（03-review-5 问题 6），不产出 render items；另挂 _maxLines/_maxItems/
 *   _resolveMaxLines（maxLines 常量与 legacy multiline+lineClamp 双形态，行级求值
 *   闭包——评审 6 P6）与 _isTreeColumn（A3.4）
 * - 取值：_text(record) 非 null 直接作为显示文本（跳过类型渲染）；否则
 *   value = _value(record) ?? record[field]，调 _render({ record, recordNumber, value, emit })
 * - 落地：text 直绘（string/number/array——数组每元素一行、超 _maxItems 第
 *   _maxItems 行 '...'）；字符串 + maxLines>1 经 wrapLines 多行（钳制末行 '...'，
 *   实施约束 4）；items 按 DOM class 标记落地 check / link / tag / img——link 列
 *   竖排每条一行（条目列，A3.5）并解析 mu-link--{color} class 查 theme.colors 取色
 *   （评审 6 P1）；TextColumn 的单 line-clamp item 形态改道 drawText 多行（A3.5）；
 *   class/style/title 为 DOM 通道字段，canvas 忽略
 *
 * 模块隔离（A8）：不 import theme.js / layout.js，主题色与 colors（固定 17 色
 * map）经 drawCell 的 theme 快照参数传入（字段同 theme.js readSnapshot）；
 * text-wrap 为纯函数模块（measure 经参数注入，painter state 携带）。
 */
import { ensureFn } from '../table/utils'
import { resolveColumnType } from '../table/column-types'
import { wrapLines, MAX_LINES_LIMIT } from './text-wrap'

// 视觉常量（镜像现有 DOM 规格，非新增设计值）：
// check 方框 —— src/components/table/column-types/style.scss .mu-table__cell-check
//   （16px、圆角 4px、✓ 12px/600）
const CHECK_SIZE = 16
const CHECK_RADIUS = 4
const CHECK_FONT_SIZE = 12
// tag pill / button —— src/styles/tag.scss .mu-tag（height 20px / padding 0 8px /
//   font-size 12px / 圆角 var(--mu-radius-control) = 4px）；button 为 tag 同构轻量按钮（A3.3）
const TAG_HEIGHT = 20
const TAG_PADDING_X = 8
const TAG_FONT_SIZE = 12
const TAG_RADIUS = 4
// progress 条（A3.3）：轨道 8px 圆角 4、百分比文本 12px
const PROGRESS_TRACK_HEIGHT = 8
const PROGRESS_RADIUS = 4
const PROGRESS_FONT_SIZE = 12
// 树缩进（A2.4，镜像 tree.scss --mu-tree_node-indent: 16px；该变量定义于 .mu-tree
// 作用域，组件探针读不到，canvas 侧取常量；与 row-geometry.TREE_INDENT 同值）
const TREE_INDENT = 16

// img 缓存上限（超限整体清空，同 theme.js 测量缓存策略）
const IMAGE_CACHE_LIMIT = 200

// 生产路径 theme 快照必含以下字段（readSnapshot）；缺省值仅为容错
const FALLBACK_FONT_SIZE = 14
const FALLBACK_FONT_FAMILY = 'sans-serif'
const FALLBACK_PADDING = 8
const FALLBACK_LINE_HEIGHT = 18

// 溢出/省略字符统一 '...'（三个半角点，00-task.md 实施约束 4，用户确认——
// maxLines 末行收缩、单行超宽省略、数组/link 超限 dots 同一字面）
const ELLIPSIS = '...'
const DOTS = '...'

// canvas 专属类型（A3.3）：不入 table 列类型注册表，prepareColumn 在
// resolveColumnType 之前分发，drawCell 按 canvasKind 走 drawProgress/drawButton；
// DOM 版 mu-table 无此二字段时回退 TextColumn（A3.1 差异 ④）
const CANVAS_ONLY_TYPES = { progress: true, button: true }

// —— img 异步加载缓存：src → { image, status: 'loading' | 'loaded' | 'failed' } ——

const imageCache = new Map()

/** 读取某 src 的缓存条目（painter / 自检用），未请求过返回 null */
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

    // 统一 crossOrigin=anonymous：跨域无 CORS 头的图加载失败，避免污染画布
    // （02-design.md 风险表：加载失败按空格处理，不绘制）
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      entry.status = 'loaded'
      // 同一 src 只回调一次；重绘范围（该格 / 整幅）由 painter 侧回调决定
      onLoad?.()
    }
    image.onerror = () => {
      entry.status = 'failed'
    }
    image.src = src
  }

  return entry
}

// —— 列准备（table.vue internalColumns 的 canvas 等价物，仅保留绘制所需字段） ——

/** maxLines/maxItems 配置值钳制（人工 2 意见 2：1–10；非法值回退 fallback） */
function clampLimit (value, fallback) {
  const n = Math.round(Number(value))

  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_LINES_LIMIT) : fallback
}

/**
 * 列定义 → 内部列：解析列类型缺省 align/width、ensureFn 化 text/value、
 * 构建 render；canvas 专属类型（progress/button）分发；挂 maxLines/maxItems/
 * 树形列标记；placeholder 列级缺省继承表格级（table.vue:195 同款）。
 *
 * @param {Object} column 原始列定义（不修改）
 * @param {{ placeholder?: String }} [options] 表格级 placeholder
 * @returns {Object} 内部列（_raw / _align / _text / _value / _render / _maxLines /
 *   _maxItems / _resolveMaxLines / _isTreeColumn / placeholder）
 */
export function prepareColumn (column, { placeholder } = {}) {
  const col = { ...column, _raw: column }

  const type = resolveColumnType(column.type)

  const { width = type.width, align = type.align } = column

  col._align = align ?? 'left'
  col._text = ensureFn(column.text)
  col._value = ensureFn(column.value)

  // 多行/条目上限（评审 6 P6 + 人工 2 意见 2）：
  // - _maxLines 仅常量形态；DOM 风格 multiline + lineClamp 等效映射进闭包
  // - _resolveMaxLines(record) 行级求值闭包：drawText、computeRowHeights/
  //   ensureRowMeasured、editor textarea 判定三处同源调用（函数形态 lineClamp
  //   的行高与绘制必然一致）；不在列准备期求值（无 record，函数形态只会得
  //   undefined 回退 10，行高/绘制分裂）
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

  // canvas 专属类型分发（03-review-5 问题 6）：progress/button 不经
  // resolveColumnType（回退 TextColumn 会绘制文本），产出 canvasKind 产物
  const canvasOnlyKind = CANVAS_ONLY_TYPES[column.type] ? column.type : null

  if (canvasOnlyKind === 'progress') {
    const getProgressOption = ensureFn(column.progressOption)

    col._render = ({ record, value }) => ({
      canvasKind: 'progress',
      value,
      progressOption: getProgressOption(record) ?? {}
    })
  } else if (canvasOnlyKind === 'button') {
    const getButtons = ensureFn(column.buttons)

    col._render = ({ record }) => ({ canvasKind: 'button', buttons: getButtons(record) ?? [] })
  } else {
    // table.vue:178 同款：compile 优先，其次类型对象/函数自身作为 render
    col._render = type.compile ? type.compile(column) : (type.render || type)
  }

  col.placeholder ??= placeholder

  return col
}

/**
 * 单元格内容解析（table-row.vue cells computed 的纯函数等价物）：
 * 返回 { text } / { items } / { canvasKind, ... }（皆空的空对象 = 空内容，
 * 绘制时落 placeholder）。render 产物的 class/style/title 为 DOM 通道字段，
 * 此处剔除、不消费。
 */
export function resolveCellContent (col, { record, recordNumber, emit }) {
  const text = col._text(record)

  if (text != null) return { text }

  // value 传字符串等非函数值经 ensureFn 包装后恒为函数，不会抛错
  const value = col._value(record) ?? (col.field ? record[col.field] : undefined)

  const { class: _class, style: _style, title: _title, ...params } =
    col._render({ record, recordNumber, value, emit }) || {}

  return params
}

/** maxLines 行级求值（消费方容错形态：优先 _resolveMaxLines 闭包，其次 _maxLines） */
function maxLinesOf (col, record) {
  if (typeof col._resolveMaxLines === 'function') return col._resolveMaxLines(record)

  return col._maxLines ?? 1
}

// —— canvas 落地 ——

/**
 * 绘制单个单元格内容（背景/网格线/hover 等由 painter 负责，此函数只画内容）。
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} options
 * - col            prepareColumn 产出的内部列
 * - record / recordNumber / emit   透传给列类型 render
 * - rect           { x, y, width, height } 单元格矩形（canvas 坐标）
 * - theme          主题快照（字段同 theme.js readSnapshot，含 colors 17 色 map）
 * - onImageLoad    img 异步加载完成回调（painter 用于触发重绘），可选
 * - row            行号（树形列 levels/hasChildren 平行数组取值），可选
 * - flatInfo       { levels, hasChildren } 树平铺信息（树关 = null），可选
 * - expandedKeys   展开 key 集合（Set），可选
 * - recordKey      当前行 key（箭头展开态判定），可选
 * - measure / wrapCache   文本测量注入（theme.js 工厂产物，多行折行），可选
 * - onItemRect     条目命中矩形收集回调 ({ kind, index, rect })（painter itemHits），
 *                  link/tag/button 条目回报（dots '...' 条目同样回报），可选
 * @returns {Object} resolveCellContent 的解析结果（painter 调试用）
 */
export function drawCell (ctx, {
  col,
  record,
  recordNumber,
  emit,
  rect,
  theme,
  onImageLoad,
  row,
  flatInfo,
  expandedKeys,
  recordKey,
  measure,
  wrapCache,
  onItemRect
}) {
  const content = resolveCellContent(col, { record, recordNumber, emit })

  if (!rect || rect.width <= 0 || rect.height <= 0) return content

  const padding = theme?.cellPadding || FALLBACK_PADDING

  ctx.font = cellFontOf(theme)
  ctx.textBaseline = 'middle'

  // 树形列（A2.4/A3.4）：内容区前置 level×16 缩进 + 16px 箭头槽（父行箭头/
  // 叶行空槽，判定 = flatInfo.hasChildren[row]），箭头方向经 expandedKeys 判定
  const inset = drawTreeAffordance(ctx, rect, {
    col,
    row,
    flatInfo,
    expandedKeys,
    recordKey,
    padding,
    theme
  })

  const contentRect = inset
    ? { ...rect, x: rect.x + inset, width: rect.width - inset }
    : rect

  // canvas 专属分发（A3.3）：progress / button 真实绘制，非 items 产物
  if (content.canvasKind === 'progress') {
    drawProgress(ctx, contentRect, content, { padding, theme, record })
    return content
  }

  if (content.canvasKind === 'button') {
    drawButton(ctx, contentRect, content.buttons, { padding, theme, record, onItemRect })
    return content
  }

  if (Array.isArray(content.items) && content.items.length) {
    // 单 item + line-clamp class 形态改道 drawText 多行（A3.5 DOM 风格兼容，
    // 评审 6 P6：maxLines 取 _resolveMaxLines(record)，与 render 内 --line-clamp
    // 同函数求值恒等）
    const only = content.items[0]

    if (content.items.length === 1 && itemClassOf(only).includes('line-clamp') && only.text != null) {
      drawTextValue(ctx, contentRect, only.text, col._align, {
        padding,
        theme,
        measure,
        wrapCache,
        maxLines: maxLinesOf(col, record),
        maxItems: col._maxItems
      })

      return content
    }

    // link 列 = 条目列（A3.5）：数组竖排每条一行（单条超宽省略）+ maxItems 钳制
    if (col.type === 'link') {
      drawLinkItems(ctx, contentRect, content.items, { padding, theme, maxItems: col._maxItems, onItemRect })

      return content
    }

    drawItems(ctx, contentRect, content.items, {
      align: col._align,
      padding,
      theme,
      onImageLoad,
      onItemRect
    })

    return content
  }

  // 空内容落占位文本（table-row.vue 的 cell.text ?? col.placeholder）
  const display = content.text ?? col.placeholder

  if (display != null) {
    drawTextValue(ctx, contentRect, display, col._align, {
      padding,
      theme,
      measure,
      wrapCache,
      maxLines: maxLinesOf(col, record),
      maxItems: col._maxItems
    })
  }

  return content
}

function cellFontOf (theme) {
  const fontSize = theme?.fontSize || FALLBACK_FONT_SIZE

  return `${fontSize}px ${theme?.fontFamily || FALLBACK_FONT_FAMILY}`
}

/** 文本水平锚点（ctx.textAlign 与 align 同值时的 x 坐标） */
function textAnchorX (rect, align, padding) {
  return align === 'right'
    ? rect.x + rect.width - padding
    : align === 'center'
      ? rect.x + rect.width / 2
      : rect.x + padding
}

/** 超宽截断加省略号（A7：单行省略；溢出字符 '...' 按实施约束 4 统一）；一个字符都放不下时返回空串 */
function ellipsize (ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text

  let end = text.length

  while (end > 0 && ctx.measureText(text.slice(0, end) + ELLIPSIS).width > maxWidth) end--

  return end > 0 ? text.slice(0, end) + ELLIPSIS : ''
}

/**
 * 文本取值落地（A3.5 统一规则）：
 * - 数组值 → 每元素一行（逐元素 String 化）、顶部对齐；行数 > maxItems 时第
 *   maxItems 行显示 '...'（dots 字面，DOM link.js:47/tag.js:46 同款）
 * - 字符串 + maxLines>1 → wrapLines 多行（折行 + maxLines 钳制一体；与
 *   row-geometry 同一函数与缓存，行高与绘制折行必然一致；measure 未注入时
 *   回退单行省略），顶部对齐（首行 = rect.y + padding + lineHeight/2）
 * - 其余 → 单行省略（现状路径，垂直居中）
 */
function drawTextValue (ctx, rect, display, align, { padding, theme, measure, wrapCache, maxLines, maxItems }) {
  if (Array.isArray(display)) {
    drawArrayLines(ctx, rect, display, align, { padding, theme, maxItems })
    return
  }

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const text = String(display)
  const lineHeight = theme?.cellLineHeight || FALLBACK_LINE_HEIGHT

  if (maxLines > 1 && typeof measure === 'function' && text) {
    const { lines } = wrapLines({ text, font: cellFontOf(theme), maxWidth: contentWidth, measure, cache: wrapCache, maxLines })

    ctx.fillStyle = theme?.textColor
    ctx.textAlign = align

    let y = rect.y + padding + lineHeight / 2

    for (const line of lines) {
      ctx.fillText(line, textAnchorX(rect, align, padding), y)
      y += lineHeight
    }

    return
  }

  // 单行省略（现状路径）：垂直居中
  const single = ellipsize(ctx, text, contentWidth)

  if (!single) return

  ctx.fillStyle = theme?.textColor
  ctx.textAlign = align
  ctx.fillText(single, textAnchorX(rect, align, padding), rect.y + rect.height / 2)
}

/** 数组值多行（文本呈现列）：每元素一行、顶部对齐、超限第 maxItems 行 '...' */
function drawArrayLines (ctx, rect, values, align, { padding, theme, maxItems }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !values.length) return

  const lineHeight = theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
  const shown = values.length > maxItems
    ? values.slice(0, maxItems - 1).concat(DOTS)
    : values

  ctx.fillStyle = theme?.textColor
  ctx.textAlign = align

  let y = rect.y + padding + lineHeight / 2

  for (const element of shown) {
    const line = ellipsize(ctx, String(element ?? ''), contentWidth)

    if (line) ctx.fillText(line, textAnchorX(rect, align, padding), y)

    y += lineHeight
  }
}

// —— 树形列（A2.4/A3.4） ——

/** 箭头展开态判定（Set 优先，数组容错） */
function isExpandedKey (expandedKeys, key) {
  if (expandedKeys == null || key == null) return false

  if (typeof expandedKeys.has === 'function') return expandedKeys.has(key)

  return typeof expandedKeys.includes === 'function' ? expandedKeys.includes(key) : false
}

/**
 * 树形列缩进与箭头：内容区前置 level×16 缩进 + 16px 箭头槽（父行 12px 三角、
 * 叶行空槽）；返回内容区应右移的 inset px（= level×16 + 16，与行高估高的
 * contentWidth 扣减口径一致——实施约束 6），非树形列/树关返回 0。
 */
function drawTreeAffordance (ctx, rect, { col, row, flatInfo, expandedKeys, recordKey, padding, theme }) {
  if (!col._isTreeColumn || !flatInfo) return 0

  const level = flatInfo.levels?.[row] ?? 0
  const hasChildren = !!flatInfo.hasChildren?.[row]

  if (hasChildren) {
    const x = rect.x + padding + level * TREE_INDENT
    const centerY = rect.y + rect.height / 2

    ctx.beginPath()

    if (isExpandedKey(expandedKeys, recordKey)) {
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
    ctx.fillStyle = theme?.textColor
    ctx.fill()
  }

  return level * TREE_INDENT + TREE_INDENT
}

// —— items 落地 ——

function itemClassOf (item) {
  const cls = item.attrs?.class

  return Array.isArray(cls) ? cls.join(' ') : String(cls ?? '')
}

/**
 * 条目落地类别。check 与 multiline 的 div 条目 is 均为 'div'，
 * 以列类型写入的 DOM class 标记区分（mu-table__cell-check / mu-tag / line-clamp），
 * 与列类型内部实现解耦。
 */
function resolveItemKind (item) {
  const cls = itemClassOf(item)

  if (cls.includes('mu-table__cell-check')) return 'check'
  if (item.is === 'img') return 'img'
  if (item.is === 'a') return 'link'
  if (cls.includes('mu-tag')) return 'tag'

  // 未识别 is 且 text != null 的条目按文本绘制（decisions「[I1 前]⑤」；
  // 单 line-clamp div 已在 drawCell 改道，其余（无文本的未知条目）忽略
  return item.text != null ? 'text' : null
}

/** mu-{tag|link}--{color} class 色名解析（17 色板名；无 class/未知名返回 null） */
function colorClassOf (item, prefix) {
  const match = new RegExp(`mu-${prefix}--(\\S+)`).exec(itemClassOf(item))

  return match?.[1] ?? null
}

/**
 * link 条目文本色（评审 6 P1 完整链路 + 实施约束 7）：
 * disabled（存在性判定 attrs.disabled != null && attrs.disabled !== false，与
 * 命中/发事件口径一致）→ textColorMuted；mu-link--{color} class → colors[name].color
 * （mu-link--danger → colors.danger.color 同路径）；未知名/无 class → primaryColor。
 */
function linkTextColorOf (item, theme) {
  const attrs = item.attrs ?? {}

  if (attrs.disabled != null && attrs.disabled !== false) {
    return theme?.textColorMuted || theme?.gray
  }

  const name = colorClassOf(item, 'link')
  const colored = name && theme?.colors?.[name]?.color

  return colored || theme?.primaryColor
}

/**
 * items 行绘制：先测各条目宽度，按列 align 分布整体起点
 * （check 列 align:center 的方框居中，与 DOM text-align 行为一致），
 * 再逐条目绘制；超出右缘的条目丢弃。link/tag 条目矩形经 onItemRect 回报
 * （kind/index/rect，painter itemHits 命中来源，A3.3）。
 */
function drawItems (ctx, rect, items, { align, padding, theme, onImageLoad, onItemRect }) {
  const gap = padding
  const contentWidth = rect.width - padding * 2
  const centerY = rect.y + rect.height / 2

  const hooks = { contentWidth, contentHeight: rect.height, padding, theme, onImageLoad }
  const widths = items.map(item => measureItem(ctx, item, hooks))

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

  // 内容超宽时回退左对齐（溢出部分被右缘丢弃，不向两侧外溢）
  let start = rect.x + padding

  if (visible && offset < contentWidth) {
    if (align === 'center') start = rect.x + (rect.width - offset) / 2
    else if (align === 'right') start = rect.x + rect.width - padding - offset
  }

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
      onImageLoad
    })

    if (onItemRect) {
      const kind = resolveItemKind(items[i])

      if (kind === 'tag' || kind === 'link') {
        onItemRect({ kind, index: i, rect: { x, y: rect.y, width, height: rect.height } })
      }
    }
  }
}

function measureItem (ctx, item, { contentWidth, contentHeight, padding, theme, onImageLoad }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return CHECK_SIZE

  if (kind === 'img') {
    const entry = requestImage(item.attrs?.src, onImageLoad)

    // 加载中 / 失败按空格处理（不占位；加载完成后经回调触发重绘）
    if (entry.status !== 'loaded') return null

    return imageLayoutSize(entry.image, contentHeight - padding, contentWidth).width
  }

  if (kind == null) return null

  const text = String(item.text ?? '')

  ctx.font = kind === 'tag' ? tagFontOf(theme) : cellFontOf(theme)

  const width = ctx.measureText(text).width + (kind === 'tag' ? TAG_PADDING_X * 2 : 0)

  return Math.min(width, contentWidth)
}

function drawItem (ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return drawCheck(ctx, item, x, centerY, theme)

  if (kind === 'img') {
    return drawCellImage(ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad })
  }

  if (kind === 'tag') return drawTag(ctx, item, x, centerY, { maxWidth, theme })

  if (kind == null) return

  // link 条目色经 class 解析（mu-link--{color} → theme.colors 查表，评审 6 P1；
  // danger/disabled 同路径）；其余条目按普通文本绘制
  drawItemText(ctx, item, x, centerY, {
    maxWidth,
    theme,
    color: kind === 'link' ? linkTextColorOf(item, theme) : theme?.textColor
  })
}

function drawItemText (ctx, item, x, centerY, { maxWidth, theme, color }) {
  ctx.font = cellFontOf(theme)

  const text = ellipsize(ctx, String(item.text ?? ''), Math.max(0, maxWidth))

  if (!text) return

  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, centerY)
}

function drawCheck (ctx, item, x, centerY, theme) {
  const attrs = item.attrs ?? {}
  const checked = attrs['data-checked'] != null && attrs['data-checked'] !== false
  const disabled = attrs.disabled != null && attrs.disabled !== false

  const y = centerY - CHECK_SIZE / 2

  if (disabled) {
    // 置灰底衬：--mu-bg-strong（DOM 版同款变量，03-review-3 问题 1 回退链统一：
    // 自定义主题缺该变量时回退 hoverBg 现状等效色）
    ctx.beginPath()
    ctx.roundRect(x + 0.5, y + 0.5, CHECK_SIZE - 1, CHECK_SIZE - 1, CHECK_RADIUS)
    ctx.fillStyle = theme?.bgStrong || theme?.hoverBg
    ctx.fill()
  }

  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, CHECK_SIZE - 1, CHECK_SIZE - 1, CHECK_RADIUS)

  // DOM 规格：checked 边框 --mu-border-color-strong，否则 --mu-border-color-normal；
  // disabled 边框恒为 --mu-border-color-normal
  ctx.strokeStyle = disabled
    ? theme?.borderColor
    : (checked ? theme?.borderColorStrong : theme?.borderColor)
  ctx.lineWidth = 1
  ctx.stroke()

  if (checked) {
    ctx.font = `${CHECK_FONT_SIZE}px ${theme?.fontFamily || FALLBACK_FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = disabled ? theme?.gray : theme?.textColor
    ctx.fillText('✓', x + CHECK_SIZE / 2, centerY)
  }

  return CHECK_SIZE
}

function tagFontOf (theme) {
  return `${TAG_FONT_SIZE}px ${theme?.fontFamily || FALLBACK_FONT_FAMILY}`
}

/**
 * tag pill 落地：解析 mu-tag--{color} class → 底 colors[name].translucent +
 * 边框/文字 colors[name].color（17 色板，A3.3；无 class/未知名/gray 回退现状灰底）。
 */
function drawTag (ctx, item, x, centerY, { maxWidth, theme }) {
  ctx.font = tagFontOf(theme)

  const text = ellipsize(ctx, String(item.text ?? ''), Math.max(0, maxWidth - TAG_PADDING_X * 2))

  const width = ctx.measureText(text).width + TAG_PADDING_X * 2

  if (width <= TAG_PADDING_X * 2) return width

  const name = colorClassOf(item, 'tag')
  const colored = name ? theme?.colors?.[name] : null
  const y = centerY - TAG_HEIGHT / 2

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

/** 单条 link 文本绘制：单行省略，返回绘制宽度（命中矩形用） */
function drawLinkEntry (ctx, text, x, y, maxWidth, theme, color) {
  ctx.font = cellFontOf(theme)

  const display = ellipsize(ctx, text, Math.max(0, maxWidth))

  if (!display) return 0

  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(display, x, y)

  return Math.min(ctx.measureText(display).width, maxWidth)
}

/**
 * link 列竖排（数组每条一行，A3.5）：单条超宽省略；条目数 > maxItems 时第
 * maxItems 条显示 '...'（DOM dots 字面值，评审 6 P4）；对象元素颜色经
 * mu-link--{color} class 解析（link.js 产出，评审 6 P1）；条目矩形（含 dots）
 * 经 onItemRect 回报（kind 'link'，disabled 过滤在交互侧与取色同口径）。
 */
function drawLinkItems (ctx, rect, items, { padding, theme, maxItems, onItemRect }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !items.length) return

  const lineHeight = theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
  const x = rect.x + padding
  const overflow = items.length > maxItems
  const shown = overflow ? items.slice(0, maxItems - 1) : items

  let y = rect.y + padding + lineHeight / 2

  const report = (index, width) => {
    onItemRect?.({
      kind: 'link',
      index,
      rect: { x, y: y - lineHeight / 2, width, height: lineHeight }
    })
  }

  for (let i = 0; i < shown.length; i++) {
    const item = shown[i]
    const width = drawLinkEntry(ctx, String(item.text ?? ''), x, y, contentWidth, theme, linkTextColorOf(item, theme))

    if (width > 0) report(i, width)

    y += lineHeight
  }

  if (overflow) {
    const width = drawLinkEntry(ctx, DOTS, x, y, contentWidth, theme, theme?.primaryColor)

    if (width > 0) report(maxItems - 1, width)
  }
}

// —— canvas 专属类型（A3.3） ——

/** 色板名解析（color 支持 (record)=>name） */
function colorNameOf (value, record) {
  const name = typeof value === 'function' ? value(record) : value

  return typeof name === 'string' && name ? name : 'primary'
}

/** progress 条：轨道 bgStrong 8px 圆角 4 + 填充 colors[color].color + 百分比文本（单行高） */
function drawProgress (ctx, rect, content, { padding, theme, record }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const option = content.progressOption ?? {}
  const numeric = Number(content.value)
  const value = Number.isFinite(numeric) ? Math.min(Math.max(numeric, 0), 100) : 0
  const colorName = colorNameOf(option.color, record)
  const color = theme?.colors?.[colorName]?.color ?? theme?.primaryColor
  const showText = option.showText !== false
  const centerY = rect.y + rect.height / 2

  let trackWidth = contentWidth

  if (showText) {
    const label = Math.round(value) + '%'

    ctx.font = `${PROGRESS_FONT_SIZE}px ${theme?.fontFamily || FALLBACK_FONT_FAMILY}`

    const labelWidth = ctx.measureText(label).width + 6

    // 极窄列文本放不下时退化为仅轨道
    if (contentWidth - labelWidth > 0) {
      trackWidth = contentWidth - labelWidth

      ctx.fillStyle = theme?.textColor
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, rect.x + rect.width - padding, centerY)
    }
  }

  // 轨道（bgStrong 缺失时回退 hoverBg，与 check disabled 底衬同款回退链）
  ctx.beginPath()
  ctx.roundRect(rect.x + padding + 0.5, centerY - PROGRESS_TRACK_HEIGHT / 2 + 0.5, trackWidth - 1, PROGRESS_TRACK_HEIGHT - 1, PROGRESS_RADIUS)
  ctx.fillStyle = theme?.bgStrong || theme?.hoverBg
  ctx.fill()

  // 填充（pct × 轨道宽）
  const fillWidth = trackWidth * value / 100

  if (fillWidth > 0.5) {
    ctx.beginPath()
    ctx.roundRect(rect.x + padding + 0.5, centerY - PROGRESS_TRACK_HEIGHT / 2 + 0.5, Math.max(1, fillWidth - 1), PROGRESS_TRACK_HEIGHT - 1, PROGRESS_RADIUS)
    ctx.fillStyle = color
    ctx.fill()
  }
}

/**
 * button 组（tag 同构轻量按钮：20px / padding 0 8px / 圆角 4 / 12px）：横排，
 * 底 colors[color].translucent + 边框/文字 colors[color].color；disabled 底
 * bgDisabled、文字 textColorMuted；超宽丢弃；条目矩形回报 itemHits
 * （kind 'button'，可点击命中），progress 不回报。
 */
function drawButton (ctx, rect, buttons, { padding, theme, record, onItemRect }) {
  if (!Array.isArray(buttons) || !buttons.length) return

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const centerY = rect.y + rect.height / 2
  const rightBound = rect.x + rect.width - padding

  let x = rect.x + padding

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i] ?? {}

    if (x >= rightBound) break

    ctx.font = tagFontOf(theme)

    const text = ellipsize(ctx, String(button.caption ?? ''), Math.max(0, rightBound - x - TAG_PADDING_X * 2))

    if (!text) break

    const disabled = button.disabled != null && button.disabled !== false
    const colorName = colorNameOf(button.color, record)
    const colored = theme?.colors?.[colorName]
    const width = Math.min(ctx.measureText(text).width + TAG_PADDING_X * 2, rightBound - x)
    const y = centerY - TAG_HEIGHT / 2

    ctx.beginPath()
    ctx.roundRect(x + 0.5, y + 0.5, width - 1, TAG_HEIGHT - 1, TAG_RADIUS)
    ctx.fillStyle = disabled
      ? (theme?.bgDisabled || theme?.hoverBg)
      : (colored?.translucent ?? theme?.hoverBg)
    ctx.fill()
    ctx.strokeStyle = disabled ? theme?.borderColor : (colored?.color ?? theme?.borderColor)
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = disabled
      ? (theme?.textColorMuted || theme?.gray)
      : (colored?.color ?? theme?.textColor)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + TAG_PADDING_X, centerY)

    onItemRect?.({ kind: 'button', index: i, rect: { x, y: rect.y, width, height: rect.height } })

    x += width + padding
  }
}

/** 图片等比布局尺寸：不放大，clamp 到 maxH × maxW 内 */
function imageLayoutSize (image, maxH, maxW) {
  const width = image.naturalWidth || 1
  const height = image.naturalHeight || 1
  const scale = Math.min(1, maxH / height, maxW / width)

  return { width: width * scale, height: height * scale }
}

function drawCellImage (ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad }) {
  const src = item.attrs?.src

  if (!src) return

  const entry = requestImage(src, onImageLoad)

  // 加载中 / 失败按空格处理；onload 后经回调触发该格重绘（painter 侧）
  if (entry.status !== 'loaded') return

  // 高度收进单元格内边距内，宽度再受右缘剩余空间约束
  const { width, height } = imageLayoutSize(entry.image, contentHeight - padding, maxWidth)

  ctx.drawImage(entry.image, x, centerY - height / 2, width, height)

  return width
}
