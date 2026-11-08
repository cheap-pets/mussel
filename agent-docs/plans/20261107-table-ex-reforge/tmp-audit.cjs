// 临时脚本 v2：host 键使用 vs @host-* 声明（支持多行续行、点键前缀匹配）
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

for (const f of files.filter(f => /composables[\\/]/.test(f))) {
  const src = fs.readFileSync(f, 'utf8')
  // 头部区域：至首个 import 语句前的所有 doc 块
  const headEnd = src.search(/^import /m)
  const head = src.slice(0, headEnd < 0 ? 2000 : headEnd)
  // 逐行分节收集 @host-reads/writes/calls 的 token（含续行，直到下一个 @host- 或非续行内容）
  const lines = head.split(/\r?\n/)
  const declared = new Set()
  let section = null
  for (const line of lines) {
    const m = line.match(/^\s*\*?\s*(@host-(?:reads|writes|calls))\s+(.*)$/) || line.match(/^\s*\*?\s{2,}(.+)$/)
    const clean = l => l.replace(/（[^）]*）|\([^)]*\)/g, ' ')
    if (line.match(/@host-(?:reads|writes|calls)/)) {
      section = true
      const content = clean(line).replace(/.*@host-\w+\s*/, '').replace(/\//g, ' ')
      for (const t of content.split(/[，,\s]+/)) {
        if (/^[a-zA-Z_$][\w$.]*$/.test(t)) declared.add(t)
      }
    } else if (section && line.match(/^\s*\*\s{2,}\S/) && !line.match(/@host-/)) {
      for (const t of clean(line).replace(/^\s*\*\s*/, '').replace(/\//g, ' ').split(/[，,\s]+/)) {
        if (/^[a-zA-Z_$][\w$.]*$/.test(t)) declared.add(t)
      }
    } else if (section) {
      section = null
    }
  }
  const used = new Set()
  const reH = /\bhost\.([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g
  let mm
  while ((mm = reH.exec(src))) used.add(mm[1])
  const missing = [...used].filter(k => {
    if (declared.has(k)) return false
    // 前缀键：declared 有 a.b，used a → 已覆盖；declared a，used a.b → 已覆盖
    for (const d of declared) {
      if (k.startsWith(d + '.') || d.startsWith(k + '.')) return false
    }
    return true
  })
  console.log(`${rel(f)}: used=${used.size} declared=${declared.size}` + (missing.length ? ` MISSING -> ${missing.join(', ')}` : ' OK'))
}
