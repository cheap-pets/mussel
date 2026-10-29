// CDP 驱动 headless Edge 验证 mu-table-ex 合并单元格 demo 14–20 场景。
// 用法：node evidence/cdp-spans-verify.mjs <wsUrl>（wsUrl 由启动脚本传入）。
// 输出：逐步骤 JSON 行（stdout），console 时间线单独输出。
import { setTimeout as sleep } from 'node:timers/promises'

const wsUrl = process.argv[2]
if (!wsUrl) { console.error('need ws url'); process.exit(2) }

let msgId = 0
const pending = new Map()
const consoleLines = [] // { step, type, text }
let currentStep = 'boot'
let closed = false

const ws = new WebSocket(wsUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })

ws.onmessage = event => {
  const msg = JSON.parse(event.data)
  if (msg.id != null && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(msg.error.message))
    else resolve(msg.result)
    return
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const { type, args } = msg.params
    const text = args.map(a => a.value ?? a.description ?? '').join(' ')
    consoleLines.push({ step: currentStep, type, text })
  }
}
ws.onclose = () => { closed = true }

function send (method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evalJs (expression) {
  const r = await send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true
  })
  if (r.exceptionDetails) {
    const d = r.exceptionDetails
    throw new Error('page eval: ' + (d.exception?.description || d.text))
  }
  return r.result?.value
}

const results = []
async function step (name, fn) {
  currentStep = name
  const entry = { step: name, ok: false }
  try {
    entry.detail = await fn()
    entry.ok = true
  } catch (err) {
    entry.error = String(err.message || err).slice(0, 500)
  }
  results.push(entry)
  console.log('STEP ' + JSON.stringify(entry))
  return entry
}

await send('Runtime.enable')
await send('Page.enable')

// 等页面就绪（自检面板渲染完成）
for (let i = 0; i < 40; i++) {
  const ready = await evalJs(`!!document.querySelector('.ct-self-checks') && !!window.__canvasTable?.getLayoutInfo?.()`)
  if (ready) break
  await sleep(500)
}
await sleep(1200)

// ---- helper 注入 ----
await evalJs(`
  window.__v = (() => {
    const canvas = document.querySelector('.mu-table-ex__canvas')
    const sticky = document.querySelector('.mu-table-ex__sticky')
    const scroll = document.querySelector('.mu-table-ex__scroll')
    const api = window.__canvasTable
    const comp = () => canvas?.__vueParentComponent ?? document.querySelector('.mu-table-ex')?.__vueParentComponent
    const spans = () => {
      const ss = comp()?.setupState
      const s = ss?.spans
      return s && typeof s === 'object' && 'value' in s ? s.value : s
    }
    const pixel = (cx, cy) => {
      const r = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      const d = ctx.getImageData(Math.round(cx - r.left), Math.round(cy - r.top), 1, 1).data
      return [d[0], d[1], d[2], d[3]]
    }
    const block = (cx, cy, w = 6, h = 4) => {
      const r = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      const d = ctx.getImageData(Math.round(cx - r.left - w / 2), Math.round(cy - r.top - h / 2), w, h).data
      const out = []
      for (let i = 0; i < d.length; i += 4) out.push(d[i] + ',' + d[i + 1] + ',' + d[i + 2])
      return out.join('|')
    }
    const cell = (row, col) => api.getCellRect(row, col)
    const center = rect => [rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 18)]
    const fire = (type, cx, cy, extra = {}) =>
      sticky.dispatchEvent(type === 'click'
        ? new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true, ...extra })
        : new PointerEvent(type, { clientX: cx, clientY: cy, bubbles: true, pointerId: 1, ...extra }))
    const clickAt = (cx, cy) => {
      fire('pointermove', cx, cy); fire('pointerdown', cx, cy); fire('pointerup', cx, cy); fire('click', cx, cy)
    }
    const moveAt = (cx, cy) => fire('pointermove', cx, cy)
    const events = n => [...document.querySelectorAll('.ct-event-log__item')].slice(0, n).map(el => el.textContent.trim())
    const layout = () => api.getLayoutInfo()
    const radio = async value => {
      const el = [...document.querySelectorAll('input[type=radio]')].find(r => r.value === value)
      if (!el) throw new Error('radio not found: ' + value)
      el.click()
    }
    const buttonByCaption = caption => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes(caption))
      if (!btn) throw new Error('button not found: ' + caption)
      btn.click()
    }
    const settle = ms => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms ?? 120))) })
    return { canvas, sticky, scroll, spans, pixel, block, cell, center, clickAt, moveAt, events, layout, radio, buttonByCaption, settle }
  })()
  'ok'
`)

