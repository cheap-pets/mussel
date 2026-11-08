#!/usr/bin/env node
/**
 * table-ex S1 门禁：禁止内部聚合文件的纯转发 re-export（export … from）。
 *
 * 规格来源：agent-docs/plans/20261107-table-ex-reforge/02-design.md O2 附带交付。
 * 输入：扫描 src/components/table/ex/ 下全部 .js 文件（固定范围，无参数）。
 * 检查项：`export … from`（含 `export { x } from` / `export * from` / `export * as ns from`）
 *   纯转发形态；聚合文件只允许真正的门控逻辑或公共入口。
 * 输出：零命中输出报告退出码 0；命中输出清单（文件:行号 + 原文）退出码 1。
 * 豁免：PUBLIC_ENTRIES（相对 ex/ 根）——包对外公共入口，lang-js.md S1 生态豁免。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'components', 'table', 'ex')

// 包对外公共入口，lang-js.md S1 生态豁免（相对 ex/ 根）
const PUBLIC_ENTRIES = new Set(['index.js'])

// `export { … } from` / `export * from` / `export * as ns from`
const REEXPORT_RE = /^\s*export\s+(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s*from\s*['"]/

function listJsFiles (dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...listJsFiles(p))
    else if (name.endsWith('.js')) out.push(p)
  }
  return out
}

const hits = []
const files = listJsFiles(ROOT)
for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/')
  if (PUBLIC_ENTRIES.has(rel)) continue
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    // 去掉行内 // 后再匹配，避免误报注释中的示例；块注释按整行以 /* 或 * 开头排除
    const stripped = line.replace(/\/\/.*$/, '')
    const t = stripped.trim()
    if (t.startsWith('/*') || t.startsWith('*')) return
    if (REEXPORT_RE.test(stripped)) hits.push(`${rel}:${i + 1}: ${line.trim()}`)
  })
}

if (hits.length > 0) {
  console.error(`table-ex-structure-check: ${hits.length} 处纯转发 re-export 命中（S1 违规）：`)
  for (const h of hits) console.error('  ' + h)
  process.exit(1)
}

console.log(`table-ex-structure-check: OK — 扫描 ${files.length} 个文件，零纯转发 re-export（豁免公共入口：${[...PUBLIC_ENTRIES].join(', ')}）`)
process.exit(0)
