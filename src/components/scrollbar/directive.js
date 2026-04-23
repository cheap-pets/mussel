import { attach, detach } from './scrollbar'

export function install (app) {
  app.directive('mu-scrollbar', {
    mounted: (el, bindings) => {
      if (![false, 'none'].includes(bindings.value)) {
        attach(el)
      }
    },
    updated: (el, bindings) => {
      if ([false, 'none'].includes(bindings.value)) {
        detach(el)
      } else {
        attach(el)
      }
    },
    beforeUnmount: detach
  })
}
