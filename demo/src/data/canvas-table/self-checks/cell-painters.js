/**
 * canvas-table 自检断言 — cell-painters 模块（G2）。
 *
 * 覆盖（02-design.md G2 判据 + 既有取值链回归）：
 * 取值链 text→value→field（含 value 传字符串）、rec_no 的 recordNumber、check disabled
 * （底衬 bgStrong 回退链）、enum/number/currency/date 格式化、自定义类型 render、
 * link/tag/items 落地；canvas 类型分发（progress/button 产 canvasKind，03-review-5
 * 问题 6）；多行文本（maxLines 常量与函数形态 lineClamp 行级求值——评审 6 P6、
 * 数组值 maxItems dots '...'、line-clamp item 改道）；link 列竖排 + 对象数组颜色
 * （mu-link--{color} class → theme.colors 取色，评审 6 P1）+ LinkColumn compile
 * 产物断言（DOM 版回归，评审 6 P1）+ TagColumn compile 产物断言（对象数组
 * color/pill/flat 落 class，DOM 版回归，S1 续做）；tag 17 色、button/disabled、
 * 树形列缩进箭头。
 *
 * 断言全部同步执行（runChecks 不支持异步）；img 加载完成后的重绘联动属 painter
 * 集成行为，此处只断言加载状态、crossOrigin 与未加载前空格（data URI 每次运行
 * 生成不同像素，规避页内重跑时序竞争——G1-b 遗留）。
 */
import {
  prepareColumn,
  resolveCellContent,
  drawCell,
  getImageEntry
} from '../../../../../src/components/canvas-table/cell-painters.js'
import { LinkColumn } from '../../../../../src/components/table/column-types/link.js'
import { TagColumn } from '../../../../../src/components/table/column-types/tag.js'

