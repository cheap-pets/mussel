import vue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'

import { optimize } from 'svgo'
import { defineConfig } from 'vite'
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

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isWatch = process.argv.includes('--watch')

  return {
    define: {
      __version__: JSON.stringify(version),
      __env__: isDev ? '"development"' : '"production"'
    },
    plugins: [
      svg(),
      vue()
    ],
    resolve: {
      alias: {
        '~icons': resolve(__dirname, 'node_modules/@tabler/icons/icons'),
        '@': resolve(__dirname, 'src')
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
      target: ['chrome100', 'edge100', 'firefox100'],
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
          assetFileNames: isDev ? '[name].[ext]' : '[name].min.[ext]',
          entryFileNames: isDev ? 'mussel.js' : 'mussel.min.js'
        },
        onwarn(warning, warn) {
          if (!isWatch || warning.code !== 'FILE_NAME_CONFLICT') {
            warn(warning)
          }
        }
      },
      minify: !isDev,
      sourcemap: true,
      cssMinify: !isDev,
      cssCodeSplit: false,
    }
  }
})
