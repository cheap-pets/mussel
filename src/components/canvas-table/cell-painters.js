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
import { wrapLines, ellipsize, cellFontOf, MAX_LINES_LIMIT } from './text-wrap'
import { isExpandedKey } from './tree'
import {
  TREE_INDENT,
  CELL_PADDING_FALLBACK,
  CHECK_SIZE,
  CHECK_RADIUS,
  CHECK_FONT_SIZE,
  ELLIPSIS,
  FONT_FAMILY_FALLBACK
} from './constants'

// 视觉常量（镜像现有 DOM 规格，非新增设计值）：
// check 方框（CHECK_*，与表头 painter.drawHeaderCheck 同规格互指——状态机不同
// 不强合，规格变更两处同步）—— src/components/table/column-types/style.scss
//   .mu-table__cell-check
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

// img 缓存上限（超限整体清空，同 theme.js 测量缓存策略）
const IMAGE_CACHE_LIMIT = 200

// 生产路径 theme 快照必含以下字段（readSnapshot）；缺省值仅为容错
const FALLBACK_LINE_HEIGHT = 18

// button 组条目缺省占位（buttons[i] 为 null/undefined 时的只读替身，
// 仅访问 caption/disabled/color，共享单例替代循环内逐次 {} 分配）
const EMPTY_BUTTON = {}

// canvas 专属类型（A3.3）：不入 table 列类型注册表，prepareColumn 在
// resolveColumnType 之前分发，drawCell 按 canvasKind 走 drawProgress/drawButton；
// DOM 版 mu-table 无此二字段时回退 TextColumn（A3.1 差异 ④）
const CANVAS_ONLY_TYPES = { progress: true, button: true }

// —— img 异步加载缓存：src → { image, status: 'loading' | 'loaded' | 'failed' } ——

const imageCache = new Map()

/** 读取某 src 的缓存条目（self-check only：img 缓存行为的自检观测窗口，
    生产路径经 requestImage 内部消费，无其他调用方） */
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
 * _render 构建：canvas 专属类型（progress/button，03-review-5 问题 6）不经
 * resolveColumnType 产物（回退 TextColumn 会绘制文本），直接产出 canvasKind
 * render；普通类型走 table.vue:178 同款——compile 优先，其次类型对象/函数
 * 自身作为 render。
 */
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

  const { align = type.align } = column

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

  col._render = createColumnRender(column, type, canvasOnlyKind)

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
 * - measure / wrapCache   文本测量注入（theme.js 工厂产物，多行折行），可选；
 *                        单行省略经 ellipsize 走 measure 缓存，未注入时回退 ctx 直测
 * - onItemRect     条目命中矩形收集回调 ({ kind, index, rect })（painter itemHits），
 *                  link/tag/button 条目回报（dots '...' 条目同样回报），可选
 * - placeholder    表格级占位文本兜底（content.text ?? 列级 placeholder ?? 此值），
 *                  painter state.placeholder 注入，可选
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
  onItemRect,
  placeholder
}) {
  const content = resolveCellContent(col, { record, recordNumber, emit })

  if (isSkippableRect(rect)) return content

  const padding = theme?.cellPadding || CELL_PADDING_FALLBACK

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
  if (drawCanvasKindContent(ctx, contentRect, content, padding, theme, record, measure, onItemRect)) {
    return content
  }

  if (Array.isArray(content.items) && content.items.length) {
    drawContentItems(
      ctx, contentRect, content, col, record,
      padding, theme, measure, wrapCache, onItemRect, onImageLoad
    )

    return content
  }

  drawDisplayText(ctx, contentRect, content, col, record, placeholder, padding, theme, measure, wrapCache)

  return content
}

/** 矩形缺失 / 零尺寸（含 NaN 尺寸：`<= 0` 判定为 false 时照常进入绘制，
    与原实现逐分支一致）时跳过内容绘制 */
function isSkippableRect (rect) {
  return !rect || rect.width <= 0 || rect.height <= 0
}

/** canvas 专属分发（A3.3）：progress / button 真实绘制；命中返回 true */
function drawCanvasKindContent (ctx, rect, content, padding, theme, record, measure, onItemRect) {
  if (content.canvasKind === 'progress') {
    drawProgress(ctx, rect, content, { padding, theme, record, measure })
    return true
  }

  if (content.canvasKind === 'button') {
    drawButton(ctx, rect, content.buttons, { padding, theme, record, onItemRect, measure })
    return true
  }

  return false
}

