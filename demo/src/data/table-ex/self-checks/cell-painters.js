/**
 * table-ex 自检断言 — cell-painters 模块（G2）。
 *
 * 覆盖（02-design.md G2 判据 + 既有取值链回归）：
 * 取值链 text→value→field（含 value 传字符串）、rec_no 的 recordNumber、check disabled
 * （底衬 bgStrong 回退链）、mappings/options 显示映射（mappings 特性 enum 独有，
 * 20261104：mappings 优先、仅 options 转换、未命中原值回退；text 列不走映射、
 * 改挂 column.color 染色）、number/currency/date
 * 格式化与 color 双通道（canvas 平铺色名直取 / dom text-{c} class）、
 * 自定义类型 render、link/list/tag/items 落地；canvas 类型分发（progress/button 产 canvasKind，03-review-5
 * 问题 6）；多行文本（maxLines 常量与函数形态 lineClamp 行级求值——评审 6 P6、
 * line-clamp item 改道；A9（20261104-table-column-type）后文本列数组值在
 * resolveCellContent 统一门控落占位，不再逐元素拆行）；link/list 列竖排
 * （list 共用 kind 'link' 命中/hover 链：link 列（column.link 列级，R1）条目
 * item.color 色名查表、非 link 列条目 textColor、disabled muted、hover 按
 * item.link !== false 门控——link 字段 = 列级 column.link）+ ListColumn /
 * LinkColumn（兼容壳委托 list）/ TagColumn 双通道 compile 产物断言
 * （canvas 平铺 kind 条目 / dom DOM 形态条目；payload 键统一 item）；tag 17 色、
 * button/disabled、树形列缩进箭头；button link 形态（column.link 列级声明：纯文字链
 * 取色/正文字体/hover 下划线/命中宽度/tooltip 计宽切换）；
 * button 组与 link 竖排对齐（20261104 修复：两遍式测宽按列 align 分布、center 扣
 * rightInset、命中矩形 x 随对齐同步；link 竖排每条各自对齐）。
 *
 * 问题 1/5/7（G2-3，A1/A5/A7）：槽位锚断言组（首行 y = Math.round(ROW_TOP_INSET +
 * (rowHeight − ROW_TOP_INSET)/2) 不随行高变、水平 center 扣 rightInset、超高行跨列首行同高——
 * decisions 检查点-A1判据：直调残差 1px（r=0 / 格线不含 row）/ 0.5px（r≥1 且含 row），
 * 锚为行线中点四舍五入取整）；requestIconImage（SVG currentColor 着色 → data URL、同参复用
 * 缓存条目、非 SVG src 直通）；linkHoverColorOf 分支；link 悬停两路径色变 +
 * fillRect 下划线（recordingCtx 增记 fillRect/stroke）；button pill 悬停反转三色；
 * itemHits 条目 disabled 字段。
 *
 * resolveCellTooltip（title 列协议，20261030-table-ex-cell-tooltip）：falsy 门控、
 * 自定义 String/Function title、true 形态文本/横排条目（check/img/tag 计宽）/
 * link·list 竖排/button 组溢出判定矩阵、maxLines 与 regionHeight 钳制、line-clamp 改道
 * （A9 后无数组文本形态）。
 *
 * 断言全部同步执行（runChecks 不支持异步）；img 加载完成后的重绘联动属 painter
 * 集成行为，此处只断言加载状态、crossOrigin 与未加载前空格（data URI 每次运行
 * 生成不同像素，规避页内重跑时序竞争——G1-b 遗留；requestIconImage 的 SVG 串
 * 同理逐次唯一）。
 */
import {
  prepareColumn,
  resolveCellContent,
  resolveCellTooltip,
  drawCell,
  getImageEntry,
  requestIconImage,
  linkHoverColorOf
} from '../../../../../src/components/table/ex/cell-painters.js'
import { createWrapCache } from '../../../../../src/components/table/ex/text-wrap.js'
import { LinkColumn } from '../../../../../src/components/table/column-types/link.js'
import { ListColumn } from '../../../../../src/components/table/column-types/list.js'
import { TagColumn } from '../../../../../src/components/table/column-types/tag.js'
import { BoolColumn } from '../../../../../src/components/table/column-types/bool.js'
import { NumberColumn } from '../../../../../src/components/table/column-types/number.js'
import { TextColumn } from '../../../../../src/components/table/column-types/text.js'
import { EnumColumn } from '../../../../../src/components/table/column-types/enum.js'
import { resolveColumnType } from '../../../../../src/components/table/column-types/index.js'
import { t } from '../../../../../src/langs/index.js'

// 主题夹具：字段名对齐 theme.js readSnapshot（值用固定 rgba 串，与探针无关）；
// colors 固定 17 色形态 = 12 彩色 + 5 语义，gray 不入（A6.1；全量读取断言在 theme 组）
const BASE_COLOR_NAMES = ['red', 'pink', 'grape', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange']
const SEMANTIC_COLOR_NAMES = ['primary', 'secondary', 'success', 'warning', 'danger']

// R1-2（20261104-table-column-type 修复轮）：primary 语义色与 primaryColor 同源同值
// —— theme.js readColors 语义色读 --mu-{name}-color，真实主题两者恒等；旧 stub 按
// 17 色位置公式两值分离，属夹具口径缺陷（verify-1 失败项 1a），hover 仍保持可区分
const PRIMARY_COLOR = 'rgba(0, 102, 255, 1)'
const PRIMARY_HOVER = 'rgba(0, 130, 245, 0.85)'

const THEME_COLORS = {}

for (const [index, name] of [...BASE_COLOR_NAMES, ...SEMANTIC_COLOR_NAMES].entries()) {
  const semantic = index >= BASE_COLOR_NAMES.length
  const sameSourcePrimary = name === 'primary'
  const color = sameSourcePrimary ? PRIMARY_COLOR : `rgba(${20 + index * 10}, 60, 200, 1)`

  THEME_COLORS[name] = {
    color,
    translucent: sameSourcePrimary ? 'rgba(0, 102, 255, 0.1)' : `rgba(${20 + index * 10}, 60, 200, 0.1)`,
    // hover（问题 7 谱系）：语义色 = --mu-{name}-color-4 等价的可区分配色
    // （断言 hover ≠ color 才有效）；彩色 hover === color（DOM 版 hover 基准）
    hover: semantic
      ? (sameSourcePrimary ? PRIMARY_HOVER : `rgba(${20 + index * 10}, 130, 245, 0.85)`)
      : color
  }
}

const THEME = {
  textColor: 'rgba(24, 24, 24, 1)',
  textColorMuted: 'rgba(120, 120, 120, 1)',
  borderColor: 'rgba(208, 213, 219, 1)',
  borderColorSoft: 'rgba(232, 236, 241, 1)',
  borderColorStrong: 'rgba(153, 158, 165, 1)',
  hoverBg: 'rgba(0, 0, 0, 0.04)',
  bgNormal: 'rgba(255, 255, 255, 1)',
  bgStrong: 'rgba(0, 0, 0, 0.08)',
  bgDisabled: 'rgba(0, 0, 0, 0.12)',
  primaryColor: PRIMARY_COLOR,
  gray: 'rgba(153, 153, 153, 1)',
  fontSize: 14,
  fontFamily: 'sans-serif',
  rowHeight: 36,
  cellPadding: 8,
  cellLineHeight: 18,
  colors: THEME_COLORS
}

const CELL_WIDTH = 160
const CELL_HEIGHT = 36
const RECORD_NUMBER = 7

function content (col, record, extra = {}) {
  return resolveCellContent(col, { record, recordNumber: RECORD_NUMBER, ...extra })
}

function drawToCanvas (
  col, record,
  { theme = THEME, emit, onImageLoad, width = CELL_WIDTH, height = CELL_HEIGHT, rect, recording, ...extra } = {}
) {
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = recording ? recordingCtx(canvas) : canvas.getContext('2d')

  drawCell(ctx, {
    col,
    record,
    recordNumber: RECORD_NUMBER,
    emit,
    rect: rect ?? { x: 0, y: 0, width, height },
    theme,
    onImageLoad,
    ...extra
  })

  return canvas
}

/** 绘制并返回 fillText/fill/fillRect/stroke 调用记录（坐标与绘制时颜色，供取色/布局断言） */
function drawRecorded (col, record, options = {}) {
  const canvas = drawToCanvas(col, record, { ...options, recording: true })

  return { canvas, calls: canvas.__paintCalls }
}

/**
 * canvas 2d 上下文代理：记录 fillText（text/x/y + 调用时 fillStyle）、fill
 * （调用时 fillStyle）、fillRect（x/y/width/height + fillStyle——link 悬停下划线
 * 断言，A5 行）与 stroke（strokeStyle——button 悬停反转边框色断言）。文本取色
 * 断言避免像素抗锯齿噪声，直接捕获 fillStyle。set 派发到 target 本体（默认 set
 * 的 receiver 为 proxy，会触发原生 setter 的品牌检查抛 Illegal invocation）。
 */
function recordingCtx (canvas) {
  const ctx = canvas.getContext('2d')
  const calls = { fillText: [], fill: [], fillRect: [], stroke: [] }

  canvas.__paintCalls = calls

  return new Proxy(ctx, {
    get (target, prop) {
      if (prop === 'fillText') {
        return (text, x, y) => {
          calls.fillText.push({ text: String(text), x, y, fillStyle: target.fillStyle, font: target.font })
          return target.fillText(text, x, y)
        }
      }

      if (prop === 'fill') {
        return () => {
          calls.fill.push({ fillStyle: target.fillStyle })
          return target.fill()
        }
      }

      if (prop === 'fillRect') {
        return (x, y, width, height) => {
          calls.fillRect.push({ x, y, width, height, fillStyle: target.fillStyle })
          return target.fillRect(x, y, width, height)
        }
      }

      if (prop === 'stroke') {
        return () => {
          calls.stroke.push({ strokeStyle: target.strokeStyle })
          return target.stroke()
        }
      }

      const value = Reflect.get(target, prop, target)

      return typeof value === 'function' ? value.bind(target) : value
    },

    set (target, prop, value) {
      target[prop] = value

      return true
    }
  })
}

/** 确定性文本测量（非空格字符 7px + 每字符 2px 记账 → CJK 9px/字符，供折行断言无字体依赖） */
function fakeMeasure (text) {
  return String(text).replace(/\s/g, '').length * 7 + String(text).length * 2
}

/** 文本光学居中锚偏移（20261029 问题 1）：与 cell-painters.centeredTextAnchor
 *  同参口径现算——y = centerY + round((fbAscent − fbDescent)/2)，随运行时字体
 *  自适应（fontBoundingBox 须 alphabetic 状态测量；度量缺失环境回退 0 = middle） */
function textAnchorOffset (font) {
  const c = document.createElement('canvas').getContext('2d')

  c.font = font
  c.textBaseline = 'alphabetic'
  const m = c.measureText('')

  return Number.isFinite(m?.fontBoundingBoxAscent) && Number.isFinite(m?.fontBoundingBoxDescent)
    ? Math.round((m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2)
    : 0
}

// THEME fixture 的 cellFontOf 产物与对应锚偏移（槽位锚 y 断言 = 19 + OFF）
const CELL_FONT = '14px sans-serif'
const TEXT_ANCHOR_OFF = textAnchorOffset(CELL_FONT)

/** css 颜色串按 canvas 序列化口径归一（fillStyle 赋值后回读：#rrggbb / rgba(...)） */
const COLOR_PROBE = document.createElement('canvas').getContext('2d')

function cssColorOf (value) {
  COLOR_PROBE.fillStyle = value

  return COLOR_PROBE.fillStyle
}

function countPaintedPixels (canvas) {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)

  let count = 0

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) count++
  }

  return count
}

function pixelBuffersDiffer (a, b) {
  const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data
  const db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data

  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) return true
  }

  return false
}

/** 4×4 纯色 PNG data URI（同源，不污染画布；不用跨域图）。
 *  每次调用生成不同像素（红通道递增）→ data URI 不同 → 走全新 Image 加载：
 *  修复页内重跑时序竞争（同 URI 二次加载走内存缓存可能同步完成 load，
 *  使「未完成前状态应为 loading」断言失败——G1-b 遗留 instability）。 */
let imageSeed = 0

function tinyPngDataUri () {
  const canvas = document.createElement('canvas')

  canvas.width = 4
  canvas.height = 4

  const ctx = canvas.getContext('2d')

  imageSeed = imageSeed % 254 + 1
  ctx.fillStyle = `rgb(${imageSeed}, 0, 0)`
  ctx.fillRect(0, 0, 4, 4)

  return canvas.toDataURL('image/png')
}

/** requestIconImage 夹具的 SVG 串逐次唯一序号：imageCache 是模块级 Map 跨检查
 *  持存，固定串在页内重跑时会直接命中已加载条目，「loading」断言假红（同
 *  tinyPngDataUri 的重跑时序规避，A5 行） */
let iconSeed = 0

// —— resolveCellTooltip 夹具（title 列协议，20261030-table-ex-cell-tooltip）： ——
// stub measure（fakeMeasure，CJK 每字符 9px）+ 固定 theme；contentWidth =
// CELL_WIDTH − padding×2 = 144、contentHeight = CELL_HEIGHT − ROW_TOP_INSET = 35
// （壳预算同式：格宽 − padding×2 − 树缩进 / 格高 − 1）
function tooltipOf (column, record, extra = {}) {
  return resolveCellTooltip(prepareColumn(column), {
    record,
    recordNumber: RECORD_NUMBER,
    contentWidth: extra.contentWidth ?? CELL_WIDTH - THEME.cellPadding * 2,
    contentHeight: extra.contentHeight ?? CELL_HEIGHT - 1,
    regionHeight: extra.regionHeight ?? null,
    theme: THEME,
    measure: fakeMeasure,
    wrapCache: createWrapCache()
  })
}

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)

  return String(actual)
}

function assertArray (actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)

  if (a !== e) throw new Error(`${label} 期望 ${e}，实际 ${a}`)

  return a
}

function pixelAt (canvas, x, y) {
  return Array.from(canvas.getContext('2d').getImageData(x, y, 1, 1).data)
}

/** 单像素期望色对照（透明画布填充 cssColor 后比对，容差 ±2 抗锯齿） */
function assertPixel (canvas, x, y, cssColor, label) {
  const probe = document.createElement('canvas').getContext('2d')

  probe.fillStyle = cssColor
  probe.fillRect(0, 0, 1, 1)

  const expected = Array.from(probe.getImageData(0, 0, 1, 1).data)
  const actual = pixelAt(canvas, x, y)
  const ok = expected.every((v, i) => Math.abs(v - actual[i]) <= 2)

  if (!ok) throw new Error(`${label} (${x},${y}) 期望 ${cssColor}，实际 rgba(${actual.join(',')})`)
}

