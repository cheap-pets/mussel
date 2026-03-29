import vue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readdirSync, readFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { optimize } from 'svgo'
import { generatePreCssVariables } from './src/colors.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 读取 package.json 获取版本号
const pkgJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const version = pkgJson.version

const colorMaps =
  '$colors: (\n' +
  Object
    .entries(generatePreCssVariables())
    .map(([key, value]) => `  "${key}": ${value},`)
    .join('\n') +
  '\n);'

// SVG 处理插件
function svg() {
  return {
    name: 'svg-plugin',
    enforce: 'pre',
    load(id) {
      if (id.endsWith('.svg')) {
        const content = readFileSync(id, 'utf-8')
        const optimized = optimize(content).data
        return `export default ${JSON.stringify(optimized)}`
      }
    }
  }
}

// 获取所有示例目录
const examplesDir = resolve(__dirname, 'examples2/src')
const examples = existsSync(examplesDir)
  ? readdirSync(examplesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  : []

// 为每个示例生成入口点
const input = {}
examples.forEach(example => {
  const mainJs = resolve(__dirname, `examples2/src/${example}/main.js`)
  if (existsSync(mainJs)) {
    input[example] = mainJs
  }
})

// 插件:复制 HTML 文件到 dist 目录并修复路径
function copyHtmlFiles() {
  return {
    name: 'copy-html-files',
    writeBundle() {
      const fs = require('node:fs')
      const path = require('node:path')

      examples.forEach(example => {
        const srcHtml = resolve(__dirname, `examples2/src/${example}/index.html`)
        const distHtml = resolve(__dirname, `examples2/dist/${example}/index.html`)

        if (existsSync(srcHtml)) {
          // 确保目标目录存在
          mkdirSync(resolve(__dirname, `examples2/dist/${example}`), { recursive: true })

          // 读取 HTML 内容并修复路径
          let htmlContent = readFileSync(srcHtml, 'utf-8')

          // 添加 CSS 文件引用（在 </head> 之前）
          const cssLink = '    <link rel="stylesheet" type="text/css" href="./style.css" />\n'
          if (!htmlContent.includes('./style.css')) {
            htmlContent = htmlContent.replace('</head>', `${cssLink}</head>`)
          }

          // 写入修复后的 HTML
          fs.writeFileSync(distHtml, htmlContent)
        }
      })

      // 复制根目录的 index.html
      const rootIndexHtml = resolve(__dirname, 'examples2/src/index.html')
      if (existsSync(rootIndexHtml)) {
        let rootHtml = readFileSync(rootIndexHtml, 'utf-8')
        // 修复导航页面中的路径: dist/button/ -> button/
        rootHtml = rootHtml.replace(/href="dist\//g, 'href="')
        fs.writeFileSync(resolve(__dirname, 'examples2/dist/index.html'), rootHtml)
      }

      // 复制 common.css (使用现有的 examples/style.css)
      const commonCss = resolve(__dirname, 'examples/style.css')
      if (existsSync(commonCss)) {
        copyFileSync(commonCss, resolve(__dirname, 'examples2/dist/common.css'))
      }
    }
  }
}

export default {
  define: {
    __version__: JSON.stringify(version),
    __env__: '"development"'
  },
  plugins: [svg(), vue(), copyHtmlFiles()],
  resolve: {
    alias: {
      '~icons': resolve(__dirname, 'node_modules/@tabler/icons/icons'),
      '@': resolve(__dirname, 'src'),
      'mussel': resolve(__dirname, 'src/index.js')
    }
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 100,
        edge: 100,
        firefox: 100
      }
    },
    preprocessorOptions: {
      scss: {
        additionalData: (source, filepath) => {
          return filepath.includes('root.scss')
            ? `@use "sass:map";\n${colorMaps}\n${source}`
            : source
        }
      }
    }
  },
  build: {
    outDir: resolve(__dirname, 'examples2/dist'),
    emptyOutDir: true,
    minify: false,
    cssMinify: false,
    rollupOptions: {
      input,
      output: {
        entryFileNames: '[name]/main.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''

          // 处理 CSS 文件 - 文件名已经按示例命名好了
          // 如: button.css, combo-box.css, flex-layout.css 等
          if (name.endsWith('.css') && name !== 'src.css') {
            // 直接用文件名（去掉.css）作为目录名，输出为 style.css
            const exampleName = name.replace('.css', '')
            return `${exampleName}/style.css`
          }

          // 其他资源保持原有路径
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    publicDir: false
  }
}