// ---- S1: 切 spans 场景 + hoverMode cell ----
await step('S1-select-scene', async () => {
  await evalJs(`__v.radio('spans')`)
  await evalJs(`__v.radio('cell')`)
  await evalJs(`__v.settle(400)`)
  const layout = await evalJs(`__v.layout()`)
  const colWidthSum = layout.colWidths.reduce((a, b) => a + b, 0)
  if (!layout || layout.colWidths.length !== 8) throw new Error('colWidths len=' + layout?.colWidths?.length + '（spanColumns 应 8 列）')
  return { cols: layout.colWidths.length, sum: colWidthSum, headHeight: layout.headHeight, rowHeight: layout.rowHeight, mode: layout.rowGeometryMode }
})

// ---- S2: demo 17 区域结构（级联分组 + 小计 rest + 首列固定） ----
let baseRegions = null
await step('S2-demo17-structure', async () => {
  const s = await evalJs(`__v.spans()`)
  if (!s) throw new Error('spans 为 null')
  const regions = s.regions
  baseRegions = regions
  const catRegions = regions.filter(r => r.col === 0)
  const subRegions = regions.filter(r => r.col === 1)
  const summaryRegions = regions.filter(r => r.col === 5)
  const allCat7 = catRegions.every(r => r.rowspan === 7)
  const allSub7 = subRegions.every(r => r.rowspan === 7)
  const sumSpan = summaryRegions.map(r => r.colspan)
  const layout = await evalJs(`__v.layout()`)
  const fixedInfo = await evalJs(`(() => { const c = document.querySelector('.mu-table-ex'); const inst = c.__vueParentComponent; const p = inst?.props; return { fixed: p?.fixedLeftColumns, scene: p && 'n/a' } })()`)
  if (regions.length !== 12) throw new Error('regions=' + regions.length + '（期望 12：cat4+sub4+summary4）')
  if (catRegions.length !== 4 || !allCat7) throw new Error('cat 段 ' + JSON.stringify(catRegions))
  if (subRegions.length !== 4 || !allSub7) throw new Error('sub 段异常')
  if (summaryRegions.length !== 4) throw new Error('summary 段 ' + summaryRegions.length)
  const maxColTo = Math.max(...summaryRegions.map(r => r.colTo))
  if (maxColTo !== 8) throw new Error('summary colTo=' + maxColTo + '（rest 应展开到末列 8）')
  return { regions: regions.length, cat: catRegions.length, sub: subRegions.length, summary: summaryRegions.length, sumColspans: sumSpan, fixedLeft: fixedInfo?.fixed }
})

