/**
 * table-ex demo 自检聚合入口。
 *
 * 各模块断言文件按 02-design.md 实施步骤表分步填充（文件集合两两不相交）：
 * - text-wrap.js / row-geometry.js / tree.js → G1-a（纯函数基建）
 * - theme.js          → G1-b（主题快照扩容 + colors 17 色 + createTextMeasurer）
 * - layout.js / painter.js / cell-painters.js → G2（布局与绘制管线接入）
 * - interactions.js / editor.js → G3（交互与组件壳）
 *
 * runChecks(extraChecks) 返回逐条结果数组，由页面"自检结果"面板渲染；
 * extraChecks 为页面自带的夹具级断言（如数据生成器检查）。
 */
import { checks as textWrapChecks } from './text-wrap.js'
import { checks as rowGeometryChecks } from './row-geometry.js'
import { checks as treeChecks } from './tree.js'
import { checks as themeChecks } from './theme.js'
import { checks as layoutChecks } from './layout.js'
import { checks as cellPaintersChecks } from './cell-painters.js'
import { checks as painterChecks } from './painter.js'
import { checks as interactionsChecks } from './interactions.js'
import { checks as editorChecks } from './editor.js'

export const moduleChecks = [
  { module: 'text-wrap', checks: textWrapChecks },
  { module: 'row-geometry', checks: rowGeometryChecks },
  { module: 'tree', checks: treeChecks },
  { module: 'theme', checks: themeChecks },
  { module: 'layout', checks: layoutChecks },
  { module: 'cell-painters', checks: cellPaintersChecks },
  { module: 'painter', checks: painterChecks },
  { module: 'interactions', checks: interactionsChecks },
  { module: 'editor', checks: editorChecks }
]

/**
 * 运行全部自检：模块断言（moduleChecks）+ 页面夹具断言（extraChecks）。
 * 单条断言返回字符串时作为 detail 展示；抛错视为失败，error 取错误消息。
 */
export function runChecks (extraChecks = []) {
  const results = []

  const run = (module, check) => {
    try {
      const detail = check.fn()
      results.push({ module, name: check.name, passed: true, detail: detail == null ? '' : String(detail), error: '' })
    } catch (err) {
      results.push({ module, name: check.name, passed: false, detail: '', error: err?.message ?? String(err) })
    }
  }

  for (const { module, checks } of moduleChecks) {
    for (const check of checks) run(module, check)
  }

  for (const check of extraChecks) run('data', check)

  return results
}
