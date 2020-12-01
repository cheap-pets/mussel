import ResizeObserver from 'resize-observer-polyfill'

import emit from './emit'
import interceptor from './interceptor'

const GLOBAL_OBSERVER_NAME = '__mussel_resize_observer'
const LISTENER_COUNT_PROP_NAME = '__mussel_resize_listener_count'

function getResizeObserver () {
  if (!window[GLOBAL_OBSERVER_NAME]) {
    window[GLOBAL_OBSERVER_NAME] = new ResizeObserver(entries => {
      entries.forEach(entry => emit(entry.target, 'sizechange'))
    })
  }
  return window[GLOBAL_OBSERVER_NAME]
}

function interceptorAdd () {
  const count = this[LISTENER_COUNT_PROP_NAME] || 0
  if (!count) getResizeObserver().observe(this)

  this[LISTENER_COUNT_PROP_NAME] = count + 1
}

function interceptorRemove () {
  const count = this[LISTENER_COUNT_PROP_NAME] || 0
  this[LISTENER_COUNT_PROP_NAME] = count ? count - 1 : 0
  if (!count) getResizeObserver().unobserve(this)
}

interceptor.register('sizechange', {
  add: interceptorAdd,
  remove: interceptorRemove
})
