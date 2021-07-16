import Vue from 'vue'

import variables from '@/variables'
import * as scrollbar from './scrollbar'
import { installDirectives } from './directives'
import { installComponents } from './components'

export * from './events'
export * from './components'
export * from './base-styles'

export { setTheme } from '@/utils/theme'
export { scrollbar, variables }

export function install ($Vue) {
  installDirectives($Vue)
  installComponents($Vue)
}

if (Vue) install(Vue)
