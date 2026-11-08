// 临时脚本：S8 位置参数扫描 v2——花括号/方括号组按 1 个参数计（参数袋）
const fs = require('fs')
const path = require('path')
const root = path.resolve('src/components/table/ex')
function splitParams (s) {
  const parts = []
  let depth = 0; let cur = ''
  for (const ch of s) {
    if (ch === '{' || ch === '[') depth++
    if (ch === '}' || ch === ']') depth--
    if (ch === ',' && depth === 0) { parts.push(cur); cur = '' } else cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts
}
;(function walk (d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { walk(p); continue }
    if (!/\.(js|vue)$/.test(e.name)) continue
    const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
    lines.forEach((line, i) => {
      let m = line.match(/^(?:export )?(?:async )?function\s+(\w+)\s*\((.*)\)/) ||
              line.match(/^(?:export )?const\s+(\w+)\s*=\s*\((.*)\)\s*=>/)
      if (m) {
        const params = splitParams(m[2])
        const positional = params.filter(x => !x.trim().startsWith('{') && !x.trim().startsWith('['))
        if (positional.length > 5) console.log(`pos=${positional.length} bag=${params.length - positional.length}  ${path.relative(root, p).split(path.sep).join('/')}:${i + 1}  ${m[1]}`)
      }
    })
  }
})(root)