/**
 * items 数组落地：单 item + line-clamp class 形态改道 drawText 多行（A3.5
 * DOM 风格兼容，评审 6 P6：maxLines 取 _resolveMaxLines(record)，与 render 内
 * --line-clamp 同函数求值恒等）；link 列 = 条目列竖排（A3.5）；其余横排。
 */
function drawContentItems (
  ctx, rect, content, col, record,
  padding, theme, measure, wrapCache, onItemRect, onImageLoad
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
        maxItems: col._maxItems
      })

      return
    }
  }

  // link 列 = 条目列（A3.5）：数组竖排每条一行（单条超宽省略）+ maxItems 钳制
  if (col.type === 'link') {
    drawLinkItems(ctx, rect, content.items, { padding, theme, maxItems: col._maxItems, onItemRect, measure })

    return
  }

  drawItems(ctx, rect, content.items, {
    align: col._align,
    padding,
    theme,
    onImageLoad,
    onItemRect,
    measure
  })
}

/** 空内容落占位文本（table-row.vue 的 cell.text ?? col.placeholder ?? 表格级 placeholder） */
function drawDisplayText (ctx, rect, content, col, record, placeholder, padding, theme, measure, wrapCache) {
  const display = content.text ?? col.placeholder ?? placeholder

  if (display != null) {
    drawTextValue(ctx, rect, display, col._align, {
      padding,
      theme,
      measure,
      wrapCache,
      maxLines: maxLinesOf(col, record),
      maxItems: col._maxItems
    })
  }
}

/**
 * 测量回调解析：注入 measure 优先（生产路径 = theme.js 测量缓存实例，与行高
 * 估高/精算同一缓存）；未注入（自检/手织调用容错）回退当前 ctx 直测，无缓存
 */
function measureOf (ctx, measure) {
  if (typeof measure === 'function') return measure

  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

/** 文本水平锚点（ctx.textAlign 与 align 同值时的 x 坐标） */
function textAnchorX (rect, align, padding) {
  return align === 'right'
    ? rect.x + rect.width - padding
    : align === 'center'
      ? rect.x + rect.width / 2
      : rect.x + padding
}

/**
 * 多行文本块首行 y（R4b）：块整体在格内垂直居中——单行内容（n=1）时与单行
 * 省略路径的 rect.height/2 锚一致，首行文字与其他单行格文字对齐；此前恒从
 * 顶部 padding 起画，等高行偏 1px、变高行（如 h=52）偏 9px。估高与行高公式
 * 一致时 (h − 块高)/2 ≥ padding，max(…, padding) 为行数不一致时的顶部防溢出。
 */
function multilineBlockTop (rect, blockHeight, padding) {
  return rect.y + Math.max(padding, (rect.height - blockHeight) / 2)
}

/**
 * 文本取值落地（A3.5 统一规则）：
 * - 数组值 → 每元素一行（逐元素 String 化）、块整体垂直居中（R4b）；行数 >
 *   maxItems 时第 maxItems 行显示 '...'（dots 字面，DOM link.js:47/tag.js:46 同款）
 * - 字符串 + maxLines>1 → wrapLines 多行（折行 + maxLines 钳制一体；与
 *   row-geometry 同一函数与缓存，行高与绘制折行必然一致；measure 未注入时
 *   回退单行省略），块整体垂直居中（R4b）
 * - 其余 → 单行省略（现状路径，垂直居中：锚 = rect.y + rect.height/2）
 */
function drawTextValue (ctx, rect, display, align, { padding, theme, measure, wrapCache, maxLines, maxItems }) {
  if (Array.isArray(display)) {
    drawArrayLines(ctx, rect, display, align, { padding, theme, maxItems, measure })
    return
  }

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const text = String(display)
  const lineHeight = theme?.cellLineHeight || FALLBACK_LINE_HEIGHT

  if (maxLines > 1 && typeof measure === 'function' && text) {
    const { lines } = wrapLines({
      text, font: cellFontOf(theme), maxWidth: contentWidth, measure, cache: wrapCache, maxLines
    })

    ctx.fillStyle = theme?.textColor
    ctx.textAlign = align

    let y = multilineBlockTop(rect, lines.length * lineHeight, padding) + lineHeight / 2

    for (const line of lines) {
      ctx.fillText(line, textAnchorX(rect, align, padding), y)
      y += lineHeight
    }

    return
  }

  // 单行省略（现状路径）：垂直居中；截断经注入 measure 走缓存（P0-1）
  const { text: single } = ellipsize({
    text,
    font: cellFontOf(theme),
    maxWidth: contentWidth,
    measure: measureOf(ctx, measure)
  })

  if (!single) return

  ctx.fillStyle = theme?.textColor
  ctx.textAlign = align
  ctx.fillText(single, textAnchorX(rect, align, padding), rect.y + rect.height / 2)
}

/** 数组值多行（文本呈现列）：每元素一行、块整体垂直居中（R4b）、超限第 maxItems 行 '...' */
function drawArrayLines (ctx, rect, values, align, { padding, theme, maxItems, measure }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !values.length) return

  const lineHeight = theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
  const shown = values.length > maxItems
    ? values.slice(0, maxItems - 1).concat(ELLIPSIS)
    : values
  const font = cellFontOf(theme)
  const measureFn = measureOf(ctx, measure)

  ctx.fillStyle = theme?.textColor
  ctx.textAlign = align

  let y = multilineBlockTop(rect, shown.length * lineHeight, padding) + lineHeight / 2

  for (const element of shown) {
    const { text: line } = ellipsize({ text: String(element ?? ''), font, maxWidth: contentWidth, measure: measureFn })

    if (line) ctx.fillText(line, textAnchorX(rect, align, padding), y)

    y += lineHeight
  }
}

