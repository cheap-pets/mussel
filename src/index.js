import './styles/index.scss'

import { install as installTheme } from './theme.js'
import { install as installIcons } from './icons/index.js'
import { install as installDirectives } from './directives/index.js'
import { install as installComponents } from './components/index.js'

import { resolveElement } from './utils/dom.js'

const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches

function install (app, options = {}) {
  const { root, darkMode, theme, icons, ...componentOptions } = options

  const rootElement = resolveElement(root) || document.body
  const context = { rootElement, options: componentOptions }

  app.provide('$mussel', context)
  app.config.globalProperties.$mussel = context

  installTheme(app, {
    root: rootElement,
    darkMode: (darkMode === true) || (darkMode === 'auto' && isSysDark),
    variables: theme
  })

  installIcons(icons)
  installDirectives(app)
  installComponents(app)
}

export * as scrollbar from 'mussel-scrollbar'

export { EventInterceptor } from './events'
export { install, installIcons }
