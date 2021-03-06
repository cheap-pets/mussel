import path from 'path'

import vue from 'rollup-plugin-vue'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

import { terser } from 'rollup-plugin-terser'
import { string } from 'rollup-plugin-string'

import postcss from 'rollup-plugin-postcss'
import postcssCalc from 'postcss-calc'
import autoprefixer from 'autoprefixer'
import postcssNested from 'postcss-nested'
import postcssAdvanced from 'postcss-advanced-variables'
import postcssCustomProps from './build/postcss-custom-properties-polyfill'

import variables from './src/variables'

const isDevEnv = process.env.dev

const output = [
  {
    file: 'dist/mussel.js',
    format: 'umd',
    name: 'mussel',
    globals: {
      vue: 'Vue'
    },
    sourcemap: false
  }
].concat(
  isDevEnv
    ? undefined
    : [
        {
          file: 'dist/mussel.esm.js',
          format: 'esm',
          globals: {
            vue: 'Vue'
          },
          sourcemap: false
        },
        {
          file: 'dist/mussel.min.js',
          format: 'umd',
          name: 'mussel',
          plugins: isDevEnv ? undefined : [terser()],
          globals: {
            vue: 'Vue'
          },
          sourcemap: false
        },
        {
          file: 'dist/mussel.esm.min.js',
          format: 'esm',
          plugins: isDevEnv ? undefined : [terser()],
          globals: {
            vue: 'Vue'
          },
          sourcemap: false
        }
      ]
)

export default {
  input: 'src/index.js',
  output,
  external: ['vue'],
  plugins: [
    alias({
      entries: [
        { find: '~icons', replacement: path.resolve(__dirname, 'node_modules/@tabler/icons/icons') },
        { find: '@', replacement: path.resolve(__dirname, 'src') }
      ]
    }),
    vue({
      normalizer: '~vue-runtime-helpers/dist/normalize-component.js',
      css: false
    }),
    string({
      include: "**/*.svg",
    }),
    postcss({
      minimize: true,
      plugins: [
        postcssAdvanced({ variables }),
        postcssCustomProps,
        postcssCalc,
        postcssNested,
        autoprefixer
      ]
      // extract: path.resolve(__dirname, 'dist/mussel.css')
    }),
    resolve({
      mainFields: ['module', 'main', 'browser']
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.vue']
    }),
    commonjs()
  ],
  onwarn: warning => {
    const { code, plugin, id, input, message, text } = warning
    console.warn('[!]', '[B]', code || warning)
    if (plugin) console.warn('[!]', '...', '[plugin]', plugin)
    if (id) console.warn('[!]', '...', '[id]', id)
    if (input) console.warn('[!]', '...', '[input]', input.file || input)
    if (message) console.warn('[!]', '...', '[message]', message)
    if (text) console.warn('[!]', '...', '[message]', text)
  }
}
