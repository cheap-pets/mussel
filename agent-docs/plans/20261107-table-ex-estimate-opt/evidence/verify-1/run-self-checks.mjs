// 独立验证 runner：Node ESM 直跑 3 个纯函数自检模块全部断言（含本任务新增）。
// 不采信实施记录自检结果，全部亲自重跑。
globalThis.__version__ = '0.0.0-verify'
globalThis.__env__ = 'development'

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./loader-hooks.mjs', import.meta.url)

const ROOT = 'D:/workshop/cheap-pets/mussel'
const MODULES = [
  ['text-wrap', `${ROOT}/demo/src/data/table-ex/self-checks/text-wrap.js`],
  ['row-geometry', `${ROOT}/demo/src/data/table-ex/self-checks/row-geometry.js`],
  ['row-geometry-controller', `${ROOT}/demo/src/data/table-ex/self-checks/row-geometry-controller.js`]
]

let pass = 0
let fail = 0
const failures = []

for (const [label, file] of MODULES) {
  const mod = await import(pathToFileURL(file).href)
  const { checks } = mod

  for (const check of checks) {
    try {
      const msg = await check.fn()
      pass++
      console.log(`PASS [${label}] ${check.name}${msg ? ' :: ' + msg : ''}`)
    } catch (e) {
      fail++
      failures.push({ label, name: check.name, error: e.message })
      console.log(`FAIL [${label}] ${check.name} :: ${e.message}`)
    }
  }
}

console.log(`TOTAL: ${pass} pass, ${fail} fail`)

if (failures.length) {
  console.log('FAILURES:')
  for (const f of failures) console.log(`  - [${f.label}] ${f.name}: ${f.error}`)
}

process.exit(fail ? 1 : 0)
