// 探针 1：ListColumn/LinkColumn compile 产物 .count 语义（cell-painters 模块
// 依赖 canvas，此处直验 compile 本体——render 主体纯对象构造，Node 可跑）。
// 探针 2：wrapCache LRU「淘汰重算前后结果逐字节一致」（测试计划 AC4 断言，
// self-checks 未落地该项，由 verifier 独立补验）。
globalThis.__version__ = '0.0.0-verify'
globalThis.__env__ = 'development'

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./loader-hooks.mjs', import.meta.url)

const ROOT = 'D:/workshop/cheap-pets/mussel'

const assert = (cond, msg) => {
  if (!cond) throw new Error('ASSERT: ' + msg)
}
const assertEqual = (actual, expected, msg) => {
  if (actual !== expected) throw new Error(`ASSERT: ${msg}（actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}）`)
}

let pass = 0
let fail = 0

const run = (label, fn) => {
  try {
    fn()
    pass++
    console.log(`PASS ${label}`)
  } catch (e) {
    fail++
    console.log(`FAIL ${label} :: ${e.message}`)
  }
}

const { ListColumn } = await import(pathToFileURL(`${ROOT}/src/components/table/column-types/list.js`).href)
const { LinkColumn } = await import(pathToFileURL(`${ROOT}/src/components/table/column-types/link.js`).href)

// —— 探针 1：count 产物语义（对齐 cell-painters 新增断言口径） ——

run('count 语义: canvas 挂 count / dom 不挂', () => {
  assert(typeof ListColumn.compile({ listOption: { max: 4 } }).count === 'function', 'canvas 应挂 .count')
  const domRender = ListColumn.compile({}, true)
  assert(typeof domRender.count !== 'function', 'dom 产物不挂 .count')
})

run('count 语义: 非数组/对象/空数组 → 0', () => {
  const r = ListColumn.compile({ listOption: { max: 4 } })
  assertEqual(r.count({}, '标量'), 0, '标量')
  assertEqual(r.count({}, { label: '对象' }), 0, '对象')
  assertEqual(r.count({}, []), 0, '空数组')
})

run('count 语义: 空 label 过滤后计数', () => {
  const r = ListColumn.compile({ listOption: { max: 4 } })
  assertEqual(r.count({}, ['a', { label: '' }, { caption: '旧键' }, 'b']), 2, '过滤后 2')
})

run('count 语义: count ≡ 渲染 items.length（各 max 形态）', () => {
  for (const max of [3, 4, -1, 2.5, '2', 0, undefined]) {
    const col = { listOption: max === undefined ? {} : { max } }
    const value = ['a', 'b', 'c', 'd', 'e']
    const render = ListColumn.compile(col)
    const items = render({ record: {}, value, emit: () => {} })
    const expected = items === undefined ? 0 : items.items.length
    assertEqual(render.count({}, value), expected, `max=${String(max)} count ≡ items.length`)
  }
})

run('count 语义: 负/小数/字符串 max slice 截断', () => {
  assertEqual(ListColumn.compile({ listOption: { max: 3 } }).count({}, ['a', 'b', 'c', 'd', 'e']), 3, 'max=3')
  assertEqual(ListColumn.compile({ listOption: { max: -1 } }).count({}, ['a', 'b', 'c', 'd', 'e']), 4, 'max=-1 slice 去末条')
  assertEqual(ListColumn.compile({ listOption: { max: 2.5 } }).count({}, ['a', 'b', 'c']), 2, 'max=2.5')
  assertEqual(ListColumn.compile({ listOption: { max: '2' } }).count({}, ['a', 'b', 'c']), 2, "max='2'")
})

run('count 语义: LinkColumn 委托（单值/数组/过滤/max 截断）', () => {
  const r = LinkColumn.compile({})
  assert(typeof r.count === 'function', 'Link 委托产物挂 .count')
  assertEqual(r.count({}, 12345), 1, '单值包装 1')
  assertEqual(r.count({}, [{ label: 'A', danger: true }, 'B', { label: '' }]), 2, '数组过滤后 2')
  assertEqual(LinkColumn.compile({ linkOption: { max: 1 } }).count({}, ['a', 'b']), 1, 'linkOption.max 截断')
})

// —— 探针 2：LRU 淘汰重算逐字节一致 ——

const { wrapLines, createWrapCache } = await import(pathToFileURL(`${ROOT}/src/components/table/ex/shared/text-wrap.js`).href)

// 接近真实 CJK 文本的 measure：签名 (text, font)——wrapLines 以 measure(source, font) 调用
const measure = (text) => [...text].length * 10

run('LRU 一致性: 同输入淘汰重算前后 lines/lineCount 逐字相等（随机冷键 200 组）', () => {
  const cache = createWrapCache(5)
  const inputs = []

  for (let i = 0; i < 200; i++) {
    const len = 1 + (i * 7) % 25
    const text = Array.from({ length: len }, (_, j) => String.fromCharCode(0x4e00 + ((i * 13 + j * 31) % 500))).join('')
    inputs.push({ text, font: '14px test-font', maxWidth: 40 + (i % 6) * 10, maxLines: i % 4 })
  }

  // 预热后超出 limit，触发逐条淘汰；每个 key 淘汰前后各折行一次，逐字节比对
  const first = new Map()
  for (const input of inputs) {
    const r = wrapLines({ ...input, measure, cache })
    first.set(JSON.stringify([input.text, input.font, input.maxWidth, input.maxLines]), JSON.stringify({ lines: r.lines, lineCount: r.lineCount, clamped: r.clamped }))
  }

  // 全部已被淘汰（200 > 5）：重算并比对
  let mismatches = 0
  for (const input of inputs) {
    const r = wrapLines({ ...input, measure, cache: createWrapCache(5) })
    const key = JSON.stringify([input.text, input.font, input.maxWidth, input.maxLines])
    if (first.get(key) !== JSON.stringify({ lines: r.lines, lineCount: r.lineCount, clamped: r.clamped })) mismatches++
  }

  assertEqual(mismatches, 0, '200 组淘汰重算全部逐字一致')
})

run('LRU 一致性: 命中路径与冷算路径结果逐字相等（get 触碰前后）', () => {
  const cache = createWrapCache(3)
  const mk = text => ({ text, font: '14px f', maxWidth: 50, maxLines: 2, measure })

  const cold = wrapLines({ ...mk('甲乙丙丁戊己'), cache: createWrapCache(3) })

  const r1 = wrapLines({ ...mk('甲乙丙丁戊己'), cache }) // 首算（写缓存）
  wrapLines({ ...mk('丁一'), cache }) // 填充
  wrapLines({ ...mk('丁二'), cache })
  wrapLines({ ...mk('丁三'), cache })
  const r2 = wrapLines({ ...mk('甲乙丙丁戊己'), cache }) // 已淘汰 → 重算

  assertEqual(JSON.stringify(r1), JSON.stringify(cold), '首算与冷算一致')
  assertEqual(JSON.stringify(r2), JSON.stringify(cold), '淘汰重算与冷算一致')
})

console.log(`PROBE TOTAL: ${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