// ---- S3: demo 14 hover cell 残影 ----
await step('S3-demo14-hover-residue', async () => {
  // 区域 [0,7)x{0,1}：取覆盖行 row 6 的 sub 列（col 1）做 hover 目标
  const rect = await evalJs(`__v.cell(6, 1)`)
  const [cx, cy] = await evalJs(`__v.center(__v.cell(6, 1))`)
  await evalJs(`__v.settle(150)`)
  const baseline = await evalJs(`__v.block(${cx}, ${cy})`)
  await evalJs(`__v.moveAt(${cx}, ${cy})`)
  await evalJs(`__v.settle(200)`)
  const hovered = await evalJs(`__v.block(${cx}, ${cy})`)
  if (baseline === hovered) throw new Error('hover 后区域像素无变化（cell 模式高亮未生效或采样点未变）')
  // 移出到表头区上方（sticky 之外/表头），等待重绘
  const head = await evalJs(`__v.layout()`)
  const outX = 30, outY = 8
  await evalJs(`__v.moveAt(${outX}, ${outY})`)
  await evalJs(`__v.settle(250)`)
  const recovered = await evalJs(`__v.block(${cx}, ${cy})`)
  if (recovered !== baseline) throw new Error('移出后像素未恢复（残影）: base=' + baseline.slice(0, 60) + ' got=' + recovered.slice(0, 60))
  return { baselineChanged: true, recovered: 'baseline-equal', probe: baseline.split('|')[0] }
})

