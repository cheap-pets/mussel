// 20261106-table-ex-foldering 验证冒烟（基于 20261105-table-ex-refactor/evidence/smoke-interaction.mjs 适配）：
// 新增单元格选中（col2 名称格点击 → selectedCell）/ Ctrl+C 复制（writeText 记录器比对
// records[0].name）/ 方向键移动（ArrowDown/Right/Left）；编辑浮层断言移后（编辑态与
// 选中互斥）；编辑打开后追断 selectedCell 清空。自检 223/223 + console 无错误同基准。
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

  // 自检摘要（等自检跑完：摘要出现 N/M 数字）
  let summaryText = ''
  for (let i = 0; i < 100 && !/\\d+\\/\\d+/.test(summaryText); i++) {
    summaryText = document.querySelector('.ct-self-checks .ct-debug__header span')?.textContent || ''
    if (!/\\d+\\/\\d+/.test(summaryText)) await sleep(100)
  }
  const m = summaryText.match(/（(\\d+)\\/(\\d+)\\s*通过）/)
  const summary = { passed: m ? +m[1] : null, total: m ? +m[2] : null, text: summaryText }
  const fails = document.querySelectorAll('.ct-check-item--fail').length

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

  // —— 单元格选中：col2 名称（不可编辑）→ selectedCell {row:0,col:2} ——
  fire(2)
  await sleep(150)
  const sel = inst.getLayoutInfo().selectedCell

  // —— Ctrl+C 复制：writeText 记录器捕获（无权限依赖） ——
  const copies = []
  let clipAvailable = false
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    clipAvailable = true
    navigator.clipboard.writeText = t => { copies.push(String(t)); return Promise.resolve() }
  }
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', ctrlKey: true, bubbles: true, cancelable: true }))
  await sleep(200)
  const stageRecords = window.__ctStage?.()?.records
  const expectedCopy = stageRecords?.[0]?.name != null ? String(stageRecords[0].name) : null

  // —— 方向键移动 ——
  const arrow = key => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  arrow('ArrowDown'); await sleep(150)
  const selDown = inst.getLayoutInfo().selectedCell
  arrow('ArrowRight'); await sleep(150)
  const selRight = inst.getLayoutInfo().selectedCell
  arrow('ArrowLeft'); await sleep(150)
  const selLeft = inst.getLayoutInfo().selectedCell

  // —— 编辑浮层（可编辑列 3-8 依次回退）；编辑态应清空单元格选中 ——
  const before = document.querySelectorAll('.ct-event-log__item').length
  let editor = false
  for (const col of [3, 4, 5, 6, 7, 8]) {
    fire(col)
    await sleep(150)
    editor = !!document.querySelector('.mu-table-ex__editor')
    if (editor) break
  }
  const after = document.querySelectorAll('.ct-event-log__item').length
  const selAfterEditor = inst.getLayoutInfo().selectedCell

  // —— 滚动 ——
  const scrollEl = document.querySelector('.mu-table-ex__scroll')
  const v0 = JSON.stringify(inst.getLayoutInfo().viewRows)
  scrollEl.scrollTop = 120
  scrollEl.dispatchEvent(new Event('scroll'))
  await sleep(250)
  const v1 = JSON.stringify(inst.getLayoutInfo().viewRows)
  return {
    ok: true,
    summary,
    fails,
    canvas: [canvas.width, canvas.height],
    sel, selDown, selRight, selLeft,
    clipAvailable, copied: copies, expectedCopy,
    editor, selAfterEditor,
    logDelta: after - before,
    viewChanged: v0 !== v1,
    scrollTop: scrollEl.scrollTop
  }
})()`

const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
const r = result.value ?? {}
const eq = (a, b) => a && b && a.row === b.row && a.col === b.col
const summaryOk = r.summary && r.summary.passed === 223 && r.summary.total === 223
const selOk = eq(r.sel, { row: 0, col: 2 })
const copyOk = r.clipAvailable && r.copied?.length === 1 && r.copied[0] !== '' &&
  (r.expectedCopy == null || r.copied[0] === r.expectedCopy)
const arrowOk = eq(r.selDown, { row: 1, col: 2 }) && eq(r.selRight, { row: 1, col: 3 }) &&
  eq(r.selLeft, { row: 1, col: 2 })
const editorOk = r.editor && r.selAfterEditor === null && r.logDelta > 0
const scrollOk = r.viewChanged && r.scrollTop > 0
const canvasOk = r.canvas?.[0] > 0 && r.canvas?.[1] > 0
const pass = r.ok && summaryOk && r.fails === 0 && canvasOk && selOk && copyOk &&
  arrowOk && editorOk && scrollOk && errors.length === 0
console.log(JSON.stringify({
  pass, summaryOk, selOk, copyOk, arrowOk, editorOk, scrollOk, canvasOk,
  ...r, errors
}))
ws.close()
process.exit(pass ? 0 : 1)
