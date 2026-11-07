/** 单元格文本绘制共享原语：光学居中锚 / 水平锚 / 单多行落地 / 行高 / 下划线 y（cell-painters 簇共享层） */
import { wrapLines, ellipsize, cellFontOf } from '../shared/text-wrap'
import { FONT_FAMILY_FALLBACK } from '../shared/constants'

// 生产路径 theme 快照必含以下字段（readSnapshot）；缺省值仅为容错
const FALLBACK_LINE_HEIGHT = 18

/** 测量回调解析：注入 measure 优先（theme.js 测量缓存）；未注入回退 ctx 直测无缓存 */
export function measureOf (ctx, measure) {
  if (typeof measure === 'function') return measure

  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

// —— 文本光学居中锚（20261029 问题 1；20261107 测量基升级 CJK 墨迹半差） ——
// canvas 'middle' 基线按 em 方框中点定位，与 DOM 行框（字体 ascent/descent，
// 如 .mu-tag 的 inline-flex + line-height:1）居中口径不同，CJK 字形群系统性
// 偏上（实测 12px 雅黑链偏 1~2px）。改以 alphabetic 基线 + 典型 CJK 字符
// （CJK_PROBE_CHAR '永'）actualBoundingBox 墨迹半差补偿，使墨迹框中点对齐槽位
// centerY（与 DOM 行框居中同口径）——实测墨迹度量随系统字体栈自适应，取代
// fontBoundingBox 整字体包围盒（对 CJK 回退字体不敏感、跨系统漂移大）。
// 偏移按 font 串缓存取整（font 串含字号/字重 ⇒ 同字体+字号不重测；基数有界，
// 无需淘汰；与既有整数锚一致防亚像素模糊）。
// 度量不可得（actualBoundingBox* 缺失/非有限、墨迹零高或 ctx 无 measureText——
// 自检 width-only stub ctx）时回退 { y: centerY, baseline: 'middle' }，行为等同
// 修复前。
// 注意一：boundingBox 口径随 ctx.textBaseline 当前值变化（middle 状态下返回
// 相对 em 中点的换算值而非 ascent/descent 本身），测量必须在 alphabetic 状态下取。
// 注意二：缓存键并入 ctx 实例级「可度量」能力位——真 canvas 与 width-only stub
// 同 font 串时能力不同，防止真 ctx 条目污染 stub 的回退路径。能力位保持实例级
// （勿改模块级）：探测本身 = 一次 measureText(CJK_PROBE_CHAR)，与锚 miss 测量
// 分开计——新实例首绘固定 2 次探针字符测量（探测 1 + 锚 1），同 font 的第二
// 实例仅 1 次（探测 1，锚命中）。
// 注意三：缓存写入守卫 fontsLoadedForCache——@font-face 加载前实测易把回退/tofu
// 度量固化进模块级缓存，document.fonts.status !== 'loaded' 期间测得值即用即弃
// （该窗口内按 fillText 站点重复测量，有界于 fonts.ready，稳态为零）。
const textAnchorCache = new Map()

/** 典型 CJK 探针字符（永字八法全笔画类满高表意字，单字符即单字形度量）；
    自检 textAnchorOffset 同参口径复用 */
export const CJK_PROBE_CHAR = '永'

/** 缓存写入守卫（文本锚与字形锚两缓存共用谓词，仅 miss 路径执行）：
    无 FontFaceSet（含 SSR）视同 loaded；命中路径不查，稳态零开销 */
function fontsLoadedForCache () {
  return typeof document === 'undefined' ||
    document.fonts == null ||
    document.fonts.status === 'loaded'
}

/** 墨迹半差锚偏移：alphabetic 状态单字形测量的 (inkAscent − inkDescent)/2 取整；
    度量缺失/非有限/墨迹零高返回 null（调用方回退 'middle'）。
    恢复调用前 textBaseline，边界对齐既有探测/锚测量写法 */
function inkHalfDiffOffsetOf (ctx, text) {
  const prevBaseline = ctx.textBaseline

  ctx.textBaseline = 'alphabetic'
  const metrics = ctx.measureText(text)
  ctx.textBaseline = prevBaseline

  const ascent = metrics?.actualBoundingBoxAscent
  const descent = metrics?.actualBoundingBoxDescent

  if (!Number.isFinite(ascent) || !Number.isFinite(descent)) return null
  if (!(ascent + descent > 0)) return null

  return Math.round((ascent - descent) / 2)
}

/**
 * ctx 可度量探测（实例级一次）：measureText(CJK_PROBE_CHAR) 在 alphabetic
 * 状态下能取到有限 actualBoundingBoxAscent/Descent 才走补偿路径。
 */
function probeTextMetricsCapable (ctx) {
  if (typeof ctx.measureText !== 'function') return false

  const prevBaseline = ctx.textBaseline

  ctx.textBaseline = 'alphabetic'
  const metrics = ctx.measureText(CJK_PROBE_CHAR)
  ctx.textBaseline = prevBaseline

  return Number.isFinite(metrics?.actualBoundingBoxAscent) && Number.isFinite(metrics?.actualBoundingBoxDescent)
}

/**
 * 文本光学居中锚：全部单元格文本 fillText 站点共用（槽位 centerY 的字形
 * 光学居中换算）。
 * @param {CanvasRenderingContext2D} ctx 已设 ctx.font 的绘制上下文
 * @param {Number} centerY 槽位中心（drawCell 槽位锚）
 * @returns {{ y: Number, baseline: 'alphabetic' | 'middle' }}
 */
export function centeredTextAnchor (ctx, centerY) {
  if (ctx.__muTextAnchorCapable == null) {
    ctx.__muTextAnchorCapable = probeTextMetricsCapable(ctx)
  }

  const key = ctx.__muTextAnchorCapable ? ctx.font : `stub:${ctx.font}`
  let offset = textAnchorCache.get(key)

  if (offset === undefined) {
    offset = ctx.__muTextAnchorCapable ? inkHalfDiffOffsetOf(ctx, CJK_PROBE_CHAR) : null

    if (fontsLoadedForCache()) textAnchorCache.set(key, offset)
  }

  // 度量缺失（null）→ 'middle' 原行为
  return offset == null
    ? { y: centerY, baseline: 'middle' }
    : { y: centerY + offset, baseline: 'alphabetic' }
}

// —— 字形墨迹锚（20261107：iconfont 字形与单元格/表头 ✓ 等单字形内容） ——
// 单字形内容（iconfont 图标常不满 em 框、✓ 墨迹偏 em 框上部）的墨迹框与
// CJK 表意字差异大，文本 CJK 探针半差不代表其渲染高度——逐字形实测
// actualBoundingBox 墨迹半差（键含 glyph + font 串，font 串含字号 ⇒ 字号未变
// 不重测）。守卫（fontsLoadedForCache）、回退（'middle'）、取整口径与文本锚一致，
// 两缓存无共享可变状态。
const glyphAnchorCache = new Map()

/**
 * 字形墨迹锚：单字形内容（iconfont cls 字形、check ✓）fillText 站点共用。
 * @param {CanvasRenderingContext2D} ctx 已设 ctx.font 的绘制上下文
 * @param {String} glyph 单字符字形（缓存键一部分）
 * @param {Number} centerY 槽位中心（drawCell 槽位锚）
 * @returns {{ y: Number, baseline: 'alphabetic' | 'middle' }}
 */
export function centeredGlyphAnchor (ctx, glyph, centerY) {
  if (ctx.__muTextAnchorCapable == null) {
    ctx.__muTextAnchorCapable = probeTextMetricsCapable(ctx)
  }

  const key = (ctx.__muTextAnchorCapable ? '' : 'stub:') + glyph + '\u0000' + ctx.font
  let offset = glyphAnchorCache.get(key)

  if (offset === undefined) {
    offset = ctx.__muTextAnchorCapable ? inkHalfDiffOffsetOf(ctx, glyph) : null

    if (fontsLoadedForCache()) glyphAnchorCache.set(key, offset)
  }

  return offset == null
    ? { y: centerY, baseline: 'middle' }
    : { y: centerY + offset, baseline: 'alphabetic' }
}

/** 文本水平锚点：center 锚扣本格右缘列线占用 rightInset（painter 注入），left/right 不动 */
export function textAnchorX (rect, align, padding, rightInset) {
  return align === 'right'
    ? rect.x + rect.width - padding
    : align === 'center'
      ? rect.x + (rect.width - rightInset) / 2
      : rect.x + padding
}

/** 对齐反推左缘（下划线 x / 命中矩形 x 同式防口径漂移）：textAnchorX 对
    center/right 返回的是锚点而非左缘，按实绘宽反推（缺此换算时对齐列的线会
    从锚点向右溢出格内文本区） */
function alignedLeftX (align, anchorX, width) {
  if (align === 'center') return anchorX - width / 2
  if (align === 'right') return anchorX - width
  return anchorX
}

// 文本取值落地（A3.5 统一规则；A9 后无数组形态——数组值在 resolveCellContent
// 门控落占位，不会进入本函数）：
// - 字符串 + maxLines>1 → wrapLines 多行（与 row-geometry 同一函数与缓存；
//   measure 未注入时回退单行省略），首行槽位锚起排
// - 其余 → 单行省略（垂直锚 = 槽位中心 centerY，与多行首行同式）
// color 为 canvas 通道色名查表产物（drawDisplayText 直取 content.color）
// options.underline（20261106-column-link-hover-button-value）：缺省 falsy；
// true 时每实绘行下画 1px 下划线（y = linkUnderlineY(该行锚 y)，色随文本
// fillStyle，与 drawLinkEntry/drawItemText 同式），多行逐行对齐 DOM
// text-decoration 行为
// 返回值（新增）：实绘文本块行框外接矩形 { x, y, width, height } | undefined
// （y = centerY − lineHeight/2，height = 实绘行数 × lineHeight，width = 最宽
// 实绘行宽省略后，x 按 align 反推）；未绘制任何文本（空串/零宽）返回 undefined。
// 既有调用方（cell-painters line-clamp 路径 / drawDisplayText）不传 underline、
// 忽略返回值，行为不变
export function drawTextValue (ctx, rect, display, align, {
  padding, theme, color, measure, wrapCache, maxLines, centerY, rightInset, underline
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

    const anchorX = textAnchorX(rect, align, padding, rightInset)
    let y = anchor.y
    let widest = 0

    for (const line of lines) {
      // 行宽走注入 measure 缓存（wrapLines 同源）；下划线 x 与文本起点同口径
      const lineWidth = measure(line, cellFontOf(theme))

      ctx.fillText(line, anchorX, y)

      if (underline && lineWidth > 0) {
        ctx.fillRect(alignedLeftX(align, anchorX, lineWidth), linkUnderlineY(y), lineWidth, 1)
      }

      if (lineWidth > widest) widest = lineWidth
      y += lineHeight
    }

    // 空串/零宽（未绘制任何文本）不回报矩形
    if (!(widest > 0)) return

    return {
      x: alignedLeftX(align, anchorX, widest),
      y: centerY - lineHeight / 2,
      width: widest,
      height: lines.length * lineHeight
    }
  }

  // 单行省略：截断经注入 measure 走缓存（P0-1）
  const { text: single, width } = ellipsize({
    text,
    font: cellFontOf(theme),
    maxWidth: contentWidth,
    measure: measureOf(ctx, measure)
  })

  if (!single) return

  ctx.fillStyle = color || theme?.textColor
  ctx.textAlign = align

  const anchor = centeredTextAnchor(ctx, centerY)
  const anchorX = textAnchorX(rect, align, padding, rightInset)
  const drawn = Math.min(width, contentWidth)

  ctx.textBaseline = anchor.baseline
  ctx.fillText(single, anchorX, anchor.y)

  if (!(drawn > 0)) return

  // link 悬停下划线（条目链路同式）：宽 = 实绘省略后宽，1px
  if (underline) {
    ctx.fillRect(alignedLeftX(align, anchorX, drawn), linkUnderlineY(anchor.y), drawn, 1)
  }

  return {
    x: alignedLeftX(align, anchorX, drawn),
    y: centerY - lineHeight / 2,
    width: drawn,
    height: lineHeight
  }
}

/** link 悬停下划线 y（drawLinkEntry 与 drawItemText 共用单函数防公式漂移）：
    基线（alphabetic 锚，问题 1）下 2px——CJK descent ≈ 0.12em < 2px，不下穿字形 */
export function linkUnderlineY (anchorY) {
  return anchorY + 2
}

/** 行框高（--cell-line-height 快照缺省回退 18）：三条文本绘制路径同源 */
export function cellLineHeightOf (theme) {
  return theme?.cellLineHeight || FALLBACK_LINE_HEIGHT
}

/** 字体族回退（theme 快照缺 fontFamily 时用兜底族；check/tag/progress 同源） */
export function fontFamilyOf (theme) {
  return theme?.fontFamily || FONT_FAMILY_FALLBACK
}
