import pluginVue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'

import { optimize } from 'svgo'
import { defineConfig } from 'vite'
import { colors } from './src/colors.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

// mode 约定：development / production，加 ex- 前缀（ex-development / ex-production）则构建含 ex 组件的版本
export default defineConfig(({ mode }) => {
  const isEx = mode.startsWith('ex-')
  const isDev = mode.endsWith('development')
  const isWatch = process.argv.includes('--watch')
  const suffix = isEx ? '.ex' : ''

  return {
    define: {
      __version__: JSON.stringify(version),
      __env__: isDev ? '"development"' : '"production"'
    },
    plugins: [
      pluginSvg(),
      pluginVue()
    ],
    resolve: {
      alias: [
        // ex 版换组件注册表：匹配原始 import 说明符（仅 src/index.js 一处引用）
        isEx && {
          find: './components/index.js',
          replacement: resolve(__dirname, 'src/components/index.ex.js')
        },
        { find: '~icons', replacement: resolve(__dirname, 'node_modules/@tabler/icons/icons') },
        { find: '@', replacement: resolve(__dirname, 'src') }
      ].filter(Boolean)
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
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'mussel',
        formats: ['umd']
      },
      rolldownOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          },
          assetFileNames: isDev ? `mussel${suffix}.[ext]` : `mussel${suffix}.min.[ext]`,
          entryFileNames: isDev ? `mussel${suffix}.js` : `mussel${suffix}.min.js`
        },
        onwarn (warning, warn) {
          if (!isWatch || warning.code !== 'FILE_NAME_CONFLICT') {
            warn(warning)
          }
        }
      },
      minify: !isDev,
      sourcemap: true,
      cssMinify: !isDev,
      cssCodeSplit: false
    }
  }
})
