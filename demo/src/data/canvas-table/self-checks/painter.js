/**
 * canvas-table 自检断言 — painter 模块（G2）。
 *
 * 覆盖（02-design.md G2 判据 + R1/人工 3 + 既有绘制回归）：在位 canvas（挂入文档的真实 canvas）
 * 渲染出完整表格（文字/网格线/表头/固定列/覆盖层）；lastPaint 统计字段有值且
 * rowCount 与窗口一致；变高行坐标（fake rowGeometry：viewportRowY/cellRectAt 高度、
 * 行带高度、单格脏区裁剪高 heightAt 化——03-review-5 问题 9）；itemHits (row,col)
 * 粒度收集（双 pass 不互覆 + dots '...' 条目 + 窗口裁剪，A3.3）；hover 可编辑格
 * 1px 主色内描边（A5.3 R1：EDITOR_GAP 4px 等距内缩 = 编辑浮层矩形）；行背景带
 * 宽度（R1/人工 3 意见 1：ΣcolWidths < 视口宽时充满至视口右缘）；另覆盖：选中/
 * 斑马纹底色、虚拟滚动窗口一致性、脏区调度（行横带/单格/表头/调宽竖带）、
 * createPainter 契约。
 *
 * 断言全部同步执行（runChecks 不支持异步）；img onload → invalidateCell 重绘联动为
 * rAF 异步路径，此处只断言窗口校验的同步返回值，端到端联动留 S1 验证。
 * 主题夹具字段名对齐 theme.js readSnapshot（值用固定 rgba 串，rowHeight/headHeight
 * 经 layout.js relayout 入参传入，不经 theme）。
 */
import { drawRegion, cellRectAt, createPainter } from '@/components/canvas-table/painter.js'
import { EDITOR_GAP } from '@/components/canvas-table/editor.js'
import { relayout } from '@/components/canvas-table/layout.js'
import { prepareColumn } from '@/components/canvas-table/cell-painters.js'
import { createVariableRowGeometry, createUniformRowGeometry } from '@/components/canvas-table/row-geometry.js'
import { withAlpha } from '@/components/canvas-table/theme.js'

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
  cellPadding: 8
}

const RAW_COLUMNS = [
  { field: 'id', type: 'rec_no', width: 60 }, // 固定列
  { field: 'name', caption: '名称', width: 140 },
  { field: 'status', caption: '状态', type: 'enum', mappings: { a: '启用', b: '停用' }, width: 100, sortable: true },
  { field: 'amount', caption: '金额', type: 'currency', width: 120 },
  { field: 'ok', type: 'check', headerCheckbox: true, width: 50 },
  { field: 'memo', caption: '备注' } // 未定宽 → 均摊 130
]

const COLUMNS = RAW_COLUMNS.map(col => prepareColumn(col, { placeholder: '--' }))

