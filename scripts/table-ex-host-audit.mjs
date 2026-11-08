#!/usr/bin/env node
/**
 * table-ex @host-* 注解审计：composables 文件头声明 vs host.<键> 实际使用。
 *
 * 规格来源：agent-docs/plans/20261107-table-ex-reforge/02-design.md O5 附带交付
 * （蓝本：tmp-audit.cjs 解析逻辑，修复其注释误抓与跨行全角括号两处解析缺陷）。
 * 输入：src/components/table/ex/composables/*.js（固定范围，无参数）。
 * 检查项：文件头 @host-reads/writes/calls 声明的键集合 vs 正文 host.<键> 实际
 *   使用（含 host.a.b 点路径，前缀覆盖：声明 a 覆盖使用 a.b，声明 a.b 覆盖使用 a）。
 * 输出：每文件 used/declared 计数；零缺失输出报告退出码 0；缺失输出未声明键
 *   清单退出码 1。
 * 注：@host-* 声明仅覆盖 composables（host 袋消费者）；壳（table-ex.vue）为
 *   host 提供方，不在审计范围。
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'components', 'table', 'ex', 'composables')

const clean = s => s
  .replace(/（[^）]*）/gs, ' ') // 全角括号注释剥离（支持跨行）
  .replace(/\([^)]*\)/gs, ' ') // 半角括号注释剥离（支持跨行）

const TOKEN_RE = /^[a-zA-Z_$][\w$.]*$/

function addTokens (set, content) {
  for (const t of content.replace(/\//g, ' ').split(/[，,\s]+/)) {
    if (TOKEN_RE.test(t)) set.add(t)
  }
}

function parseDeclared (src) {
  const headEnd = src.search(/^import /m)
  // 括号注释剥离先于按行解析：支持跨行全角/半角括号（如「rowGeometry（消费 geometry /
  //   remeasureVisibleRows）」），剥离后的续行 token 仍按原续行结构收集
  const head = clean(src.slice(0, headEnd < 0 ? 2000 : headEnd))
  const lines = head.split(/\r?\n/)
  const declared = new Set()
  let section = false
  for (const line of lines) {
    if (line.match(/@host-(?:reads|writes|calls)/)) {
      section = true
      addTokens(declared, line.replace(/.*@host-\w+\s*/, ''))
    } else if (section && line.match(/^\s*\*\s{2,}\S/) && !line.match(/@host-/)) {
      addTokens(declared, line.replace(/^\s*\*\s*/, ''))
    } else if (section && line.match(/^\s*\*(?:\s.*)?$/) === null && line.trim() !== '') {
      // 非续行正文（doc 块结束）：结束本节
      section = false
    }
  }
  return declared
}

function parseUsed (src) {
  const used = new Set()
  // 逐行去 // 行注释后抓 host.<键>；行内 /* */ 块注释一并剥离
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, ' ')
    if (line.trim().startsWith('*') || line.trim().startsWith('/*')) continue
    const re = /\bhost\.([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g
    let m
    while ((m = re.exec(line))) used.add(m[1])
  }
  return used
}

const files = readdirSync(ROOT).filter(f => f.endsWith('.js')).sort()
let totalMissing = 0
const report = []
for (const f of files) {
  const src = readFileSync(join(ROOT, f), 'utf8')
  const declared = parseDeclared(src)
  const used = parseUsed(src)
  const missing = [...used].filter(k => {
    if (declared.has(k)) return false
    for (const d of declared) {
      if (k.startsWith(d + '.') || d.startsWith(k + '.')) return false
    }
    return true
  })
  totalMissing += missing.length
  report.push({ file: f, used: used.size, declared: declared.size, missing })
}

for (const r of report) {
  const tag = r.missing.length ? ` MISSING -> ${r.missing.join(', ')}` : ' OK'
  console.log(`${r.file}: used=${r.used} declared=${r.declared}${tag}`)
}

if (totalMissing > 0) {
  console.error(`table-ex-host-audit: ${totalMissing} 个未声明 host 键`)
  process.exit(1)
}
console.log(`table-ex-host-audit: OK — 审计 ${files.length} 个 composables 文件，host 键声明零缺失`)
process.exit(0)
