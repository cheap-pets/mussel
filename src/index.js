import './styles/index.js'

import { setupLocale } from './langs/index.js'
import { setupColors } from './colors.js'

import { install as installIcons } from './icons/index.js'
import { install as installComponents } from './components/index.js'

import { resolveElement } from './utils/dom.js'

const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches

function setupRootClass (rootElement, dark) {
  rootElement.classList.add('mu-root')

  if ((dark === true) || (dark === 'auto' && isSysDark)) {
    rootElement.classList.add('mu-dark')
  }
}

function install (app, options = {}) {
  const {
    root,
    dark,
    icons,
    colors,
    locale,
    localeResources,
    ...componentOptions
  } = options

  const rootElement = resolveElement(root) || document.body
  const context = { rootElement, options: componentOptions }

  app.provide('$mussel', context)
  app.config.globalProperties.$mussel = context

  setupRootClass(rootElement, dark)
  setupColors(rootElement, colors)
  setupLocale(locale, localeResources)

  installIcons(icons)
  installComponents(app)

  return app
}

export * from './env'

export { EventInterceptor } from './events'
export { colors } from './colors.js'
export { install, installIcons }
