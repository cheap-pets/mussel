import vue from 'rollup-plugin-vue'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

import postcss from 'rollup-plugin-postcss'
import postcssAutoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import postcssClean from 'postcss-clean'
import postcssFor from 'postcss-for'
import postcssNested from 'postcss-nested'
import postcssVars from 'postcss-simple-vars'
import postcssUnprefix from 'postcss-unprefix'

export default {
  input: 'src/index.js',
  plugins: [
    vue({
      css: false
    }),
    postcss({
      plugins: [
        postcssImport,
        postcssUnprefix,
        postcssFor,
        postcssVars,
        postcssNested,
        postcssAutoprefixer,
        postcssClean
      ]
    }),
    resolve({
      mainFields: ['module', 'main', 'browser']
    }),
    commonjs(),
    babel({
      exclude: [/\/core-js\//],
      externalHelpers: true,
      extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.vue']
    }),
    terser()
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
      file: 'dist/buebue.min.js',
      format: 'umd',
      name: 'Bue',
      sourcemap: true
    },
    {
      file: 'dist/buebue.esm.min.js',
      format: 'esm',
      sourcemap: true
    }
  ]
}
