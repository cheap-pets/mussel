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
    transform(code, id) {
      if (id.endsWith('.svg')) {
        const svg = readFileSync(id, 'utf-8')
        const optimized = optimize(svg).data

        return {
          code: `export default ${JSON.stringify(optimized)}`,
          map: null
        }
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
      vue(),
      svg()
    ],
    resolve: {
      alias: {
        '~icons': resolve(__dirname, 'node_modules/@tabler/icons/icons'),
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
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
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'mussel',
        formats: ['umd']
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          },
          assetFileNames: isDev ? '[name].[ext]' : '[name].min.[ext]',
          entryFileNames: isDev ? 'mussel.js' : 'mussel.min.js'
        },
        onwarn(warning, warn) {
          // watch 模式下抑制文件覆盖警告
          if (isWatch && warning.code === 'FILE_NAME_CONFLICT') {
            return
          }

          warn(warning)
        }
      },
      sourcemap: true,
      minify: isDev ? false : undefined,
      cssCodeSplit: false,
      cssMinify: !isDev
    }
  }
})
