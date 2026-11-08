// 临时脚本：构建 ex/ 模块 import 图（入/出度、行数）。任务结束可删。
const fs = require('fs')
const path = require('path')
const root = path.resolve('src/components/table/ex')
const files = []
;(function walk (d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(js|vue)$/.test(e.name)) files.push(p)
  }
})(root)
const rel = f => path.relative(root, f).split(path.sep).join('/')
const out = {}
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  const deps = new Set()
  const re = /import\s+(?:[^'"]*?from\s+)?['"]([^'"]+)['"]|export\s+[^'"]*?from\s+['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(src))) {
    const t = m[1] || m[2]
    if (!t) continue
    let r
    if (t.startsWith('@/')) r = 'SRC/' + t.slice(2)
    else if (t.startsWith('.')) {
      const x = path.resolve(path.dirname(f), t)
      const c = [x, x + '.js', x + '.vue', path.join(x, 'index.js')].find(fs.existsSync)
      r = c ? rel(c) : 'EXT?/' + t
    } else r = 'npm/' + t
    deps.add(r)
  }
  out[rel(f)] = { lines: src.split('\n').length, deps: [...deps] }
}
const indeg = {}
for (const f in out) for (const d of out[f].deps) if (d in out) indeg[d] = (indeg[d] || 0) + 1
for (const f in out) {
  out[f].indeg = indeg[f] || 0
  out[f].outdeg = out[f].deps.filter(d => d in out).length
}
// 入度全仓前10%阈值：ex 内部
const sorted = Object.entries(out).map(([f, v]) => ({ f, ...v }))
console.log('== by indeg ==')
sorted.sort((a, b) => b.indeg - a.indeg || b.lines - a.lines).forEach(x => console.log(String(x.indeg).padStart(3), String(x.outdeg).padStart(3), String(x.lines).padStart(5), x.f))
console.log('== by outdeg ==')
sorted.sort((a, b) => b.outdeg - a.outdeg || b.lines - a.lines).slice(0, 12).forEach(x => console.log(String(x.indeg).padStart(3), String(x.outdeg).padStart(3), String(x.lines).padStart(5), x.f))
console.log('== external deps ==')
const ext = {}
for (const f in out) for (const d of out[f].deps) if (!(d in out)) ext[d] = (ext[d] || 0) + 1
Object.entries(ext).sort((a, b) => b[1] - a[1]).forEach(([d, n]) => console.log(String(n).padStart(3), d))
console.log('== edges (internal) ==')
for (const x of sorted.sort((a, b) => a.f.localeCompare(b.f))) for (const d of x.deps) if (d in out) console.log(x.f, '->', d)
