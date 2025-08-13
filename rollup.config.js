import fs from 'fs'
import path from 'path'
import browserslist from 'browserslist'

import alias from '@rollup/plugin-alias'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'

import swc from 'rollup-plugin-swc'
import vue from 'unplugin-vue/rollup'
import sass from '@cheap-pets/rollup-plugin-postcss-scss'

import { string } from 'rollup-plugin-string'

import { fileURLToPath } from 'url'
import { generatePreCssVariables } from './src/colors.js'

const pkgJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'))
const version = pkgJson.version

const isDevEnv = process.env.dev
const scssVariables = generatePreCssVariables()

function warn (...args) {
  console.warn('\x1b[33m%s', ...args, '\x1b[0m')
}

export default {
  input: 'src/index.js',
  output: {
    file: isDevEnv ? 'dist/mussel.js' : 'dist/mussel.min.js',
    format: 'umd',
    name: 'mussel',
    assetFileNames: '[name].[ext]',
    globals: {
      vue: 'Vue'
    },
    sourcemap: true
  },
  external: ['vue'],
  plugins: [
    replace({
      include: 'src/env.js',
      preventAssignment: false,
      values: {
        __version: version,
        __env: isDevEnv ? 'development' : 'production'
      }
    }),
    alias({
      entries: [
        {
          find: '~icons',
          replacement: path.resolve('node_modules/@tabler/icons/icons')
        },
        {
          find: '@',
          replacement: path.resolve('src')
        }
      ]
    }),
    vue({
      inlineTemplate: !isDevEnv
    }),
    string({
      include: '**/*.svg'
    }),
    sass({
      extract: true,
      minify: isDevEnv ? 0 : 1,
      variables: scssVariables
    }),
    resolve({
      mainFields: ['module', 'main', 'browser']
    }),
    swc.default({
      jsc: {
        minify: {
          mangle: !isDevEnv
        }
      },
      env: {
        targets: browserslist.findConfig('.').defaults,
        coreJs: 3
      },
      minify: !isDevEnv
    })
  ],
  onwarn: warning => {
    const { code, plugin, id, input, message } = warning

    warn(`[!] ${code || warning}`)

    if (plugin) warn(`... Plugin: ${plugin}`)
    if (id) warn(`... id: ${id}`)
    if (input) warn(`... Input: ${input.file || input}`)
    if (message) warn(`... message: ${message}`)
  }
}
