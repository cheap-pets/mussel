// CDP v3：滚动态断言（demo 15/16）+ 事件诊断
import { setTimeout as sleep } from 'node:timers/promises'

const wsUrl = process.argv[2]
let msgId = 0
const pending = new Map()
const consoleLines = []
let currentStep = 'boot'
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id != null && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return }
  if (m.method === 'Runtime.consoleAPICalled') {
    consoleLines.push({ step: currentStep, type: m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ') })
  }
}
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
const evalJs = async expression => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error('page eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result?.value
}
async function step (name, fn) {
  currentStep = name
  try { console.log('STEP ' + JSON.stringify({ step: name, ok: true, detail: await fn() })) }
  catch (err) { console.log('STEP ' + JSON.stringify({ step: name, ok: false, error: String(err.message || err).slice(0, 700) })) }
}
await send('Runtime.enable')

await evalJs(`
  window.__v = (() => {
    const canvas = document.querySelector('.mu-table-ex__canvas')
    const sticky = document.querySelector('.mu-table-ex__sticky')
    const scroll = document.querySelector('.mu-table-ex__scroll')
    const api = window.__canvasTable
    const pixel = (cx, cy) => { const r = canvas.getBoundingClientRect(); const d = canvas.getContext('2d').getImageData(Math.round(cx - r.left), Math.round(cy - r.top), 1, 1).data; return [d[0], d[1], d[2], d[3]] }
    const regionPixels = (cx, cy, w, h) => { const r = canvas.getBoundingClientRect(); const d = canvas.getContext('2d').getImageData(Math.round(cx - r.left), Math.round(cy - r.top), w, h).data; const uniq = {}; for (let i = 0; i < d.length; i += 4) { const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; uniq[k] = (uniq[k] || 0) + 1 } return uniq }
    const cell = (row, col) => api.getCellRect(row, col)
    const fire = (type, cx, cy) => sticky.dispatchEvent(type === 'click' ? new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }) : new PointerEvent(type, { clientX: cx, clientY: cy, bubbles: true, pointerId: 1 }))
    const clickAt = (cx, cy) => { fire('pointermove', cx, cy); fire('pointerdown', cx, cy); fire('pointerup', cx, cy); fire('click', cx, cy) }
    const moveAt = (cx, cy) => fire('pointermove', cx, cy)
    const events = n => [...document.querySelectorAll('.ct-event-log__item')].slice(0, n).map(el => el.textContent.trim())
    const layout = () => api.getLayoutInfo()
    const settle = ms => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms ?? 120))) })
    return { canvas, sticky, scroll, pixel, regionPixels, cell, clickAt, moveAt, events, layout, settle }
  })()
  'ok'
`)
await evalJs(`__v.settle(200)`)

// D1 跳过（已通过），直接 D2/D3
await step('D1-scroll-coverage-click', async () => {
  await evalJs(`__v.scroll.scrollTop = 150`)
  await evalJs(`new Promise(r => setTimeout(r, 400))`)
  const l = await evalJs(`__v.layout()`)
  const diag = { start: l.viewRows.start, end: l.viewRows.end, scroll: await evalJs(`__v.scroll.scrollTop`), rowH: l.rowHeight }
  // 可视覆盖行：start+2（区域 [0,7) 内且非锚行）
  const visRow = Math.min(l.viewRows.start + 2, 6)
  const r = await evalJs(`__v.cell(${visRow}, 0)`)
  diag.cellRect = { top: r.top, height: r.height }
  const canvasTop = await evalJs(`__v.canvas.getBoundingClientRect().top`)
  diag.canvasTop = canvasTop
  // 点击覆盖行 cat 列
  const cx = r.left + r.width / 2
  const cy = r.top + 18
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(rr => setTimeout(rr, 300))`)
  const evs = await evalJs(`__v.events(4)`)
  diag.events = evs
  const cellClick = evs.find(t => t.includes('cell-click'))
  if (cellClick) {
    const rid = Number((cellClick.match(/"record":"#(\d+)"/) || [])[1])
    const ri = Number((cellClick.match(/"recordIndex":(\d+)/) || [])[1])
    diag.payload = { rid, ri }
    if (rid !== 1 || ri !== 0) throw new Error('滚动态覆盖行点击载荷非主行: ' + cellClick)
  } else {
    throw new Error('滚动态覆盖行点击无 cell-click: ' + JSON.stringify(evs.slice(0, 2)))
  }
  return diag
})

// D2: 主格文本像素（区域 pass 在锚行滚出后仍绘制主格内容）
await step('D2-anchor-region-content-pixels', async () => {
  // cat 列区域 [0,7)x{0}，滚动 150 后可视部分；主格文本「数码」在区域垂直居中（区域高 7×36=252，文本在区域中部）
  // 可视窗口内的 cat 列采样块应有文字像素（非纯背景）
  const l = await evalJs(`__v.layout()`)
  const start = l.viewRows.start
  const r0 = await evalJs(`__v.cell(${start}, 0)`)
  const blk = await evalJs(`__v.regionPixels(${r0.left + 10}, ${r0.top + 2}, 80, ${r0.height - 4})`)
  const kinds = Object.keys(blk).length
  await evalJs(`__v.scroll.scrollTop = 0`)
  await evalJs(`__v.settle(300)`)
  if (kinds < 2) throw new Error('cat 列可视区像素单一（主格文本未绘制?） uniq=' + JSON.stringify(blk).slice(0, 200))
  return { colorKinds: kinds }
})

// D3: link 条目命中（非滚动态，像素定位文字后点击）
await step('D3-link-item-pixel-click', async () => {
  const r = await evalJs(`__v.cell(1, 7)`)
  // 扫描格内像素找 link 文字色块（非白非灰背景）
  const scan = await evalJs(`__v.regionPixels(${r.left + 2}, ${r.top + 2}, ${r.width - 4}, ${r.height - 4})`)
  const bg = Object.entries(scan).sort((a, b) => b[1] - a[1])[0][0]
  // 逐行找第一个显著非背景像素的 y
  const findY = await evalJs(`(() => {
    const rect = __v.cell(1, 7); const c = __v.canvas.getBoundingClientRect(); const ctx = __v.canvas.getContext('2d')
    const x0 = Math.round(rect.left - c.left + 2), y0 = Math.round(rect.top - c.top + 2)
    const w = Math.min(rect.width - 4, 120), h = rect.height - 4
    const img = ctx.getImageData(x0, y0, w, h).data
    const bg = ${JSON.stringify(bg)}.split(',').map(Number)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const diff = Math.abs(img[i] - bg[0]) + Math.abs(img[i + 1] - bg[1]) + Math.abs(img[i + 2] - bg[2])
      if (diff > 90) return { y: rect.top + 2 + y, x: rect.left + 2 + x }
    }
    return null
  })()`)
  if (!findY) throw new Error('未找到 link 文字像素; uniq=' + JSON.stringify(scan).slice(0, 200))
  await evalJs(`__v.moveAt(${findY.x + 4}, ${findY.y})`)
  await evalJs(`__v.settle(100)`)
  await evalJs(`__v.clickAt(${findY.x + 4}, ${findY.y})`)
  await evalJs(`new Promise(rr => setTimeout(rr, 300))`)
  const evs = await evalJs(`__v.events(4)`)
  const itemEv = evs.find(t => t.includes('cell-item-click'))
  if (!itemEv) throw new Error('link 文字像素点击仍无 cell-item-click; events=' + JSON.stringify(evs.slice(0, 3)))
  return { probe: findY, itemEvent: itemEv.slice(0, 150) }
})

console.log('WARNINGS ' + JSON.stringify(consoleLines.filter(l => l.type === 'warning').slice(0, 10)))
ws.close()
process.exit(0)
