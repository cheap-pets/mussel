import vue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readdirSync, readFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
          if (!htmlContent.includes('style.css')) {
            htmlContent = htmlContent.replace('</head>', `${cssLink}</head>`)
          }

          // 写入修复后的 HTML
          fs.writeFileSync(distHtml, htmlContent)
        }
      })

      // 移动 assets 目录中的 CSS 文件到对应的示例目录
      const assetsDir = resolve(__dirname, 'examples2/dist/assets')
      if (existsSync(assetsDir)) {
        const cssFiles = readdirSync(assetsDir).filter(f => f.endsWith('.css'))

        cssFiles.forEach(cssFile => {
          // 提取示例名称 - 匹配格式：prefix-hash.css，hash 可包含下划线
          const match = cssFile.match(/^([a-z]+)-[a-z0-9_\-]+\.css$/i)
          if (match) {
            const prefix = match[1]
            const exampleMap = {
              'button': 'button',
              'input': 'input',
              'modal': 'modal',
              'tabs': 'tabs',
              'tree': 'tree',
              'scrollbar': 'scrollbar',
              'calendar': 'calendar',
              'color': 'color',
              'combo': 'combo-box',
              'dropdown': 'dropdown',
              'selection': 'selection',
              'message': 'message',
              'form': 'form',
              'flex': 'flex-layout',
              'grid': 'grid-layout'
            }
            const exampleName = exampleMap[prefix]
            if (exampleName) {
              const srcCss = resolve(__dirname, `examples2/dist/assets/${cssFile}`)
              const destCss = resolve(__dirname, `examples2/dist/${exampleName}/style.css`)
              // 移动文件
              fs.renameSync(srcCss, destCss)
            }
          }
        })
      }

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
  plugins: [vue(), copyHtmlFiles()],
  resolve: {
    alias: {
      '~icons': resolve(__dirname, 'node_modules/@tabler/icons/icons'),
      '@': resolve(__dirname, 'src')
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
          // 处理 CSS 文件 - 检查原始文件名
          const originalNames = assetInfo.names || []
          if (name.includes('.css') && originalNames.length > 0) {
            const originalName = originalNames[0]
            // 从原始路径中提取组件名称
            // 格式类似: src/button/ButtonDemo.vue?vue&type=style&index=0&scoped.lang.css
            const pathMatch = originalName.match(/src\/([a-z-]+)\/[^\/]+\.vue/i)
            if (pathMatch) {
              const componentName = pathMatch[1]
              return `${componentName}/style.css`
            }
          }

          // 备用方案：通过文件名前缀匹配
          if (name.includes('.css')) {
            const cssNameMatch = name.match(/^([a-z]+)-[a-z0-9\-]+\.css$/i)
            if (cssNameMatch) {
              const prefix = cssNameMatch[1]
              const exampleMap = {
                'button': 'button',
                'input': 'input',
                'modal': 'modal',
                'tabs': 'tabs',
                'tree': 'tree',
                'scrollbar': 'scrollbar',
                'calendar': 'calendar',
                'color': 'color',
                'combo': 'combo-box',
                'dropdown': 'dropdown',
                'selection': 'selection',
                'message': 'message',
                'form': 'form',
                'flex': 'flex-layout',
                'grid': 'grid-layout'
              }
              const exampleName = exampleMap[prefix] || prefix
              return `${exampleName}/style.css`
            }
          }

          // 其他资源保持原有路径
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    publicDir: false
  }
}
