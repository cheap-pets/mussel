// demo 夹具结构冒烟：复刻 main-view.vue spanColumns/spanRecords/spanSpanMethod，
// 经组件同参 buildSpans 断言 demo 17 区域结构（12 regions / cat rowspan 7 / rest→末列）
import { buildSpans } from '@/components/table/ex/spans.js'
import { prepareColumn } from '@/components/table/ex/cell-painters.js'

const SPAN_IMG = 'data:,x'
function createSpanRecords () {
  const records = []
  let id = 0
  for (const cat of ['数码', '家居']) {
    for (const sub of ['电脑', '配件']) {
      for (let i = 0; i < 7; i++) {
        records.push({ id: ++id, cat, sub, name: `${cat}-${sub}-item-${i + 1}`, tags: i % 2 ? [{ caption: '热卖', color: 'red' }] : ['新品'], count: i + 1, img: SPAN_IMG, links: [{ caption: `链接 ${i + 1}`, color: 'primary' }] })
      }
      records.push({ id: ++id, cat: null, sub: null, name: `${cat}/${sub} 小计`, count: 28, summary: `${cat}/${sub} 小计`, isTotal: true })
    }
  }
  return records
}
const spanRecords = createSpanRecords()
const spanColumns = [
  { caption: '分类', field: 'cat', width: 100, autoRowSpan: true },
  { caption: '子类', field: 'sub', width: 100, autoRowSpan: true },
  { caption: '名称', field: 'name', width: 170, autoRowSpan: true, sortable: true, editable: true, editor: true },
  { caption: '标签', field: 'tags', type: 'tag', width: 130, autoRowSpan: true },
  { caption: '数量', field: 'count', type: 'number', width: 80, editable: true, editor: true },
  { caption: '小计', key: 'summary', field: 'summary', width: 130 },
  { caption: '图片', field: 'img', type: 'img', width: 90 },
  { caption: '链接', field: 'links', type: 'link', width: 130 }
]
function spanSpanMethod ({ record }) {
  return record?.isTotal ? { summary: { colspan: 'rest' } } : null
}

const warnings = []
const spans = buildSpans({
  records: spanRecords,
  columns: spanColumns.map(def => prepareColumn(def)),
  spanMethod: spanSpanMethod,
  flatInfo: null,
  fixedCount: 1,
  recordsOffset: 0,
  orderBy: '',
  warn: m => warnings.push(m)
})

const fail = []
const check = (label, cond) => { if (!cond) fail.push(label) }
const regions = spans.regions
check('regions=12（cat4+sub4+summary4）', regions.length === 12)
const cat = regions.filter(r => r.col === 0)
const sub = regions.filter(r => r.col === 1)
const sum = regions.filter(r => r.col === 5)
check('cat 4 段', cat.length === 4)
check('cat 段 rowspan=7', cat.every(r => r.rowspan === 7))
check('cat 段起点 [0,8,16,24]', cat.map(r => r.rowFrom).join() === '0,8,16,24')
check('sub 4 段', sub.length === 4)
check('sub 段 rowspan=7', sub.every(r => r.rowspan === 7))
check('summary 4 段', sum.length === 4)
check("summary 'rest' 展开到末列 colTo=8", sum.every(r => r.colTo === 8))
check('summary 行号 [7,15,23,31]', sum.map(r => r.row).join() === '7,15,23,31')
check('name 列无段（值唯一）', regions.filter(r => r.col === 2).length === 0)
check('tags 列 true 形态无段', regions.filter(r => r.col === 3).length === 0)
check('tags true 形态警告 ×1', warnings.filter(w => w.includes('true 形态')).length === 1)

console.log('regions=' + regions.length, 'warnings=' + warnings.length)
console.log(fail.length ? 'FAIL: ' + fail.join('; ') : 'ALL PASS')
console.log('warnings:', warnings.map(w => w.slice(0, 80)).join(' / '))
process.exit(fail.length ? 1 : 0)
