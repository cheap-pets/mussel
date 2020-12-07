import path from 'path'

import vue from 'rollup-plugin-vue'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { string } from 'rollup-plugin-string'

import postcss from 'rollup-plugin-postcss'
import postcssAutoprefixer from 'autoprefixer'
import postcssCalc from 'postcss-calc'
import postcssClean from 'postcss-clean'
import postcssConditionals from 'postcss-conditionals'
import postcssCustomProps from './build/postcss-custom-properties-polyfill'
import postcssFor from 'postcss-for'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssVars from 'postcss-simple-vars'
import postcssUnprefix from 'postcss-unprefix'

import variables from './src/variables'

export default {
  input: 'src/index.js',
  external: ['vue'],
  plugins: [
    alias({
      entries: [
        { find: '@icons', replacement: 'tabler-icons/icons' },
        { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') },
        { find: '@mixins', replacement: path.resolve(__dirname, 'src/mixins') },
        { find: '@events', replacement: path.resolve(__dirname, 'src/events') }
        
      ]
    }),
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
        postcssFor,
        postcssVars({ variables }),
        postcssCustomProps(),
        postcssCalc,
        postcssNested,
        postcssConditionals,
        postcssAutoprefixer,
        postcssClean({
          format: {
            breaks: {
              afterAtRule: true,
              afterBlockBegins: true,
              afterBlockEnds: true,
              afterComment: true,
              afterProperty: true,
              afterRuleBegins: true,
              afterRuleEnds: true,
              beforeBlockEnds: true,
              betweenSelectors: true
            },
            spaces: {
              aroundSelectorRelation: true,
              beforeBlockBegins: true,
              beforeValue: true
            },
            semicolonAfterLastProperty: true,
            indentBy: 2
          }
        })
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
      sourcemap: false
    },
    {
      file: 'dist/mussel.esm.js',
      format: 'esm',
      globals: {
        vue: 'Vue'
      },
      sourcemap: false
    }
  ]
}
