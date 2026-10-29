// verifier 复现 harness：直接对真实 src 模块复现 self-checks/painter.js 的两条失败断言
// （变高行 invalidateCell / 编辑按钮 hoverMode=none 对照），并输出取证数据。
import { drawRegion, cellRectAt, createPainter } from '@/components/canvas-table/painter.js'
import { editorButtonRectOf } from '@/components/canvas-table/editor.js'
import { CELL_LINE_HEIGHT_FALLBACK } from '@/components/canvas-table/constants.js'
import { relayout } from '@/components/canvas-table/layout.js'
import { prepareColumn, requestIconImage, drawCell } from '@/components/canvas-table/cell-painters.js'
import { createVariableRowGeometry, createUniformRowGeometry } from '@/components/canvas-table/row-geometry.js'

// —— 夹具：与 demo/src/data/canvas-table/self-checks/painter.js 逐字一致 ——
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
  { field: 'id', type: 'rec_no', width: 60 },
  { field: 'name', caption: '名称', width: 140 },
  { field: 'status', caption: '状态', type: 'enum', mappings: { a: '启用', b: '停用' }, width: 100, sortable: true },
  { field: 'amount', caption: '金额', type: 'currency', width: 120 },
  { field: 'ok', type: 'check', headerCheckbox: true, width: 50 },
  { field: 'memo', caption: '备注' }
]

const COLUMNS = RAW_COLUMNS.map(col => prepareColumn(col, { placeholder: '--' }))

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

function darkBbox (ctx, x, y, w, h) {
  const d = ctx.getImageData(x, y, w, h).data
  let minX = 1e9
  let minY = 1e9
  let maxX = -1
  let maxY = -1
  let dark = 0

  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]

      if (d[i + 3] > 40 && lum < 150) {
        dark++

        if (xx < minX) minX = xx
        if (xx > maxX) maxX = xx
        if (yy < minY) minY = yy
        if (yy > maxY) maxY = yy
      }
    }
  }

  return { dark, bbox: maxX < 0 ? null : [minX + x, minY + y, maxX + x, maxY + y] }
}

function firstDiff (a, b, x, y, w, h) {
  const da = a.getContext('2d').getImageData(x, y, w, h).data
  const db = b.getContext('2d').getImageData(x, y, w, h).data

  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) {
      const off = i >> 2
      const base = (i & ~3)

      return {
        offset: off,
        pixel: [off % w + x, Math.floor(off / w) + y],
        a: Array.from(da.slice(base, base + 4)),
        b: Array.from(db.slice(base, base + 4))
      }
    }
  }

  return null
}

// —— 复现 1：变高行 invalidateCell（self-checks/painter.js「变高行」块 :762-777）——
function reproVariableRow () {
  return withCanvas(canvas => {
    const painter = createPainter({ canvas })
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

    painter.draw(state)

    const ctx = canvas.getContext('2d')
    const baseBbox = darkBbox(ctx, 60, 100, 141, 90)
    const baseData = ctx.getImageData(60, 110, 140, 30).data.slice()

    records[1].name = '变高行已修改'

    const accepted = painter.invalidateCell(1, 1, { immediate: true, state })
    const afterData = ctx.getImageData(60, 110, 140, 30).data
    const afterBbox = darkBbox(ctx, 60, 100, 141, 90)
    let diff = -1

    for (let i = 0; i < afterData.length; i++) {
      if (afterData[i] !== baseData[i]) {
        diff = i >> 2
        break
      }
    }

    // 对照：整幅重画后该区域（验证内容本身可绘出）
    const fresh = document.createElement('canvas')

    fresh.width = W
    fresh.height = H
    createPainter({ canvas: fresh }).draw(state)

    const freshDiff = firstDiff(canvas, fresh, 60, 110, 140, 30)
    const freshBbox = darkBbox(fresh.getContext('2d'), 60, 100, 141, 90)

    painter.dispose()

    return {
      accepted,
      baseBbox,
      afterBbox,
      firstDiffOffsetInRegion: diff,
      freshVsInvalidatedDiff: freshDiff,
      freshBbox,
      viewRows: { start: layout.viewRows.start, end: layout.viewRows.end },
      cellRect: (() => { const r = cellRectAt(layout, 1, 1); return `${r.x},${r.y},${r.width},${r.height}` })()
    }
  })
}

