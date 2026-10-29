// 诊断：组件实例上 spans/flatInfo 的可读路径
const wsUrl = process.argv[2]
let msgId = 0
const pending = new Map()
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id != null && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise(res => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })) })
const evalJs = async expression => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  return r.exceptionDetails ? 'ERR: ' + r.exceptionDetails.exception?.description : r.result?.value
}
await send('Runtime.enable')

console.log(await evalJs(`(() => {
  const root = document.querySelector('.mu-table-ex')
  const inst = root?.__vueParentComponent
  if (!inst) return 'no instance'
  const out = { type: inst.type?.name || inst.type?.__name }
  const ss = inst.setupState
  out.ssKeys = ss ? Object.keys(ss).slice(0, 60) : null
  out.ssHasSpans = ss ? 'spans' in ss : null
  const raw = ss && ss.spans
  out.spansRaw = raw && typeof raw === 'object' ? { isRef: 'value' in raw, isNull: raw.value === null, regions: raw.value?.regions?.length } : String(raw)
  // paintState 路径
  const ps = inst.ctx?.paintState ?? inst.setupState?.paintState
  out.paintStateSpans = ps ? (ps.spans ? ps.spans.regions?.length : 'ps-no-spans') : 'no-ps'
  // flatInfo
  const fi = inst.setupState?.flatRows
  out.flatRows = fi ? ('value' in fi ? { hasPk: !!fi.value?.parentKeys, n: fi.value?.rows?.length } : 'raw') : 'none'
  return JSON.stringify(out)
})()`))
ws.close()
process.exit(0)