// ---- S4: demo 18 载荷主行 + demo 16a 选中底色随动 ----
await step('S4-demo18-payload-anchor', async () => {
  // 点击覆盖格 (2, 0)（分类列 covered，物理行 2 = item-3 id 3）→ 载荷应为主行 id 1
  const [cx, cy] = await evalJs(`__v.center(__v.cell(2, 0))`)
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`__v.settle(250)`)
  const evs = await evalJs(`__v.events(4)`)
  const cellClick = evs.find(t => t.includes('cell-click'))
  if (!cellClick) throw new Error('无 cell-click 事件：' + JSON.stringify(evs))
  let payload = cellClick.slice(cellClick.indexOf('{'))
  let obj
  try { obj = JSON.parse(payload.replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"')) } catch { obj = null }
  // 日志文本解析不稳，退回正则取 id
  const idm = cellClick.match(/"id"\s*:\s*(\d+)/) || cellClick.match(/id["']?\s*[:=]\s*(\d+)/)
  const clickedId = idm ? Number(idm[1]) : null
  if (clickedId !== 1) throw new Error('cell-click 载荷 id=' + clickedId + '（期望主行 id 1）: ' + cellClick)
  // 选中随动：覆盖行 (6,1) 底色应变为选中色（与 hover 移出后的基线不同）
  const [sx, sy] = await evalJs(`__v.center(__v.cell(6, 1))`)
  const afterSelect = await evalJs(`__v.block(${sx}, ${sy})`)
  const base = await evalJs(`__v.block(${cx}, ${cy})`)
  if (afterSelect === base) throw new Error('覆盖行底色未随锚行选中变化')
  return { payloadId: clickedId, logHead: evs[0]?.slice(0, 120), coveredRowTinted: true }
})

// ---- S5: demo 16b 覆盖行受控选中警告 ----
await step('S5-demo16-covered-selected-warn', async () => {
  await evalJs(`__v.buttonByCaption('选中覆盖行')`)
  await evalJs(`__v.settle(300)`)
  const evs = await evalJs(`__v.events(3)`)
  const warns = consoleLines.filter(l => l.step === 'S5-demo16-covered-selected-warn' && l.type === 'warning')
  const hit = warns.find(w => w.text.includes('覆盖') || w.text.includes('选中'))
  if (!hit) throw new Error('未捕获覆盖行受控选中警告; warns=' + JSON.stringify(warns.map(w => w.text.slice(0, 80))))
  return { warn: hit.text.slice(0, 140), logHead: evs[0]?.slice(0, 100) }
})

// ---- S6: demo 15 锚行滚出窗口：区域内条目可点 + img 可见 ----
await step('S6-demo15-anchor-out-of-view', async () => {
  // 滚动 3 行（rowHeight 默认段；spans 场景 rows 有数组值列 → 变高，用比例滚动 120px 确保锚行滚出表头底）
  const before = await evalJs(`__v.layout()`)
  await evalJs(`__v.scroll.scrollTop = 150`)
  await evalJs(`new Promise(r => setTimeout(r, 350))`)
  const layout = await evalJs(`__v.layout()`)
  if (layout.viewRows.start === 0) throw new Error('滚动未生效 viewRows.start=' + layout.viewRows.start)
  // 点击可视行的链接格（col 7）：行 5（区域 [0,7) 内、锚行 0 之外）
  const [cx, cy] = await evalJs(`__v.center(__v.cell(5, 7))`)
  // link 条目贴首行槽位锚，点格内偏上位置
  const rect = await evalJs(`__v.cell(5, 7)`)
  const ly = rect.top + 14
  await evalJs(`__v.moveAt(${cx}, ${ly})`)
  await evalJs(`__v.settle(120)`)
  await evalJs(`__v.clickAt(${cx}, ${ly})`)
  await evalJs(`new Promise(r => setTimeout(r, 250))`)
  const evs = await evalJs(`__v.events(6)`)
  const itemClick = evs.find(t => t.includes('cell-item-click'))
  if (!itemClick) throw new Error('锚行滚出后条目点击无 cell-item-click：' + JSON.stringify(evs.slice(0, 3)))
  const idm = itemClick.match(/id["']?\s*[:=]\s*["']?(\d+)/)
  // img 列（col 6）可视行像素非空（图片加载重绘后应含 IMG 蓝底）
  await evalJs(`new Promise(r => setTimeout(r, 400))`)
  const [ix, iy] = await evalJs(`__v.center(__v.cell(4, 6))`)
  const imgPx = await evalJs(`__v.pixel(${ix}, ${iy})`)
  const imgVisible = imgPx[3] > 0 && !(imgPx[0] > 240 && imgPx[1] > 240 && imgPx[2] > 240)
  await evalJs(`__v.scroll.scrollTop = 0`)
  await evalJs(`__v.settle(250)`)
  return { itemClick: itemClick.slice(0, 140), itemId: idm?.[1], imgPixel: imgPx, imgVisible }
})

// ---- S7: demo 20 排序重算 + dev 警告 ----
await step('S7-demo20-sort-rewarn', async () => {
  const layout = await evalJs(`__v.layout()`)
  // 名称列 = col 2；表头 x = 前缀和（48? 无 check 列——spanColumns 无 check；colWidths[0..1] 前缀 + 一半宽）
  const cw = layout.colWidths
  const hx = cw[0] + cw[1] + cw[2] / 2
  const hy = layout.headHeight / 2
  const canvasRect = await evalJs(`(() => { const r = __v.canvas.getBoundingClientRect(); return { left: r.left, top: r.top } })()`)
  const cx = canvasRect.left + hx
  const cy = canvasRect.top + hy
  const beforeRefs = await evalJs(`(() => { const s = __v.spans(); return { n: s.regions.length, cat7: s.regions.filter(r => r.col === 0 && r.rowspan === 7).length } })()`)
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(r => setTimeout(r, 350))`)
  const evs = await evalJs(`__v.events(5)`)
  const orderEv = evs.find(t => t.includes('order-by'))
  const warns = consoleLines.filter(l => l.step === 'S7-demo20-sort-rewarn' && l.type === 'warning')
  const sortWarn = warns.find(w => (w.text.includes('排序') || w.text.includes('orderBy')) && (w.text.includes('合并') || w.text.includes('RowSpan') || w.text.includes('autoRowSpan')))
  const afterRefs = await evalJs(`(() => { const s = __v.spans(); return { n: s.regions.length, cat7: s.regions.filter(r => r.col === 0 && r.rowspan === 7).length } })()`)
  // 还原排序（再点两次：desc → 无）
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(r => setTimeout(r, 250))`)
  await evalJs(`__v.clickAt(${cx}, ${cy})`)
  await evalJs(`new Promise(r => setTimeout(r, 250))`)
  if (!orderEv) throw new Error('无 order-by 事件：' + JSON.stringify(evs.slice(0, 3)))
  if (!sortWarn) throw new Error('未捕获排序+autoRowSpan dev 警告; warns=' + JSON.stringify(warns.map(w => w.text.slice(0, 90))))
  return { orderEv: orderEv.slice(0, 90), before: beforeRefs, after: afterRefs, warn: sortWarn.text.slice(0, 140), regionsChanged: beforeRefs.n !== afterRefs.n || beforeRefs.cat7 !== afterRefs.cat7 }
})

// ---- S8: demo 17 截图（人工材料） ----
await step('S8-demo17-screenshot', async () => {
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(new URL('./spans-scene.png', import.meta.url), Buffer.from(shot.data, 'base64'))
  return 'evidence/spans-scene.png'
})

// ---- S9: demo 19 树跨父不合并 ----
await step('S9-demo19-tree-no-merge', async () => {
  await evalJs(`__v.radio('tree')`)
  await evalJs(`__v.settle(400)`)
  const s1 = await evalJs(`__v.spans()`)
  // 数量列（col 2）区域若存在，覆盖行必须与锚行同父链；并断言已知跨父同值不合并：
  // collapseAll 后只有根行，count=(i*7)%900 各异 → 数量列应无区域
  await evalJs(`window.__canvasTable.collapseAll()`)
  await evalJs(`__v.settle(350)`)
  const sCollapsed = await evalJs(`__v.spans()`)
  const countRegionsCollapsed = sCollapsed ? sCollapsed.regions.filter(r => r.col === 2) : []
  await evalJs(`window.__canvasTable.expandAll()`)
  await evalJs(`__v.settle(350)`)
  const sExpanded = await evalJs(`__v.spans()`)
  // 展开态：深层节点 90002/90003 同父（父 90001）count 2/3 不同值；跨父同值段才是缺陷。
  // 通用判据：每个 count 区域内所有行的 parentKeys 链一致
  let crossParent = null
  if (sExpanded) {
    const flat = await evalJs(`(() => { const inst = document.querySelector('.mu-table-ex').__vueParentComponent; const ps = inst?.setupState?.flatInfo ?? inst?.ctx?.flatInfo; const f = ps && 'value' in ps ? ps.value : ps; return f?.parentKeys ? { pk: f.parentKeys, rows: f.rows?.map(r => r.record?.count) } : null })()`)
    if (flat?.pk) {
      for (const r of sExpanded.regions.filter(r => r.col === 2)) {
        const chain = i => JSON.stringify(flat.pk[i])
        for (let i = r.rowFrom + 1; i < r.rowTo; i++) {
          if (flat.pk[i] !== flat.pk[r.rowFrom]) { crossParent = { region: r, rowFrom: r.rowFrom, row: i }; break }
        }
        if (crossParent) break
      }
    }
  }
  if (countRegionsCollapsed.length !== 0) throw new Error('收起态数量列仍有合并区域: ' + JSON.stringify(countRegionsCollapsed))
  if (crossParent) throw new Error('跨父合并: ' + JSON.stringify(crossParent))
  return { collapsedCountRegions: 0, expandedRegions: sExpanded?.regions?.length ?? 0, crossParent: null }
})

// ---- S10: 回默认场景（null 分支常态）无新增 error ----
await step('S10-default-scene-no-error', async () => {
  const errBefore = consoleLines.filter(l => l.type === 'error').length
  await evalJs(`__v.radio('default')`)
  await evalJs(`__v.settle(400)`)
  const errs = consoleLines.filter(l => l.type === 'error')
  return { newErrors: errs.length - errBefore }
})

console.log('CONSOLE ' + JSON.stringify(consoleLines.filter(l => l.type === 'warning' || l.type === 'error').slice(0, 40)))
console.log('DONE')
ws.close()
process.exit(0)
