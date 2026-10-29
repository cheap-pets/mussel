import http from 'node:http'
import serveHandler from 'serve-handler'

import pluginVue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url'
import { dirname, relative, resolve } from 'node:path'
import { readdirSync, readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'

import { optimize } from 'svgo'
import { colors } from './src/colors.js'
import { catalog, findCatalogPage } from './demo/src/catalog.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isWatch = process.argv.includes('--watch')

// 读取 package.json 获取版本号
const pkgJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const version = pkgJson.version

const targetBrowsers = {
  chrome: 120,
  edge: 120,
  firefox: 128,
  safari: 20
}

const colorMaps =
  '$colors: (\n' +
  Object
    .entries(colors)
    .map(([key, value]) => `  "${key}": ${value},`)
    .join('\n') +
  '\n);'

// SVG 处理插件
function pluginSvg () {
  return {
    name: 'svg-plugin',
    enforce: 'pre',
    load (id) {
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

/**
 * 组装构建入口：
 * - home 固定入口（首页）
 * - catalog 登记的页面（目录与 URL 一致，支持多级路径）
 */
function buildInputs () {
  const inputs = { home: resolve(demoSrcDir, 'home/main.js') }
  const registered = new Set()

  for (const category of catalog) {
    for (const page of category.pages) {
      if (!page.path.startsWith(`${category.category}/`)) {
        throw new Error(`[demo] catalog 页面路径 "${page.path}" 必须以分类 "${category.category}/" 开头`)
      }

      if (registered.has(page.path)) {
        throw new Error(`[demo] catalog 页面路径重复: "${page.path}"`)
      }

      registered.add(page.path)

      const mainJs = resolve(demoSrcDir, page.path, 'main.js')

      if (!existsSync(mainJs)) {
        throw new Error(`[demo] catalog 页面 "${page.path}" 缺少 main.js`)
      }

      inputs[page.path] = mainJs
    }
  }

  // 未登记警告：demo/src 下的两级页面目录必须登记到 catalog
  const topLevelDirs = readdirSync(demoSrcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'common' && dirent.name !== 'home')
    .map(dirent => dirent.name)

  topLevelDirs.forEach(name => {
    const dir = resolve(demoSrcDir, name)

    readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .forEach(({ name: sub }) => {
        const path = `${name}/${sub}`

        if (existsSync(resolve(dir, sub, 'main.js')) && !registered.has(path)) {
          console.warn(`[demo] 页面目录 demo/src/${path}/main.js 未登记到 catalog.js`)
        }
      })
  })

  return inputs
}

const input = buildInputs()

// 插件:复制 HTML 文件到 dist 目录并修复路径
function copyHtmlFiles () {
  return {
    name: 'copy-html-files',
    writeBundle (options, bundle) {
      const templatePath = resolve(__dirname, 'demo/src/common/template.html')

      if (!existsSync(templatePath)) return

      const appCss = Object
        .keys(bundle)
        .find(fileName => fileName.startsWith('assets/') && fileName.endsWith('.css'))

      if (!appCss) {
        throw new Error('[demo] 未找到共享样式 assets/*.css，页面模板缺少全局样式')
      }

      const template = readFileSync(templatePath, 'utf-8')

      Object.keys(input).forEach(key => {
        const isHome = key === 'home'
        const catalogPage = isHome ? null : findCatalogPage(key)?.page

        const title = isHome
          ? 'Mussel 组件库'
          : catalogPage
            ? catalogPage.title
            : key.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')

        const root = isHome ? '' : '../'.repeat(key.split('/').length)
        const pageJs = isHome ? './home/main.js' : './main.js'
        const pageCssHref = isHome ? './home/style.css' : './style.css'
        const pageCssKey = isHome ? 'home/style.css' : `${key}/style.css`

        // 无样式页面不输出 link，避免 404
        const pageCssLink = bundle[pageCssKey]
          ? `<link rel="stylesheet" type="text/css" href="${pageCssHref}" />\n`
          : ''

        const outDir = isHome ? 'demo/dist' : `demo/dist/${key}`
        const htmlFile = resolve(__dirname, outDir, 'index.html')

        mkdirSync(resolve(__dirname, outDir), { recursive: true })

        const html = template
          .replaceAll('{{title}}', title)
          .replaceAll('{{root}}', root)
          .replaceAll('{{appCss}}', appCss)
          .replaceAll('{{pageCssLink}}', pageCssLink)
          .replaceAll('{{pageJs}}', pageJs)

        writeFileSync(htmlFile, html)
      })

      const faviconPath = resolve(__dirname, 'demo/src/common/favicon.svg')

      if (existsSync(faviconPath)) {
        copyFileSync(faviconPath, resolve(__dirname, 'demo/dist/favicon.svg'))
      }
    }
  }
}

// 插件:在 watch 模式下启动静态服务器托管 demo/dist
function serveDemoDist () {
  const port = Number(process.env.SERVE_PORT) || 3000
  const root = resolve(__dirname, 'demo/dist')

  let server

  const stop = () => {
    server?.close()
    server = null
  }

  const start = () => {
    server = http.createServer((req, res) =>
      serveHandler(req, res, { public: root, cleanUrls: true })
    )

    server.listen(port, () => {
      console.log(`\n  demo 静态服务已启动 → http://localhost:${port}\n`)
    })

    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)
  }

  return {
    name: 'serve-demo-dist',
    configResolved () { if (isWatch) start() },
    closeWatcher () { stop() }
  }
}

export default {
  define: {
    __version__: JSON.stringify(version),
    __env__: '"development"'
  },
  plugins: [pluginSvg(), pluginVue(), copyHtmlFiles(), serveDemoDist()],
  resolve: {
    alias: [
      // ex 版 registry 换表：demo 始终用含 ex 组件的版本
      { find: 'mussel', replacement: resolve(__dirname, 'src/index.js') },
      { find: './components/index.js', replacement: resolve(__dirname, 'src/components/index.ex.js') },
      { find: 'vue', replacement: resolve(__dirname, 'node_modules/vue/dist/vue.esm-browser.js') },
      { find: '~icons', replacement: resolve(__dirname, 'node_modules/@tabler/icons/icons') },
      { find: '@', replacement: resolve(__dirname, 'src') }
    ]
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: targetBrowsers
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
    target: Object.entries(targetBrowsers).map(([name, ver]) => `${name}${ver}`),
    outDir: resolve(__dirname, 'demo/dist'),
    emptyOutDir: true,
    minify: false,
    cssMinify: false,
    rollupOptions: {
      input,
      output: {
        entryFileNames: '[name]/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''

          if (!name.endsWith('.css')) return 'assets/[name].[ext]'

          // assetInfo.name 只含 basename，须按入口源码路径反推页面目录
          const original = assetInfo.originalFileName || ''
          const rel = original
            ? relative(demoSrcDir, resolve(__dirname, original)).replace(/\\/g, '/')
            : ''
          const isPageCss = rel.endsWith('/main.js') && !rel.startsWith('..')

          return isPageCss
            ? `${rel.slice(0, -'/main.js'.length)}/style.css`
            : 'assets/[name].[ext]'
        }
      },
      onwarn (warning, warn) {
        if (!isWatch || warning.code !== 'FILE_NAME_CONFLICT') {
          warn(warning)
        }
      }
    },
    publicDir: false
  }
}
