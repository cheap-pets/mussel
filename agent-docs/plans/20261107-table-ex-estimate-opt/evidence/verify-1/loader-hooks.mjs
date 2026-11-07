// 验证用 ESM resolve/load hooks（verifier 独立搭建，非实施产物）。
// stub：~icons/*（SVG 组件树，纯函数自检不触碰）、*.scss（副作用样式）。
// alias：@/ → <root>/src/；无扩展名相对/绝对导入补 .js。
import { existsSync, statSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = 'D:/workshop/cheap-pets/mussel'

function resolveFile (p) {
  if (existsSync(p) && statSync(p).isFile()) return p
  if (existsSync(p + '.js') && statSync(p + '.js').isFile()) return p + '.js'
  // 目录导入 → dir/index.js（vite 风格，如 layout.js 的 '../../column-types'）
  if (existsSync(p) && statSync(p).isDirectory() && existsSync(path.join(p, 'index.js'))) {
    return path.join(p, 'index.js')
  }
  return null
}

export async function resolve (specifier, context, nextResolve) {
  if (specifier.startsWith('~icons/')) {
    return { url: 'stub:icon:' + specifier, shortCircuit: true }
  }

  if (specifier.endsWith('.scss')) {
    return { url: 'stub:scss:' + specifier, shortCircuit: true }
  }

  // .vue 单文件组件 → 空组件壳 stub（纯函数自检不实例化组件）
  if (specifier.endsWith('.vue')) {
    return { url: 'stub:vue:' + specifier, shortCircuit: true }
  }

  if (specifier.startsWith('@/')) {
    const file = resolveFile(path.join(ROOT, 'src', specifier.slice(2)))

    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }

  // 相对/绝对文件路径无扩展名 → 补 .js（src 侧 './layout' 等裸导入）；
  // 无扩展名目录导入 → dir/index.js
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    (!path.extname(specifier) || !/\.(js|mjs|json)$/.test(specifier))
  ) {
    const parentPath = context.parentURL && context.parentURL.startsWith('file:')
      ? path.dirname(fileURLToPath(context.parentURL))
      : null

    if (parentPath) {
      const file = resolveFile(path.resolve(parentPath, specifier))

      if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
    }
  }

  return nextResolve(specifier, context)
}

export async function load (url, context, nextLoad) {
  if (url.startsWith('stub:icon:')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: [
        '// stub：~icons 产物被 icons/index.js install 当 SVG 字符串消费（sanitizeHTML）',
        "export default '<svg xmlns=\"http://www.w3.org/2000/svg\"/>'"
      ].join('\n')
    }
  }

  if (url.startsWith('stub:scss:')) {
    return { format: 'module', shortCircuit: true, source: '' }
  }

  if (url.startsWith('stub:vue:')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default { name: "stub-vue" }'
    }
  }

  return nextLoad(url, context)
}
