import { attach, detach } from 'mussel-scrollbar'

export function install (app) {
  app.directive('mu-scrollbar', {
    mounted: (el, bindings) => {
      if (
        bindings.value !== false &&
        bindings.value !== 'none'
      ) {
        attach(el)
      }
    },
    beforeUnmount: detach
  })
}
