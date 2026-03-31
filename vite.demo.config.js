import vue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readdirSync, readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
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
const demoSrcDir = resolve(__dirname, 'demo/src')

const demoModules = existsSync(demoSrcDir)
  ? readdirSync(demoSrcDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  : []

// 为每个示例生成入口点
const input = {}

demoModules.forEach(el => {
  const mainJs = resolve(__dirname, `demo/src/${el}/main.js`)

  if (existsSync(mainJs)) {
    input[el] = mainJs
  }
})

// 插件:复制 HTML 文件到 dist 目录并修复路径
function copyHtmlFiles() {
  return {
    name: 'copy-html-files',
    writeBundle() {
      const assetsDir = resolve(__dirname, 'demo/dist/assets')

      const vueAppCss =
        existsSync(assetsDir) &&
        readdirSync(assetsDir).find(f => /^app-.*\.css$/.test(f))

      const templatePath = resolve(__dirname, 'demo/src/common/template.html')

      if (!existsSync(templatePath)) return

      const template = readFileSync(templatePath, 'utf-8')

      demoModules.forEach(el => {
        if (!input[el]) return

        const distHtml = resolve(__dirname, `demo/dist/${el}/index.html`)
        mkdirSync(resolve(__dirname, `demo/dist/${el}`), { recursive: true })

        const title = el.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')
        const html = template.replace('{{title}}', title).replace('%app-css%', vueAppCss || '')

        writeFileSync(distHtml, html)
      })

      const rootIndexHtml = resolve(__dirname, 'demo/src/index.html')

      if (existsSync(rootIndexHtml)) {
        copyFileSync(rootIndexHtml, resolve(__dirname, 'demo/dist/index.html'))
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
    outDir: resolve(__dirname, 'demo/dist'),
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

          return (name.endsWith('.css') && !name.includes('app'))
            ? `${name.replace('.css', '')}/style.css`
            : 'assets/[name]-[hash].[ext]'
        }
      }
    },
    publicDir: false
  }
}
