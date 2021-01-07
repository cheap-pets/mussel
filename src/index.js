import Vue from 'vue'

import './base-styles'

import { installDirectives } from './directives'
import { installComponents } from './components'

import variables from '@variables'

export * from './events'
export * from './components'
export { setTheme } from '@utils/theme'
export { variables }

export function install ($Vue) {
  installDirectives($Vue)
  installComponents($Vue)
}

if (Vue) install(Vue)
