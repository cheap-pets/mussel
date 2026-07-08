import './styles/root.scss'

import { setupLocale } from './langs/index.js'
import { setupColors } from './colors.js'

import { install as installIcons } from './icons/index.js'
import { install as installComponents } from './components/index.js'

import { resolveElement } from './utils/dom.js'

import './styles/atomic.js'

function setupRootClass (dark, rootElement) {
  rootElement.classList.add('mu-root')

  if (
    (dark === true) ||
    (dark === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
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

  context.setupColors = setupColors.bind(context)
  app.provide('$mussel', context)
  app.config.globalProperties.$mussel = context

  setupLocale(locale, localeResources)
  setupRootClass(dark, rootElement)
  setupColors(colors, rootElement)

  installIcons(icons)
  installComponents(app)

  return app
}

export * from './env'

export { EventInterceptor } from './events'
export { colors } from './colors.js'
export { icons } from './icons/index.js'
export { install, installIcons }
