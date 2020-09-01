import vue from 'rollup-plugin-vue'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import { string } from 'rollup-plugin-string'

import postcss from 'rollup-plugin-postcss'
import postcssAutoprefixer from 'autoprefixer'
import postcssCalc from 'postcss-calc'
import postcssClean from 'postcss-clean'
import postcssConditionals from 'postcss-conditionals'
import postcssFor from 'postcss-for'
import postcssEach from 'postcss-each'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssVars from 'postcss-simple-vars'
import postcssUnprefix from 'postcss-unprefix'

import variables from './src/variables'

export default {
  input: 'src/index.js',
  external: ['vue'],
  plugins: [
    vue({
      css: false
    }),
    string({
      include: "**/*.svg",
    }),
    postcss({
      plugins: [
        postcssImport,
        postcssUnprefix,
        postcssEach,
        postcssFor,
        postcssVars({ variables }),
        postcssCalc,
        postcssNested,
        postcssConditionals,
        postcssAutoprefixer,
        postcssClean
      ]
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
  },
  output: [
    {
      file: 'dist/mussel.js',
      format: 'umd',
      name: 'mussel',
      globals: {
        vue: 'Vue'
      },
      sourcemap: true
    },
    {
      file: 'dist/mussel.esm.js',
      format: 'esm',
      globals: {
        vue: 'Vue'
      },
      sourcemap: true
    },
    {
      file: 'dist/mussel.min.js',
      format: 'umd',
      name: 'mussel',
      plugins: [
        terser()
      ],
      globals: {
        vue: 'Vue'
      },
      sourcemap: true
    },
    {
      file: 'dist/mussel.esm.min.js',
      format: 'esm',
      plugins: [
        terser()
      ],
      globals: {
        vue: 'Vue'
      },
      sourcemap: true
    }
  ]
}