// —— 复现 2：编辑按钮 hoverMode=none 对照帧构造（self-checks/painter.js :1124-1135）——
function reproEditorButton () {
  return withCanvas(canvas => {
    const painter = createPainter({ canvas })
    const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      `<path d="M3 17v4h4l11-11-4-4L3 17z" fill="currentColor" data-stamp="${Date.now()}"/></svg>`
    const buttonColumns = RAW_COLUMNS
      .map(col => (col.field === 'amount' ? { ...col, editorButton: { icon } } : col))
      .map(col => prepareColumn(col, { placeholder: '--' }))
    const hover = { row: 0, col: 3 }
    const area = editorButtonRectOf(cellRectAt(makeState({ columns: buttonColumns }).layout, 0, 3), {
      padding: THEME.cellPadding,
      lineHeight: CELL_LINE_HEIGHT_FALLBACK
    })
    const loadingStatus = requestIconImage(icon, THEME.textColor).status

    // 帧 A：hover + buttonColumns（与原断言 :1124 相同）
    painter.draw(makeState({ columns: buttonColumns, hover }))
    // 帧 C：在同一 canvas 上画 hoverMode=none 帧（与原断言 :1134 相同，drawRegion(null) 含 clearRect）
    drawRegion(canvas.getContext('2d'), makeState({ columns: buttonColumns, hover, hoverMode: 'none' }), null)

    // 原断言对照帧（:1129）：makeState({ hover })——hover 有值、无 editorButton、hoverMode 缺省 'row'
    const controlHover = document.createElement('canvas')

    controlHover.width = W
    controlHover.height = H
    createPainter({ canvas: controlHover }).draw(makeState({ hover }))

    // 修正对照帧：无 hover（makeState({})）
    const controlPlain = document.createElement('canvas')

    controlPlain.width = W
    controlPlain.height = H
    createPainter({ canvas: controlPlain }).draw(makeState({}))

    // 再补一个对照：独立画 none 帧（不经帧 A 叠加）
    const noneFresh = document.createElement('canvas')

    noneFresh.width = W
    noneFresh.height = H
    createPainter({ canvas: noneFresh }).draw(makeState({ columns: buttonColumns, hover, hoverMode: 'none' }))

    painter.dispose()

    return {
      area: `${area.x},${area.y},${area.width},${area.height}`,
      iconStatus: loadingStatus,
      origAssert_firstDiff: firstDiff(controlHover, canvas, 0, 0, W, H),
      fixedAssert_firstDiff: firstDiff(controlPlain, canvas, 0, 0, W, H),
      noneFreshVsPlain_firstDiff: firstDiff(noneFresh, controlPlain, 0, 0, W, H),
      noneFreshVsOrigControl_firstDiff: firstDiff(noneFresh, controlHover, 0, 0, W, H),
      hoverVsPlain_firstDiff: firstDiff(controlHover, controlPlain, 0, 0, W, H)
    }
  })
}

// —— 复现 3：直调 drawCell + recording ctx（定位 fillText 锚值）——
function reproTextProbe () {
  const calls = []
  const stub = new Proxy({}, {
    get (target, prop) {
      if (prop === 'measureText') return () => ({ width: 40 })
      if (prop === 'canvas') return { width: 10, height: 10 }
      if (prop === 'fillText') return (...args) => calls.push({ op: 'fillText', args })
      if (prop === 'fillRect') return (...args) => calls.push({ op: 'fillRect', args })
      if (typeof prop === 'string') return target[prop] !== undefined ? target[prop] : () => {}
      return () => {}
    },
    set (target, prop, value) {
      calls.push({ op: 'set:' + String(prop), value })
      target[prop] = value
      return true
    }
  })

  const run = (rect, record) => {
    calls.length = 0
    window.__ctDrawCell(stub, {
      col: COLUMNS[1],
      record,
      recordNumber: 2,
      emit: null,
      rect,
      theme: THEME,
      row: 1,
      rightInset: 0,
      hoverItem: null
    })
    return calls.filter(c => c.op === 'fillText' || c.op.startsWith('set:textBaseline')).map(c => ({ op: c.op, args: c.args, value: c.value }))
  }

  return {
    tallRow: run({ x: 60, y: 108, width: 140, height: 72 }, { name: '货品 1' }),
    tallRowModified: run({ x: 60, y: 108, width: 140, height: 72 }, { name: '变高行已修改' }),
    normalRow: run({ x: 60, y: 180, width: 140, height: 36 }, { name: '货品 3' })
  }
}

window.__ctResults = {
  variableRow: reproVariableRow(),
  editorButton: reproEditorButton(),
  textProbe: (window.__ctDrawCell = drawCell, reproTextProbe())
}

document.title = 'CT_VERIFY_DONE'
