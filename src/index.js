import Vue from 'vue'

import './base-styles'

import { installComponents } from './components'
import { installDirectives } from './directives'

export * from './events'
export * from './components'
export { setTheme } from '@utils/theme'

export function install ($Vue) {
  installComponents($Vue)
  installDirectives($Vue)
}

if (Vue) install(Vue)
