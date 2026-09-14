import './styles/root.scss'

import { setupLocale } from './langs/index.js'
import { setupColors } from './colors.js'

import { install as installIcons } from './icons/index.js'
import { install as installComponents } from './components/index.js'

import { createPopupCoordinator } from './components/common/popup.js'
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

  // SSR（SSG 构建）阶段无 DOM：rootElement 置空、跳过根元素样式设置，
  // 仅完成组件注册与 $mussel 上下文注入，让组件可在服务端渲染。
  const isBrowser = typeof document !== 'undefined'
  const rootElement = isBrowser ? (resolveElement(root) || document.body) : null
  const context = { rootElement, options: componentOptions }

  context.popupCoordinator = createPopupCoordinator()
  context.setupColors = setupColors.bind(context)

  app.provide('$mussel', context)
  app.config.globalProperties.$mussel = context

  setupLocale(locale, localeResources)

  if (isBrowser) {
    setupRootClass(dark, rootElement)
    setupColors(colors, rootElement)
  }

  installIcons(icons)
  installComponents(app)

  return app
}

export * from './env'

export { EventInterceptor } from './events'
export { colors } from './colors.js'
export { icons } from './icons/index.js'
export { install, installIcons }
