// verifier 临时校验脚本：提取 .vue 的 <script setup> 块后做模块语法校验
// 用 vm.SourceTextModule 仅解析不执行（等价 node --check 的 ESM 语法检查）
// 证据脚本，存于 evidence/
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const files = process.argv.slice(2)
let fail = 0
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const m = src.match(/<script setup>([\s\S]*?)<\/script>/)
  if (!m) { console.log(`FAIL ${file}: no <script setup> block found`); fail++; continue }
  const body = m[1]
  try {
    new vm.SourceTextModule(body, { identifier: file })
    console.log(`OK  ${file} (<script setup> ${body.length} chars)`)
  } catch (e) {
    console.log(`FAIL ${file}: ${e.name}: ${e.message}`)
    fail++
  }
}
process.exit(fail ? 1 : 0)