// —— 树形列（A2.4/A3.4） ——

/**
 * 树箭头三角绘制（C2 收拢：槽内 2..10、展开 ▾ / 收起 ▸ ±3.5 / ±5 的坐标
 * 单一事实源）：分区 1 常态（drawTreeAffordance，textColor）与分区 5 hover
 * 主色（painter.paintTreeArrowAccent）共用，形状变更只改此处。
 */
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
    drawTreeArrow(
      ctx,
      rect.x + padding + level * TREE_INDENT,
      rect.y + rect.height / 2,
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
function drawItems (ctx, rect, items, { align, padding, theme, onImageLoad, onItemRect, measure }) {
  const gap = padding
  const contentWidth = rect.width - padding * 2
  const centerY = rect.y + rect.height / 2

  const hooks = { contentWidth, contentHeight: rect.height, padding, theme, onImageLoad, measure }
  const widths = items.map(item => measureItem(ctx, item, hooks))

  const { positions, offset, visible } = layoutItemPositions(items, widths, gap)

  // 内容超宽时回退左对齐（溢出部分被右缘丢弃，不向两侧外溢）
  const start = itemsStartX(rect, align, padding, offset, visible, contentWidth)
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
      measure
    })

    if (onItemRect) reportHitRect(onItemRect, items[i], i, x, rect.y, width, rect.height)
  }
}

/** 逐条目横向起点（可见条目间以 gap 分隔；测量失败条目 null 跳过不占位），
    一并产出累计宽度 offset 与是否含可见条目 visible（起点分布判定用） */
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

/** items 整体起点：内容未超宽时按列 align 分布，超宽回退左对齐 */
function itemsStartX (rect, align, padding, offset, visible, contentWidth) {
  let start = rect.x + padding

  if (visible && offset < contentWidth) {
    if (align === 'center') start = rect.x + (rect.width - offset) / 2
    else if (align === 'right') start = rect.x + rect.width - padding - offset
  }

  return start
}

/** tag/link 条目命中矩形回报（painter itemHits 命中来源，A3.3；其余类别不回报） */
function reportHitRect (onItemRect, item, index, x, y, width, height) {
  const kind = resolveItemKind(item)

  if (kind === 'tag' || kind === 'link') {
    onItemRect({ kind, index, rect: { x, y, width, height } })
  }
}

function measureItem (ctx, item, { contentWidth, contentHeight, padding, theme, onImageLoad, measure }) {
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
  const width = measureOf(ctx, measure)(text, kind === 'tag' ? tagFontOf(theme) : cellFontOf(theme)) +
    (kind === 'tag' ? TAG_PADDING_X * 2 : 0)

  return Math.min(width, contentWidth)
}

function drawItem (ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad, measure }) {
  const kind = resolveItemKind(item)

  if (kind === 'check') return drawCheck(ctx, item, x, centerY, theme)

  if (kind === 'img') {
    return drawCellImage(ctx, item, x, centerY, { maxWidth, contentHeight, padding, theme, onImageLoad })
  }

  if (kind === 'tag') return drawTag(ctx, item, x, centerY, { maxWidth, theme, measure })

  if (kind == null) return

  // link 条目色经 class 解析（mu-link--{color} → theme.colors 查表，评审 6 P1；
  // danger/disabled 同路径）；其余条目按普通文本绘制
  drawItemText(ctx, item, x, centerY, {
    maxWidth,
    theme,
    measure,
    color: kind === 'link' ? linkTextColorOf(item, theme) : theme?.textColor
  })
}

