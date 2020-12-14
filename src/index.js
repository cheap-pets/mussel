import Vue from 'vue'

import './base-styles'

import { installDirectives } from './directives'
import { installComponents } from './components'

export * from './events'
export * from './components'
export { setTheme } from '@utils/theme'

export function install ($Vue) {
  installDirectives($Vue)
  installComponents($Vue)
}

if (Vue) install(Vue)
