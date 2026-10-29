// D4: dpr/坐标系诊断 + 滚动态截图（demo 15 人工材料）
import { writeFileSync } from 'node:fs'
const wsUrl = process.argv[2]
let msgId = 0
const pending = new Map()
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id != null && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
const evalJs = async expression => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result?.value
}
await send('Runtime.enable')

console.log(JSON.stringify(await evalJs(`(() => {
  const c = __v.canvas
  const r = c.getBoundingClientRect()
  const dpr = window.devicePixelRatio
  const ctx = c.getContext('2d')
  const probe = (px, py) => { const d = ctx.getImageData(px, py, 1, 1).data; return [d[0], d[1], d[2], d[3]] }
  // cat 列行 3（区域 [0,7) 内）CSS 中点 → 物理 ×dpr 与不 ×dpr 各采一个
  const cell = __v.canvas && window.__canvasTable.getCellRect(3, 0)
  const cssX = cell.left + 20 - r.left
  const cssY = cell.top + 12 - r.top
  return {
    dpr, canvasW: c.width, canvasH: c.height, cssW: r.width, cssH: r.height,
    rect: { top: Math.round(r.top), left: Math.round(r.left) },
    cell30: cell,
    raw: probe(Math.round(cssX), Math.round(cssY)),
    scaled: probe(Math.round(cssX * dpr), Math.round(cssY * dpr)),
    headerRaw: probe(Math.round(cssX), 20),
    headerScaled: probe(Math.round(cssX * dpr), 40)
  }
})()`)))

// 滚动态截图（锚行滚出，区域仍可见）
await evalJs(`__v.scroll.scrollTop = 150; 'ok'`)
await evalJs(`new Promise(r => setTimeout(r, 500))`)
const shot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(new URL('./spans-scrolled.png', import.meta.url), Buffer.from(shot.data, 'base64'))
await evalJs(`__v.scroll.scrollTop = 0`)
console.log('saved evidence/spans-scrolled.png')
ws.close()
process.exit(0)
