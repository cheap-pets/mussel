/**
 * table-ex 自检断言 — painter 模块（G2）。
 *
 * 覆盖（02-design.md G2 判据 + 20261027 问题 1/3/5/6/9 + 既有绘制回归）：在位
 * canvas（挂入文档的真实 canvas）渲染出完整表格（文字/网格线/表头/固定列/覆盖层）；
 * lastPaint 统计字段有值且 rowCount 与窗口一致；变高行坐标（fake rowGeometry：
 * viewportRowY/cellRectAt 高度、行带高度、单格脏区裁剪高 heightAt 化——03-review-5
 * 问题 9）；itemHits (row,col) 粒度收集（双 pass 不互覆 + dots '...' 条目 + 窗口裁剪，
 * A3.3）；hover 可编辑格 1px 不透明主色描边贴格线内侧（顶/右按格线占位内缩、
 * 不与格线重叠，与编辑浮层盒 editorRectOf 同源同位）；行背景带宽度（R1/人工 3 意见 1：ΣcolWidths <
 * 视口宽时充满至视口右缘）；树箭头 hover 主色与常态箭头同槽位 centerY（问题 1）；
 * veil 编辑格跳绘 + itemHits 显式清空（问题 6）；rightInset 注入门控与 painter 路径
 * 槽位锚（问题 1/9，stub ctx 记录 fillText）；编辑按钮加载中不半绘制、hoverMode none
 * 整体抑制（问题 5，加载像素与点击回调归浏览器）；blankTail 末列右缘线（问题 9）；
 * 另覆盖：选中/斑马纹底色、虚拟滚动窗口一致性、脏区调度（行横带/单格/表头/调宽
 * 竖带）、createPainter 契约。
 *
 * 断言全部同步执行（runChecks 不支持异步）；img onload → invalidateCell 重绘联动为
 * rAF 异步路径，此处只断言窗口校验的同步返回值，端到端联动留 S1 验证。
 * 主题夹具字段名对齐 theme.js readSnapshot（值用固定 rgba 串）；行高经 layout.js
 * relayout 入参与 THEME.rowHeight 双通道传入（20261028 起垂直锚消费快照 rowHeight）。
 */
import { drawRegion, cellRectAt, createPainter } from '@/components/table-ex/painter.js'
import { editorButtonRectOf } from '@/components/table-ex/editor.js'
import { relayout } from '@/components/table-ex/layout.js'
import { prepareColumn, requestIconImage } from '@/components/table-ex/cell-painters.js'
import { createVariableRowGeometry, createUniformRowGeometry } from '@/components/table-ex/row-geometry.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)

  return String(actual)
}

// —— 夹具：600×252 画布、6 列（固定 1 列 + 5 列滚动区，末列未定宽 flex）+ 50 行 ——

const W = 600
const H = 252
const ROW_HEIGHT = 36
const HEAD_HEIGHT = 36
const FIXED_COLS = 1

const THEME = {
  textColor: 'rgba(24, 24, 24, 1)',
  borderColor: 'rgba(208, 213, 219, 1)',
  borderColorSoft: 'rgba(232, 236, 241, 1)',
  borderColorStrong: 'rgba(153, 158, 165, 1)',
  bgNormal: 'rgba(255, 255, 255, 1)',
  bgFill: 'rgba(246, 247, 248, 1)',
  bgStripe: 'rgba(250, 250, 250, 1)',
  selectBg: 'rgba(0, 102, 255, 0.08)',
  hoverBg: 'rgba(0, 0, 0, 0.04)',
  primaryColor: 'rgba(0, 102, 255, 1)',
  gray: 'rgba(153, 153, 153, 1)',
  fontSize: 14,
  fontFamily: 'sans-serif',
  rowHeight: 36,
  cellPadding: 8
}

const RAW_COLUMNS = [
  { field: 'id', type: 'rec_no', width: 60 }, // 固定列
  { field: 'name', caption: '名称', width: 140 },
  { field: 'status', caption: '状态', type: 'text', mappings: { a: '启用', b: '停用' }, width: 100, sortable: true },
  { field: 'amount', caption: '金额', type: 'currency', width: 120 },
  { field: 'ok', type: 'check', headerCheckbox: true, width: 50 },
  { field: 'memo', caption: '备注' } // 未定宽 → 均摊 130
]

const COLUMNS = RAW_COLUMNS.map(col => prepareColumn(col, { placeholder: '--' }))

// 列几何（relayout 求解结果，采样坐标依据）：备注列未定宽 → text 类型弹性基线
// 160（定宽列已占 470，容器 600 无余量可摊）：
// colWidths [60, 140, 100, 120, 50, 160]，colLefts [0, 60, 200, 300, 420, 470]，
// fixedWidth 60，Σ=630 > stickyWidth 600 → blankTail false（末列右缘无线）

function makeRecords (count = 50) {
  return Array.from({ length: count }, (_, i) => ({
    name: `货品 ${i}`,
    status: i % 2 ? 'b' : 'a',
    amount: i * 10 + 0.5,
    ok: i % 3 === 0,
    memo: ''
  }))
}

function makeState ({
  records = makeRecords(),
  scrollTop = 0,
  scrollLeft = 0,
  widthOverrides,
  columns = COLUMNS,
  ...rest
} = {}) {
  return {
    dpr: 1,
    layout: relayout({
      columns,
      rowCount: records.length,
      containerWidth: W,
      containerHeight: H,
      fixedLeftColumns: FIXED_COLS,
      rowHeight: ROW_HEIGHT,
      headHeight: HEAD_HEIGHT,
      scrollTop,
      scrollLeft,
      widthOverrides,
      // C4 起 rowGeometry 必传：默认等高夹具（变高用例经 ...rest 覆盖 layout）
      rowGeometry: createUniformRowGeometry({ rowHeight: ROW_HEIGHT, rowCount: records.length })
    }),
    theme: THEME,
    records,
    columns,
    recordsOffset: 0,
    emit: null,
    keyField: '',
    selectedKey: null,
    headerChecked: null,
    gridlines: 'all',
    hoverMode: 'row',
    striped: true,
    orderBy: '',
    hover: null,
    resizeGuideX: null,
    ...rest
  }
}

/** 在位 canvas：挂入文档的真实元素（屏外定位不参与页面视觉），断言后移除 */
function withCanvas (fn) {
  const host = document.createElement('div')

  host.style.cssText = 'position:absolute;left:-9999px;top:0;'

  const canvas = document.createElement('canvas')

  canvas.width = W
  canvas.height = H
  host.appendChild(canvas)
  document.body.appendChild(host)

  try {
    return fn(canvas)
  } finally {
    host.remove()
  }
}

// —— 像素断言工具 ——

const PROBE = document.createElement('canvas')

PROBE.width = 1
PROBE.height = 1

/** css 颜色 → 画布像素值（透明底直接填充，与整幅绘制的半透明叠加同口径） */
function colorPixel (cssColor) {
  const ctx = PROBE.getContext('2d')

  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = cssColor
  ctx.fillRect(0, 0, 1, 1)

  return Array.from(ctx.getImageData(0, 0, 1, 1).data)
}

/** css 颜色叠加在另一颜色上的混合结果（覆盖层 hoverBg 类半透明色的期望值） */
function blendColor (top, bottom) {
  const ctx = PROBE.getContext('2d')

  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = bottom
  ctx.fillRect(0, 0, 1, 1)
  ctx.fillStyle = top
  ctx.fillRect(0, 0, 1, 1)

  return Array.from(ctx.getImageData(0, 0, 1, 1).data)
}

function pixelAt (canvas, x, y) {
  return Array.from(canvas.getContext('2d').getImageData(x, y, 1, 1).data)
}

function assertPixel (canvas, x, y, expected, label, tolerance = 0) {
  const value = typeof expected === 'string' ? colorPixel(expected) : expected
  const actual = pixelAt(canvas, x, y)
  const ok = actual.every((v, i) => Math.abs(v - value[i]) <= tolerance)

  if (!ok) {
    throw new Error(`${label} (${x},${y}) 期望 ${JSON.stringify(value)}，实际 rgba(${actual.join(',')})`)
  }
}