export const checks = [
  {
    name: 'prepareColumn：类型缺省 align、text/value ensureFn、placeholder 继承',
    fn: () => {
      const plain = prepareColumn({ field: 'name' })

      assert(plain._align === 'left', `text 缺省 align 应为 left，实际 ${plain._align}`)
      assert(typeof plain._text === 'function' && typeof plain._value === 'function', 'text/value 应 ensureFn 为函数')
      assert(plain._text({}) == null, '未配置 text 时 _text(record) 应为 null/undefined')
      assert(plain._raw.field === 'name', '_raw 应保留原始列定义引用')

      assert(prepareColumn({ type: 'rec_no' })._align === 'center', 'rec_no 类型缺省 align 应为 center')
      assert(prepareColumn({ type: 'currency' })._align === 'right', 'currency 类型缺省 align 应为 right')
      assert(prepareColumn({ align: 'right' })._align === 'right', '显式 align 应优先于类型缺省')

      assert(
        prepareColumn({ field: 'a' }, { placeholder: 'P' }).placeholder === 'P',
        'placeholder 应继承表格级缺省（table.vue:195 同款）'
      )
      assert(prepareColumn({ field: 'a' }).placeholder === undefined, '未传表格级 placeholder 时不产生 placeholder')

      return 'align 解析 / ensureFn / placeholder 继承均正确'
    }
  },
  {
    name: '取值链：text 覆盖 → value 函数 → record[field] → 空',
    fn: () => {
      const record = { name: 'N' }

      assert(
        content(prepareColumn({ field: 'name', text: r => 'T-' + r.name, value: r => 'V-' + r.name }), record).text === 'T-N',
        'text 函数非 null 时应优先并跳过类型渲染'
      )
      assert(
        content(prepareColumn({ field: 'name', value: r => 'V-' + r.name }), record).text === 'V-N',
        '无 text 时应取 value 函数结果'
      )
      assert(
        content(prepareColumn({ field: 'name', text: () => null }), record).text === 'N',
        'text 函数返回 null 应落回 value 链'
      )
      assert(content(prepareColumn({ field: 'name' }), record).text === 'N', '无 text/value 时应取 record[field]')
      assert(content(prepareColumn({ field: 'missing' }), record).text == null, 'field 不存在时取 undefined')
      assert(content(prepareColumn({}), record).text == null, '无 field 无 value 时为空内容（后续落 placeholder）')

      return 'text → value → field 逐级回退正确'
    }
  },
  {
    name: '取值链：value 传字符串不抛错且按字面取值',
    fn: () => {
      const col = prepareColumn({ field: 'extra', value: '固定值' })

      assert(content(col, { extra: 'E' }).text === '固定值', 'value 字符串应经 ensureFn 按字面取值')

      return 'value: \'固定值\' → 文本「固定值」'
    }
  },
  {
    name: 'rec_no：recordNumber 经 render 落地',
    fn: () => {
      const col = prepareColumn({ type: 'rec_no' })
      const result = content(col, {}, { recordNumber: 42 })

      assert(result.text === 42, `rec_no 应渲染 recordNumber=42，实际 ${result.text}`)
      assert(
        content(col, {}, { recordNumber: RECORD_NUMBER + 1 }).text === RECORD_NUMBER + 1,
        'recordNumber 应随入参变化（recordsOffset + index + 1 由调用方计算）'
      )

      return 'recordNumber=42 落地为文本 42（offset 语义由调用方传入）'
    }
  },
  {
    name: 'enum 注册与 mappings 显示映射：文本、对象形式与 default 兜底（enum 独有）',
    fn: () => {
      // enum 恢复一级列类型（20261104）：注册表命中 + 类型缺省 align center
      assert(resolveColumnType('enum') === EnumColumn, "resolveColumnType('enum') 应命中 EnumColumn")
      assert(prepareColumn({ type: 'enum' })._align === 'center', 'enum 类型缺省 align 应为 center')

      // 无映射源 enum：mapper 恒等，原值显示
      assert(content(prepareColumn({ field: 's', type: 'enum' }), { s: 'raw' }).text === 'raw', '无映射源 enum 原值显示')

      const col = prepareColumn({
        field: 's',
        type: 'enum',
        mappings: { a: '甲', b: { text: '乙' }, default: '未知' }
      })

      assert(content(col, { s: 'a' }).text === '甲', 'mapping 简单值应取文本')
      assert(content(col, { s: 'b' }).text === '乙', 'mapping 对象形式应取 text 字段')
      assert(content(col, { s: 'zz' }).text === '未知', '未匹配应落 default 兜底映射')

      // 空值不映射：enum 经 compile 内 mapper，v == null → null（落占位链，不走 default）
      assert(content(col, { s: null }).text == null, '空值不映射（不走 default，落占位链）')

      return '注册命中 + align center + 甲 / 乙 / default 未知；空值不映射'
    }
  },
  {
    name: 'mappings/options 优先级：mappings 优先、仅 options 转换、未命中原值回退（enum 独有）',
    fn: () => {
      // mappings 与 options 同时定义时显示映射只取 mappings
      const both = prepareColumn({
        field: 'v',
        type: 'enum',
        mappings: { a: '甲' },
        options: [{ value: 'a', label: '乙' }]
      })

      assert(content(both, { v: 'a' }).text === '甲', 'mappings 优先于 options')

      // 仅 options：转换为显示映射（mu-select options 口径，'-' 分隔项跳过）
      const onlyOptions = prepareColumn({
        field: 'v',
        type: 'enum',
        options: [{ value: 1, label: '低' }, { value: 2, label: '中' }, '-', { value: 'x' }]
      })

      assert(content(onlyOptions, { v: 1 }).text === '低', '仅 options 命中显示 label')
      assert(content(onlyOptions, { v: 'x' }).text === 'x', '纯字符串项缺省 label 取 value')
      assert(content(onlyOptions, { v: 5 }).text === 5, '未命中回退原值（number 原样，绘制经 String 化）')

      // number 列不支持映射（mappings 特性 enum 独有，20261104）：options/mappings
      // 不参与显示，文本保持 Intl 格式化
      assert(
        content(prepareColumn({ field: 'v', type: 'number', mappings: { 2: '中' } }), { v: 2 }).text === '2',
        'number+mappings 不再映射（2 → Intl 文本）'
      )
      assert(
        content(prepareColumn({ field: 'v', type: 'number' }), { v: 1234.5 }).text === '1,234.5',
        'number 保持 Intl 格式化（minimumFractionDigits: 0）'
      )

      return 'mappings 优先 / options 转换 / 原值回退；number 不再映射'
    }
  },
  {
    name: 'bool：缺省 locale 文案、mappings 不再生效、color 双通道（字符串/函数色名）',
    fn: () => {
      // 无映射：缺省渲染 locale 文案（Table.BOOL_TRUE/FALSE，与 t() 同源断言——
      // 无头浏览器多为 en，不可硬编码 是/否）；null 落占位链
      const plain = prepareColumn({ field: 'b', type: 'bool' })
      const trueText = t('Table.BOOL_TRUE')
      const falseText = t('Table.BOOL_FALSE')

      assert(trueText !== 'Table.BOOL_TRUE' && falseText !== 'Table.BOOL_FALSE', 'BOOL_TRUE/FALSE 词条存在（非 path 回退）')
      assert(plain._mapText === null, 'bool 不挂 _mapText（mappings 特性 enum 独有）')
      assert(content(plain, { b: true }).text === trueText, '缺省 true → locale 文案')
      assert(content(plain, { b: false }).text === falseText, '缺省 false → locale 文案')
      assert(content(plain, { b: null }).text == null, '缺省空值落占位链')

      // bool + mappings 不再映射（映射通道已删，仍走缺省文案）
      const mapped = prepareColumn({ field: 'b', type: 'bool', mappings: { true: '启用', false: '停用' } })

      assert(mapped._mapText === null, 'bool+mappings 不挂 _mapText')
      assert(content(mapped, { b: true }).text === trueText, 'bool+mappings 不再映射（true → locale 文案）')

      // color 字符串色名：canvas 通道平铺 color 色名
      const colored = prepareColumn({ field: 'b', type: 'bool', color: 'success' })
      const c1 = content(colored, { b: true })

      assert(c1.text === trueText && c1.color === 'success', 'color 字符串色名 → canvas 产物 { text, color }')

      // color 函数色名：(record, value) => 色名；null 无色
      const fnColored = prepareColumn({ field: 'b', type: 'bool', color: (r, v) => (v ? 'danger' : null) })
      const c2 = content(fnColored, { b: true })
      const c3 = content(fnColored, { b: false })

      assert(c2.text === trueText && c2.color === 'danger', 'color 函数按值取色（true → danger）')
      assert(c3.color === null, 'color 函数返回 null 无色')

      // dom 通道（compile(column, true) 直调，resolveCellContent 链会剔除 DOM 通道字段）：
      // color 落 text-{c} class；无色 class null
      const domColored = BoolColumn.compile({ color: 'success' }, true)({ record: {}, value: true })

      assert(domColored.text === trueText && domColored.class[0] === 'text-success', 'dom 通道 color 落 text-{c} class')
      assert(BoolColumn.compile({}, true)({ record: {}, value: true }).class === null, 'dom 通道无 color class 为 null')

      return '缺省 locale 文案 / mappings 不再生效 / color 双通道（canvas 平铺 + dom text-{c}）'
    }
  },
  {
    name: 'prepareColumn：_mapText/_plainText 判定（enum 独有挂载 / text 忽略映射源短路 / 带色不短路——P2 修复）',
    fn: () => {
      // text 列不再走映射（20261104）：mappings/options 被忽略，回归直渲短路显示原值
      const mapped = prepareColumn({ field: 'v', type: 'text', mappings: { a: '甲' } })

      assert(mapped._mapText === null, 'text + mappings 不挂 _mapText（映射收敛 enum 独有）')
      assert(mapped._plainText === true, 'text+mappings 短路直渲（映射源对 text 不产生效果）')
      assert(content(mapped, { v: 'a' }).text === 'a', 'text+mappings 显示原值（不走映射）')

      const fromOptions = prepareColumn({ field: 'v', type: 'text', options: [{ value: 1, label: '低' }] })

      assert(fromOptions._mapText === null, 'text + options 不挂 _mapText')
      assert(fromOptions._plainText === true, 'text+options 短路直渲（显示原值）')

      // enum 挂载与不短路（估高与显示同源，映射不丢）
      const enumMapped = prepareColumn({ field: 'v', type: 'enum', mappings: { a: '甲' } })

      assert(typeof enumMapped._mapText === 'function', 'enum + mappings 挂 _mapText（估高用）')
      assert(enumMapped._plainText === false, 'enum+mappings 不短路（走 compile 内 mapper）')
      assert(content(enumMapped, { v: 'a' }).text === '甲', 'enum+mappings 经 render 映射显示（映射不丢）')

      const enumFromOptions = prepareColumn({ field: 'v', type: 'enum', options: [{ value: 1, label: '低' }] })

      assert(typeof enumFromOptions._mapText === 'function', 'enum + options 挂 _mapText（options 转换）')
      assert(enumFromOptions._plainText === false, 'enum+options 不短路')

      assert(
        prepareColumn({ field: 'v', type: 'number', options: [{ value: 1, label: '低' }] })._mapText === null,
        'number+options 不挂 _mapText（number 不可映射）'
      )
      assert(prepareColumn({ field: 'v', type: 'enum' })._mapText === null, '无映射源 enum 列 _mapText null（不挂恒等 mapper）')
      assert(
        prepareColumn({ field: 'v', type: 'currency', mappings: { a: '甲' } })._mapText === null,
        'currency+mappings 不可映射'
      )
      assert(
        prepareColumn({ field: 'v', type: 'enum', text: r => 'T', mappings: { a: '甲' } })._mapText === null,
        'column.text 优先显示不挂映射（估高与显示同源）'
      )
      assert(
        prepareColumn({ field: 'v', multiline: true, mappings: { a: '甲' } })._plainText === false,
        'multiline 不短路（走 render）'
      )
      assert(
        prepareColumn({ field: 'v', type: 'number' })._plainText === false,
        'number 列不走短路（经 render 分支）'
      )

      return 'enum 独有挂载 / text 忽略映射源短路 / number、currency 不挂全正确'
    }
  },
  {
    name: 'text color：canvas 平铺色名、dom text-{c} class（字符串与函数色名两形态）',
    fn: () => {
      // 字符串色名：canvas 通道平铺 color
      const colored = content(prepareColumn({ field: 'v', color: 'success' }), { v: '文本' })

      assert(colored.text === '文本' && colored.color === 'success', 'color 字符串色名 → canvas 产物 { text, color }')

      // 函数色名：(record, value) => 色名；返回 null 无色
      const fnColor = (r, v) => (v === '甲' ? 'primary' : null)
      const fnColored = content(prepareColumn({ field: 'v', color: fnColor }), { v: '甲' })

      assert(fnColored.text === '甲' && fnColored.color === 'primary', 'color 函数按值取色（甲 → primary）')
      assert(content(prepareColumn({ field: 'v', color: fnColor }), { v: '乙' }).color === null, 'color 函数返回 null 无色')

      // dom 通道（compile(column, true) 直调，resolveCellContent 链会剔除 DOM 通道字段）：
      // color 落 text-{c} class
      const dom = TextColumn.compile({ color: 'success' }, true)({ record: {}, value: '文本' })

      assert(dom.text === '文本' && dom.class[0] === 'text-success', 'dom 通道 color 落 text-{c} class')
      assert(TextColumn.compile({}, true)({ record: {}, value: '文本' }).class.length === 0, 'dom 通道无 color class 为空数组')

      return '字符串/函数色名 canvas 平铺 + dom text-{c}'
    }
  },
  {
    name: 'number/currency：千分位与货币格式化文本',
    fn: () => {
      const numberText = content(prepareColumn({ field: 'v', type: 'number' }), { v: 12345.678 }).text
      assert(numberText === '12,345.68', `number 应千分位 + 2 位小数，实际 ${numberText}`)

      const currencyText = content(prepareColumn({ field: 'v', type: 'currency' }), { v: 12345.678 }).text
      assert(currencyText.includes('12,345.68'), `currency 应保留千分位数值，实际 ${currencyText}`)
      assert(currencyText.includes('¥'), `currency(zh-CN CNY) 应含 ¥ 符号，实际 ${currencyText}`)

      return `number=${numberText}，currency=${currencyText}`
    }
  },
  {
    name: 'date/datetime：格式化文本',
    fn: () => {
      const dateText = content(
        prepareColumn({ field: 'd', type: 'date', format: 'yyyy-MM-dd' }),
        { d: new Date(2026, 0, 9) }
      ).text
      assert(dateText === '2026-01-09', `date 应格式化为 2026-01-09，实际 ${dateText}`)

      const datetimeText = content(
        prepareColumn({ field: 'd', type: 'datetime' }),
        { d: new Date(2026, 0, 9, 13, 5) }
      ).text
      assert(datetimeText === '2026-01-09 13:05', `datetime 缺省格式应为 yyyy-MM-dd hh:mm，实际 ${datetimeText}`)

      return `date=${dateText}，datetime=${datetimeText}`
    }
  },
  {
    name: 'number/date color：canvas 平铺色名、绘制层直取取色、dom 通道 text-{c} class',
    fn: () => {
      // color 函数色名（number 列）：canvas 产物平铺 color，绘制层经 colors 查表直取
      const col = prepareColumn({ field: 'v', type: 'number', color: r => (r.v > 0 ? 'success' : 'danger') })
      const c = content(col, { v: 1234.5 })

      assertEqual(c.text, '1,234.5', 'number 文本仍 Intl 格式化')
      assertEqual(c.color, 'success', 'color 函数 → canvas 平铺色名')

      const { calls } = drawRecorded(col, { v: 1234.5 })

      assertEqual(calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.success.color), '绘制层 color 直取（colors 查表，不走 class 解析）')

      // 未知色名回退 textColor
      const bad = drawRecorded(prepareColumn({ field: 'v', type: 'number', color: 'ghost' }), { v: 1 })

      assertEqual(bad.calls.fillText[0].fillStyle, cssColorOf(THEME.textColor), '未知色名回退 textColor')

      // 字符串色名（date 列）
      const dateCol = prepareColumn({ field: 'd', type: 'date', color: 'primary' })
      const dc = content(dateCol, { d: new Date(2026, 0, 9) })

      assertEqual(dc.text, '2026-01-09', 'date 文本仍格式化')
      assertEqual(dc.color, 'primary', 'date 字符串色名平铺')

      // dom 通道（compile(column, true) 直调）：color 落 text-{c} class
      const dom = NumberColumn.compile({ color: r => (r.v > 0 ? 'success' : 'danger') }, true)({ record: { v: 1234.5 }, value: 1234.5 })

      assertEqual(dom.class[0], 'text-success', 'dom 通道 color 落 text-{c} class')
      assert(NumberColumn.compile({}, true)({ record: {}, value: 1 }).class === null, 'dom 通道无 color class 为 null')

      return 'number/date color 平铺 + 绘制直取；未知名回退；dom text-{c}'
    }
  },
  {
    name: '自定义类型对象/函数：render 返回 text、DOM 通道字段剔除、emit 透传',
    fn: () => {
      const viaObject = content(
        prepareColumn({
          field: 'v',
          type: { render: ({ value }) => ({ text: 'X' + value, class: 'c', title: 't' }) }
        }),
        { v: 99 }
      )

      assert(viaObject.text === 'X99', `自定义类型对象 render 应生效，实际 ${viaObject.text}`)
      assert(viaObject.class === undefined && viaObject.title === undefined, 'class/title 为 DOM 通道字段应剔除')

      const viaFn = content(
        prepareColumn({ field: 'v', type: ({ value, emit }) => ({ text: (emit === 'E' ? 'Y' : 'N') + value }) }),
        { v: 99 },
        { emit: 'E' }
      )

      assert(viaFn.text === 'Y99', `类型为函数时应整体作为 render 且 emit 透传，实际 ${viaFn.text}`)

      return '对象 render=X99、函数类型= Y99（emit 透传）'
    }
  },
  {
    name: 'check：disabled 经 ensureFn 判定，置灰与非置灰像素不同',
    fn: () => {
      const col = prepareColumn({ field: 'checked', type: 'check', disabled: r => r.locked })

      const disabled = content(col, { checked: true, locked: true }).items[0]
      assert(disabled.attrs.disabled === true, 'disabledFn 为真时 attrs.disabled 应为 true')

      const enabled = content(col, { checked: true, locked: false }).items[0]
      assert(enabled.attrs.disabled === null, 'disabledFn 为假时 attrs.disabled 应为 null')
      assert(enabled.attrs['data-checked'] === true, 'checked 值应写入 data-checked')

      const disabledCanvas = drawToCanvas(col, { checked: true, locked: true })
      const enabledCanvas = drawToCanvas(col, { checked: true, locked: false })

      assert(countPaintedPixels(disabledCanvas) > 0, 'disabled ✓ 方框应有非空像素')
      assert(countPaintedPixels(enabledCanvas) > 0, '正常 ✓ 方框应有非空像素')
      assert(pixelBuffersDiffer(disabledCanvas, enabledCanvas), 'disabled 置灰与正常态像素应不同')

      return 'disabled 判定 + 置灰落地（像素差异）正确'
    }
  },
  {
    name: 'link/tag：items 落地（主色文本 / 灰底 pill）像素非空',
    fn: () => {
      const linkCol = prepareColumn({ field: 'v', type: 'link' })
      const linkContent = content(linkCol, { v: ['甲', '乙'] })

      assert(Array.isArray(linkContent.items) && linkContent.items.length === 2, 'link 数组值应产出 2 个条目')
      assert(linkContent.items[0].kind === 'link', 'canvas link 条目自带 kind: link（无 is/attrs）')

      const linkCanvas = drawToCanvas(linkCol, { v: ['甲', '乙'] })
      assert(countPaintedPixels(linkCanvas) > 0, 'link 文本应有非空像素')

      const textCanvas = drawToCanvas(prepareColumn({ field: 'v' }), { v: '甲 乙' })
      assert(pixelBuffersDiffer(linkCanvas, textCanvas), 'link 主色文本应与普通文本像素不同')

      const tagCol = prepareColumn({ field: 'v', type: 'tag' })
      const tagContent = content(tagCol, { v: '已发布' })

      assert(Array.isArray(tagContent.items) && tagContent.items.length === 1, 'tag 标量值应产出 1 个条目')

      const tagCanvas = drawToCanvas(tagCol, { v: '已发布' })
      assert(countPaintedPixels(tagCanvas) > 0, 'tag pill 应有非空像素')

      return 'link 2 条目主色文本、tag 1 条目 pill，像素均非空'
    }
  },
  {
    name: 'img：data URI 异步加载、crossOrigin=anonymous、加载前按空格',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'img' })
      const src = tinyPngDataUri()

      let notified = 0

      const canvas = drawToCanvas(col, { v: src }, { onImageLoad: () => notified++ })

      const entry = getImageEntry(src)
      assert(entry != null, 'drawCell 应发起 img 请求并写入缓存')
      assert(entry.status === 'loading', `未完成前状态应为 loading，实际 ${entry.status}`)
      assert(entry.image.crossOrigin === 'anonymous', 'Image 须设置 crossOrigin=anonymous')
      assert(countPaintedPixels(canvas) === 0, '加载完成前不应绘制（按空格处理）')
      assert(notified === 0, '加载完成前不应触发 onImageLoad')

      const badSrc = `data:image/png;base64,AAAA${imageSeed}` // 同样逐次唯一，防重跑命中 failed 缓存
      const badCanvas = drawToCanvas(col, { v: badSrc })
      assert(getImageEntry(badSrc)?.status === 'loading', '损坏 data URI 应进入加载（异步失败）')
      assert(countPaintedPixels(badCanvas) === 0, '失败图不应绘制且不抛错')

      // 同一 src 复用缓存条目（加载完成后仅回调一次，重绘范围由 painter 决定）
      drawToCanvas(col, { v: src })
      assert(getImageEntry(src) === entry, '同 src 应复用缓存条目')

      return 'loading 状态 + anonymous + 加载前空格（onload 重绘联动留 S3）'
    }
  },
  {
    name: 'onImageLoad 契约（P1b）：img 分支闭包以 (row, colIndex) 调用处理器',
    fn: () => {
      const calls = []
      const RealImage = window.Image

      // 同步 Image 桩：src 赋值即触发 onload（runChecks 不支持异步；
      // 真实 img 元素保证 drawImage 不抛错——未解码时按规范静默不绘制）
      window.Image = function () {
        const img = document.createElement('img')
        let src = ''

        Object.defineProperty(img, 'src', {
          get () {
            return src
          },
          set (value) {
            src = value
            img.onload?.()
          }
        })

        return img
      }

      try {
        const src = tinyPngDataUri() // 唯一 src，防缓存条目复用吞掉本次 onLoad 注册
        const col = prepareColumn({ field: 'v', type: 'img' })

        drawToCanvas(col, { v: src }, {
          onImageLoad: (row, colIndex) => calls.push([row, colIndex]),
          row: 3,
          colIndex: 5
        })

        assertArray(calls, [[3, 5]], 'onImageLoad 应以 (row, colIndex) 调用（新契约）')
        assertEqual(getImageEntry(src).status, 'loaded', '同步加载完成后条目 loaded')
      } finally {
        window.Image = RealImage
      }

      return 'img 分支闭包转发 (row, colIndex)，恰回调一次'
    }
  },
  {
    name: 'multiline/lineClamp：canvas 通道产 text（无 items）、按文本落地不空白',
    fn: () => {
      const col = prepareColumn({ field: 'memo', multiline: true, lineClamp: 2 })
      const record = { memo: '多行内容' }

      const result = content(col, record)

      assert(result.text === '多行内容' && !result.items, 'canvas 通道 lineClamp>1 产 text（div items 为 dom 通道形态）')

      const canvas = drawToCanvas(col, record)
      const pixels = countPaintedPixels(canvas)

      assert(pixels > 0, `canvas 文本落地应有非空像素，实际 ${pixels}`)

      const single = content(prepareColumn({ field: 'memo', multiline: true, lineClamp: 1 }), record)

      assert(single.text === '多行内容' && !single.items, 'lineClamp=1 同产 text')

      return `canvas 通道 text 直绘（${pixels} 像素）；lineClamp=1 同产 text`
    }
  },
  {
    name: '各类型离屏绘制非空像素（text/bool/enum+mappings/number/currency/date/rec_no/check/link/tag）',
    fn: () => {
      const cases = [
        ['text', prepareColumn({ field: 'v' }), { v: '文本' }],
        ['bool', prepareColumn({ field: 'v', type: 'bool' }), { v: true }],
        ['enum+mappings', prepareColumn({ field: 'v', type: 'enum', mappings: { a: '甲' } }), { v: 'a' }],
        ['number', prepareColumn({ field: 'v', type: 'number' }), { v: 1234.5 }],
        ['currency', prepareColumn({ field: 'v', type: 'currency' }), { v: 1234.5 }],
        ['date', prepareColumn({ field: 'v', type: 'date' }), { v: new Date(2026, 0, 9) }],
        ['rec_no', prepareColumn({ type: 'rec_no' }), {}],
        ['check', prepareColumn({ field: 'v', type: 'check' }), { v: true }],
        ['link', prepareColumn({ field: 'v', type: 'link' }), { v: '链接' }],
        ['tag', prepareColumn({ field: 'v', type: 'tag' }), { v: '标签' }]
      ]

      for (const [name, col, record] of cases) {
        const pixels = countPaintedPixels(drawToCanvas(col, record))

        assert(pixels > 0, `${name} 类型 painter 应有非空像素，实际 ${pixels}`)
      }

      return '10 种类型全部非空像素（含 bool/rec_no）'
    }
  },
  {
    name: '空值：placeholder 兜底绘制、无 placeholder 留空、空串不落占位',
    fn: () => {
      const record = { empty: null }

      const withPlaceholder = drawToCanvas(prepareColumn({ field: 'empty' }, { placeholder: '待填写' }), record)
      assert(countPaintedPixels(withPlaceholder) > 0, '空值 + placeholder 应绘制占位文本')

      const withoutPlaceholder = drawToCanvas(prepareColumn({ field: 'empty' }), record)
      assert(countPaintedPixels(withoutPlaceholder) === 0, '空值无 placeholder 应留空（0 像素）')

      const emptyString = drawToCanvas(prepareColumn({ field: 'empty' }, { placeholder: '待填写' }), { empty: '' })
      assert(countPaintedPixels(emptyString) === 0, '空串是有效值，不应落占位（对齐 ?? 语义）')

      return 'placeholder 兜底 / 留空 / 空串语义正确'
    }
  },
  {
    name: '像素采样工具：单像素期望色对照',
    fn: () => {
      const canvas = document.createElement('canvas')

      canvas.width = 2
      canvas.height = 2

      const ctx = canvas.getContext('2d')

      ctx.fillStyle = THEME_COLORS.success.color
      ctx.fillRect(0, 0, 2, 2)
      assertPixel(canvas, 0, 0, THEME_COLORS.success.color, '期望色采样')

      return `fill 采样 = ${THEME_COLORS.success.color}`
    }
  },
  {
    name: 'prepareColumn：_maxLines/_resolveMaxLines（常量与函数形态行级求值）/_maxItems/_isTreeColumn',
    fn: () => {
      const constant = prepareColumn({ field: 'm', maxLines: 3 })

      assert(constant._maxLines === 3, 'maxLines 常量应挂 _maxLines')
      assert(constant._resolveMaxLines({ x: 1 }) === 3, '常量形态 _resolveMaxLines 不依赖 record')
      assert(prepareColumn({ field: 'm', maxLines: 99 })._maxLines === 10, 'maxLines 钳制上限 10')
      assert(prepareColumn({ field: 'm', maxLines: 0 })._maxLines === 1, 'maxLines 钳制下限 1')

      const legacy = prepareColumn({ field: 'm', multiline: true })

      assert(legacy._maxLines == null && legacy._resolveMaxLines({}) === 10, 'multiline 无 lineClamp → 10')

      const clamped = prepareColumn({ field: 'm', multiline: true, lineClamp: 2 })

      assert(clamped._resolveMaxLines({}) === 2, 'multiline + lineClamp 常量 → 2')

      const dynamic = prepareColumn({ field: 'm', multiline: true, lineClamp: r => (r.deep ? 3 : 1) })

      assert(
        dynamic._resolveMaxLines({ deep: true }) === 3 && dynamic._resolveMaxLines({ deep: false }) === 1,
        '函数形态 lineClamp 应按 record 行级求值（评审 6 P6）'
      )

      const plain = prepareColumn({ field: 'm' })

      assert(plain._resolveMaxLines({}) === 1 && plain._maxLines == null, '缺省单行')
      assert(plain._maxItems === 10, 'maxItems 缺省 10')
      assert(prepareColumn({ field: 'm', maxItems: 33 })._maxItems === 10, 'maxItems 钳制上限 10')
      assert(prepareColumn({ field: 'm', maxItems: 2 })._maxItems === 2, 'maxItems 显式生效')
      assert(prepareColumn({ field: 'm', treeNode: true })._isTreeColumn === true, 'treeNode → _isTreeColumn')
      assert(plain._isTreeColumn === false, '缺省非树形列')

      // canvas 专属列同样挂内部字段（row-geometry/editor 消费）
      const progress = prepareColumn({ field: 'p', type: 'progress', maxItems: 3 })

      assert(progress._maxItems === 3 && typeof progress._resolveMaxLines === 'function', 'canvas 列内部字段齐备')

      return '常量/legacy/函数三形态 _resolveMaxLines + _maxItems/_isTreeColumn 均正确'
    }
  },
  {
    name: 'canvas 类型分发：progress/button 产 canvasKind（非 text/items），progressOption/buttons ensureFn',
    fn: () => {
      const progress = prepareColumn({ field: 'p', type: 'progress', progressOption: r => ({ color: r.c }) })
      const p1 = content(progress, { p: 42, c: 'red' })

      assert(p1.canvasKind === 'progress', `progress 应产 canvasKind，实际 ${JSON.stringify(p1)}`)
      assert(p1.text === undefined && p1.items === undefined, 'progress 不应产出 text/items（不落 TextColumn 文本）')
      assert(p1.value === 42, 'value = _value/field 取值透传')
      assert(p1.progressOption.color === 'red', 'progressOption 支持 (record)=> 配置')

      const button = prepareColumn({ field: 'b', type: 'button', buttons: r => r.list })
      const b1 = content(button, { list: [{ caption: 'X' }] })

      assert(b1.canvasKind === 'button', 'button 应产 canvasKind')
      assert(Array.isArray(b1.buttons) && b1.buttons[0].caption === 'X', 'buttons 支持 (record)=> 配置')

      return 'canvasKind 分发在 resolveColumnType 之前（03-review-5 问题 6）'
    }
  },
  {
    name: 'progress 绘制：轨道/填充/百分比文本像素，记录级色与 onItemRect 不回报',
    fn: () => {
      const col = prepareColumn({ field: 'p', type: 'progress', progressOption: { color: 'success', showText: true } })
      const rects = []
      const canvas = drawToCanvas(col, { p: 60 }, { onItemRect: r => rects.push(r) })

      // 填充覆盖区（contentWidth 144，label 12px '60%' ≈ 30px → trackW ≈ 108，fill 60% ≈ 65 → 采样 x=30）
      assertPixel(canvas, 30, 18, THEME_COLORS.success.color, 'progress 填充色')
      // 轨道未填充段（右端靠 label 前）：底衬 bgStrong 半透明叠在透明画布
      const track = pixelAt(canvas, 100, 18)

      assert(track[3] > 0 && track[3] < 255, `轨道应为半透明 bgStrong，实际 alpha=${track[3]}`)
      assertEqual(rects.length, 0, 'progress 不应回报 itemHits（不可点击）')

      // 记录级色：(record)=> 配置经 colors 查表
      const dynamic = prepareColumn({ field: 'p', type: 'progress', progressOption: r => ({ color: r.c, showText: false }) })
      const redCanvas = drawToCanvas(dynamic, { p: 50, c: 'red' })

      assertPixel(redCanvas, 30, 18, THEME_COLORS.red.color, 'progress 记录级填充色')

      assert(pixelBuffersDiffer(canvas, redCanvas), '不同色名填充像素应不同')

      return `填充=${THEME_COLORS.success.color}，记录级=${THEME_COLORS.red.color}，无 itemHits`
    }
  },
  {
    name: 'button 绘制：tag 同构、色板/disabled 两态取色、条目矩形回报 itemHits',
    fn: () => {
      const col = prepareColumn({
        field: 'v',
        type: 'button',
        buttons: [{ caption: '编辑', color: 'danger' }, { caption: '删除', disabled: true }]
      })
      const rects = []
      const { canvas, calls } = drawRecorded(col, {}, { width: 220, onItemRect: r => rects.push(r) })

      assert(countPaintedPixels(canvas) > 0, 'button 应有非空像素')
      assertArray(calls.fillText.map(c => c.text), ['编辑', '删除'], '按钮 caption')
      assertEqual(calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.danger.color), '常规按钮文字色')
      assertEqual(calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), 'disabled 按钮文字色')
      assertEqual(calls.fill[0].fillStyle, cssColorOf(THEME_COLORS.danger.translucent), '常规按钮底色 translucent')
      assertEqual(calls.fill[1].fillStyle, cssColorOf(THEME.bgDisabled), 'disabled 按钮底色 bgDisabled')
      assertArray(rects.map(r => `${r.kind}:${r.index}`), ['button:0', 'button:1'], 'itemHits 回报')
      assertEqual(rects[0].disabled, false, '常规按钮条目 disabled = false（isTruthyAttr 口径）')
      assertEqual(rects[1].disabled, true, 'disabled 按钮条目携带 disabled = true')
      assert(rects[0].rect.width > 0, '条目矩形应含宽高')
      assertEqual(
        `${rects[0].rect.y},${rects[0].rect.height}`,
        '9,20',
        'button 命中矩形 = pill 绘制区（centerY 19 ± TAG_HEIGHT/2，非整格）'
      )

      // 对齐（20261104 修复）：两遍式测宽后按列 align 分布——pill 34×2 + gap 8 = 76
      // ≤ 144，center 起点 = (160−76)/2 = 42、right = 160−8−76 = 76；命中矩形随平移
      const centeredButtons = [{ caption: '编辑', color: 'danger' }, { caption: '删除' }]
      const centeredRects = []
      const centered = drawRecorded(
        prepareColumn({ field: 'v', type: 'button', align: 'center', buttons: centeredButtons }),
        {},
        { measure: fakeMeasure, onItemRect: r => centeredRects.push(r) }
      )

      assertArray(centeredRects.map(r => r.rect.x), [42, 84], 'center 两 pill 起点 42/84（左基线 8/50 整体平移）')
      assertEqual(centered.calls.fillText[0].x, 50, 'center pill 文字 x = 起点 + TAG_PADDING_X')

      const rightRects = []

      drawRecorded(
        prepareColumn({ field: 'v', type: 'button', align: 'right', buttons: centeredButtons }),
        {},
        { measure: fakeMeasure, onItemRect: r => rightRects.push(r) }
      )
      assertEqual(rightRects[0].rect.x, 76, 'right 起点 = 右缘 padding − 总宽（不受 rightInset 影响）')

      // 窄列（width=100 → 内容宽 84）：两条 76 ≤ 84 仍居中，起点 = (100−76)/2 = 12
      // 注：末条宽被 min(全宽, 右缘剩余) 封顶 ⇒ 组总宽恒 ≤ 内容宽−gap，回退分支不可达
      const narrowRects = []

      drawRecorded(
        prepareColumn({ field: 'v', type: 'button', align: 'center', buttons: centeredButtons }),
        {},
        { width: 100, measure: fakeMeasure, onItemRect: r => narrowRects.push(r) }
      )
      assertArray(narrowRects.map(r => r.rect.x), [12, 54], '窄列 center 起点 12/54（平移随内容宽收缩）')

      return '编辑/删除两按钮取色与回报正确（kind=button，含 disabled 字段）；center/right 分布 + 窄列平移'
    }
  },
  {
    name: '多行文本：maxLines 常量折行 + 钳制末行 \'...\'（约束 4）+ 顶部对齐 + 无 measure 回退单行',
    fn: () => {
      const col = prepareColumn({ field: 'memo', maxLines: 2 })
      const long = '一二三四五六七八九十'.repeat(6) // 60 字符 × 7px = 420 > 内容宽 144
      const { calls } = drawRecorded(col, { memo: long }, { measure: fakeMeasure, height: 60 })

      assertEqual(calls.fillText.length, 2, 'maxLines=2 应绘制 2 行')
      assertEqual(calls.fillText[0].text.length, 16, '首行按测量宽度折行（16 字符 × 9px = 144 ≤ 内容宽）')
      assert(calls.fillText[1].text.endsWith('...'), `钳制末行应以 '...' 收缩，实际「${calls.fillText[1].text}」`)
      assertArray(
        calls.fillText.map(c => c.y),
        [19 + TEXT_ANCHOR_OFF, 37 + TEXT_ANCHOR_OFF],
        `首行光学居中锚（槽位 19 + 字体偏移 ${TEXT_ANCHOR_OFF}，与行高无关、与 padding/lineHeight 解耦；后续 +18）`
      )

      // maxLines=1（缺省）：即使注入 measure 也走单行省略（现状路径）
      const single = drawRecorded(prepareColumn({ field: 'memo' }), { memo: long }, { measure: fakeMeasure })

      assertEqual(single.calls.fillText.length, 1, '缺省单行省略')
      assertEqual(
        single.calls.fillText[0].y,
        19 + TEXT_ANCHOR_OFF,
        `单行光学居中锚（槽位 19 + 字体偏移 ${TEXT_ANCHOR_OFF}；20261029 问题 1）`
      )

      // measure 未注入：多行列回退单行省略（不抛错）
      const fallback = drawRecorded(col, { memo: long })

      assertEqual(fallback.calls.fillText.length, 1, '无 measure 回退单行')

      return `2 行 + 末行 '...'；y=${JSON.stringify(calls.fillText.map(c => c.y))}`
    }
  },
  {
    name: 'A9 数组门控：文本/无 type 列数组值落占位（resolveCellContent 统一门控），list 条目列数组照常',
    fn: () => {
      // 文本列数组值 → 门控落空内容 → 无文本绘制（占位链）
      const plain = drawRecorded(prepareColumn({ field: 'v', maxItems: 3 }), { v: [1, '二', 3, 4, 5] }, { height: 80 })

      assertEqual(plain.calls.fillText.length, 0, '文本列数组值不再逐元素拆行（无 fillText）')

      // 占位注入时绘制占位文本（placeholder 通道）
      const withPlaceholder = drawRecorded(prepareColumn({ field: 'v' }), { v: ['甲', '乙'] }, { placeholder: '-' })

      assertArray(withPlaceholder.calls.fillText.map(c => c.text), ['-'], '文本列数组值 → placeholder 文本')

      // number 列数组值同样门控（非条目字符串 type 一律落占位，A9）
      const numberCol = drawRecorded(prepareColumn({ field: 'v', type: 'number' }), { v: [1, 2] }, { placeholder: '-' })

      assertArray(numberCol.calls.fillText.map(c => c.text), ['-'], 'number 列数组值 → placeholder')

      // 非字符串 type 自定义列豁免门控：render 自行消费数组
      const custom = prepareColumn({
        field: 'v',
        type: { render: ({ value }) => ({ text: Array.isArray(value) ? value.join('|') : String(value) }) }
      })

      assertEqual(content(custom, { v: [1, 2, 3] }).text, '1|2|3', '非字符串 type 自定义列豁免门控')

      // list 条目列数组值照常消费（竖排 dots 口径）
      const list = drawRecorded(prepareColumn({ field: 'v', type: 'list', listOption: { max: 3 } }), { v: [1, '二', 3, 4, 5] }, { height: 80 })

      assertArray(list.calls.fillText.map(c => c.text), ['1', '二', '...'], 'list 列前 maxItems−1 条 + dots 行')
      assertArray(list.calls.fillText.map(c => c.y), [19 + TEXT_ANCHOR_OFF, 37 + TEXT_ANCHOR_OFF, 55 + TEXT_ANCHOR_OFF], `list 竖排首行光学居中锚逐行（槽位 19 + 偏移 ${TEXT_ANCHOR_OFF}；顺次 +18）`)

      return '文本/number 数组 → 占位；自定义列豁免；list 数组照常（dots 截断）'
    }
  },
  {
    name: '函数 lineClamp 行级求值 + line-clamp item 改道 drawText（评审 6 P6）',
    fn: () => {
      const col = prepareColumn({ field: 'memo', multiline: true, lineClamp: r => (r.deep ? 3 : 1) })
      const long = 'abcdefghij'.repeat(10) // 100 字符原子词，测量 700 > 144 → 逐字断 5 行

      const deep = drawRecorded(col, { memo: long, deep: true }, { measure: fakeMeasure, height: 80 })

      assertEqual(deep.calls.fillText.length, 3, 'deep record 应按求值 3 行')
      assert(deep.calls.fillText[2].text.endsWith('...'), '钳制末行 \'...\'')

      const shallow = drawRecorded(col, { memo: long, deep: false }, { measure: fakeMeasure })

      assertEqual(shallow.calls.fillText.length, 1, '非 deep record 应按求值 1 行（同列分 record 求值）')

      // line-clamp item 改道（DOM 形态条目回退路径保留）：自定义类型产单 line-clamp
      // div item → drawText 多行（TextColumn canvas 通道产 text 无 items，改道仅剩此路径）
      const clampedCol = prepareColumn({
        field: 'memo',
        multiline: true,
        lineClamp: 2,
        type: { render: ({ value }) => ({ items: [{ is: 'div', text: value, attrs: { class: 'line-clamp' } }] }) }
      })
      const raw = content(clampedCol, { memo: long })

      assert(Array.isArray(raw.items) && raw.items.length === 1 && raw.items[0].attrs.class === 'line-clamp', '前置：render 产单 line-clamp item')
      assert(clampedCol._maxLines == null, '前置：常量 _maxLines 未设（证明走闭包）')

      const redirected = drawRecorded(clampedCol, { memo: long }, { measure: fakeMeasure, height: 60 })

      assertEqual(redirected.calls.fillText.length, 2, '单 div item 应改道 drawText 多行（maxLines=2 钳制）')
      assertArray(redirected.calls.fillText.map(c => c.y), [19 + TEXT_ANCHOR_OFF, 37 + TEXT_ANCHOR_OFF], `改道后首行光学居中锚（槽位 19 + 偏移 ${TEXT_ANCHOR_OFF}，与行高无关）`)

      return 'deep 3 行 / shallow 1 行；line-clamp item 改道 2 行'
    }
  },
  {
    name: '槽位锚（问题 1/A1）：垂直锚 = 行线间空白中点不随行高变、水平 center 扣 rightInset、超高行跨列首行同高',
    fn: () => {
      const col = prepareColumn({ field: 'v', align: 'center' })
      const rect = { x: 0, y: 0, width: 160, height: 36 }

      // 残差口径（decisions 检查点-A1判据，写入注释供 verifier）：直调锚恒为
      // Math.round(rect.y + 1 + (36 − 1)/2) = 19（ROW_TOP_INSET 内建常量，gridlines 不参与
      // 直调路径；行线间空白 [1,36) 中点 18.5 四舍五入，文字基线落整数像素）。
      // r≥1 且 gridlines 含 row 时与「不含边线内容区中心」残差 0.5px；r=0 或
      // 不含 row 时中心 18 → 锚偏下 1px。
      // 超高行不设与内容区中心的差，只验跨列首行同高（见末组断言）。
      const base = drawRecorded(col, { v: '甲' }, { rect, rightInset: 0 })

      assertEqual(base.calls.fillText[0].x, 80, 'center rightInset=0 → x=80（rect.x + width/2）')
      assertEqual(base.calls.fillText[0].y, 19 + TEXT_ANCHOR_OFF, `槽位锚 y = 19 + 字体偏移 ${TEXT_ANCHOR_OFF}（光学居中，20261029 问题 1）`)

      // rightInset=1（本格右缘列线占用）：内容区水平中心精确 −0.5px，垂直不变
      const inset = drawRecorded(col, { v: '甲' }, { rect, rightInset: 1 })

      assertEqual(inset.calls.fillText[0].x, 79.5, 'center rightInset=1 → x=79.5（列线占用扣除）')
      assertEqual(inset.calls.fillText[0].y, 19 + TEXT_ANCHOR_OFF, 'rightInset 只参与水平锚，垂直锚不变')

      // left/right 锚不受 rightInset 影响（padding 8 ≫ 1px 格线，防误改分支）
      const left = drawRecorded(prepareColumn({ field: 'v' }), { v: '甲' }, { rect, rightInset: 1 })

      assertEqual(left.calls.fillText[0].x, 8, 'left 锚 x=8（不受 rightInset 影响）')

      const right = drawRecorded(prepareColumn({ field: 'v', align: 'right' }), { v: '甲' }, { rect, rightInset: 1 })

      assertEqual(right.calls.fillText[0].x, 152, 'right 锚 x=152（不受 rightInset 影响）')

      // 超高行（h=88，同行多行列撑高场景的单行格）：仍锚首行槽位 19，与多行文本
      // /link 竖排首行 y=19 同高（decisions 检查点-A1判据：超高行只验跨列首行同高）
      const tall = drawRecorded(col, { v: '甲' }, { height: 88, rightInset: 0 })

      assertEqual(tall.calls.fillText[0].y, 19 + TEXT_ANCHOR_OFF, '超高行单行锚不变（不随行高变，与多行/link 竖排首行同高）')

      return `x=80/79.5/8/152；y 恒 ${19 + TEXT_ANCHOR_OFF}（h=36/88 同值，跨列首行同高）`
    }
  },
  {
    name: 'link（list 兼容壳）/tag 双通道条目结构：canvas 平铺 kind 条目 + onItemClick、dom 保持 DOM 形态',
    fn: () => {
      const calls = []
      const captureEmit = (name, payload) => calls.push([name, payload])

      // link canvas 通道（兼容壳委托 ListColumn，compile 不传 dom）：
      // 平铺 kind:'link' + link/color 字段 + onItemClick；danger:true → color 'danger' 映射
      const columnDef = { title: true }
      const linkRender = LinkColumn.compile(columnDef)
      const lc = linkRender({
        record: { id: 1 },
        value: [{ caption: 'A', danger: true }, { caption: 'B', disabled: true }, 'C'],
        emit: captureEmit
      })

      assertEqual(lc.items.length, 3, 'link 3 条目')
      assert(lc.items.every(i => i.kind === 'link'), 'canvas 条目恒带 kind: link')
      assert(lc.items.every(i => i.link === true), 'link 列条目 link:true（列级 column.link，兼容壳顶层 link:true）')
      assertArray(lc.items.map(i => i.text), ['A', 'B', 'C'], '条目文本')
      assert(lc.items.every(i => i.title === i.text), 'title:true 时 title = caption')
      assertEqual(lc.items[0].color, 'danger', 'danger:true → color danger（兼容映射）')
      assertEqual(lc.items[1].disabled, true, 'disabled 平铺')
      assertEqual(lc.items[2].color, 'primary', '无 color 条目缺省 primary')
      assert(
        lc.items.every(i => i.is === undefined && i.attrs === undefined && i.events === undefined),
        'canvas 条目不含 is/attrs/events（DOM 通道字段）'
      )
      assert(lc.class === undefined && lc.text === undefined, 'canvas 通道产物仅 items（无外层 DOM class）')
      assert(lc.items.every(i => typeof i.onItemClick === 'function'), 'canvas 条目自持 onItemClick')

      lc.items[0].onItemClick()

      assertEqual(calls[0][0], 'cell-item-click', 'onItemClick 派发 cell-item-click')
      assertEqual(calls[0][1].item.caption, 'A', 'payload.item = 条目对象原引用')
      assertEqual(calls[0][1].record.id, 1, 'payload.record = 行记录')
      assert(calls[0][1].column === columnDef, 'payload.column = 原始列引用（compile 入参，_raw 回指）')

      // link canvas dots：'...' 字面 + title join + onItemClick payload 值 '...'
      const linkDots = LinkColumn.compile({ title: true, linkOption: { max: 2 } })(
        { record: {}, value: ['a', 'b', 'c'], emit: captureEmit }
      )

      assertEqual(linkDots.items[1].text, '...', 'canvas dots 条目 \'...\'')
      assertEqual(linkDots.items[1].title, 'b\n\nc', 'canvas dots title = 截断条目 caption join')

      linkDots.items[1].onItemClick()

      assertEqual(calls.at(-1)[1].item, '...', 'canvas dots onItemClick payload 值 \'...\'（键 item，decisions 第 5 条）')

      // link dom 通道（compile(column, true)）：共用 list 实现——list-cell + a + text-{color}
      const ld = LinkColumn.compile({ linkOption: { max: 2 } }, true)({
        record: {},
        value: [{ caption: 'A', danger: true }, 'B', 'C'],
        emit: () => {}
      })

      assertEqual(ld.class, 'mu-table__list-cell', 'dom 外层 class = list-cell（A7 共用 list 实现）')
      assert(ld.items.every(i => i.is === 'a' && i.attrs && i.events), 'dom link 列条目恒 is a')
      assert(ld.items[0].attrs.class.includes('text-danger'), 'dom danger 落 text-danger')
      assert(!ld.items[0].attrs.class.join(' ').includes('mu-link'), 'dom 条目不复用 mu-link 类')
      assertEqual(ld.items[1].text, '...', 'dom max dots')
      assert(typeof ld.items[1].events.click === 'function', 'dom 条目绑定 events.click')

      // tag canvas 通道：color 平铺（tagOption.color 缺省 / 条目覆盖 / 无色 null）+ onItemClick
      const tagRender = TagColumn.compile({ tagOption: { color: 'warning' } })
      const tc = tagRender({ record: { id: 2 }, value: [{ caption: 'T1', color: 'success' }, 'T2'], emit: captureEmit })

      assertEqual(tc.items.length, 2, 'tag 2 条目')
      assert(tc.items.every(i => i.kind === 'tag'), 'canvas 条目恒带 kind: tag')
      assertEqual(tc.items[0].color, 'success', '条目级 color 平铺')
      assertEqual(tc.items[1].color, 'warning', 'tagOption.color 缺省平铺')
      assert(
        tc.items.every(i => i.is === undefined && i.attrs === undefined && i.events === undefined),
        'canvas 条目不含 is/attrs/events'
      )
      assert(tc.items.every(i => typeof i.onItemClick === 'function'), 'canvas 条目自持 onItemClick')

      tc.items[0].onItemClick()

      assertEqual(calls.at(-1)[1].tag.caption, 'T1', 'onItemClick payload.tag = 条目对象原引用')

      // tag canvas dots（tagOption.max）：onItemClick payload 值 '...'
      const tagDots = TagColumn.compile({ tagOption: { max: 1 } })(
        { record: {}, value: ['t1', 't2'], emit: captureEmit }
      )

      tagDots.items[0].onItemClick()

      assertEqual(calls.at(-1)[1].tag, '...', 'tag dots onItemClick payload 值 \'...\'')

      const tc2 = TagColumn.compile({})({ record: {}, value: ['x'], emit: () => {} })

      assertEqual(tc2.items[0].color, null, '无色条目 color null（绘制缺省 gray）')

      // tag dom 通道：颜色类恒落地（无色默认 gray）
      const td = TagColumn.compile({}, true)({ record: {}, value: ['x'], emit: () => {} })

      assert(
        td.items[0].attrs.class.includes('text-gray') && td.items[0].attrs.class.includes('bg-gray-translucent'),
        'dom 无色 tag 恒落 gray 类'
      )

      const td2 = TagColumn.compile({}, true)({ record: {}, value: [{ caption: 'y', color: 'success' }], emit: () => {} })

      assert(td2.items[0].attrs.class.includes('text-success'), 'dom 条目级 color 落 text-{c}')

      return 'link/tag canvas 平铺（kind/link/color/onItemClick/payload item）+ dom list-cell/a/text-{color}；tag 颜色类恒落地'
    }
  },
  {
    name: 'LinkColumn compile 产物（dom 通道，兼容壳委托 list）：caption/color 激活、dots payload item、danger→color、disabled、过滤',
    fn: () => {
      const render = LinkColumn.compile({}, true)

      // 对象数组：对象元素原样保留；color 键激活（decisions 第 4 条，20261103 版「不消费」已推翻）
      const out = render({ record: {}, value: [{ caption: 'A', color: 'success' }, { caption: 'B' }, 3], emit: () => {} })

      assertEqual(out.items.length, 3, '3 个条目')
      assertEqual(out.items[0].text, 'A', '对象元素 caption 文本（非 [object Object]）')
      assert(out.items[0].attrs.class.includes('text-success'), 'color 键激活 → text-{color}')
      assert(!out.items[0].attrs.class.join(' ').includes('mu-link'), '不复用 mu-link 类（list-cell 样式通道）')
      assertEqual(out.items[2].text, 3, '数字元素仍包 { caption: el } 行为不变（text 保持原始 number）')

      // 字符串数组：包裹行为不变、link 列缺省 primary 色类
      const out2 = render({ record: {}, value: ['x', 'y'], emit: () => {} })

      assertArray(out2.items.map(i => i.text), ['x', 'y'], '字符串数组文本')
      assertEqual(out2.items[0].attrs.class[0], 'text-primary', '无 color 条目缺省 text-primary')

      // max 超限 dots：'...' 字面值 + events.click 绑定（payload 键 item，值 '...'）
      const dots = LinkColumn.compile({ linkOption: { max: 2 } }, true)
      const dotEvents = []
      const out3 = dots({ record: {}, value: ['a', 'b', 'c', 'd'], emit: (type, payload) => dotEvents.push([type, payload]) })

      assertEqual(out3.items.length, 2, 'max=2 截断')
      assertEqual(out3.items[1].text, '...', '超限条目 \'...\' 三点字面')
      out3.items[1].events.click()
      assertEqual(dotEvents[0][0], 'cell-item-click', 'dots 条目绑定 click')
      assertEqual(dotEvents[0][1].item, '...', 'dots payload 键 item 值 = \'...\'（decisions 第 5 条）')

      // 常规条目 payload item = 条目原对象、payload column = 原始列引用
      const target = { caption: 'P', color: 'blue' }
      const columnDef = { caption: '兼容列' }
      let captured = null
      const out4 = LinkColumn.compile(columnDef, true)(
        { record: {}, value: [target], emit: (type, payload) => { captured = payload } }
      )

      out4.items[0].events.click()
      assert(captured.item === target, 'payload item 应为条目原对象（对象数组元素原引用）')
      assert(captured.column === columnDef, 'payload column 应为原始列引用（_raw 回指）')

      // danger 映射（壳内 danger:true → { ...el, color: el.color ?? 'danger' }）与 disabled
      const out5 = render({ record: {}, value: [{ caption: 'D', danger: true }, { caption: 'E', disabled: true }], emit: () => {} })

      assert(out5.items[0].attrs.class.includes('text-danger'), 'danger:true 落 text-danger')
      assertEqual(out5.items[1].attrs.disabled, '', 'disabled 落 attrs')

      const out6 = render({ record: {}, value: [{ color: 'red' }, { caption: 'ok' }], emit: () => {} })

      assertEqual(out6.items.length, 1, '缺 caption 对象被过滤')
      assertEqual(out6.items[0].text, 'ok', '有效条目保留')

      return 'color 激活、字符串不变、dots click 键 item、payload 原对象/原列、danger→color/disabled/过滤全通过'
    }
  },
  {
    name: 'ListColumn compile 产物（20261104 list 列双通道，R1 列级 link）：仅数组值、列级 link 整列、非 link 列正文色、payload item、caption 兼容、过滤',
    fn: () => {
      // 非数组（标量）→ 空产物落占位（A4）；listItems 自定义取值同门控
      assertEqual(ListColumn.compile({}, true)({ record: {}, value: '标量', emit: () => {} }), undefined, '标量值 → undefined（占位链）')
      assertEqual(ListColumn.compile({}, true)({ record: {}, value: { label: '对象' }, emit: () => {} }), undefined, '对象值 → undefined（占位链）')
      assertEqual(
        ListColumn.compile({ listItems: () => '不是数组' }, true)({ record: {}, value: [1], emit: () => {} }),
        undefined,
        'listItems 返回非数组同样落占位'
      )

      // dom 通道全 text 列（无 column.link）：条目对象遗留 link 键不参与渲染
      // （人工-1 [1-1] 负向断言：{ label, link: true } 条目仍渲染 span、无色类）
      const domText = ListColumn.compile({ listOption: { max: 3 } }, true)({
        record: {},
        value: ['文本项', { label: '链接项', link: true }, { label: '覆盖项', id: 42, link: true, color: 'danger' }, '第4项'],
        emit: () => {}
      })

      assertEqual(domText.class, 'mu-table__list-cell', 'dom 外层 class')
      assertEqual(domText.items.length, 3, 'listOption.max=3 截断（第 3 条 dots）')
      assert(domText.items.every(i => i.is === 'span'), '全 text 列条目恒 span（条目 link 键不参与渲染）')
      assert(domText.items.every(i => i.attrs.class.filter(Boolean).length === 0), '全 text 列不落 text-{color}（正文色，条目 color 键不消费）')
      assertEqual(domText.items[2].text, '...', 'dots 条目')

      // dom 通道全 link 列（column.link: true 列级单点）：整列 a + text-{color}
      const domLink = ListColumn.compile({ link: true, listOption: { max: 3, color: 'teal', disabled: false } }, true)({
        record: {},
        value: ['文本项', { label: '覆盖项', id: 42, color: 'danger' }, '第3项', '第4项'],
        emit: () => {}
      })

      assert(domLink.items.every(i => i.is === 'a'), '全 link 列条目恒 a（列级单点）')
      assert(domLink.items[0].attrs.class.includes('text-teal'), 'listOption.color 缺省色 → text-teal')
      assert(domLink.items[1].attrs.class.includes('text-danger'), '条目 color 覆盖 listOption.color')
      assert(domLink.items.every(i => typeof i.events.click === 'function'), '全 link 列条目绑定 click')

      // 常规条目 payload item = 条目原对象（含 id 附加键，遗留 link 键原样传出）、column = 原列引用
      const target = { label: '附加键', id: 42, link: true, color: 'danger' }
      const columnDef = { field: 'items', type: 'list' }
      let captured = null

      ListColumn.compile(columnDef, true)(
        { record: { id: 1 }, value: ['文本项', target], emit: (type, payload) => { captured = payload } }
      ).items[1].events.click()

      assertEqual(captured.record.id, 1, 'payload.record = 行记录')
      assert(captured.column === columnDef, 'payload.column = 原始列引用')
      assert(captured.item === target, 'payload.item = 条目原引用（id/link 附加键不丢）')

      // canvas 通道：link 字段 = 列级 column.link（整列同值）、color 仅 link 列消费
      const canvasLink = ListColumn.compile({ link: true, title: true })({
        record: {},
        value: [{ label: '甲', color: 'danger' }, '乙'],
        emit: () => {}
      })

      assertEqual(canvasLink.items[0].kind, 'link', 'canvas 条目复用 kind link 命中链')
      assert(canvasLink.items.every(i => i.link === true), '全 link 列条目 link:true（列级来源）')
      assertEqual(canvasLink.items[0].color, 'danger', 'link 列条目 color 查表名')
      assertEqual(canvasLink.items[1].color, 'primary', 'link 列无 color 条目缺省 primary')
      assertEqual(canvasLink.items[0].title, '甲', 'title:true 生效')

      const canvasText = ListColumn.compile({ title: true })({
        record: {},
        value: [{ label: '甲', link: true, color: 'danger' }, '乙'],
        emit: () => {}
      })

      assert(canvasText.items.every(i => i.link === false), '全 text 列条目恒 link:false（条目 link 键不参与）')
      assertEqual(canvasText.items[0].color, null, '非 link 列条目 color null（绘制正文色）')

      // 全条目点击派发（A6：含纯文本条目，两形态列同）
      const events = []

      ListColumn.compile({})({ record: {}, value: [{ label: '甲', link: true }, '乙'], emit: (type, payload) => events.push(payload) })
        .items.forEach(item => item.onItemClick())

      assertEqual(events.length, 2, '所有条目绑定 onItemClick（A6）')
      assertEqual(events[0].item.label, '甲', 'link 项 payload item')
      assertEqual(events[1].item.label, '乙', '纯文本项 payload item = primitive 包装对象 { label }')

      // caption 兼容读取 + 空条目过滤
      const legacy = ListColumn.compile({}, true)({ record: {}, value: [{ caption: '旧键' }, { label: '' }, 'ok'], emit: () => {} })

      assertEqual(legacy.items.length, 2, '空 label 条目过滤、caption 条目保留')
      assertEqual(legacy.items[0].text, '旧键', 'caption 键兼容读取（开发期警告一次）')

      return '标量/对象落占位、列级 link 整列 span/a、非 link 列正文色、payload item/column、caption 兼容、过滤全通过'
    }
  },
  {
    name: 'TagColumn compile 产物（dom 通道）：颜色类恒落地（text-{c}+bg-{c}-translucent）、pill/flat、dots、payload 原对象',
    fn: () => {
      const render = TagColumn.compile({}, true)

      // 对象数组：对象元素原样保留；颜色类恒落地（无色默认 gray，20261103）
      const out = render({ record: {}, value: [{ caption: 'A', color: 'success' }, { caption: 'B' }, 3], emit: () => {} })

      assertEqual(out.items.length, 3, '3 个条目')
      assertEqual(out.items[0].text, 'A', '对象元素 caption 文本（非 [object Object]）')
      assert(
        out.items[0].attrs.class.includes('text-success') && out.items[0].attrs.class.includes('bg-success-translucent'),
        '条目级 color 落 text-{c}+bg-{c}-translucent'
      )
      assert(
        out.items[1].attrs.class.includes('text-gray') && out.items[1].attrs.class.includes('bg-gray-translucent'),
        '无色条目恒落 gray 类（默认 gray）'
      )
      assertEqual(out.items[2].text, 3, '数字元素仍包 { caption: el } 行为不变（text 保持原始 number）')

      // tagOption.color 缺省与条目级覆盖
      const withOption = TagColumn.compile({ tagOption: { color: 'warning' } }, true)
      const outOpt = withOption({ record: {}, value: [{ caption: 'A' }, { caption: 'B', color: 'success' }], emit: () => {} })

      assert(outOpt.items[0].attrs.class.includes('text-warning'), 'tagOption.color 缺省落 class')
      assert(!outOpt.items[1].attrs.class.includes('text-warning') && outOpt.items[1].attrs.class.includes('text-success'), '条目级 color 覆盖 tagOption.color')

      // pill/flat：条目级生效（pill:false 覆盖缺省）与 tagOption 缺省落 class
      const pillFlat = TagColumn.compile({ tagOption: { pill: true } }, true)
      const outPf = pillFlat({ record: {}, value: [{ caption: 'P', pill: false }, { caption: 'F', pill: true, flat: true }, { caption: 'N' }], emit: () => {} })

      assert(!outPf.items[0].attrs.class.includes('mu-tag--pill'), '条目级 pill:false 覆盖 tagOption.pill')
      assert(outPf.items[1].attrs.class.includes('mu-tag--pill') && outPf.items[1].attrs.class.includes('mu-tag--flat'), '条目级 pill/flat 落 class')
      assert(outPf.items[2].attrs.class.includes('mu-tag--pill'), 'tagOption.pill 缺省落全部条目 class')

      // 字符串数组：包裹行为不变、色类体系为 text-{c}（无 mu-tag--{c}）
      const out2 = render({ record: {}, value: ['x', 'y'], emit: () => {} })

      assertArray(out2.items.map(i => i.text), ['x', 'y'], '字符串数组文本')
      assertEqual(out2.items[0].attrs.class[0], 'mu-tag', '基础 mu-tag class 保留')
      assert(!out2.items[0].attrs.class.join(' ').includes('mu-tag--'), '色类体系 text-{c}（无 mu-tag--{c}）')

      // max 超限 dots：'...' 字面值 + events.click 绑定（DOM tag.js dots 字面）
      const dots = TagColumn.compile({ tagOption: { max: 2 } }, true)
      const dotEvents = []
      const out3 = dots({ record: {}, value: ['a', 'b', 'c', 'd'], emit: (type, payload) => dotEvents.push([type, payload]) })

      assertEqual(out3.items.length, 2, 'max=2 截断')
      assertEqual(out3.items[1].text, '...', '超限条目 \'...\' 三点字面')
      out3.items[1].events.click()
      assertEqual(dotEvents[0][0], 'cell-item-click', 'dots 条目绑定 click')
      assertEqual(dotEvents[0][1].tag, '...', 'dots payload 值 = \'...\' 非省略号字符')

      // 常规条目 payload tag = 条目原对象（对象数组元素即 { caption, color, ... }）
      const target = { caption: 'T', color: 'blue' }
      let captured = null
      const out4 = TagColumn.compile({}, true)(
        { record: {}, value: [target], emit: (type, payload) => { captured = payload.tag } }
      )

      out4.items[0].events.click()
      assert(captured === target, 'payload tag 应为条目原对象（与 LinkColumn 对齐）')

      // 缺 caption 对象被 isValidTag 过滤
      const out5 = render({ record: {}, value: [{ color: 'red' }, { caption: 'ok' }], emit: () => {} })

      assertEqual(out5.items.length, 1, '缺 caption 对象被 isValidTag 过滤')
      assertEqual(out5.items[0].text, 'ok', '有效条目保留')

      return '颜色类恒落地、pill/flat、字符串不变、dots click、payload 原对象、过滤全通过'
    }
  },
  {
    name: 'link 列竖排：数组每条一行、color 查表/danger 映射/disabled 取色、超限 dots \'...\'、条目矩形回报',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'link', maxItems: 4 })
      const record = { v: [{ caption: 'A', color: 'success' }, { caption: 'B', disabled: true }, { caption: 'C', danger: true }, 'D', 'E'] }
      const rects = []
      const { calls } = drawRecorded(col, record, { height: 88, onItemRect: r => rects.push(r) })

      assertArray(calls.fillText.map(c => c.text), ['A', 'B', 'C', '...'], '3 条 + dots（maxItems=4，第 4 条 \'...\'）')
      assertArray(
        calls.fillText.map(c => c.y),
        [19 + TEXT_ANCHOR_OFF, 37 + TEXT_ANCHOR_OFF, 55 + TEXT_ANCHOR_OFF, 73 + TEXT_ANCHOR_OFF],
        `竖排每条一行（首行光学居中锚 19 + 偏移 ${TEXT_ANCHOR_OFF}；+18 顺排）`
      )
      assertArray(calls.fillText.map(c => c.x), [8, 8, 8, 8], '左缘对齐内容区')
      assertEqual(calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.success.color), '条目 color 色名查表 → colors.success.color（20261104 color 激活）')
      assertEqual(calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), 'disabled（存在性判定）→ textColorMuted')
      assertEqual(calls.fillText[2].fillStyle, cssColorOf(THEME_COLORS.danger.color), 'danger:true → color danger 映射 → colors.danger')
      assertEqual(calls.fillText[3].fillStyle, cssColorOf(THEME.primaryColor), 'dots 条目回退主色（mu-link 缺省）')
      assertArray(rects.map(r => `${r.kind}:${r.index}`), ['link:0', 'link:1', 'link:2', 'link:3'], '条目矩形（含 dots）回报')
      assertArray(rects.map(r => r.disabled), [false, true, false, false], '条目 disabled 字段（B disabled=true、dots false）')

      // list 列（R1 列级 link）：全 text 列条目恒正文色（条目遗留 link 键不参与渲染）；
      // 全 link 列（column.link）缺省 primary（colors.primary 与 primaryColor 同源）、条目 color 查表
      const listCol = prepareColumn({ field: 'v', type: 'list' })
      const listDraw = drawRecorded(listCol, { v: ['甲', { label: '链接乙', link: true }] }, { height: 60 })

      assertArray(listDraw.calls.fillText.map(c => c.text), ['甲', '链接乙'], 'list 列竖排文本')
      assertEqual(listDraw.calls.fillText[0].fillStyle, cssColorOf(THEME.textColor), '全 text 列条目正文色 textColor')
      assertEqual(listDraw.calls.fillText[1].fillStyle, cssColorOf(THEME.textColor), '条目遗留 link 键不参与渲染（仍正文色，R1 列级口径）')

      const listLinkCol = prepareColumn({ field: 'v', type: 'list', link: true })
      const listLinkDraw = drawRecorded(listLinkCol, { v: [{ label: '甲' }, { label: '乙', color: 'danger' }] }, { height: 60 })

      assertEqual(listLinkDraw.calls.fillText[0].fillStyle, cssColorOf(THEME.primaryColor), '全 link 列条目缺省 primary（colors.primary 与 primaryColor 同源，R1-2 夹具）')
      assertEqual(listLinkDraw.calls.fillText[1].fillStyle, cssColorOf(THEME_COLORS.danger.color), '全 link 列条目 color 查表')

      // 字符串数组竖排 + 数字单值 String 化
      const strings = drawRecorded(col, { v: ['甲', '乙'] }, { height: 60 })

      assertArray(strings.calls.fillText.map(c => c.text), ['甲', '乙'], '字符串数组竖排')

      const single = drawRecorded(col, { v: 9 })

      assertArray(single.calls.fillText.map(c => c.text), ['9'], '单值数字 String 化')

      // 对齐（20261104 修复）：竖排每条独占一行、各自按列 align 定位（对齐 DOM 版
      // td text-{align} 作用于每行 inline 条目）；fakeMeasure 'A'=9、'AB'=18
      const centeredCol = prepareColumn({ field: 'v', type: 'link', align: 'center' })
      const centered = drawRecorded(centeredCol, { v: ['A', 'AB'] }, { height: 60, measure: fakeMeasure })

      assertArray(centered.calls.fillText.map(c => c.x), [75.5, 71], 'center 每条各自居中（(160−宽)/2：9→75.5、18→71）')

      const centeredInset = drawRecorded(centeredCol, { v: ['A'] }, { measure: fakeMeasure, rightInset: 1 })

      assertEqual(centeredInset.calls.fillText[0].x, 75, 'center 扣 rightInset（本格右缘列线占用）→ 75')

      const rightAligned = drawRecorded(
        prepareColumn({ field: 'v', type: 'link', align: 'right' }),
        { v: ['A', 'AB'] },
        { height: 60, measure: fakeMeasure }
      )

      assertArray(rightAligned.calls.fillText.map(c => c.x), [143, 134], 'right 各条右缘贴 padding（160−8−宽）')

      // 命中矩形 x 随对齐同步（hover/点击 itemHits 命中链路）
      const centeredRects = []

      drawRecorded(centeredCol, { v: ['A'] }, { measure: fakeMeasure, onItemRect: r => centeredRects.push(r) })
      assertEqual(centeredRects[0].rect.x, 75.5, '条目矩形 x = 对齐后起点（itemHits 命中同步）')

      return `竖排 y=${[19, 37, 55, 73].map(y => y + TEXT_ANCHOR_OFF).join('/')}；success/muted/danger/primary 四态取色正确；center/right 各自对齐`
    }
  },
  {
    name: 'link 悬停（问题 7/A7）：竖排与横排两路径色变 + 1px 下划线、disabled 不悬停、list 非 link 条目不悬停',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'link', maxItems: 4 })
      const record = { v: [{ caption: 'A', color: 'success' }, { caption: 'B', disabled: true }, { caption: 'C', danger: true }, 'D', 'E'] }

      // 竖排路径（drawLinkItems）：hover 第 0 条（color success 查表，彩色 hover === color）
      const vertical = drawRecorded(col, record, { height: 88, hoverItem: { kind: 'link', index: 0 } })
      const successHover = cssColorOf(THEME_COLORS.success.hover)

      assertEqual(vertical.calls.fillText[0].fillStyle, successHover, '竖排 hover 条目 fillStyle = item.color 查表 hover 谱系（success）')
      assertEqual(vertical.calls.fillRect.length, 1, '竖排仅 hover 条目画下划线')
      assertEqual(vertical.calls.fillRect[0].y, 19 + TEXT_ANCHOR_OFF + 2, `下划线 y = 光学锚(${19 + TEXT_ANCHOR_OFF}) + 2（基线下 2px，20261029 问题 1）`)
      assertEqual(vertical.calls.fillRect[0].x, 8, '下划线 x = 条目起点（内容区左缘）')
      assert(vertical.calls.fillRect[0].width > 0 && vertical.calls.fillRect[0].height === 1, '下划线 1px 高、宽 = 实绘文本宽')
      assertEqual(vertical.calls.fillRect[0].fillStyle, successHover, '下划线 fillStyle = hover 色')

      // 竖排 disabled 条目被 hover：不悬停（常态 muted、无下划线）
      const verticalDisabled = drawRecorded(col, record, { height: 88, hoverItem: { kind: 'link', index: 1 } })

      assertEqual(verticalDisabled.calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), '竖排 disabled 被 hover 仍为常态 muted')
      assertEqual(verticalDisabled.calls.fillRect.length, 0, '竖排 disabled 被 hover 不画下划线')

      // list 列（非 link 条目 link:false）被 hover：不悬停（正文色、无下划线，A6 门控）
      const listCol = prepareColumn({ field: 'v', type: 'list' })
      const listHover = drawRecorded(listCol, { v: ['甲', '乙'] }, { height: 60, hoverItem: { kind: 'link', index: 0 } })

      assertEqual(listHover.calls.fillText[0].fillStyle, cssColorOf(THEME.textColor), 'list 非 link 条目被 hover 保持正文色（item.link !== false 门控）')
      assertEqual(listHover.calls.fillRect.length, 0, 'list 非 link 条目被 hover 不画下划线')

      // 横排路径（drawItemText）：自定义类型产平铺 kind:'link' 条目（col.type 非 link → 横排；
      // 老式条目无 link 字段 → link !== false 视为 link，danger 回退保留）
      const hCol = prepareColumn({
        field: 'v',
        type: {
          render: () => ({
            items: [
              { kind: 'link', text: '甲', danger: true },
              { kind: 'link', text: '乙', disabled: true }
            ]
          })
        }
      })
      const rects = []
      const horizontal = drawRecorded(hCol, { v: 1 }, { onItemRect: r => rects.push(r), hoverItem: { kind: 'link', index: 0 } })

      assertEqual(horizontal.calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.danger.hover), '横排 hover 条目 fillStyle = colors.danger.hover')
      assertEqual(horizontal.calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), '横排未 hover 的 disabled 条目仍 muted')
      assertEqual(horizontal.calls.fillRect.length, 1, '横排仅 hover 条目画下划线')
      assertEqual(horizontal.calls.fillRect[0].y, 19 + TEXT_ANCHOR_OFF + 2, '横排下划线 y 同式（光学锚 + 2）')
      assertEqual(horizontal.calls.fillRect[0].fillStyle, cssColorOf(THEME_COLORS.danger.hover), '横排下划线 fillStyle = hover 色')

      // 横排 disabled 条目被 hover：不悬停（第 0 条回落常态 danger.color）
      const horizontalDisabled = drawRecorded(hCol, { v: 1 }, { hoverItem: { kind: 'link', index: 1 } })

      assertEqual(horizontalDisabled.calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.danger.color), '横排未 hover 条目为常态 danger.color')
      assertEqual(horizontalDisabled.calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), '横排 disabled 被 hover 仍 muted（不悬停）')
      assertEqual(horizontalDisabled.calls.fillRect.length, 0, '横排 disabled 被 hover 不画下划线')

      // 横排条目 disabled 字段（reportHitRect 路径）
      assertArray(rects.map(r => `${r.kind}:${r.index}`), ['link:0', 'link:1'], '横排条目回报')
      assertArray(rects.map(r => r.disabled), [false, true], '横排条目携带 disabled 布尔')

      return `两路径 hover 色变 + 下划线 y=${19 + TEXT_ANCHOR_OFF + 2}；disabled 两态不悬停；list 非 link 不悬停；横排 disabled=[false,true]`
    }
  },
  {
    name: 'button 悬停反转（问题 7/A7）：命中且非 disabled 反转三色、disabled 不反转',
    fn: () => {
      const col = prepareColumn({
        field: 'v',
        type: 'button',
        buttons: [{ caption: '编辑', color: 'danger' }, { caption: '删除', disabled: true }]
      })

      // hover 第 0 条（danger，非 disabled）：底/边框 = colored.color、文字 = bgNormal
      const inverted = drawRecorded(col, {}, { width: 220, hoverItem: { kind: 'button', index: 0 } })

      assertEqual(inverted.calls.fill[0].fillStyle, cssColorOf(THEME_COLORS.danger.color), '反转底色 = colors.danger.color')
      assertEqual(inverted.calls.stroke[0].strokeStyle, cssColorOf(THEME_COLORS.danger.color), '反转边框 = colors.danger.color')
      assertEqual(inverted.calls.fillText[0].fillStyle, cssColorOf(THEME.bgNormal), '反转文字 = bgNormal')

      // hover 第 1 条（disabled）：不反转，两按钮均保持常态
      const disabledHover = drawRecorded(col, {}, { width: 220, hoverItem: { kind: 'button', index: 1 } })

      assertEqual(disabledHover.calls.fill[0].fillStyle, cssColorOf(THEME_COLORS.danger.translucent), 'hover 第 1 条不影响第 0 条常态底色')
      assertEqual(disabledHover.calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.danger.color), '第 0 条常态文字色')
      assertEqual(disabledHover.calls.fill[1].fillStyle, cssColorOf(THEME.bgDisabled), 'disabled 被 hover 不反转（底 bgDisabled）')
      assertEqual(disabledHover.calls.stroke[1].strokeStyle, cssColorOf(THEME.borderColor), 'disabled 边框常态 borderColor')
      assertEqual(disabledHover.calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), 'disabled 文字常态 muted')

      return '反转三色（底/边框 = danger.color、文字 = bgNormal）；disabled 保持置灰'
    }
  },
  {
    name: 'button link 形态（column.link）：纯文字链取色/正文字体/hover 下划线/disabled 不悬停/命中宽度/tooltip 计宽',
    fn: () => {
      const column = {
        field: 'v',
        type: 'button',
        link: true,
        buttons: [{ caption: '编辑', color: 'danger' }, { caption: '删除', disabled: true }]
      }
      const col = prepareColumn(column)

      // 产物链：canvasKind 仍 button（hover/点击/光标链路不变）+ 列级 link 标志平铺
      const produced = content(col, {})

      assertEqual(produced.canvasKind, 'button', 'canvasKind 仍为 button（itemHits 命中链路不变）')
      assertEqual(produced.link, true, 'column.link 平铺进 render 产物（不落单条 button）')
      assertEqual(content(prepareColumn({ ...column, link: false }), {}).link, null, 'link 缺省/假值产物不带该字段')

      const rects = []
      const normal = drawRecorded(col, {}, { width: 220, measure: fakeMeasure, onItemRect: r => rects.push(r) })

      assertEqual(normal.calls.fill.length, 0, 'link 形态无 pill 底色 fill')
      assertEqual(normal.calls.stroke.length, 0, 'link 形态无边框 stroke')
      assertEqual(normal.calls.fillText[0].font, CELL_FONT, '字体取正文 cellFontOf（非 tag 12px）')
      assertEqual(normal.calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.danger.color), '常态文字色 = colors.danger.color')
      assertEqual(normal.calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), 'disabled 文字色 muted')

      // 命中宽度 = 文本宽（无 pill 内边距）：'编辑' fakeMeasure 18；pill 对照 = 18 + 16
      assertEqual(rects[0].kind, 'button', '命中条目 kind 仍为 button')
      assertEqual(rects[0].rect.width, 18, 'link 条目矩形宽 = 文本宽（无 TAG_PADDING_X）')

      const pillRects = []

      drawRecorded(
        prepareColumn({ ...column, link: false }),
        {},
        { width: 220, measure: fakeMeasure, onItemRect: r => pillRects.push(r) }
      )
      assertEqual(pillRects[0].rect.width, 34, 'pill 对照矩形宽 = 文本宽 + 2×TAG_PADDING_X')

      // hover：hover 谱系 + 1px 下划线（y 与 link 条目同式：光学锚 + 2）
      const hovered = drawRecorded(col, {}, { width: 220, hoverItem: { kind: 'button', index: 0 } })

      assertEqual(hovered.calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.danger.hover), 'hover 文字色 = colors.danger.hover')
      assertEqual(hovered.calls.fillRect.length, 1, 'hover 画 1 条下划线')
      assertEqual(hovered.calls.fillRect[0].y, 19 + TEXT_ANCHOR_OFF + 2, '下划线 y = 光学锚 + 2（link 条目同式）')

      // disabled 被 hover：恒置灰不悬停、不画下划线
      const disabledHover = drawRecorded(col, {}, { width: 220, hoverItem: { kind: 'button', index: 1 } })

      assertEqual(disabledHover.calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), 'disabled 被 hover 仍 muted')
      assertEqual(disabledHover.calls.fillRect.length, 0, 'disabled 被 hover 不画下划线')

      // 对齐（20261104 修复）与 pill 形态同源：18+8+18 = 44 → center 起点 (160−44)/2 = 58
      const linkCenteredRects = []
      const linkCentered = drawRecorded(
        prepareColumn({ ...column, align: 'center' }),
        {},
        { measure: fakeMeasure, onItemRect: r => linkCenteredRects.push(r) }
      )

      assertArray(linkCentered.calls.fillText.map(c => c.x), [58, 84], 'link 形态 center 文字 x = 58/84（无 pill 内边距）')
      assertArray(linkCenteredRects.map(r => r.rect.x), [58, 84], '命中矩形 x 随对齐同步（itemHits 命中链路）')

      // tooltip 溢出计宽随 link 切换：15 字 = 135，pill 135+16 = 151 > 144 溢出、link 135 ≤ 144 不溢出
      const CAPTION15 = '一二三四五六七八九十壹贰叁肆伍'

      assertEqual(
        tooltipOf({ field: 'b', type: 'button', buttons: [{ caption: CAPTION15 }], title: true }, { b: 1 }).overflow,
        true,
        'pill 形态 151 > 144 截断溢出（对照）'
      )
      assertEqual(
        tooltipOf({ field: 'b', type: 'button', link: true, buttons: [{ caption: CAPTION15 }], title: true }, { b: 1 }).overflow,
        false,
        'link 形态 135 ≤ 144 不溢出（无 pill 内边距计宽）'
      )
      assertEqual(
        tooltipOf({ field: 'b', type: 'button', link: true, buttons: [{ caption: '一二三四五六七八九十'.repeat(2) }], title: true }, { b: 1 }).overflow,
        true,
        'link 形态 180 > 144 截断溢出'
      )

      return '无底无边框 + danger.color/正文 14px + hover 谱系下划线 + 宽 18 vs 34 + tooltip 计宽切换'
    }
  },
  {
    name: 'linkHoverColorOf：danger hover / 默认 primary hover / hover 缺失回退 color / disabled muted（A7）',
    fn: () => {
      assert(THEME_COLORS.danger.hover !== THEME_COLORS.danger.color, '前置：夹具语义色 hover 与 color 可区分')
      assert(THEME_COLORS.primary.hover !== THEME_COLORS.primary.color, '前置：primary hover 与 color 可区分')
      assertEqual(linkHoverColorOf({ danger: true }, THEME), THEME_COLORS.danger.hover, 'danger → colors.danger.hover')
      assertEqual(linkHoverColorOf({}, THEME), THEME_COLORS.primary.hover, '默认 → colors.primary.hover')
      assertEqual(
        linkHoverColorOf({ danger: true }, { ...THEME, colors: { danger: { color: '#123456' } } }),
        '#123456',
        'hover 字段缺失回退 color（自定义主题裁剪变量场景）'
      )
      assertEqual(linkHoverColorOf({ disabled: true }, THEME), THEME.textColorMuted, 'disabled → textColorMuted')
      assertEqual(linkHoverColorOf({ danger: false }, THEME), THEME_COLORS.primary.hover, 'danger 假值 → 默认 primary hover')

      // 20261104 color 色名维度：查表优先、非 link 条目（link:false）正文色
      assertEqual(linkHoverColorOf({ color: 'success' }, THEME), THEME_COLORS.success.hover, 'color 色名 → colors.success.hover')
      assertEqual(linkHoverColorOf({ color: 'success', danger: true }, THEME), THEME_COLORS.success.hover, 'color 查表优先于 danger 回退')
      assertEqual(linkHoverColorOf({ link: false }, THEME), THEME.textColor, '非 link 条目 → 正文色（hover 门控不达，防御回退）')

      return 'danger.hover / primary.hover / 缺失回退 / muted / color 查表 / 非 link 正文色 分支'
    }
  },
  {
    name: 'requestIconImage（问题 5/A5）：SVG currentColor 着色 → data URL、同参复用缓存条目、非 SVG src 直通',
    fn: () => {
      const color = 'rgb(9, 87, 200)'
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="currentColor"><path d="M4 4h${iconSeed++}"/></svg>`
      const entry = requestIconImage(svg, color, () => {})

      assert(entry != null, '应返回 requestImage 缓存条目')
      assertEqual(entry.status, 'loading', '未完成前 status = loading（SVG 串逐次唯一，防重跑命中缓存）')
      assertEqual(entry.image.crossOrigin, 'anonymous', 'Image crossOrigin = anonymous（requestImage 单一管线）')

      const prefix = 'data:image/svg+xml;charset=utf-8,'
      assert(entry.image.src.startsWith(prefix), `SVG 应转 data URL（前缀 ${prefix}）`)

      const decoded = decodeURIComponent(entry.image.src.slice(prefix.length))

      assert(!/currentcolor/i.test(decoded), 'currentColor 应全部替换为着色串（img 上下文不可靠）')
      assertEqual(decoded.split(color).length - 1, 2, 'stroke/fill 两处写法均着色')
      assert(decoded.includes('<svg'), 'SVG 标记保留在 data URL 内')

      assertEqual(requestIconImage(svg, color), entry, '同参二次调用返回同一缓存条目')
      assert(requestIconImage(svg, 'rgb(1, 2, 3)') !== entry, '着色串入缓存键（异色分键）')

      const png = tinyPngDataUri()
      const direct = requestIconImage(png, color)

      assertEqual(direct.image.src, png, '非 SVG 串按 src 直通（不转 data URL）')
      assert(getImageEntry(png) === direct, '直通串经 getImageEntry 可查到（入 imageCache）')

      return 'data URL 前缀 + 着色 ×2 + 同参同条目 + 异色分键 + src 直通'
    }
  },
  {
    name: 'tag 颜色：条目 color 直取 colors 查表（底 translucent、边框与文字同色），无色恒 gray',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'tag', tags: r => r.list })
      const rects = []
      const { calls } = drawRecorded(col, { list: [{ caption: '紧急', color: 'success' }, { caption: '普通' }] }, { onItemRect: r => rects.push(r) })

      assertArray(calls.fillText.map(c => c.text), ['紧急', '普通'], '两条 tag')
      assertEqual(calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.success.color), '彩色 tag 文字色')
      assertEqual(calls.fillText[1].fillStyle, cssColorOf(THEME.gray), '无色 tag 恒 gray（colors 无 gray 键走快照）')
      assertEqual(calls.fill[0].fillStyle, cssColorOf(THEME_COLORS.success.translucent), '彩色 tag 底 translucent')
      assertEqual(calls.fill[1].fillStyle, cssColorOf(THEME.hoverBg), '无色 tag 底回退 hoverBg（gray translucent 等价）')
      assertEqual(calls.stroke[0].strokeStyle, cssColorOf(THEME_COLORS.success.color), '彩色 tag 边框与文字同色（对齐 dom currentColor）')
      assertEqual(calls.stroke[1].strokeStyle, cssColorOf(THEME.gray), '无色 tag 边框与文字同色 gray')
      assertArray(rects.map(r => `${r.kind}:${r.index}`), ['tag:0', 'tag:1'], 'tag 条目矩形回报（可点击命中）')
      assert(rects.every(r => r.disabled === false), 'tag 条目 disabled 缺省 false（横排 reportHitRect 路径）')

      return 'success 色查表 + gray 恒定；边框与文字同色；kind=tag 回报'
    }
  },
  {
    name: 'check disabled 底衬：bgStrong 优先，缺失回退 hoverBg（03-review-3 问题 1 回退链统一）',
    fn: () => {
      const col = prepareColumn({ field: 'c', type: 'check', disabled: true })

      assertEqual(drawRecorded(col, { c: true }).calls.fill[0].fillStyle, THEME.bgStrong, '底衬取 bgStrong')
      assertEqual(
        drawRecorded(col, { c: true }, { theme: { ...THEME, bgStrong: undefined } }).calls.fill[0].fillStyle,
        THEME.hoverBg,
        '无 bgStrong 回退 hoverBg'
      )

      return `底衬 = ${THEME.bgStrong}；回退 = ${THEME.hoverBg}`
    }
  },
  {
    name: '树形列：level 缩进 + 箭头槽（父行三角/叶行空槽/展开态方向），树关无缩进',
    fn: () => {
      const col = prepareColumn({ field: 'name', treeNode: true })
      const flatInfo = { levels: [0, 1], hasChildren: [true, false] }

      // 行 0：level 0 父行收起 → 箭头三角 + 文本右移 0×16+16
      const row0 = drawRecorded(col, { name: '甲' }, { row: 0, flatInfo, expandedKeys: new Set(['k2']), recordKey: 'k1' })

      assertEqual(row0.calls.fill.length, 1, '父行应绘箭头三角（path fill）')
      assertEqual(row0.calls.fillText[0].x, 8 + 0 * 16 + 16, 'level 0 缩进 + 16px 箭头槽')

      // 行 1：level 1 叶行 → 空槽无箭头，文本右移 1×16+16
      const row1 = drawRecorded(col, { name: '乙' }, { row: 1, flatInfo, expandedKeys: new Set(['k2']), recordKey: 'k2' })

      assertEqual(row1.calls.fill.length, 0, '叶行空槽无箭头')
      assertEqual(row1.calls.fillText[0].x, 8 + 1 * 16 + 16, 'level 1 缩进 + 16px 箭头槽')

      // 展开态（expandedKeys 含当前 key）方向不同 → 像素差异
      const collapsed = drawToCanvas(col, { name: '甲' }, { row: 0, flatInfo, expandedKeys: new Set(['other']), recordKey: 'k1' })
      const expanded = drawToCanvas(col, { name: '甲' }, { row: 0, flatInfo, expandedKeys: new Set(['k1']), recordKey: 'k1' })

      assert(pixelBuffersDiffer(collapsed, expanded), '收起 ▸ 与展开 ▾ 像素应不同')

      // 树关（flatInfo null）：无缩进无箭头（现状路径）
      const off = drawRecorded(col, { name: '甲' }, { row: 0, flatInfo: null, recordKey: 'k1' })

      assertEqual(off.calls.fill.length, 0, '树关无箭头')
      assertEqual(off.calls.fillText[0].x, 8, '树关无缩进（内容区不扣 inset）')

      return '缩进 x=24/40、父行箭头/叶行空槽、展开/收起方向、树关回退'
    }
  },
  {
    name: 'resolveCellTooltip：falsy 门控与无文本源类型（title:false/无 title/空串/0/check/progress/img/null 文本）',
    fn: () => {
      // falsy 不生效（对齐 DOM 版 title 只对 truthy 生效，不得被 String(false) 成 'false'）
      assert(tooltipOf({ field: 'v', title: false }, { v: '甲' }) === null, 'title:false 应不生效（不得 String(false)）')
      assert(tooltipOf({ field: 'v' }, { v: '甲' }) === null, '无 title 应返回 null')
      assert(tooltipOf({ field: 'v', title: '' }, { v: '甲' }) === null, 'title 空串应不生效')
      assert(tooltipOf({ field: 'v', title: 0 }, { v: 1 }) === null, 'title 0 应不生效')
      assert(tooltipOf({ field: 'v', title: () => '' }, { v: '甲' }) === null, '_title 返回空串应返回 null')

      // true 形态无可提示文本源的类型
      assert(tooltipOf({ field: 'v', type: 'check', title: true }, { v: true }) === null, 'check 列 title:true 无可提示文本 → null')
      assert(tooltipOf({ field: 'p', type: 'progress', title: true }, { p: 60 }) === null, 'progress 列 title:true 无文本源 → null')
      assert(
        tooltipOf({ field: 'img', type: 'img', title: true }, { img: 'data:image/png;base64,AAAA' }) === null,
        'img 列（未加载单条目无文本）→ null'
      )
      assert(tooltipOf({ field: 'empty', title: true }, { empty: null }) === null, '文本源 null → null')

      return 'title:false/无 title/空串/0/空串返回/check/progress/img/null 文本源均返回 null'
    }
  },
  {
    name: 'resolveCellTooltip：自定义 String/Function title 恒显示（overflowOnly:false、content 恒 String）',
    fn: () => {
      const stringTip = tooltipOf({ field: 'v', title: '固定提示' }, { v: '甲' })

      assertEqual(stringTip.content, '固定提示', 'String title 恒显示（不判溢出）')
      assertEqual(stringTip.overflowOnly, false, '自定义 title 不判溢出')
      assertEqual(typeof stringTip.content, 'string', 'content 恒为 String')

      const fnTip = tooltipOf({ field: 'status', title: r => `状态码：${r.status}` }, { status: 'active' })

      assertEqual(fnTip.content, '状态码：active', 'Function title 按 record 求值')
      assertEqual(fnTip.overflowOnly, false, 'Function title 不判溢出')
      assertEqual(tooltipOf({ field: 'v', title: 123 }, { v: 1 }).content, '123', 'truthy 数字 title String 化')

      return 'String/Function/数字 title 恒显示；overflowOnly=false；content 为 String'
    }
  },
  {
    name: 'resolveCellTooltip：单行文本溢出判定（截断/未截断/contentWidth≤0 按溢出）',
    fn: () => {
      // fakeMeasure CJK 9px/字符：20 字 = 180 > 内容宽 144 → 溢出
      const long = '一二三四五六七八九十'.repeat(2)
      const overflowed = tooltipOf({ field: 'v', title: true }, { v: long })

      assertEqual(overflowed.overflow, true, '超宽单行应判溢出')
      assertEqual(overflowed.content, long, 'content = 全文（不含省略号）')
      assertEqual(overflowed.overflowOnly, true, 'title:true 为 overflowOnly 形态')

      assertEqual(tooltipOf({ field: 'v', title: true }, { v: '甲' }).overflow, false, '未截断不显示（overflow false，壳据此收起）')
      assertEqual(
        tooltipOf({ field: 'v', title: true }, { v: '甲' }, { contentWidth: 0 }).overflow,
        true,
        'contentWidth ≤ 0 按溢出返回（绘制层不画的格子允许提示）'
      )

      return '180>144 溢出 / 未截断 false / contentWidth=0 溢出；content 为全文'
    }
  },
  {
    name: 'resolveCellTooltip：maxLines 多行 wrapLines clamped 与 regionHeight 钳制（capMaxLinesOf 同式）',
    fn: () => {
      const col = { field: 'v', maxLines: 3, title: true }
      const fourLines = '一二三四五六七八九十'.repeat(6) // 60 字 ×9 = 540 → 16 字/行 → 4 行 > 3

      assertEqual(tooltipOf(col, { v: fourLines }).overflow, true, '折 4 行 > maxLines 3 → clamped 溢出')
      assertEqual(
        tooltipOf(col, { v: '一二三四五六七八九十'.repeat(2) }).overflow,
        false,
        '折 2 行 ≤ maxLines 3 不溢出'
      )

      // regionHeight 36：floor((36 − 8×2)/18) = 1 → maxLines 3 钳为 1 → 单行 measure 口径 → 溢出
      assertEqual(
        tooltipOf(col, { v: '一二三四五六七八九十'.repeat(2) }, { regionHeight: 36 }).overflow,
        true,
        'regionHeight 钳 maxLines=1 后 180 > 144 溢出'
      )

      // regionHeight 80：floor((80 − 16)/18) = 3 不钳 → 折 2 行仍不溢出
      assertEqual(
        tooltipOf(col, { v: '一二三四五六七八九十'.repeat(2) }, { regionHeight: 80 }).overflow,
        false,
        'regionHeight 宽绰（钳后仍 3 行）不改变判定'
      )

      return '折 4 行 clamped / 2 行不溢出 / regionHeight 钳 1 行溢出 / 宽绰区域不钳'
    }
  },
  {
    name: 'resolveCellTooltip：文本数组无 tooltip（A9 占位）+ link/list 条目竖排通道（超 maxItems dots / 单条超宽）',
    fn: () => {
      // A9：文本列数组值 → resolveCellContent 门控落 {} → 无可提示文本源
      assertEqual(
        tooltipOf({ field: 'v', maxItems: 3, title: true }, { v: [1, '二', 3, 4] }),
        null,
        '文本列数组值落占位 → 无 tooltip'
      )

      // list 列走 link/list 竖排口径（resolveTooltipItems link 分支，col.type === 'list'）
      const over = tooltipOf({ field: 'v', type: 'list', maxItems: 3, title: true }, { v: ['a', 'b', 'c', 'd'] })

      assertEqual(over.overflow, true, '4 条目 > maxItems 3 应溢出（绘制为 dots）')
      assertEqual(over.content, 'a；b；c；d', '全文 = 条目 text join \'；\'（不含 dots 行）')
      assertEqual(
        tooltipOf({ field: 'v', type: 'list', maxItems: 3, title: true }, { v: ['一二三四五六七八九十'.repeat(2), '甲'] }).overflow,
        true,
        '任一条目超宽（180 > 144）应溢出'
      )
      assertEqual(
        tooltipOf({ field: 'v', type: 'list', maxItems: 3, title: true }, { v: ['甲', '乙'] }).overflow,
        false,
        '窄条目集不溢出'
      )
      assertEqual(
        tooltipOf({ field: 'links', type: 'link', maxItems: 3, title: true }, { links: ['a', 'b', 'c', 'd'] }).overflow,
        true,
        'link 兼容列同口径（col.type === link 分发保留）'
      )

      return '文本数组无 tooltip；list/link 竖排口径：超 maxItems dots / 单条超宽 / 窄集不溢出'
    }
  },
  {
    name: 'resolveCellTooltip：line-clamp 单条目改道文本路径（drawContentItems 同分支）',
    fn: () => {
      const col = { field: 'memo', multiline: true, lineClamp: 2, title: true }
      const long = '一二三四五六七八九十'.repeat(6)
      const tip = tooltipOf(col, { memo: long })

      assertEqual(tip.content, long, '改道后全文 = 条目 text 原文')
      assertEqual(tip.overflow, true, '折 4 行 > lineClamp 2（_resolveMaxLines 行级求值）→ clamped 溢出')
      assertEqual(tooltipOf(col, { memo: '甲' }).overflow, false, '短文本不溢出')

      return '单条 line-clamp 条目按文本求值：clamped/短文本两态正确'
    }
  },
  {
    name: 'resolveCellTooltip：横排条目 drawItems 口径（check 计 CHECK_SIZE、img 未加载零占位、tag 计 pill）',
    fn: () => {
      // 夹具基线：两条 63px 文本（7 字 ×9）→ Σ126 + 1×8 gap = 134 ≤ 144 不溢出
      const itemsColumn = items => ({
        field: 'v',
        title: true,
        type: { render: () => ({ items: [{ is: 'span', text: '一二三四五六七' }, ...items] }) }
      })
      const TEXT63 = '一二三四五六七'

      // + check（CHECK_SIZE 16）：Σ(63+16+63)=142 + 2×8 gap = 158 > 144 → 溢出翻转，证明 check 计入
      const withCheck = tooltipOf(
        itemsColumn([{ is: 'span', text: '', attrs: { class: 'mu-table__cell-check' } }, { is: 'span', text: TEXT63 }]),
        { v: 1 }
      )

      assertEqual(withCheck.overflow, true, 'check 计 CHECK_SIZE：142 + 16 = 158 > 144 溢出')
      assertEqual(withCheck.content, `${TEXT63}；${TEXT63}`, 'check 条目无文本，全文 = 文本条目 join')

      const withoutCheck = tooltipOf(itemsColumn([{ is: 'span', text: TEXT63 }]), { v: 1 })

      assertEqual(withoutCheck.overflow, false, '去 check 后 126 + 8 = 134 ≤ 144 不溢出')

      // img 未加载：不计宽也不计间隙（可见数不含）——[63, img, 63] 仍 = 126 + 8 = 134 不溢出
      assertEqual(
        tooltipOf(
          itemsColumn([{ is: 'img', attrs: { src: 'data:image/png;base64,AAAA' } }, { is: 'span', text: TEXT63 }]),
          { v: 1 }
        ).overflow,
        false,
        'img 未加载不计宽不计间隙（与判定期不发起加载同口径）'
      )

      // tag pill：文本宽 + 2×TAG_PADDING_X = 79 → 79 + 63 + 8 = 150 > 144 溢出
      assertEqual(
        tooltipOf(itemsColumn([{ is: 'span', text: TEXT63, attrs: { class: 'mu-tag' } }]), { v: 1 }).overflow,
        true,
        'tag pill +16 内边距：150 > 144 溢出'
      )

      return 'check 计 CHECK_SIZE 翻转溢出 / img 未加载零占位 / tag 计 pill 内边距；全文 join 正确'
    }
  },
  {
    name: 'resolveCellTooltip：link 列竖排（超 maxItems dots / 单条超宽 / 全文 join）',
    fn: () => {
      const over = tooltipOf({ field: 'v', type: 'link', maxItems: 3, title: true }, { v: ['甲', '乙', '丙', '丁', '戊'] })

      assertEqual(over.overflow, true, '5 条 > maxItems 3 → dots 溢出')
      assertEqual(over.content, '甲；乙；丙；丁；戊', '全文 = 全部条目（含被 dots 截断的）join')
      assertEqual(
        tooltipOf({ field: 'v', type: 'link', maxItems: 3, title: true }, { v: ['一二三四五六七八九十'.repeat(2), '甲'] }).overflow,
        true,
        '任一条目超宽（180 > 144，逐条独立省略）→ 溢出'
      )
      assertEqual(
        tooltipOf({ field: 'v', type: 'link', title: true }, { v: ['甲', '乙'] }).overflow,
        false,
        '短条目竖排不溢出'
      )

      return '5>3 dots / 单条超宽 / 短条目不溢出；全文 join 正确'
    }
  },
  {
    name: 'resolveCellTooltip：button 组（pill 累加溢出 / 空 caption 哨兵终止 / 末位空 caption 不溢出）',
    fn: () => {
      // 单 pill 20 字 ×9 = 180 + 16 = 196 > 右缘剩余 144 → 截断溢出
      const truncated = tooltipOf(
        { field: 'b', type: 'button', buttons: [{ caption: '一二三四五六七八九十'.repeat(2) }], title: true },
        { b: 1 }
      )

      assertEqual(truncated.overflow, true, '单 pill 全宽超右缘剩余 → 截断溢出')
      assertEqual(truncated.content, '一二三四五六七八九十'.repeat(2), '全文 = 完整 caption')

      assertEqual(
        tooltipOf({ field: 'b', type: 'button', buttons: [{ caption: '一二三四五六七八九' }], title: true }, { b: 1 }).overflow,
        false,
        '单 pill 81 + 16 = 97 ≤ 144 不溢出'
      )

      // 空 caption 中位：其后仍有按钮 → drawButtonPill -1 哨兵终止 → 内容被丢弃 → 溢出
      const emptyMid = tooltipOf(
        { field: 'b', type: 'button', buttons: [{ caption: '甲' }, { caption: '' }, { caption: '乙' }], title: true },
        { b: 1 }
      )

      assertEqual(emptyMid.overflow, true, '空 caption 后仍有按钮 → 终止绘制 → 溢出')
      assertEqual(emptyMid.content, '甲；乙', '全文仍含后续按钮 caption')

      assertEqual(
        tooltipOf({ field: 'b', type: 'button', buttons: [{ caption: '甲' }, { caption: '' }], title: true }, { b: 1 }).overflow,
        false,
        '末位空 caption 不构成溢出（无后续内容被丢弃）'
      )

      return '截断溢出 / 97px 不溢出 / 空 caption 中位溢出末位不溢出；全文 join 正确'
    }
  }
]