// 列几何（relayout 求解结果，采样坐标依据）：
// colWidths [60, 140, 100, 120, 50, 130]，colLefts [0, 60, 200, 300, 420, 470]，fixedWidth 60

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

      // 单格脏区裁剪高 = heightAt + 1（旧实现 36+1 会把 y≥109 的重绘截掉）
      const baseCanvas = document.createElement('canvas')

      baseCanvas.width = W
      baseCanvas.height = H

      painter.draw(state)
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0)

      records[1].name = '变高行已修改'

      const accepted = painter.invalidateCell(1, 1, { immediate: true, state })

      assert(accepted, '变高行单格应受理')
      assertRegionDiffer(baseCanvas, canvas, 60, 110, 140, 30, '单格裁剪覆盖行 1 下半（裁剪高 = heightAt+1）')
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
      assertEqual(`${linkGroup[0].rect.x},${linkGroup[0].rect.y}`, '208,44', 'link 首条目矩形（格左+padding，行顶+padding）')
      assertEqual(linkGroup[0].rect.height, 18, 'link 条目行高 = lineHeight')

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
    name: 'hover 编辑感知：可编辑格 1px 主色内描边（EDITOR_GAP 4px 等距内缩 = 编辑浮层矩形），非可编辑/关闭无描边',
    fn: () => withCanvas(canvas => {
      const painter = createPainter({ canvas })
      const isEditable = col => col.field === 'name'
      // blendColor 产 rgba 数组，二次混合需 css 串
      const bandPixels = blendColor(THEME.hoverBg, THEME.bgNormal)
      const bandCss = `rgba(${bandPixels[0]},${bandPixels[1]},${bandPixels[2]},${bandPixels[3] / 255})`
      const row0Band = bandPixels
      const stroke = blendColor(withAlpha(THEME.primaryColor, 0.45), bandCss)
      // 名称格 cellRect = (60, 36, 140, 36)：描边路径 x = 60 + EDITOR_GAP + 0.5，
      // 1px 描边覆盖 [64, 65) → 采样 cellRect.x + EDITOR_GAP 为整描边像素
      const CELL_X = 60
      const CELL_Y = 36

      assertEqual(`${cellRectAt(makeState().layout, 0, 1).x},${cellRectAt(makeState().layout, 0, 1).y}`, '60,36', '名称格夹具 rect')

      // hover 行 0 名称格（可编辑）：描边 0.45 主色叠 hover 行带（左缘/顶缘均内缩 EDITOR_GAP）
      painter.draw(makeState({ hover: { row: 0, col: 1 }, editable: true, isCellEditableFn: isEditable }))
      assertPixel(canvas, CELL_X + EDITOR_GAP, 50, stroke, '可编辑格描边（左缘内缩 4px）', 2)
      assertPixel(canvas, 100, CELL_Y + EDITOR_GAP, stroke, '描边顶边内缩 4px', 2)
      // 描边外缘距格缘 = EDITOR_GAP：格缘侧（x−1 / y−1）为纯行带无描边
      assertPixel(canvas, CELL_X + EDITOR_GAP - 1, 50, row0Band, '描边外缘距左格缘 4px', 2)
      assertPixel(canvas, 100, CELL_Y + EDITOR_GAP - 1, row0Band, '描边外缘距顶格缘 4px', 2)

      // 同 hover 落在不可编辑列（金额 col 3）：仅行带无描边
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 3 }, editable: true, isCellEditableFn: isEditable }), null)
      assertPixel(canvas, 300, 50, row0Band, '非可编辑列无描边', 2)

      // editable=false：无描边
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 1 }, isCellEditableFn: isEditable }), null)
      assertPixel(canvas, CELL_X + EDITOR_GAP, 50, row0Band, 'editable 关闭无描边', 2)

      // hoverMode none：无高亮无描边
      drawRegion(canvas.getContext('2d'), makeState({ hover: { row: 0, col: 1 }, editable: true, isCellEditableFn: isEditable, hoverMode: 'none' }), null)
      assertPixel(canvas, CELL_X + EDITOR_GAP, 50, THEME.bgNormal, 'hoverMode=none 无描边', 2)

      painter.dispose()

      return '描边随 editable+isCellEditableFn 开合、四周内缩 4px（= 浮层矩形），hoverMode=none 抑制'
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
        { field: 'status', caption: '状态', type: 'enum', mappings: { a: '启用', b: '停用' }, width: 100 },
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
    name: 'R4a/R4b：单行省略路径垂直居中锚 = 格几何中心；数组一行路径块居中对齐（±1px）',
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

      // R4a：单行文字几何中心 ≈ 格几何中心（±2px 容字体墨迹与 middle 基线差）
      assert(
        Math.abs(nameBounds.centerY - 54) <= 2,
        `R4a 单行文字中心 ${nameBounds.centerY} 应 ≈ 格几何中心 54（±2px）`
      )

      // R4b：数组一行路径（多行绘制块 n=1）与单行省略路径文字对齐（±1px）——
      // 修复前数组路径顶部 padding 起画（锚 17），与省略路径居中锚 18 差 1px
      assert(
        Math.abs(nameBounds.centerY - arrBounds.centerY) <= 1,
        `R4b 省略路径 ${nameBounds.centerY} 与数组路径 ${arrBounds.centerY} 应对齐（±1px）`
      )

      painter.dispose()

      return `省略 ${nameBounds.centerY} / 数组 ${arrBounds.centerY}（格中心 54，±1px 对齐）`
    })
  }
]
