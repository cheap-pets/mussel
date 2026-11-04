// 验证员自查 A/B bench：HEAD（b3528d7）vs 工作区 computeRowHeights 估高本体
// 用法：node agent-docs/plans/20261105-measure-perf-apply/evidence/ab-estimate-bench.mjs
// 产物：stdout JSON + 同目录 b4-2-ab-node.json；不触碰仓库源码（旧版经 git show 读入）
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..', '..') // → mussel 仓库根
const EX = 'src/components/table/ex/'

function oldSource (fsPath) {
  // fsPath 形如 src/components/table/ex/row-geometry.js
  return execFileSync('git', ['-C', ROOT, 'show', 'HEAD:' + fsPath.replace(/\\/g, '/')], { encoding: 'utf8' })
}

function newSource (fsPath) {
  return readFileSync(join(ROOT, fsPath), 'utf8')
}

const WARN_STUB = "export function warn () {}\nexport function warnOnce () {}\n"

// 以 data: URL 组装模块树（不写临时文件）：deps 按来源树解析
async function buildTree (getSource, entryFsPath) {
  const cache = new Map()

  function dataUrlOf (fsPath) {
    if (cache.has(fsPath)) return cache.get(fsPath)
    const code = fsPath === '__warn_stub__' ? WARN_STUB : getSource(fsPath)
    const dir = fsPath === '__warn_stub__' ? '' : dirname(fsPath).replace(/\\/g, '/')
    const resolved = code.replace(/from\s+'([^']+)'/g, (m, spec) => {
      if (spec === '@/utils/warn') return `from '${dataUrlOf('__warn_stub__')}'`
      let target
      if (spec.startsWith('@/')) target = 'src/' + spec.slice(2)
      else target = join(dir, spec).replace(/\\/g, '/')
      if (!/\.[a-z]+$/.test(target)) target += '.js'
      return `from '${dataUrlOf(target)}'`
    })
    const url = 'data:text/javascript;base64,' + Buffer.from(resolved).toString('base64')
    cache.set(fsPath, url)
    return url
  }

  return import(dataUrlOf(entryFsPath))
}

// —— 夹具：100k × 17 列（默认场景形态：多文本 + 图形 + 条目列）——
const N = 100000
const LONG_MEMO = '这是一段较长的备注内容用于折行路径覆盖 Latin words 与数字 12345 混排。'
const records = []
for (let i = 0; i < N; i++) {
  records.push({
    id: i + 1,
    name: '记录 ' + String(i + 1).padStart(6, '0'),
    status: ['启用', '待处理', '已归档'][i % 3],
    memo: i % 25 === 0 ? LONG_MEMO + LONG_MEMO : '备注 ' + i,
    text2: i % 40 === 0 ? LONG_MEMO : '文本 ' + i,
    amount: +((i * 13.37) % 10000).toFixed(2),
    count: i % 100,
    date: '2026-01-01',
    ok: i % 2 === 0,
    level: i % 3,
    tags: ['低', '中', '高'][i % 3],
    links: i % 7 === 0 ? ['A', 'B', 'C', 'D', 'E', 'F'] : ['A', 'B'],
    items: i % 11 === 0 ? ['x', 'y', 'z', 'w'] : ['x']
  })
}

const columns = [
  { caption: '名称', field: 'name', width: 160 },
  { caption: '状态', field: 'status', width: 100 },
  { caption: '备注', field: 'memo', width: 220 },
  { caption: '文本2', field: 'text2', width: 160, _maxLines: 2 },
  { caption: '金额', field: 'amount', type: 'currency', width: 110 },
  { caption: '数量', field: 'count', type: 'number', width: 100 },
  { caption: '日期', field: 'date', type: 'date', width: 125 },
  { caption: '启用', field: 'ok', type: 'bool', width: 60 },
  { caption: '等级', field: 'level', type: 'enum', width: 100, mappings: { 0: '甲', 1: '乙', 2: '丙' } },
  { caption: '标签', field: 'tags', type: 'tag', width: 140, _value: r => r.tags },
  { caption: '勾选', field: 'ok', type: 'check', width: 50 },
  { caption: '进度', type: 'progress', width: 120, _value: r => r.count / 100 },
  { caption: '链接', field: 'links', type: 'link', width: 140 },
  { caption: '列表', field: 'items', type: 'list', width: 140 },
  { caption: '图片', type: 'img', width: 80, _value: () => '' },
  { caption: '按钮', type: 'button', width: 140, _value: r => [{ caption: '编辑' }, { caption: '删除' }] },
  { caption: '序号', type: 'rec_no', width: 50 }
]
for (const col of columns) {
  if (col.type === 'link' || col.type === 'list') {
    col._render = ({ value }) => ({ items: Array.isArray(value) ? value : (value == null ? [] : [value]) })
  }
}

const theme = { rowHeight: 36, cellPadding: 8, cellLineHeight: 18, fontSize: 14, fontFamily: 'sans-serif' }
const measure = (text) => (text == null ? 0 : String(text).length) * 7
const wrapCache = new Map()
const args = { records, columns, colWidths: columns.map(c => c.width), theme, measure, wrapCache, treeIndents: undefined, spans: undefined }

function timeOnce (fn) {
  const t0 = process.hrtime.bigint()
  const out = fn(args)
  const t1 = process.hrtime.bigint()
  return { ms: Number(t1 - t0) / 1e6, out }
}

const oldMod = await buildTree(oldSource, EX + 'row-geometry.js')
const newMod = await buildTree(newSource, EX + 'row-geometry.js')

// 预热 + 正确性对照
const warmOld = timeOnce(a => oldMod.computeRowHeights({ ...a }))
const warmNew = timeOnce(a => newMod.computeRowHeights({ ...a }))
const heightsEqual = JSON.stringify(warmOld.out.heights) === JSON.stringify(warmNew.out.heights)
const modeEqual = warmOld.out.hasArrayValues === warmNew.out.hasArrayValues &&
  warmOld.out.rowHeightMode === warmNew.out.rowHeightMode

// 交替计时 8 轮
const oldTimes = []
const newTimes = []
for (let i = 0; i < 8; i++) {
  oldTimes.push(timeOnce(a => oldMod.computeRowHeights({ ...a })).ms)
  newTimes.push(timeOnce(a => newMod.computeRowHeights({ ...a })).ms)
}
const median = arr => {
  const s = [...arr].sort((a, b) => a - b)
  return (s[3] + s[4]) / 2
}
const oldMedian = median(oldTimes)
const newMedian = median(newTimes)

const result = {
  rows: N,
  cols: columns.length,
  heightsEqual,
  modeEqual,
  hasArrayValues: warmNew.out.hasArrayValues,
  oldMedianMs: +oldMedian.toFixed(2),
  newMedianMs: +newMedian.toFixed(2),
  deltaPct: +(((newMedian - oldMedian) / oldMedian) * 100).toFixed(1),
  oldTimes: oldTimes.map(t => +t.toFixed(2)),
  newTimes: newTimes.map(t => +t.toFixed(2)),
  note: '旧=HEAD(b3528d7) 经 git show；新=工作区；交替 8 轮取中位；预热 1 轮'
}
console.log(JSON.stringify(result, null, 2))
writeFileSync(join(HERE, 'b4-2-ab-node.json'), JSON.stringify(result, null, 2))
