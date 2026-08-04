import { attach, detach } from './scrollbar'

// 'none' 为历史兼容写法，等价于 false
const DISABLED = new Set([false, 'none'])

function sync (el, value) {
  if (DISABLED.has(value)) {
    detach(el)
  } else {
    attach(el)
  }
}

export function install (app) {
  app.directive('mu-scrollbar', {
    mounted: (el, { value }) => sync(el, value),
    updated: (el, { value, oldValue }) => {
      if (value !== oldValue) sync(el, value)
    },
    beforeUnmount: detach
  })
}