function assertPixelNot (canvas, x, y, cssColor, label) {
  const value = colorPixel(cssColor)
  const actual = pixelAt(canvas, x, y)

  if (actual.every((v, i) => v === value[i])) {
    throw new Error(`${label} (${x},${y}) 不应为 ${cssColor}`)
  }
}

function regionData (canvas, x, y, w, h) {
  return canvas.getContext('2d').getImageData(x, y, w, h).data
}

function assertRegionDiffer (a, b, x, y, w, h, label) {
  const da = regionData(a, x, y, w, h)
  const db = regionData(b, x, y, w, h)

  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) return
  }

  throw new Error(`${label} 区域 (${x},${y} ${w}×${h}) 像素应有差异`)
}

function assertRegionSame (a, b, x, y, w, h, label) {
  const da = regionData(a, x, y, w, h)
  const db = regionData(b, x, y, w, h)

  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) {
      throw new Error(`${label} 区域 (${x},${y} ${w}×${h}) 像素应一致（偏移 ${i >> 2}）`)
    }
  }
}

/** 暗像素包围盒（lum < 150）：R2/R4 文字与方框位置断言用 */
function darkBoundsOf (canvas, x0, x1, y0, y1) {
  const data = regionData(canvas, x0, y0, x1 - x0, y1 - y0)
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let count = 0

  for (let y = 0; y < y1 - y0; y++) {
    for (let x = 0; x < x1 - x0; x++) {
      const i = (y * (x1 - x0) + x) * 4
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

      if (data[i + 3] > 40 && lum < 150) {
        count++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (!count) return null

  return {
    minX: x0 + minX,
    maxX: x0 + maxX + 1,
    minY: y0 + minY,
    maxY: y0 + maxY + 1,
    centerX: x0 + (minX + maxX + 1) / 2,
    centerY: y0 + (minY + maxY + 1) / 2
  }
}

/** 深色文字像素存在性（textColor rgba(24,24,24)，底色均 ≥ 232） */
function assertHasDarkPixels (canvas, x, y, w, h, label) {
  const data = regionData(canvas, x, y, w, h)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128) return
  }

  throw new Error(`${label} 区域 (${x},${y} ${w}×${h}) 应有文字像素`)
}

function assertLastPaint (actual, expected, label) {
  assert(actual != null, `${label}：lastPaint 应有值`)
  assertEqual(actual.rowStart, expected.rowStart, `${label}.rowStart`)
  assertEqual(actual.rowEnd, expected.rowEnd, `${label}.rowEnd`)
  assertEqual(actual.rowCount, expected.rowCount, `${label}.rowCount`)
  assertEqual(actual.colStart, expected.colStart, `${label}.colStart`)
  assertEqual(actual.colEnd, expected.colEnd, `${label}.colEnd`)
  assert(typeof actual.elapsed === 'number' && actual.elapsed >= 0, `${label}.elapsed 应为非负数`)
}

/** 单像素是否落在目标色的逐通道容差内（colorBoundsOf 谓词，alpha > 40 计入） */
function isPixelNear (data, i, target, tolerance) {
  return data[i + 3] > 40 &&
    Math.abs(data[i] - target[0]) <= tolerance &&
    Math.abs(data[i + 1] - target[1]) <= tolerance &&
    Math.abs(data[i + 2] - target[2]) <= tolerance
}

/** 指定颜色邻近像素包围盒（树箭头主色 accent 三角判定用；tolerance 逐通道容差） */
function colorBoundsOf (canvas, x0, x1, y0, y1, cssColor, tolerance = 60) {
  const target = colorPixel(cssColor)
  const data = regionData(canvas, x0, y0, x1 - x0, y1 - y0)
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let count = 0

  for (let y = 0; y < y1 - y0; y++) {
    for (let x = 0; x < x1 - x0; x++) {
      const i = (y * (x1 - x0) + x) * 4

      if (isPixelNear(data, i, target, tolerance)) {
        count++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (!count) return null

  return {
    centerX: x0 + (minX + maxX + 1) / 2,
    centerY: y0 + (minY + maxY + 1) / 2
  }
}

/** 记录 fillText 调用的 ctx 桩（rightInset 注入 / painter 路径槽位锚精确断言；
    paintFull 全管线的其余 ctx 方法 no-op、measureText 按字符数估宽） */
function makeRecordingCtx (fillTexts) {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalCompositeOperation: 'source-over',
    setTransform () {},
    clearRect () {},
    save () {},
    restore () {},
    beginPath () {},
    rect () {},
    clip () {},
    closePath () {},
    moveTo () {},
    lineTo () {},
    fill () {},
    stroke () {},
    roundRect () {},
    fillRect () {},
    strokeRect () {},
    drawImage () {},
    measureText (text) {
      return { width: String(text).length * 8 + 2 }
    },
    fillText (text, x, y) {
      fillTexts.push({ text: String(text), x, y })
    }
  }
}

export const checks = [
  {
    name: '整幅绘制：在位 canvas 渲染完整表格（文字/网格线/表头/固定列）+ lastPaint 与窗口一致',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const state = makeState()
      const layout = state.layout
      const lastPaint = painter.draw(state)

      // 表头：底色 bgFill、底边框 soft、caption 文字
      assertPixel(canvas, 300, 10, THEME.bgFill, '表头底色')
      assertPixel(canvas, 300, 35, THEME.borderColorSoft, '表头底边框')
      assertHasDarkPixels(canvas, 64, 6, 120, 24, '表头 caption')

      // 表体文字（行 0 名称格）与行底色
      assertHasDarkPixels(canvas, 64, 42, 120, 24, '行 0 单元格文字')
      assertPixel(canvas, 300, 50, THEME.bgNormal, '行 0 底色')

      // 网格线：行线（行 0/1 边界 y=72）与列线（名称列右缘 x=199）；末列右缘无线
      assertPixel(canvas, 300, 72, THEME.borderColorSoft, '行网格线')
      assertPixel(canvas, 199, 100, THEME.borderColorSoft, '列网格线')
      assertPixelNot(canvas, 599, 100, THEME.borderColorSoft, '末列右缘应无边框')

      // lastPaint：字段齐全且与 layout 窗口一致（rowCount=8 « 50，仅可视窗口）
      assertLastPaint(lastPaint, {
        rowStart: layout.viewRows.start,
        rowEnd: layout.viewRows.end,
        rowCount: layout.viewRows.count,
        colStart: layout.viewCols.start,
        colEnd: layout.viewCols.end
      }, '整幅 lastPaint')
      assertEqual(layout.viewRows.count, 8, '窗口行数')
      assert(lastPaint.rowCount < state.records.length, 'rowCount 应远小于总行数')

      // drawRegion 整幅语义与 draw 一致
      const regionPaint = drawRegion(canvas.getContext('2d'), makeState(), null)
      assertEqual(regionPaint.rowCount, 8, 'drawRegion(null) 整幅口径')

      painter.dispose()

      return `header/body/grid 像素齐备，lastPaint rows=${lastPaint.rowStart}+${lastPaint.rowCount} cols=${lastPaint.colStart}+${lastPaint.colEnd - lastPaint.colStart}`
    })
  },
  {
    name: '行底色优先级：选中（--mu-primary-faint）> 斑马偶行 > 普通',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })

      // 无 keyField → getRecordKey 缺省按行号；selectedKey=2 选中行 2
      painter.draw(makeState({ selectedKey: 2 }))

      assertPixel(canvas, 300, 126, THEME.selectBg, '行 2 选中底色（半透明，透明画布上原色）')
      assertPixel(canvas, 300, 90, THEME.bgStripe, '行 1 斑马底色')
      assertPixel(canvas, 300, 50, THEME.bgNormal, '行 0 普通底色')

      // 固定列同规则（rec_no 列区域；分区 3 整高不透明底再叠选中色，混合值口径；
      // 采样点避开居中序号文字字形）
      assertPixel(canvas, 50, 126, blendColor(THEME.selectBg, THEME.bgNormal), '固定列同步选中底色')

      painter.dispose()

      return '选中/斑马/普通三态与固定列取值正确'
    })
  },
  {
    name: '虚拟滚动：跨行/整行对齐 scrollTop 下 lastPaint 与窗口一致且远小于全量',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })

      // 跨行滚动（scrollTop=18 落在行 0 中部）：可视行含跨行行，count = ceil(viewH/rowH)+OVERSCAN+1
      const straddle = makeState({ scrollTop: 18 })
      const straddlePaint = painter.draw(straddle)

      assertLastPaint(straddlePaint, {
        rowStart: straddle.layout.viewRows.start,
        rowEnd: straddle.layout.viewRows.end,
        rowCount: straddle.layout.viewRows.count,
        colStart: straddle.layout.viewCols.start,
        colEnd: straddle.layout.viewCols.end
      }, '跨行 lastPaint')
      assertEqual(straddlePaint.rowCount, 9, '跨行窗口行数')
      assert(
        straddlePaint.rowCount <= Math.ceil(216 / ROW_HEIGHT) + 2 + 1,
        'rowCount 超 lastPaint 断言口径上界 ceil(viewH/rowH)+OVERSCAN+1'
      )

      // 整行对齐滚动（scrollTop=360 → 行 10 起）
      const aligned = makeState({ scrollTop: 360 })
      const alignedPaint = painter.draw(aligned)

      assertEqual(alignedPaint.rowStart, 10, '对齐滚动 rowStart')
      assertEqual(alignedPaint.rowCount, 8, '对齐滚动 rowCount')
      assert(alignedPaint.rowCount < aligned.records.length, '仅绘制可视区行（50 行数据画 8 行）')

      painter.dispose()

      return 'scrollTop=18 → 9 行 / scrollTop=360 → 行 10 起 8 行，均与 viewRows 一致'
    })
  },
  {
    name: '固定列：scrollLeft>0 内容不随滚动、强化分界线、滚动区偏移、colStart ≥ 固定列数',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const base = makeState()
      const scrolled = makeState({ scrollLeft: 150 })

      const baseCanvas = document.createElement('canvas')
      baseCanvas.width = W
      baseCanvas.height = H
      const basePainter = createPainter({ canvas: baseCanvas })

      basePainter.draw(base)
      const lastPaint = painter.draw(scrolled)

      // 固定列区域（rec_no 列，x ∈ [0,58)）内容与未滚动时逐像素一致（不随滚动位移）
      assertRegionSame(baseCanvas, canvas, 0, HEAD_HEIGHT, 58, H - HEAD_HEIGHT, '固定列区域')

      // 滚动区内容偏移：同区域与未滚动时不同
      assertRegionDiffer(baseCanvas, canvas, 200, HEAD_HEIGHT, 300, 100, '滚动区')

      // 分界线强化色（对齐 .mu-table--x-scrolled .last-fixed-col）
      assertPixel(canvas, 59, 100, THEME.borderColorStrong, '固定列分界线')

      // colStart ≥ fixedCount（滚动区窗口不含固定列）
      assertEqual(lastPaint.colStart, 2, 'scrollLeft=150 colStart')
      assert(lastPaint.colStart >= FIXED_COLS, 'colStart 应 ≥ 固定列数')

      basePainter.dispose()
      painter.dispose()

      return `固定区逐像素一致、分界强化线、colStart=${lastPaint.colStart}`
    })
  },
  {
    name: '覆盖层：hover 行/列高亮（row/column 模式）与调宽拖拽参考线',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const ctx = canvas.getContext('2d')

      // 行 hover：行 1 横带混合 hoverBg，行 0 不变
      painter.draw(makeState({ hover: { row: 1, col: 2 } }))
      assertPixel(canvas, 300, 90, blendColor(THEME.hoverBg, THEME.bgStripe), '行 hover 高亮')

      const base = makeState()
      const baseCanvas = document.createElement('canvas')
      baseCanvas.width = W
      baseCanvas.height = H
      createPainter({ canvas: baseCanvas }).draw(base)
      assertRegionSame(baseCanvas, canvas, 0, HEAD_HEIGHT, W, ROW_HEIGHT, '非 hover 行')

      // 列 hover：金额列竖带（未被 hover 的状态列无行带）、行带消失
      drawRegion(ctx, makeState({ hover: { row: 1, col: 3 }, hoverMode: 'column' }), null)
      assertPixel(canvas, 350, 150, blendColor(THEME.hoverBg, THEME.bgStripe), '列 hover 高亮')
      assertPixel(canvas, 250, 90, THEME.bgStripe, 'column 模式无行带')

      // hoverMode none：无高亮
      drawRegion(ctx, makeState({ hover: { row: 1, col: 2 }, hoverMode: 'none' }), null)
      assertPixel(canvas, 300, 90, THEME.bgStripe, 'hoverMode=none 无高亮')

      // 调宽参考线：1px 主色全高
      drawRegion(ctx, makeState({ resizeGuideX: 250 }), null)
      assertPixel(canvas, 250, 100, THEME.primaryColor, '调宽参考线')

      painter.dispose()

      return '行/列高亮混色、模式开关、参考线像素正确'
    })
  },
  {
    name: '表头细节：排序图标 asc/desc 主色三角、check 表头 ✓ 受控绘制',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const ctx = canvas.getContext('2d')
      // 状态列（可排序）x=200 w=100 → 图标 ix=274、iy=9；上三角质心 (283,15)、下三角 (283,21)
      const IX = 200 + 100 - 8 - 18
      const IY = (HEAD_HEIGHT - 18) / 2

      painter.draw(makeState({ orderBy: 'status:asc' }))
      assertPixel(canvas, IX + 9, IY + 6, THEME.primaryColor, 'asc 上三角主色')
      assertPixel(canvas, IX + 9, IY + 12, THEME.gray, 'asc 下三角灰')

      drawRegion(ctx, makeState({ orderBy: 'status:desc' }), null)
      assertPixel(canvas, IX + 9, IY + 6, THEME.gray, 'desc 上三角灰')
      assertPixel(canvas, IX + 9, IY + 12, THEME.primaryColor, 'desc 下三角主色')

      // check 表头 ✓：headerChecked 受控（table.vue:22 同款条件），勾选后表头区域像素变化
      const unchecked = drawRegion(ctx, makeState(), null)
      const uncheckedCanvas = document.createElement('canvas')

      uncheckedCanvas.width = W
      uncheckedCanvas.height = H
      uncheckedCanvas.getContext('2d').drawImage(canvas, 0, 0)

      drawRegion(ctx, makeState({ headerChecked: { ok: true } }), null)
      assertRegionDiffer(uncheckedCanvas, canvas, 420, 0, 50, HEAD_HEIGHT, 'check 表头 ✓')
      assertHasDarkPixels(canvas, 426, 8, 24, 22, 'check 表头 ✓ 字形')

      assert(typeof unchecked.elapsed === 'number', 'drawRegion 返回统计')

      painter.dispose()

      return 'asc/desc 三角方向主色正确、headerChecked 驱动表头 ✓'
    })
  },
  {
    name: '脏区·行横带：选中行变化只重绘目标行（旧行不变、新行更新）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const base = makeState()
      const baseCanvas = document.createElement('canvas')

      baseCanvas.width = W
      baseCanvas.height = H

      painter.draw(base)
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0)

      // 选中行 3（A3 重绘表：旧行+新行两条横带；此处验证单条行带的精确性）
      const accepted = painter.invalidate(
        { rows: [3, 4] },
        { immediate: true, state: makeState({ selectedKey: 3 }) }
      )

      assert(accepted, '行横带应受理')
      assertRegionDiffer(baseCanvas, canvas, 0, 36 + 3 * ROW_HEIGHT, W, ROW_HEIGHT, '行 3 横带')
      assertRegionSame(baseCanvas, canvas, 0, 36 + 5 * ROW_HEIGHT, W, ROW_HEIGHT, '行 5 不受影响')

      painter.dispose()

      return 'invalidate({rows}) 目标行重绘、带外像素保持'
    })
  },
  {
    name: '脏区·单格：invalidateCell 目标格重绘、邻格不变 + 窗口校验拒绝',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const base = makeState()
      const baseCanvas = document.createElement('canvas')

      baseCanvas.width = W
      baseCanvas.height = H

      painter.draw(base)
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0)

      // 行 2 数据就地修改 → 单格重绘（编辑提交/check 点击路径）
      const records = makeRecords()

      records[2].name = '已修改'

      const cellRect = cellRectAt(makeState({ records }).layout, 2, 1)

      assertEqual(`${cellRect.x},${cellRect.y},${cellRect.width},${cellRect.height}`, '60,108,140,36', 'cellRect')

      assert(painter.invalidateCell(2, 1, { immediate: true, state: makeState({ records }) }), '单格应受理')
      assertRegionDiffer(baseCanvas, canvas, 60, 108, 140, 36, '行 2 名称格')
      assertRegionSame(baseCanvas, canvas, 300, 108, 120, 36, '行 2 金额格（邻格不变）')

      // 窗口校验：行/列不在可视空间时拒绝（img onload 联动的防滚出重绘判据）
      assertEqual(painter.invalidateCell(48, 0), false, '窗口外行')
      assertEqual(painter.invalidateCell(2, 99), false, '列空间外')
      assertEqual(painter.invalidateCell(2, 1), true, '窗口内单格')

      painter.dispose()

      return '单格重绘精确 + 行/列窗口校验正确'
    })
  },
  {
    name: '脏区·表头整幅：headerChecked 变化只动表头区（body 像素保持）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const baseCanvas = document.createElement('canvas')

      baseCanvas.width = W
      baseCanvas.height = H

      painter.draw(makeState())
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0)

      assert(
        painter.invalidate({ header: true }, { immediate: true, state: makeState({ headerChecked: { ok: true } }) }),
        '表头区域应受理'
      )
      assertRegionDiffer(baseCanvas, canvas, 420, 0, 50, HEAD_HEIGHT, '表头区')
      assertRegionSame(baseCanvas, canvas, 0, HEAD_HEIGHT, W, H - HEAD_HEIGHT, '表体区')

      painter.dispose()

      return 'invalidate({header}) 表头重绘、表体像素逐像素保持'
    })
  },
  {
    name: '脏区·调宽竖带：colFrom 右侧与表头更新、固定区与列左缘以左不变',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const baseCanvas = document.createElement('canvas')

      baseCanvas.width = W
      baseCanvas.height = H

      painter.draw(makeState())
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0)

      // 拖窄名称列 140 → 80（widthOverrides 按列 key，其余列重跑求解：备注列 130 → 190）
      const resized = makeState({ widthOverrides: { 1: 80 } })
      const stats = drawRegion(
        canvas.getContext('2d'),
        resized,
        { colFrom: 1 }
      )

      assertEqual(stats.colStart, 1, '调宽竖带 colStart')
      assertRegionDiffer(baseCanvas, canvas, 200, 0, 300, H, '列左缘以右（含表头）')
      assertRegionSame(baseCanvas, canvas, 0, 0, 60, H, '固定列区域')

      return `colFrom=1 竖带+表头重绘，拖窄后备注列 ${resized.layout.colWidths[5]}px`
    })
  },
  {
    name: 'createPainter 契约：未绘制拒绝失效、dispose 清理、lastPaint 字段齐全',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })

      // 未 draw（无基线 state）：一切失效拒绝
      assertEqual(painter.invalidate({ header: true }), false, '未绘制前 invalidate')
      assertEqual(painter.invalidateCell(0, 0), false, '未绘制前 invalidateCell')
      assertEqual(painter.lastPaint, null, '未绘制前 lastPaint')

      const lastPaint = painter.draw(makeState())

      // 窗口外/未知 region 拒绝；窗口内受理（入队 rAF，不立即绘制）
      assertEqual(painter.invalidateCell(200, 0), false, '窗口外行拒绝')
      assertEqual(painter.invalidate({ rows: [3, 4] }), true, '窗口内受理')
      assertEqual(painter.invalidate({ nonsense: 1 }), false, '未知 region 拒绝')

      // draw 重置挂起队列（整幅已覆盖一切脏区）；dispose 清理不抛错
      painter.draw(makeState())
      painter.dispose()
      assertEqual(painter.lastPaint, null, 'dispose 后 lastPaint 清空')

      assert(lastPaint != null, 'draw 应返回统计')
      assertEqual(
        ['rowStart', 'rowEnd', 'rowCount', 'colStart', 'colEnd', 'elapsed'].filter(k => k in lastPaint).length,
        6,
        'lastPaint 字段'
      )

      return '失效受理/拒绝、dispose、lastPaint 六字段齐备'
    })
  },
  {
    name: '变高行：fake rowGeometry 下 cellRectAt 高度、行界网格线、单格脏区裁剪高 heightAt 化',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      // 行 1 变高 72px，其余 36px
      const heights = Array.from({ length: 50 }, (_, i) => (i === 1 ? 72 : 36))
      const geometry = createVariableRowGeometry({ initialHeights: heights })
      const records = makeRecords()
      const layout = relayout({
        columns: COLUMNS,
        rowCount: records.length,
        containerWidth: W,
        containerHeight: H,
        fixedLeftColumns: FIXED_COLS,
        rowHeight: ROW_HEIGHT,
        headHeight: HEAD_HEIGHT,
        scrollTop: 0,
        rowGeometry: geometry
      })
      const state = { ...makeState({ records }), layout }
      const lastPaint = painter.draw(state)

      // cellRectAt 高度 = heightAt(row)；y = headHeight + topAt(row) − scrollTop
      const tall = cellRectAt(layout, 1, 1)

      assertEqual(`${tall.x},${tall.y},${tall.width},${tall.height}`, '60,72,140,72', '变高行 cellRect')

      const next = cellRectAt(layout, 2, 0)

      assertEqual(next.y, 36 + 108, '行 2 y = headHeight + topAt(2)')

      // 窗口来自几何 visibleRange（viewH=216：topAt(5)=216 → end=5，+OVERSCAN=7）
      assertEqual(layout.viewRows.count, geometry.visibleRange(0, 216, 2).count, 'viewRows 与几何一致')
      assertEqual(lastPaint.rowCount, layout.viewRows.count, 'lastPaint 变高窗口')

      // 行界网格线在 topAt(2) 处（行 1/2 边界 y=144，非等高 108）；行 1 底色覆盖 72px
      assertPixel(canvas, 300, 144, THEME.borderColorSoft, '变高行界网格线')
      assertPixel(canvas, 300, 140, THEME.bgStripe, '变高行底色延伸至 72px 带内')

      // 单格脏区裁剪高 = heightAt + 1；采样区跟随问题 1 槽位锚墨迹：行 1 锚
      // lineY = Math.round(72+1+(36−1)/2) = 91，fontSize 14 middle 基线墨迹 [84,98)，区域 y 80..110
      // 完整覆盖（旧居中锚采样 (60,110,140,30) 与新墨迹不相交，差异不可见恒败）
      const baseCanvas = document.createElement('canvas')

      baseCanvas.width = W
      baseCanvas.height = H

      painter.draw(state)
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0)

      records[1].name = '变高行已修改'

      const accepted = painter.invalidateCell(1, 1, { immediate: true, state })

      assert(accepted, '变高行单格应受理')
      assertRegionDiffer(baseCanvas, canvas, 60, 80, 140, 30, '单格重绘可见（区域覆盖行 1 槽位锚墨迹带）')
      assertRegionSame(baseCanvas, canvas, 60, 144, 140, 36, '行 2 不受影响')

      painter.dispose()

      return `cellRect 72px、行界 y=144、窗口 ${lastPaint.rowCount} 行、裁剪高 heightAt 化`
    })
  },
  {
    name: 'itemHits：(row,col) 粒度双 pass 不互覆（固定 tag 列 + 滚动 link 列）、dots \'...\' 收集、窗口裁剪',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const itemColumns = [
        prepareColumn({ field: 'tagList', caption: '标签', type: 'tag', tags: r => r.tagList, width: 200 }),
        prepareColumn({ field: 'links', caption: '链接', type: 'link', width: 300 })
      ]
      const records = Array.from({ length: 50 }, (_, i) => ({
        tagList: [{ caption: `甲${i}`, color: 'success' }, { caption: '乙' }],
        links: Array.from({ length: 12 }, (_row, k) => `链接${i}-${k}`) // 12 > maxItems 10 → dots
      }))
      const itemHits = new Map()
      const baseLayout = {
        columns: itemColumns,
        rowCount: records.length,
        containerWidth: W,
        containerHeight: H,
        fixedLeftColumns: 1,
        rowHeight: ROW_HEIGHT,
        headHeight: HEAD_HEIGHT,
        scrollTop: 0,
        rowGeometry: createUniformRowGeometry({ rowHeight: ROW_HEIGHT, rowCount: records.length })
      }
      const layout = relayout(baseLayout)
      const state = {
        ...makeState({ records, striped: false }),
        layout,
        columns: itemColumns,
        itemHits
      }

      painter.draw(state)

      // 双 pass（滚动区 pass + 固定区 pass）写同 row 不同 col 键，互不覆盖
      const rowHits = itemHits.get(0)
      const tagGroup = rowHits?.get(0)
      const linkGroup = rowHits?.get(1)

      assert(tagGroup?.length === 2 && tagGroup[0].kind === 'tag', '固定列 tag 条目组应存在')
      assert(linkGroup?.length === 10, `滚动区 link 条目组应存在（12 条截断 10），实际 ${linkGroup?.length}`)
      assertEqual(linkGroup[9].kind + ':' + linkGroup[9].index, 'link:9', 'dots 条目（第 maxItems 项）应收集')
      // 首行槽位锚（问题 1，20261028 解耦，行线中点四舍五入取整）：首行 lineY =
      // Math.round(格顶 36 + 1 + (36−1)/2) = 55，逐行命中矩形 y = lineY − lineHeight/2 = 46
      // （随槽位锚自动跟随，不回退到行顶+padding）
      assertEqual(`${linkGroup[0].rect.x},${linkGroup[0].rect.y}`, '208,46', 'link 首条目矩形（格左+padding，首行行框）')
      assertEqual(linkGroup[0].rect.height, 18, 'link 条目行高 = lineHeight')
      // 横排 tag 命中区 = pill 绘制区（centerY 55 ± TAG_HEIGHT/2，非整格 36）
      assertEqual(`${tagGroup[0].rect.y},${tagGroup[0].rect.height}`, '45,20', 'tag 命中矩形 = pill 绘制区')

      // 窗口裁剪：滚动后 itemHits 行集合 ⊆ 最新窗口（旧行删除，长滚不增长）
      const scrolledLayout = relayout({ ...baseLayout, scrollTop: 720 })

      painter.draw({ ...state, layout: scrolledLayout })

      const rows = [...itemHits.keys()]

      assert(!itemHits.has(0), '窗口外旧行应删除')
      assert(rows.length > 0 && rows.every(r => r >= scrolledLayout.viewRows.start && r < scrolledLayout.viewRows.end), 'itemHits 行集合 ⊆ 最新窗口')

      painter.dispose()

      return `双 pass 并存（tag 2 + link 10 含 dots）；滚动后 ${rows.length} 行 ∈ [${scrolledLayout.viewRows.start},${scrolledLayout.viewRows.end})`
    })
  },
  {
    name: 'hover 编辑感知：可编辑格 1px 主色描边贴格线内侧（不与格线重叠），非可编辑/关闭/none 无描边',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const isEditable = col => col.field === 'name'
      // 行 1（斑马 bgStripe）与行 0（bgNormal）的行带混色期望；描边不透明
      // 纯 primaryColor；行线/列线（borderColorSoft）叠 hover 带为两重混合
      const row1Band = blendColor(THEME.hoverBg, THEME.bgStripe)
      const row1Stroke = THEME.primaryColor
      const row0Band = blendColor(THEME.hoverBg, THEME.bgNormal)
      const row0Stroke = THEME.primaryColor
      const lineBand = blendColor(THEME.hoverBg, THEME.borderColorSoft)
      // 行 1 名称格 cellRect = (60, 72, 140, 36)：描边按格线占位内缩——顶避让
      // 本格行线（r≥1）、右避让本格列线（rightInset 1）：strokeRect(60.5, 73.5, 138, 34)
      const r1 = cellRectAt(makeState().layout, 1, 1)

      assertEqual(`${r1.x},${r1.y},${r1.width},${r1.height}`, '60,72,140,36', '名称格夹具 rect（行 1）')

      // hover 行 1 名称格（可编辑，r≥1）：格线位/描边位逐点核对
      painter.draw(makeState({ hover: { row: 1, col: 1 }, editable: true, isCellEditableFn: isEditable }))
      // 左缘 (60, 90)：描边贴格缘（左列线属前列矩形，画在 x=59）→ 叠 hover 行带
      assertPixel(canvas, 60, 90, row1Stroke, '左缘描边贴格缘', 2)
      // 顶行线位 (130, 72)：描边内缩避让，仅行线叠 hover 带
      assertPixel(canvas, 130, 72, lineBand, '顶行线无描边（内缩避让）', 2)
      assertPixel(canvas, 130, 73, row1Stroke, '顶缘描边贴行线内侧', 2)
      // 右列线位 (199, 90)：描边内缩避让，仅列线叠 hover 带
      assertPixel(canvas, 199, 90, lineBand, '右列线无描边（内缩避让）', 2)
      assertPixel(canvas, 198, 90, row1Stroke, '右缘描边贴列线内侧', 2)
      // 底缘 (130, 107)：行线画在下一行顶 y=108（本格外）→ 描边贴格缘叠行带
      assertPixel(canvas, 130, 107, row1Stroke, '底缘描边贴格缘', 2)
      // 内邻 (61, 90)/(130, 74)/(197, 90)：无描边像素（= hover 行带色；采样避开文字墨迹）
      assertPixel(canvas, 61, 90, row1Band, '内邻左无描边', 2)
      assertPixel(canvas, 130, 74, row1Band, '内邻顶无描边', 2)
      assertPixel(canvas, 197, 90, row1Band, '内邻右无描边', 2)
      // 外邻 (59, 90)：前列右缘列线叠 hover 带（描边不外溢出格缘）
      assertPixel(canvas, 59, 90, lineBand, '外邻为前列右缘列线叠行带', 2)

      // 行 0 顶缘：格内无行线（表头底边框在其上方相邻）→ 描边贴格缘叠行带；
      // header 底边框（y=35）不被描边覆盖
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 1 }, editable: true, isCellEditableFn: isEditable }), null)
      assertPixel(canvas, 130, 36, row0Stroke, '行 0 顶缘描边（格内无行线）', 2)
      assertPixel(canvas, 130, 35, THEME.borderColorSoft, 'header 底边框不被描边覆盖')

      // 同 hover 落在不可编辑列（金额 col 3）：仅行带无描边
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 3 }, editable: true, isCellEditableFn: isEditable }), null)
      assertPixel(canvas, 300, 50, row0Band, '非可编辑列无描边', 2)

      // editable=false：无描边
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 1 }, isCellEditableFn: isEditable }), null)
      assertPixel(canvas, 60, 50, row0Band, 'editable 关闭无描边', 2)

      // hoverMode none：无高亮无描边
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 1 }, editable: true, isCellEditableFn: isEditable, hoverMode: 'none' }), null)
      assertPixel(canvas, 60, 50, THEME.bgNormal, 'hoverMode=none 无描边（无行带）')

      painter.dispose()

      return '描边随 editable+isCellEditableFn 开合、贴格线内侧不压格线（浮层盒仍整格），hoverMode=none 抑制'
    })
  },
  {
    name: '树箭头 hover 主色 accent：与常态箭头同槽位 centerY（row 0 与 r≥1 变高行两态，问题 1）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const treeColumns = [
        prepareColumn({ field: 'id', type: 'rec_no', width: 60 }),
        prepareColumn({ field: 'name', caption: '名称', treeNode: true, width: 140 })
      ]
      const heights = Array.from({ length: 50 }, (_, i) => (i === 1 ? 60 : 36))
      const geometry = createVariableRowGeometry({ initialHeights: heights })
      const records = makeRecords()
      const layout = relayout({
        columns: treeColumns,
        rowCount: records.length,
        containerWidth: W,
        containerHeight: H,
        fixedLeftColumns: FIXED_COLS,
        rowHeight: ROW_HEIGHT,
        headHeight: HEAD_HEIGHT,
        scrollTop: 0,
        rowGeometry: geometry
      })
      const flatInfo = { levels: [0, 0], hasChildren: [true, true] }
      const base = { ...makeState({ records }), layout, columns: treeColumns, flatInfo }
      // 箭头槽（level 0：x = 格左 60 + padding 8，三角 x ∈ [70,78]）：采样区
      // x ∈ [64,80) 避开树列文字（文字起 x = 84）
      const AX0 = 64
      const AX1 = 80

      // 无 hover：常态三角 textColor；槽位 centerY = Math.round(viewportRowY + 1 + (36−1)/2)
      painter.draw(base)

      // row 0（r=0，h=36）：centerY = Math.round(36 + 1 + 17.5) = 55
      const normal0 = darkBoundsOf(canvas, AX0, AX1, 44, 64)
      assert(normal0 != null, 'row 0 常态树箭头应有暗像素')
      assert(Math.abs(normal0.centerY - 55) <= 1, `row 0 常态箭头中心 ${normal0.centerY} 应 = 槽位锚 55（±1px）`)

      // row 1（r≥1，超高行 h=60）：centerY = Math.round(72 + 1 + 17.5) = 91
      // （改前 accent 用 heightAt/2 = 102，与常态锚错位 12px）
      const normal1 = darkBoundsOf(canvas, AX0, AX1, 80, 100)
      assert(normal1 != null, 'row 1 常态树箭头应有暗像素')
      assert(Math.abs(normal1.centerY - 91) <= 1, `row 1 常态箭头中心 ${normal1.centerY} 应 = 槽位锚 91（±1px）`)

      // hover 同格：覆盖层主色 accent 三角叠画（painter 侧维持行线中点原式，
      // 较取整后常态锚高 0.5px，±1px 容差内）
      drawRegion(canvas.getContext('2d'), { ...base, hover: { row: 1, col: 1 } }, null)
      const accent1 = colorBoundsOf(canvas, AX0, AX1, 80, 100, THEME.primaryColor)
      assert(accent1 != null, 'row 1 hover 主色 accent 三角应有像素')
      assert(Math.abs(accent1.centerY - 91) <= 1, `row 1 accent 中心 ${accent1.centerY} 应 = 槽位锚 91（±1px）`)
      assert(Math.abs(accent1.centerY - normal1.centerY) <= 1, `row 1 accent ${accent1.centerY} 与常态 ${normal1.centerY} 应同 y（±1px）`)

      drawRegion(canvas.getContext('2d'), { ...base, hover: { row: 0, col: 1 } }, null)
      const accent0 = colorBoundsOf(canvas, AX0, AX1, 44, 64, THEME.primaryColor)
      assert(accent0 != null, 'row 0 hover 主色 accent 三角应有像素')
      assert(Math.abs(accent0.centerY - 55) <= 1, `row 0 accent 中心 ${accent0.centerY} 应 = 槽位锚 55（±1px）`)
      assert(Math.abs(accent0.centerY - normal0.centerY) <= 1, `row 0 accent ${accent0.centerY} 与常态 ${normal0.centerY} 应同 y（±1px）`)

      painter.dispose()

      return `常态/accent centerY：row 0 = ${normal0.centerY}/${accent0.centerY}（槽位 55）、row 1 = ${normal1.centerY}/${accent1.centerY}（槽位 91）`
    })
  },
  {
    name: 'veil：editingCell 命中格跳过内容绘制、行背景照画并显式清空本格 itemHits（问题 6）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      // 条目夹具（tag 固定列 + link 滚动列）：veil 格有可观测的条目内容与命中组
      const itemColumns = [
        prepareColumn({ field: 'tagList', caption: '标签', type: 'tag', tags: r => r.tagList, width: 200 }),
        prepareColumn({ field: 'links', caption: '链接', type: 'link', width: 300 })
      ]
      const records = Array.from({ length: 50 }, (_, i) => ({
        tagList: [{ caption: `甲${i}`, color: 'success' }, { caption: '乙' }],
        links: Array.from({ length: 12 }, (_row, k) => `链接${i}-${k}`)
      }))
      const itemHits = new Map()
      const layout = relayout({
        columns: itemColumns,
        rowCount: records.length,
        containerWidth: W,
        containerHeight: H,
        fixedLeftColumns: 1,
        rowHeight: ROW_HEIGHT,
        headHeight: HEAD_HEIGHT,
        scrollTop: 0,
        rowGeometry: createUniformRowGeometry({ rowHeight: ROW_HEIGHT, rowCount: records.length })
      })
      const state = {
        ...makeState({ records, striped: false }),
        layout,
        columns: itemColumns,
        itemHits,
        editingCell: { row: 0, col: 1 }
      }
      const cell = cellRectAt(layout, 0, 1)

      assertEqual(`${cell.x},${cell.y},${cell.width},${cell.height}`, '200,36,300,36', 'veil 格夹具 rect')

      // 对照帧：同一 state 不开 veil（link 文字照绘）
      const controlCanvas = document.createElement('canvas')

      controlCanvas.width = W
      controlCanvas.height = H
      createPainter({ canvas: controlCanvas }).draw({ ...state, editingCell: null })

      painter.draw(state)

      // veil 格无内容墨迹（link 文字跳绘），行背景照画；与对照帧有差异
      assert(darkBoundsOf(canvas, cell.x + 4, cell.x + cell.width - 4, cell.y + 4, cell.y + 32) == null, 'veil 格应无内容墨迹')
      assertPixel(canvas, 300, 50, THEME.bgNormal, 'veil 格行背景照画')
      assertRegionDiffer(controlCanvas, canvas, cell.x, cell.y, cell.width, cell.height, 'veil 格与对照帧')

      // 非 veil 格照常绘制：同行固定列 tag、下一行 link
      assert(darkBoundsOf(canvas, 8, 60, 44, 64) != null, '同行固定列 tag 条目照常绘制')
      assertHasDarkPixels(canvas, 208, 80, 100, 20, '下一行 link 文字照常绘制')

      // 命中组：veil 格显式清空为空数组（非「不写入」——absent 即残留旧组可点中），
      // 其他格照常收集
      const rowHits = itemHits.get(0)

      assert(Array.isArray(rowHits?.get(1)) && rowHits.get(1).length === 0, 'veil 格 itemHits 组应显式清空为 []')
      assert(rowHits?.get(0)?.length === 2, '固定列 tag 条目组照常收集（2 条）')
      assert(itemHits.get(1)?.get(1)?.length === 10, '非 veil 行 link 条目组照常收集（10 条含 dots）')

      painter.dispose()

      return 'veil 格跳绘 + 命中组清空为 []、行背景照画、非 veil 格内容与命中组不受影响'
    })
  },
  {
    name: 'rightInset 注入与 painter 路径槽位锚：非末列/blankTail 列线门控（stub ctx 记录 fillText，问题 1/9）',
    fn: () => {
      // 3 列全定宽（Σ=330）且后两列 center 对齐：last 列 rightInset 随 blankTail
      // 与 gridlines 门控变化，center 锚 x 可精确断言
      const centerColumns = [
        prepareColumn({ field: 'id', type: 'rec_no', width: 60 }),
        prepareColumn({ field: 'name', caption: '名称', width: 140, align: 'center' }),
        prepareColumn({ field: 'memo', caption: '备注', width: 130, align: 'center' })
      ]
      const records = [
        { id: 1, name: '货品 0', memo: 'M0' },
        { id: 2, name: '货品 1', memo: 'M1' }
      ]
      const geometry = createUniformRowGeometry({ rowHeight: ROW_HEIGHT, rowCount: records.length })
      const makeLayout = containerWidth => relayout({
        columns: centerColumns,
        rowCount: records.length,
        containerWidth,
        containerHeight: H,
        fixedLeftColumns: FIXED_COLS,
        rowHeight: ROW_HEIGHT,
        headHeight: HEAD_HEIGHT,
        scrollTop: 0,
        rowGeometry: geometry
      })
      const fillTextAt = state => {
        const calls = []

        drawRegion(makeRecordingCtx(calls), state, null)

        return calls
      }
      const rowText = (calls, text, y) => calls.filter(call => call.text === text && call.y === y)

      // 无空白：stickyWidth = contentWidth = 330 → 末列 rightInset 0
      const tight = { ...makeState({ columns: centerColumns, records }), layout: makeLayout(330) }

      assertEqual(tight.layout.stickyWidth, 330, '紧夹具 stickyWidth')
      assertEqual(tight.layout.contentWidth, 330, '紧夹具 contentWidth（无空白）')

      let calls = fillTextAt(tight)

      assertEqual(rowText(calls, 'M0', 55)[0]?.x, 200 + 65, '无空白末列 center 锚不扣列线')
      assertEqual(rowText(calls, '货品 0', 55)[0]?.x, 60 + 69.5, '非末列 center 锚扣右缘列线 1px')

      // blankTail：stickyWidth 600 > contentWidth 330 → 末列右缘画线，center 锚同扣 1px
      const blank = { ...makeState({ columns: centerColumns, records }), layout: makeLayout(600) }

      assert(blank.layout.stickyWidth > blank.layout.contentWidth, '前置：宽夹具存在空白区（blankTail）')

      calls = fillTextAt(blank)
      assertEqual(rowText(calls, 'M0', 55)[0]?.x, 200 + 64.5, 'blankTail 末列 center 锚扣右缘列线 1px')

      // gridlines row：列线门控 → rightInset 归 0（末列与非末列同）
      calls = fillTextAt({ ...blank, gridlines: 'row' })
      assertEqual(rowText(calls, 'M0', 55)[0]?.x, 200 + 65, 'row 模式末列 rightInset 门控归 0')
      assertEqual(rowText(calls, '货品 0', 55)[0]?.x, 60 + 70, 'row 模式非末列 rightInset 门控归 0')

      // painter 路径垂直锚 = 行线间空白中点四舍五入取整 Math.round(rect.y + 1 +
      // (36−1)/2)（row 0 → 55、row 1 → Math.round(72 + 1 + 17.5) = 91；20261028 与 lineHeight 解耦，
      // ROW_TOP_INSET 内建于 cell-painters，painter 不传）
      assertEqual(rowText(calls, 'M0', 55).length, 1, 'row 0 槽位锚 y=55 恰一次')
      assertEqual(rowText(calls, 'M1', 91)[0]?.x, 200 + 65, 'row 1 center 锚（row 模式不扣列线）')

      return 'rightInset 门控（非末列/blankTail/gridlines row）与 painter 路径槽位锚 y=55/91 逐值正确'
    }
  },
  {
    name: '编辑按钮绘制调用路径：hover 态加载中不半绘制、hoverMode=none 整体抑制（问题 5，像素归浏览器）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      // SVG 串每次运行唯一（imageCache 模块级跨检查持存，固定串会命中历史缓存条目
      // 使「加载中」前提失效）
      const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        `<path d="M3 17v4h4l11-11-4-4L3 17z" fill="currentColor" data-stamp="${Date.now()}"/></svg>`
      const buttonColumns = RAW_COLUMNS
        .map(col => (col.field === 'amount' ? { ...col, editorButton: { icon } } : col))
        .map(col => prepareColumn(col, { placeholder: '--' }))
      const hover = { row: 0, col: 3 }
      // 按钮区矩形（editor.js 单一事实源）：金额格 (300, 36, 120, 36) → 区 (388, 42.5) 24×24
      // （centerY = 格顶 36 + 1 + (36−1)/2 = 54.5，与文字锚同槽位式）
      const area = editorButtonRectOf(cellRectAt(makeState({ columns: buttonColumns }).layout, 0, 3), {
        padding: THEME.cellPadding,
        rowHeight: THEME.rowHeight
      })

      assertEqual(`${area.x},${area.y},${area.width},${area.height}`, '388,42.5,24,24', '编辑按钮区矩形')

      // 同步绘制帧内图标必为 loading（data URL onload 异步），证明「不半绘制」前提
      assertEqual(requestIconImage(icon, THEME.textColor).status, 'loading', '首帧图标加载中')

      // 帧 A：icon 首次请求（loading，不得 drawImage）；帧 B：无 editorButton 同 hover
      // 对照（按钮区 hover 带底色对齐，隔离「半绘制」单变量）
      painter.draw(makeState({ columns: buttonColumns, hover }))
      const controlCanvas = document.createElement('canvas')

      controlCanvas.width = W
      controlCanvas.height = H
      createPainter({ canvas: controlCanvas }).draw(makeState({ hover }))

      assertRegionSame(controlCanvas, canvas, area.x, area.y, area.width, area.height, '加载中按钮区不半绘制')

      // hoverMode none：paintOverlay 整体抑制（含编辑按钮），与真·无 hover 帧整幅一致
      // （对照帧须 makeState({})——makeState({ hover }) 是整行高亮带，并非「无 hover 帧」）
      const plainCanvas = document.createElement('canvas')

      plainCanvas.width = W
      plainCanvas.height = H
      createPainter({ canvas: plainCanvas }).draw(makeState({}))

      drawRegion(canvas.getContext('2d'), makeState({ columns: buttonColumns, hover, hoverMode: 'none' }), null)
      assertRegionSame(plainCanvas, canvas, 0, 0, W, H, 'hoverMode=none 与无 hover 帧整幅一致（编辑按钮一并抑制）')

      painter.dispose()

      return `按钮区 (${area.x},${area.y}) 加载中无半绘制、hoverMode=none 抑制；加载像素与点击回调归浏览器`
    })
  },
  {
    name: 'blankTail 末列线：Σ < 视口宽时表体段与表头段末列右缘 1px，row 模式与无空白不画（问题 9）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      // 窄列夹具：4 列全定宽 Σ=350 < W=600 → blankTail；固定 1 列
      const narrow = [
        { field: 'id', type: 'rec_no', width: 50 },
        { field: 'name', caption: '名称', width: 120 },
        { field: 'status', caption: '状态', type: 'text', mappings: { a: '启用', b: '停用' }, width: 100 },
        { field: 'amount', caption: '金额', type: 'currency', width: 80 }
      ].map(col => prepareColumn(col, { placeholder: '--' }))
      const narrowState = makeState({ columns: narrow })

      assertEqual(narrowState.layout.colWidths.reduce((a, b) => a + b, 0), 350, '窄列夹具 ΣcolWidths')
      assertEqual(narrowState.layout.contentWidth, 350, '窄列夹具 contentWidth')
      assert(narrowState.layout.stickyWidth > narrowState.layout.contentWidth, '前置：存在空白区（blankTail）')

      // 末列右缘内 1px：colLefts[3] + width − 1 = 270 + 80 − 1 = 349（表体段
      // y ∈ [36, 252)、表头段 y ∈ [0, 35)），色 = borderColorSoft（列线同口径）
      painter.draw(narrowState)
      assertPixel(canvas, 349, 100, THEME.borderColorSoft, '表体段末列右缘线')
      assertPixel(canvas, 349, 200, THEME.borderColorSoft, '表体段末列右缘线（行 4）')
      assertPixel(canvas, 349, 4, THEME.borderColorSoft, '表头段末列右缘线')

      // gridlines row：列线门控 → 表体与表头段均不画
      drawRegion(canvas.getContext('2d'), makeState({ columns: narrow, gridlines: 'row' }), null)
      assertPixelNot(canvas, 349, 100, THEME.borderColorSoft, 'row 模式表体段末列线不画')
      assertPixelNot(canvas, 349, 4, THEME.borderColorSoft, 'row 模式表头段末列线不画')

      // 无空白（默认夹具 Σ=630 > stickyWidth 600）：末列右缘无线（现状维持）
      drawRegion(canvas.getContext('2d'), makeState(), null)
      assertPixelNot(canvas, 599, 100, THEME.borderColorSoft, '无空白表体段末列无线')
      assertPixelNot(canvas, 599, 4, THEME.borderColorSoft, '无空白表头段末列无线')

      painter.dispose()

      return 'blankTail 表体+表头末列右缘 1px（borderColorSoft）；row 模式与无空白两态不画'
    })
  },
  {
    name: '行背景带宽度：ΣcolWidths < 视口宽时行背景/hover 带充满至视口右缘（R1/人工 3 意见 1）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      // 窄列夹具：4 列全定宽 Σ=350 < W=600（缺陷发生条件 = 全部列定宽）；固定 1 列
      const narrow = [
        { field: 'id', type: 'rec_no', width: 50 },
        { field: 'name', caption: '名称', width: 120 },
        { field: 'status', caption: '状态', type: 'text', mappings: { a: '启用', b: '停用' }, width: 100 },
        { field: 'amount', caption: '金额', type: 'currency', width: 80 }
      ].map(col => prepareColumn(col, { placeholder: '--' }))
      const narrowState = makeState({ columns: narrow, selectedKey: 2 })
      const narrowSum = narrowState.layout.colWidths.reduce((a, b) => a + b, 0)

      assertEqual(narrowSum, 350, '窄列夹具 ΣcolWidths')
      assertEqual(narrowState.layout.stickyWidth, W, 'stickyWidth = 容器宽')

      // (a) 延伸区 x ∈ (Σ, W−2)：普通行 = bgNormal、斑马行 = bgStripe、选中行 = selectBg 原色
      // （透明画布，半透明 selectBg 无下层混合）
      const gx = 450

      painter.draw(narrowState)
      assertPixel(canvas, gx, 50, THEME.bgNormal, '行 0 普通底色充满延伸区')
      assertPixel(canvas, gx, 90, THEME.bgStripe, '行 1 斑马底色充满延伸区')
      assertPixel(canvas, gx, 126, THEME.selectBg, '行 2 选中底色充满延伸区')

      // (b) hover 行带延伸区 = blend(hoverBg, 行底色)（与列区内合成起点一致——修复前
      // 延伸区为透明画布，半透明 hoverBg 合成结果不同）
      drawRegion(canvas.getContext('2d'), makeState({ columns: narrow, hover: { row: 1, col: 2 } }), null)
      assertPixel(canvas, gx, 90, blendColor(THEME.hoverBg, THEME.bgStripe), 'hover 行带延伸区混色一致')

      // (c) 行横带脏区（hover 进出）重绘后同采样保持（paintRowBand 经同一 bandToX）
      const bandState = makeState({ columns: narrow, hover: { row: 0, col: 1 } })

      assert(
        painter.invalidate({ rows: [0, 1] }, { immediate: true, state: bandState }),
        '行横带应受理'
      )
      assertPixel(canvas, gx, 50, blendColor(THEME.hoverBg, THEME.bgNormal), '脏区重绘后 hover 行带延伸区')
      painter.invalidate({ rows: [0, 1] }, { immediate: true, state: makeState({ columns: narrow }) })
      assertPixel(canvas, gx, 50, THEME.bgNormal, 'hover 移出后延伸区还原')

      // (d) 固定列场景：整幅后滚动区首列文字仍在（固定 pass 不传 bandToX，
      // 行底色不覆盖已绘滚动区内容）
      assertHasDarkPixels(canvas, 55, 42, 110, 24, '固定 pass 不扩带：滚动区首列文字')

      // (e) Σ > W 场景（既有夹具）：x = W−1 处为行底色（画布裁剪，不越真实内容宽）
      const wideState = makeState()
      const wideSum = wideState.layout.colWidths.reduce((a, b) => a + b, 0)

      assert(wideSum > W, `既有夹具 Σ=${wideSum} 应 > W=${W}`)
      drawRegion(canvas.getContext('2d'), wideState, null)
      assertPixel(canvas, W - 1, 50, THEME.bgNormal, 'Σ>W 时 W−1 处为行底色（不越界）')

      painter.dispose()

      return `延伸区三态底色/hover 混色/脏区保持/固定区不扩带/Σ>W 裁剪（窄列 Σ=350，W=${W}）`
    })
  },
  {
    name: '固定列表头：横向滚动后滚动列表头文字/分隔线不绘入固定表头区（R1）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })

      // scrollLeft=180：viewCols.start=2（列 2 left 200 → 视口 x 20 < fixedWidth 60，
      // 部分滚入固定区下方；caption '状态' left 对齐 [28,56) 落入固定表头区）
      const scrolled = makeState({ scrollLeft: 180 })

      assertEqual(scrolled.layout.viewCols.start, 2, '前置：首可见滚动列 = 2')

      painter.draw(scrolled)

      // 固定表头区右半（避开固定列 caption '#' 与分界强化线 x 59）应无文字像素
      const zone = darkBoundsOf(canvas, 24, 58, 6, 30)

      assert(zone == null, `固定表头区不应有滚动列文字像素（实际包围盒 ${JSON.stringify(zone)}）`)
      // 金额列（currency，right 对齐）caption 视口 [204,232)：clip 内正常绘制
      assertHasDarkPixels(canvas, 196, 6, 40, 24, '滚动列表头文字存在（金额列 right 对齐）')

      painter.dispose()

      return 'scrollLeft=180：固定表头区无残影、滚动列表头（金额列）正常绘制'
    })
  },
  {
    name: 'check 表头 ✓：无 caption 时在表头格内水平 + 垂直居中（R2，±0.5px）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })

      painter.draw(makeState({ headerChecked: { ok: false } }))

      // check 列 x [420,470)：✓ 方框边框 borderColor（lum≈212）像素包围盒中心
      // == 表头格几何中心 (445, 18)——修复前 checkbox 固定 x + padding 贴左不居中
      const data = regionData(canvas, 421, 2, 48, 32)
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 48; x++) {
          const i = (y * 48 + x) * 4
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

          if (data[i + 3] > 40 && lum >= 195 && lum <= 222) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      assert(minX < Infinity, '应找到 ✓ 方框边框像素')

      const cx = 421 + (minX + maxX + 1) / 2
      const cy = 2 + (minY + maxY + 1) / 2

      assert(Math.abs(cx - 445) <= 0.5, `✓ 中心 x=${cx} 应为表头格几何中心 445 ±0.5`)
      assert(Math.abs(cy - 18) <= 0.5, `✓ 中心 y=${cy} 应为表头格几何中心 18 ±0.5`)

      painter.dispose()

      return `✓ 像素盒中心 (${cx}, ${cy}) = 表头格几何中心 (445, 18)`
    })
  },
  {
    name: 'R4a/R4b：单行省略路径垂直锚 = 首行槽位锚；数组一行路径与省略路径对齐（±1px）',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const columns = [
        prepareColumn({ field: 'name', caption: '名称', width: 140 }),
        prepareColumn({ field: 'arr', caption: '数组', width: 140, text: r => r.arr })
      ]
      const records = [
        { name: '单行省略路径', arr: ['数组一行路径'], status: 'a', amount: 1, ok: true, memo: '' }
      ]

      painter.draw(makeState({ columns, records }))

      // 行 0 格 [36,72) 几何中心 54；名称列 [60,200)、数组列 [200,340)
      const nameBounds = darkBoundsOf(canvas, 62, 198, 40, 70)
      const arrBounds = darkBoundsOf(canvas, 202, 338, 40, 70)

      assert(nameBounds != null, '名称列（单行省略路径）应有文字像素')
      assert(arrBounds != null, '数组列（数组一行路径）应有文字像素')

      // R4a：单行文字几何中心 ≈ 首行槽位锚 55（±2px 容字体墨迹与 middle 基线差；
      // 20261028 锚解耦 + 取整后为槽位锚 55，非格几何中心 54）
      assert(
        Math.abs(nameBounds.centerY - 55) <= 2,
        `R4a 单行文字中心 ${nameBounds.centerY} 应 ≈ 槽位锚 55（±2px）`
      )

      // R4b：数组一行路径（多行绘制块 n=1）与单行省略路径文字对齐（±1px）——
      // 修复前数组路径顶部 padding 起画（锚 17），与省略路径居中锚 18 差 1px
      assert(
        Math.abs(nameBounds.centerY - arrBounds.centerY) <= 1,
        `R4b 省略路径 ${nameBounds.centerY} 与数组路径 ${arrBounds.centerY} 应对齐（±1px）`
      )

      painter.dispose()

      return `省略 ${nameBounds.centerY} / 数组 ${arrBounds.centerY}（槽位锚 55，±1px 对齐）`
    })
  }
]