// 主题夹具：字段名对齐 theme.js readSnapshot（值用固定 rgba 串，与探针无关）；
// colors 固定 17 色形态 = 12 彩色 + 5 语义，gray 不入（A6.1；全量读取断言在 theme 组）
const BASE_COLOR_NAMES = ['red', 'pink', 'grape', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange']
const SEMANTIC_COLOR_NAMES = ['primary', 'secondary', 'success', 'warning', 'danger']

const THEME_COLORS = {}

for (const [index, name] of [...BASE_COLOR_NAMES, ...SEMANTIC_COLOR_NAMES].entries()) {
  THEME_COLORS[name] = {
    color: `rgba(${20 + index * 10}, 60, 200, 1)`,
    translucent: `rgba(${20 + index * 10}, 60, 200, 0.1)`
  }
}

const THEME = {
  textColor: 'rgba(24, 24, 24, 1)',
  textColorMuted: 'rgba(120, 120, 120, 1)',
  borderColor: 'rgba(208, 213, 219, 1)',
  borderColorSoft: 'rgba(232, 236, 241, 1)',
  borderColorStrong: 'rgba(153, 158, 165, 1)',
  hoverBg: 'rgba(0, 0, 0, 0.04)',
  bgStrong: 'rgba(0, 0, 0, 0.08)',
  bgDisabled: 'rgba(0, 0, 0, 0.12)',
  primaryColor: 'rgba(0, 102, 255, 1)',
  gray: 'rgba(153, 153, 153, 1)',
  fontSize: 14,
  fontFamily: 'sans-serif',
  cellPadding: 8,
  cellLineHeight: 18,
  controlHeight: 32,
  colors: THEME_COLORS
}

const CELL_WIDTH = 160
const CELL_HEIGHT = 36
const RECORD_NUMBER = 7

function content (col, record, extra = {}) {
  return resolveCellContent(col, { record, recordNumber: RECORD_NUMBER, ...extra })
}

function drawToCanvas (col, record, { theme = THEME, emit, onImageLoad, width = CELL_WIDTH, height = CELL_HEIGHT, rect, recording, ...extra } = {}) {
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

/** 绘制并返回 fillText/fill 调用记录（文本/x/y 与绘制时 fillStyle，供取色/布局断言） */
function drawRecorded (col, record, options = {}) {
  const canvas = drawToCanvas(col, record, { ...options, recording: true })

  return { canvas, calls: canvas.__paintCalls }
}

/**
 * canvas 2d 上下文代理：记录 fillText（text/x/y + 调用时 fillStyle）与 fill
 * （调用时 fillStyle）。文本取色断言避免像素抗锯齿噪声，直接捕获 fillStyle。
 * set 派发到 target 本体（默认 set 的 receiver 为 proxy，会触发原生 setter 的
 * 品牌检查抛 Illegal invocation）。
 */
function recordingCtx (canvas) {
  const ctx = canvas.getContext('2d')
  const calls = { fillText: [], fill: [] }

  canvas.__paintCalls = calls

  return new Proxy(ctx, {
    get (target, prop) {
      if (prop === 'fillText') {
        return (text, x, y) => {
          calls.fillText.push({ text: String(text), x, y, fillStyle: target.fillStyle })
          return target.fillText(text, x, y)
        }
      }

      if (prop === 'fill') {
        return () => {
          calls.fill.push({ fillStyle: target.fillStyle })
          return target.fill()
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

      return `recordNumber=42 落地为文本 42（offset 语义由调用方传入）`
    }
  },
  {
    name: 'enum：mapping 文本、对象形式与 default 兜底',
    fn: () => {
      const col = prepareColumn({
        field: 's',
        type: 'enum',
        mappings: { a: '甲', b: { text: '乙' }, default: '未知' }
      })

      assert(content(col, { s: 'a' }).text === '甲', 'mapping 简单值应取文本')
      assert(content(col, { s: 'b' }).text === '乙', 'mapping 对象形式应取 text 字段')
      assert(content(col, { s: 'zz' }).text === '未知', '未匹配应落 default 兜底映射')

      return '甲 / 乙 / default 未知'
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
      assert(linkContent.items[0].is === 'a', 'link 条目 is 应为 a')

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
    name: 'multiline/lineClamp：div items 按文本落地不空白（decisions ⑤）',
    fn: () => {
      const col = prepareColumn({ field: 'memo', multiline: true, lineClamp: 2 })
      const record = { memo: '多行内容' }

      const result = content(col, record)

      assert(Array.isArray(result.items) && result.items.length === 1, 'lineClamp>1 应返回 div items')
      assert(result.items[0].is === 'div' && result.items[0].text === '多行内容', 'div 条目应携带文本')

      const canvas = drawToCanvas(col, record)
      const pixels = countPaintedPixels(canvas)

      assert(pixels > 0, `div items 按文本落地应有非空像素，实际 ${pixels}（若 is 未识别被忽略则为 0）`)

      const single = content(prepareColumn({ field: 'memo', multiline: true, lineClamp: 1 }), record)

      assert(single.text === '多行内容' && !single.items, 'lineClamp=1 应走 text 直绘')

      return `div 条目落地为文本（${pixels} 像素）；lineClamp=1 走 text`
    }
  },
  {
    name: '各类型离屏绘制非空像素（text/bool/enum/number/currency/date/rec_no/check/link/tag）',
    fn: () => {
      const cases = [
        ['text', prepareColumn({ field: 'v' }), { v: '文本' }],
        ['bool', prepareColumn({ field: 'v', type: 'bool' }), { v: true }],
        ['enum', prepareColumn({ field: 'v', type: 'enum', mappings: { a: '甲' } }), { v: 'a' }],
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

      return `10 种类型全部非空像素（含 bool/rec_no）`
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
      assert(rects[0].rect.width > 0 && rects[0].rect.height === 36, '条目矩形应含宽高')

      return '编辑/删除两按钮取色与回报正确（kind=button）'
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
      assertArray(calls.fillText.map(c => c.y), [17, 35], '顶部对齐（padding + lineHeight/2 顺次 +18）')

      // maxLines=1（缺省）：即使注入 measure 也走单行省略（现状路径）
      const single = drawRecorded(prepareColumn({ field: 'memo' }), { memo: long }, { measure: fakeMeasure })

      assertEqual(single.calls.fillText.length, 1, '缺省单行省略')
      assertEqual(single.calls.fillText[0].y, 18, '单行垂直居中（现状）')

      // measure 未注入：多行列回退单行省略（不抛错）
      const fallback = drawRecorded(col, { memo: long })

      assertEqual(fallback.calls.fillText.length, 1, '无 measure 回退单行')

      return `2 行 + 末行 '...'；y=${JSON.stringify(calls.fillText.map(c => c.y))}`
    }
  },
  {
    name: '数组值多行：每元素一行、超限第 maxItems 行 \'...\'（dots 字面三点）',
    fn: () => {
      const col = prepareColumn({ field: 'v', maxItems: 3 })
      const { calls } = drawRecorded(col, { v: [1, '二', 3, 4, 5] }, { height: 80 })

      assertArray(calls.fillText.map(c => c.text), ['1', '二', '...'], '前 maxItems−1 项 + dots 行')
      assertArray(calls.fillText.map(c => c.y), [17, 35, 53], '顶部对齐逐行')
      assertEqual(calls.fillText[0].text, '1', '数字元素应 String 化')

      // 缺省 maxItems=10：不超限全量显示
      const full = drawRecorded(prepareColumn({ field: 'v' }), { v: [1, 2, 3] }, { height: 80 })

      assertArray(full.calls.fillText.map(c => c.text), ['1', '2', '3'], '不超限逐元素显示')

      return `['1','二','...']（maxItems=3）；数字 String 化`
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

      // line-clamp item 改道：TextColumn multiline+lineClamp 产单 div item → drawText 多行
      const clampedCol = prepareColumn({ field: 'memo', multiline: true, lineClamp: 2 })
      const raw = content(clampedCol, { memo: long })

      assert(Array.isArray(raw.items) && raw.items.length === 1 && raw.items[0].attrs.class === 'line-clamp', '前置：render 产单 line-clamp item')
      assert(clampedCol._maxLines == null, '前置：常量 _maxLines 未设（证明走闭包）')

      const redirected = drawRecorded(clampedCol, { memo: long }, { measure: fakeMeasure, height: 60 })

      assertEqual(redirected.calls.fillText.length, 2, '单 div item 应改道 drawText 多行（maxLines=2 钳制）')
      assertArray(redirected.calls.fillText.map(c => c.y), [17, 35], '改道后顶部对齐')

      return 'deep 3 行 / shallow 1 行；line-clamp item 改道 2 行'
    }
  },
  {
    name: 'LinkColumn compile 产物：对象数组 caption/color class、字符串数组不变、dots \'...\'、danger/disabled（DOM 版回归，评审 6 P1）',
    fn: () => {
      // 对象数组：对象元素原样保留；linkOption.color 缺省落 class；条目级 color 覆盖
      const withOption = LinkColumn.compile({ linkOption: { color: 'warning' } })
      const out = withOption({ record: {}, value: [{ caption: 'A', color: 'success' }, { caption: 'B' }, 3], emit: () => {} })

      assertEqual(out.items.length, 3, '3 个条目')
      assertEqual(out.items[0].text, 'A', '对象元素 caption 文本（非 [object Object]）')
      assert(out.items[0].attrs.class.includes('mu-link--success'), '条目级 color 落 class')
      assert(!out.items[0].attrs.class.includes('mu-link--warning'), '条目级 color 覆盖 linkOption.color')
      assert(out.items[1].attrs.class.includes('mu-link--warning'), 'linkOption.color 缺省落全部条目 class')
      assertEqual(out.items[2].text, 3, '数字元素仍包 { caption: el } 行为不变（text 保持原始 number）')

      // 字符串数组：包裹行为不变、无 color class（itemClass 现状含 linkOption.class 占位位）
      const plain = LinkColumn.compile({})
      const out2 = plain({ record: {}, value: ['x', 'y'], emit: () => {} })

      assertArray(out2.items.map(i => i.text), ['x', 'y'], '字符串数组文本')
      assertEqual(out2.items[0].attrs.class[0], 'mu-link', '基础 mu-link class 保留')
      assert(!out2.items[0].attrs.class.join(' ').includes('mu-link--'), '无 color 不落色类')

      // max 超限 dots：'...' 字面值 + events.click 绑定（DOM link.js:47/:59-60 字面）
      const dots = LinkColumn.compile({ linkOption: { max: 2 } })
      const dotEvents = []
      const out3 = dots({ record: {}, value: ['a', 'b', 'c', 'd'], emit: (type, payload) => dotEvents.push([type, payload]) })

      assertEqual(out3.items.length, 2, 'max=2 截断')
      assertEqual(out3.items[1].text, '...', '超限条目 \'...\' 三点字面')
      out3.items[1].events.click()
      assertEqual(dotEvents[0][0], 'cell-item-click', 'dots 条目绑定 click')
      assertEqual(dotEvents[0][1].link, '...', 'dots payload 值 = \'...\' 非省略号字符')

      // 常规条目 payload link = 条目原对象（对象数组元素即 { caption, color, ... }）
      const target = { caption: 'P', color: 'blue' }
      let captured = null
      const out4 = LinkColumn.compile({})(
        { record: {}, value: [target], emit: (type, payload) => { captured = payload.link } }
      )

      out4.items[0].events.click()
      assert(captured === target, 'payload link 应为条目原对象（A1 对齐 DOM 版）')

      // danger/disabled 路径不变；缺 caption 对象被 isValidLink 过滤
      const out5 = LinkColumn.compile({})({ record: {}, value: [{ caption: 'D', danger: true }, { caption: 'E', disabled: true }], emit: () => {} })

      assert(out5.items[0].attrs.class.includes('mu-link--danger'), 'danger 落 class')
      assertEqual(out5.items[1].attrs.disabled, '', 'disabled 落 attrs')

      const out6 = LinkColumn.compile({})({ record: {}, value: [{ color: 'red' }, { caption: 'ok' }], emit: () => {} })

      assertEqual(out6.items.length, 1, '缺 caption 对象被 isValidLink 过滤')
      assertEqual(out6.items[0].text, 'ok', '有效条目保留')

      return '对象 caption/class、字符串不变、dots click、payload 原对象、danger/disabled/过滤全通过'
    }
  },
  {
    name: 'TagColumn compile 产物：对象数组 caption/color/pill/flat 落 class、字符串数组不变、dots \'...\'、payload 原对象（DOM 版回归，S1 续做）',
    fn: () => {
      // 对象数组：对象元素原样保留；tagOption.color 缺省落 class；条目级 color 覆盖
      const withOption = TagColumn.compile({ tagOption: { color: 'warning' } })
      const out = withOption({ record: {}, value: [{ caption: 'A', color: 'success' }, { caption: 'B' }, 3], emit: () => {} })

      assertEqual(out.items.length, 3, '3 个条目')
      assertEqual(out.items[0].text, 'A', '对象元素 caption 文本（非 [object Object]）')
      assert(out.items[0].attrs.class.includes('mu-tag--success'), '条目级 color 落 class')
      assert(!out.items[0].attrs.class.includes('mu-tag--warning'), '条目级 color 覆盖 tagOption.color')
      assert(out.items[1].attrs.class.includes('mu-tag--warning'), 'tagOption.color 缺省落全部条目 class')
      assertEqual(out.items[2].text, 3, '数字元素仍包 { caption: el } 行为不变（text 保持原始 number）')

      // pill/flat：条目级生效（pill:false 覆盖缺省）与 tagOption 缺省落 class
      const pillFlat = TagColumn.compile({ tagOption: { pill: true } })
      const outPf = pillFlat({ record: {}, value: [{ caption: 'P', pill: false }, { caption: 'F', pill: true, flat: true }, { caption: 'N' }], emit: () => {} })

      assert(!outPf.items[0].attrs.class.includes('mu-tag--pill'), '条目级 pill:false 覆盖 tagOption.pill')
      assert(outPf.items[1].attrs.class.includes('mu-tag--pill') && outPf.items[1].attrs.class.includes('mu-tag--flat'), '条目级 pill/flat 落 class')
      assert(outPf.items[2].attrs.class.includes('mu-tag--pill'), 'tagOption.pill 缺省落全部条目 class')

      // 字符串数组：包裹行为不变、无 color class（itemClass 现状含 tagOption.class 占位位）
      const plain = TagColumn.compile({})
      const out2 = plain({ record: {}, value: ['x', 'y'], emit: () => {} })

      assertArray(out2.items.map(i => i.text), ['x', 'y'], '字符串数组文本')
      assertEqual(out2.items[0].attrs.class[0], 'mu-tag', '基础 mu-tag class 保留')
      assert(!out2.items[0].attrs.class.join(' ').includes('mu-tag--'), '无 color 不落色类')

      // max 超限 dots：'...' 字面值 + events.click 绑定（DOM tag.js:45/:59-60 字面）
      const dots = TagColumn.compile({ tagOption: { max: 2 } })
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
      const out4 = TagColumn.compile({})(
        { record: {}, value: [target], emit: (type, payload) => { captured = payload.tag } }
      )

      out4.items[0].events.click()
      assert(captured === target, 'payload tag 应为条目原对象（与 LinkColumn 对齐）')

      // 缺 caption 对象被 isValidTag 过滤
      const out5 = TagColumn.compile({})({ record: {}, value: [{ color: 'red' }, { caption: 'ok' }], emit: () => {} })

      assertEqual(out5.items.length, 1, '缺 caption 对象被 isValidTag 过滤')
      assertEqual(out5.items[0].text, 'ok', '有效条目保留')

      return '对象 caption/color/pill/flat、字符串不变、dots click、payload 原对象、过滤全通过'
    }
  },
  {
    name: 'link 列竖排：数组每条一行、对象颜色三态取色、超限 dots \'...\'、条目矩形回报',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'link', maxItems: 4 })
      const record = { v: [{ caption: 'A', color: 'success' }, { caption: 'B', disabled: true }, { caption: 'C', danger: true }, 'D', 'E'] }
      const rects = []
      const { calls } = drawRecorded(col, record, { height: 88, onItemRect: r => rects.push(r) })

      assertArray(calls.fillText.map(c => c.text), ['A', 'B', 'C', '...'], '3 条 + dots（maxItems=4，第 4 条 \'...\'）')
      assertArray(calls.fillText.map(c => c.y), [17, 35, 53, 71], '竖排每条一行（+18）')
      assertArray(calls.fillText.map(c => c.x), [8, 8, 8, 8], '左缘对齐内容区')
      assertEqual(calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.success.color), 'mu-link--success class → colors 查表')
      assertEqual(calls.fillText[1].fillStyle, cssColorOf(THEME.textColorMuted), 'disabled（存在性判定）→ textColorMuted')
      assertEqual(calls.fillText[2].fillStyle, cssColorOf(THEME_COLORS.danger.color), 'mu-link--danger → colors.danger')
      assertEqual(calls.fillText[3].fillStyle, cssColorOf(THEME.primaryColor), 'dots 条目回退主色（mu-link 缺省）')
      assertArray(rects.map(r => `${r.kind}:${r.index}`), ['link:0', 'link:1', 'link:2', 'link:3'], '条目矩形（含 dots）回报')

      // 字符串数组竖排 + 数字单值 String 化
      const strings = drawRecorded(col, { v: ['甲', '乙'] }, { height: 60 })

      assertArray(strings.calls.fillText.map(c => c.text), ['甲', '乙'], '字符串数组竖排')

      const single = drawRecorded(col, { v: 9 })

      assertArray(single.calls.fillText.map(c => c.text), ['9'], '单值数字 String 化')

      return '竖排 y=17/35/53/71；success/muted/danger/primary 四态取色正确'
    }
  },
  {
    name: 'tag 颜色：mu-tag--{color} class → colors 查表（底 translucent + 文字色），条目矩形回报',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'tag', tags: r => r.list })
      const rects = []
      const { calls } = drawRecorded(col, { list: [{ caption: '紧急', color: 'success' }, { caption: '普通' }] }, { onItemRect: r => rects.push(r) })

      assertArray(calls.fillText.map(c => c.text), ['紧急', '普通'], '两条 tag')
      assertEqual(calls.fillText[0].fillStyle, cssColorOf(THEME_COLORS.success.color), '彩色 tag 文字色')
      assertEqual(calls.fillText[1].fillStyle, cssColorOf(THEME.textColor), '无色类 tag 回退现状文字色')
      assertEqual(calls.fill[0].fillStyle, cssColorOf(THEME_COLORS.success.translucent), '彩色 tag 底 translucent')
      assertEqual(calls.fill[1].fillStyle, cssColorOf(THEME.hoverBg), '无色类 tag 回退现状灰底')
      assertArray(rects.map(r => `${r.kind}:${r.index}`), ['tag:0', 'tag:1'], 'tag 条目矩形回报（可点击命中）')

      return 'success 色查表 + gray 回退；kind=tag 回报'
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
  }
]
