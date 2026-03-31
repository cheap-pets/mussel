import './styles/index.js'

import { setupLocale } from './langs/index.js'
import { setupColors } from './colors.js'

import { install as installIcons } from './icons/index.js'
import { install as installDirectives } from './directives/index.js'
import { install as installComponents } from './components/index.js'

import { resolveElement } from './utils/dom.js'

const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches

function install (app, options = {}) {
  const { root, darkMode, colors, icons, locale, localeResources, ...componentOptions } = options

  const rootElement = resolveElement(root) || document.body
  const context = { rootElement, options: componentOptions }

  app.provide('$mussel', context)
  app.config.globalProperties.$mussel = context

  setupLocale(locale, localeResources)

  setupColors({
    root: rootElement,
    darkMode: (darkMode === true) || (darkMode === 'auto' && isSysDark),
    colors
  })

  installIcons(icons)
  installDirectives(app)
  installComponents(app)

  return app
}

export * from './env'
export * as scrollbar from 'mussel-scrollbar'

export { EventInterceptor } from './events'
export { install, installIcons }
