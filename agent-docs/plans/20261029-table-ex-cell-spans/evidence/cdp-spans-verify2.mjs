// CDP v2：修复读取路径后的行为级断言（demo 18 载荷 / 15 条目+img / 20 排序警告）
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
const results = []
async function step (name, fn) {
  currentStep = name
  const entry = { step: name, ok: false }
  try { entry.detail = await fn(); entry.ok = true } catch (err) { entry.error = String(err.message || err).slice(0, 600) }
  results.push(entry)
  console.log('STEP ' + JSON.stringify(entry))
}
await send('Runtime.enable')
await send('Page.enable')
for (let i = 0; i < 30; i++) {
  if (await evalJs(`!!window.__canvasTable?.getLayoutInfo?.()`)) break
  await sleep(500)
}

// helper（同 v1）
await evalJs(`
  window.__v = (() => {
    const canvas = document.querySelector('.mu-table-ex__canvas')
    const sticky = document.querySelector('.mu-table-ex__sticky')
    const scroll = document.querySelector('.mu-table-ex__scroll')
    const api = window.__canvasTable
    const pixel = (cx, cy) => { const r = canvas.getBoundingClientRect(); const d = canvas.getContext('2d').getImageData(Math.round(cx - r.left), Math.round(cy - r.top), 1, 1).data; return [d[0], d[1], d[2], d[3]] }
    const cell = (row, col) => api.getCellRect(row, col)
    const fire = (type, cx, cy) => sticky.dispatchEvent(type === 'click' ? new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }) : new PointerEvent(type, { clientX: cx, clientY: cy, bubbles: true, pointerId: 1 }))
    const clickAt = (cx, cy) => { fire('pointermove', cx, cy); fire('pointerdown', cx, cy); fire('pointerup', cx, cy); fire('click', cx, cy) }
    const moveAt = (cx, cy) => fire('pointermove', cx, cy)
    const events = n => [...document.querySelectorAll('.ct-event-log__item')].slice(0, n).map(el => el.textContent.trim())
    const layout = () => api.getLayoutInfo()
    const radio = value => { const el = [...document.querySelectorAll('input[type=radio]')].find(r => r.value === value); if (!el) throw new Error('radio ' + value); el.click() }
    const settle = ms => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms ?? 120))) })
    return { canvas, sticky, scroll, pixel, cell, clickAt, moveAt, events, layout, radio, settle }
  })()
  'ok'
`)

// 切 spans 场景
await step('R1-select-scene', async () => {
  await evalJs(`__v.radio('spans')`)
  await evalJs(`__v.settle(400)`)
  const l = await evalJs(`__v.layout()`)
  if (l.colWidths.length !== 8) throw new Error('cols=' + l.colWidths.length)
  return { cols: l.colWidths.length }
})

// demo 18：合并格点击载荷主行（覆盖格 (2,0) 与 (5,2)）
await step('R2-demo18-payload-anchor', async () => {
  const out = {}
  for (const [row, col] of [[2, 0], [5, 2]]) {
    const r = await evalJs(`__v.cell(${row}, ${col})`)
    const cx = r.left + r.width / 2
    const cy = r.top + 18
    await evalJs(`__v.clickAt(${cx}, ${cy})`)
    await evalJs(`__v.settle(250)`)
    const ev = (await evalJs(`__v.events(3)`)).find(t => t.includes('cell-click'))
    if (!ev) throw new Error('row ' + row + ' 无 cell-click')
    const m = ev.match(/"record":"#(\d+)"/)
    const ri = ev.match(/"recordIndex":(\d+)/)
    const rid = m ? Number(m[1]) : null
    const recordIndex = ri ? Number(ri[1]) : null
    if (rid !== 1 || recordIndex !== 0) throw new Error(`cell(${row},${col}) 载荷 record=${rid} recordIndex=${recordIndex}（期望主行 #1/0）: ` + ev)
    out['cell_' + row + '_' + col] = { record: '#' + rid, recordIndex }
  }
  return out
})

// demo 15：锚行滚出 → 链接条目可点（y 扫描命中 pill）+ img 列像素
await step('R3-demo15-anchor-out-items-img', async () => {
  await evalJs(`__v.scroll.scrollTop = 150`)
  await evalJs(`new Promise(r => setTimeout(r, 350))`)
  const layout = await evalJs(`__v.layout()`)
  if (layout.viewRows.start === 0) throw new Error('滚动未生效')
  const r = await evalJs(`__v.cell(5, 7)`)
  const cx = r.left + r.width / 2
  let itemEv = null
  for (const dy of [10, 14, 18, 22, 26, 30]) {
    await evalJs(`__v.moveAt(${cx}, ${r.top + dy})`)
    await evalJs(`__v.settle(80)`)
    await evalJs(`__v.clickAt(${cx}, ${r.top + dy})`)
    await evalJs(`new Promise(rr => setTimeout(rr, 220))`)
    const ev = (await evalJs(`__v.events(3)`)).find(t => t.includes('cell-item-click'))
    if (ev) { itemEv = ev; break }
  }
  if (!itemEv) throw new Error('y 扫描未命中链接条目')
  await evalJs(`new Promise(rr => setTimeout(rr, 500))`)
  const ir = await evalJs(`__v.cell(4, 6)`)
  const imgPx = await evalJs(`__v.pixel(${ir.left + ir.width / 2}, ${ir.top + Math.min(ir.height / 2, 18)})`)
  const imgVisible = imgPx[3] > 0 && !(imgPx[0] > 235 && imgPx[1] > 235 && imgPx[2] > 235)
  await evalJs(`__v.scroll.scrollTop = 0`)
  await evalJs(`__v.settle(250)`)
  return { itemEvent: itemEv.slice(0, 150), imgPixel: imgPx, imgVisible }
})

// demo 20：表头排序 → order-by 事件 + orderBy/autoRowSpan dev 警告
await step('R4-demo20-sort-warn', async () => {
  const l = await evalJs(`__v.layout()`)
  const cw = l.colWidths
  const hx = cw[0] + cw[1] + cw[2] / 2
  const cr = await evalJs(`(() => { const r = __v.canvas.getBoundingClientRect(); return { left: r.left, top: r.top } })()`)
  const cx = cr.left + hx
  const cy = cr.top + l.headHeight / 2
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(r => setTimeout(r, 400))`)
  const evs = await evalJs(`__v.events(5)`)
  const orderEv = evs.find(t => t.includes('order-by'))
  const warn = consoleLines.filter(c => c.step === 'R4-demo20-sort-warn' && c.type === 'warning').map(c => c.text)
  const sortWarn = warn.find(t => t.includes('orderBy') && t.includes('autoRowSpan'))
  // 恢复无排序（asc → desc → 无）
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(r => setTimeout(r, 250))`)
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(r => setTimeout(r, 250))`)
  if (!orderEv) throw new Error('无 order-by 事件: ' + JSON.stringify(evs.slice(0, 3)))
  if (!sortWarn) throw new Error('未捕获 orderBy+autoRowSpan 警告: ' + JSON.stringify(warn.slice(0, 4)))
  return { orderEvent: orderEv.slice(0, 90), warn: sortWarn.slice(0, 150) }
})

console.log('WARNINGS ' + JSON.stringify(consoleLines.filter(l => l.type === 'warning').slice(0, 20)))
ws.close()
process.exit(0)