function drawItemText (ctx, item, x, centerY, { maxWidth, theme, measure, color }) {
  const { text } = ellipsize({
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

/**
 * tag pill 落地：解析 mu-tag--{color} class → 底 colors[name].translucent +
 * 边框/文字 colors[name].color（17 色板，A3.3；无 class/未知名/gray 回退现状灰底）。
 * 单次 ellipsize 同时产出截断文本与宽度（省略后免二次测量）。
 */
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

/** 单条 link 文本绘制：单行省略，返回绘制宽度（命中矩形用，省略后免二次测量） */
function drawLinkEntry (ctx, text, x, y, maxWidth, theme, color, measure) {
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

  return Math.min(width, maxWidth)
}

/**
 * link 列竖排（数组每条一行，A3.5）：单条超宽省略；条目数 > maxItems 时第
 * maxItems 条显示 '...'（DOM dots 字面值，评审 6 P4）；条目块整体垂直居中
 * （R4b，与 wrap/数组路径同口径）；对象元素颜色经 mu-link--{color} class
 * 解析（link.js 产出，评审 6 P1）；条目矩形（含 dots）经 onItemRect 回报
 * （kind 'link'，disabled 过滤在交互侧与取色同口径）。
 */
function drawLinkItems (ctx, rect, items, { padding, theme, maxItems, onItemRect, measure }) {
  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0 || !items.length) return

  const lineHeight = theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
  const x = rect.x + padding
  const overflow = items.length > maxItems
  const shown = overflow ? items.slice(0, maxItems - 1) : items
  const lineCount = Math.min(items.length, maxItems)

  let y = multilineBlockTop(rect, lineCount * lineHeight, padding) + lineHeight / 2

  const report = (index, width) => {
    onItemRect?.({
      kind: 'link',
      index,
      rect: { x, y: y - lineHeight / 2, width, height: lineHeight }
    })
  }

  for (let i = 0; i < shown.length; i++) {
    const item = shown[i]
    const width = drawLinkEntry(ctx, String(item.text ?? ''), x, y, contentWidth, theme, linkTextColorOf(item, theme), measure)

    if (width > 0) report(i, width)

    y += lineHeight
  }

  if (overflow) {
    const width = drawLinkEntry(ctx, ELLIPSIS, x, y, contentWidth, theme, theme?.primaryColor, measure)

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
function drawProgress (ctx, rect, content, { padding, theme, record, measure }) {
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

/**
 * button 组（tag 同构轻量按钮：20px / padding 0 8px / 圆角 4 / 12px）：横排，
 * 底 colors[color].translucent + 边框/文字 colors[color].color；disabled 底
 * bgDisabled、文字 textColorMuted；超宽丢弃；条目矩形回报 itemHits
 * （kind 'button'，可点击命中），progress 不回报。
 */
function drawButton (ctx, rect, buttons, { padding, theme, record, onItemRect, measure }) {
  if (!Array.isArray(buttons) || !buttons.length) return

  const contentWidth = rect.width - padding * 2

  if (contentWidth <= 0) return

  const centerY = rect.y + rect.height / 2
  const rightBound = rect.x + rect.width - padding
  const font = tagFontOf(theme)
  const measureFn = measureOf(ctx, measure)

  let x = rect.x + padding

  for (let i = 0; i < buttons.length; i++) {
    if (x >= rightBound) break

    const width = drawButtonPill(
      ctx, buttons[i] ?? EMPTY_BUTTON, x, centerY, rightBound, record, theme, font, measureFn
    )

    // ellipsize 空文本（caption 空或剩余宽度放不下）→ -1 哨兵，停止绘制后续
    // 按钮（等效原 `if (!text) break`；NaN 宽度经 `< 0` 判定不中断，分支一致）
    if (width < 0) break

    onItemRect?.({ kind: 'button', index: i, rect: { x, y: rect.y, width, height: rect.height } })

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

/**
 * 单个 button pill 绘制：返回占用宽度（供命中矩形与游标推进）；
 * ellipsize 结果为空文本（caption 空或 maxWidth 耗尽）返回 -1 哨兵、不绘制。
 * 正常宽度恒 ≥ min(TAG_PADDING_X × 2, rightBound - x) > 0，与哨兵不重叠。
 */
function drawButtonPill (ctx, button, x, centerY, rightBound, record, theme, font, measureFn) {
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

  ctx.font = font
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, TAG_HEIGHT - 1, TAG_RADIUS)
  ctx.fillStyle = buttonFillOf(theme, colored, disabled)
  ctx.fill()
  ctx.strokeStyle = buttonBorderOf(theme, colored, disabled)
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = buttonTextOf(theme, colored, disabled)
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
