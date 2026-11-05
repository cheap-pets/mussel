// 02-design.md 附录 A 交互冒烟脚本（逐字照抄，仅存档于 evidence/；任务目录不入库）
const port = 9333
const deadline = Date.now() + 15000
let target = null
while (!target && Date.now() < deadline) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    target = list.find(t => t.type === 'page' && t.url.includes('/data/table-ex/'))
  } catch {}
  if (!target) await new Promise(r => setTimeout(r, 300))
}
if (!target) { console.error('FAIL: no page target'); process.exit(1) }

const ws = new WebSocket(target.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); return }
  if (msg.method === 'Runtime.exceptionThrown') errors.push('exception')
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console.error')
})
await new Promise(r => ws.addEventListener('open', r))
const send = (method, params = {}) => new Promise(r => {
  const id = ++seq
  pending.set(id, r)
  ws.send(JSON.stringify({ id, method, params }))
})
await send('Runtime.enable')

const expression = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const deadline = Date.now() + 10000
  while (!window.__canvasTable && Date.now() < deadline) await sleep(100)
  const inst = window.__canvasTable
  const sticky = document.querySelector('.mu-table-ex__sticky')
  const canvas = document.querySelector('.mu-table-ex__canvas')
  if (!inst || !sticky || !canvas) return { ok: false, reason: 'not ready' }
  const layout = inst.getLayoutInfo()
  const rect = canvas.getBoundingClientRect()
  const fire = col => {
    let x = 0
    for (let i = 0; i <= col; i++) x += layout.colWidths[i]
    x -= layout.colWidths[col] / 2
    const opts = { bubbles: true, clientX: rect.left + x, clientY: rect.top + layout.headHeight + 18 }
    sticky.dispatchEvent(new PointerEvent('pointerdown', opts))
    sticky.dispatchEvent(new PointerEvent('pointerup', opts))
    sticky.dispatchEvent(new MouseEvent('click', opts))
  }
  const before = document.querySelectorAll('.ct-event-log__item').length
  let editor = false
  for (const col of [3, 4, 5, 6, 7, 8]) {
    fire(col)
    await sleep(150)
    editor = !!document.querySelector('.mu-table-ex__editor')
    if (editor) break
  }
  const after = document.querySelectorAll('.ct-event-log__item').length
  const scrollEl = document.querySelector('.mu-table-ex__scroll')
  const v0 = JSON.stringify(inst.getLayoutInfo().viewRows)
  scrollEl.scrollTop = 120
  scrollEl.dispatchEvent(new Event('scroll'))
  await sleep(250)
  const v1 = JSON.stringify(inst.getLayoutInfo().viewRows)
  return {
    ok: true,
    summary: document.querySelector('.ct-self-checks .ct-debug__header span')?.textContent,
    fails: document.querySelectorAll('.ct-check-item--fail').length,
    canvas: [canvas.width, canvas.height],
    editor,
    logDelta: after - before,
    viewChanged: v0 !== v1,
    scrollTop: scrollEl.scrollTop
  }
})()`

const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
const r = result.value ?? {}
const pass = r.ok && r.fails === 0 && r.canvas?.[0] > 0 && r.canvas?.[1] > 0 &&
  r.editor && r.logDelta > 0 && r.viewChanged && r.scrollTop > 0 && errors.length === 0
console.log(JSON.stringify({ pass, ...r, errors }))
ws.close()
process.exit(pass ? 0 : 1)
