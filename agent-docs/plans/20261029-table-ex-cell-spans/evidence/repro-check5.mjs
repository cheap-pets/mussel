// 复现 spans 自检 5（spanMethod 键解析）中「重叠丢弃警告带坐标」断言的实际警告文案
import { buildSpans } from '@/components/table/ex/spans.js'
import { prepareColumn } from '@/components/table/ex/cell-painters.js'

const prep = defs => defs.map(def => prepareColumn(def))

const columns = prep([
  { caption: '键列', key: 'ka', field: 'fa' },
  { caption: '甲', field: 'fb' },
  { caption: '乙', field: 'fb' },
  { caption: '键优先', key: 'kb', field: 'fb' },
  { caption: '丁', field: 'fd' }
])
const records = [{}, {}, {}]
const messages = []
const spans = buildSpans({
  records,
  columns,
  recordsOffset: 100,
  spanMethod: ({ recordIndex }) => (recordIndex !== 0 ? null : { ka: 2, kb: 3, fb: 2, ghost: 2 }),
  warn: message => messages.push(message)
})

console.log('anchors(0,3).rowspan =', spans.anchors.get(0).get(3).rowspan)
console.log('anchors(1,3) =', spans.anchors.get(1)?.get(3))
console.log('captured warnings:')
for (const m of messages) console.log('  -', JSON.stringify(m))
console.log('assert includes("(1, 3)") =', messages.some(m => m.includes('重叠') && m.includes('(1, 3)')))
