import { unbindEvents } from './events'

export default function detach (el) {
  const ctx = el.__mussel_scrollbar

  if (ctx) {
    unbindEvents.call(ctx)

    if (ctx.mutationObserver) {
      ctx.mutationObserver.disconnect()
      delete ctx.mutationObserver
    }

    Array
      .from(el.childNodes)
      .forEach(child => {
        if (child.classList?.contains('mu-scrollbar_rail')) el.removeChild(child)
      })

    Array
      .from(el.querySelectorAll('.mu-scrollbar_rail'))
      .forEach(node => {
        if (node.parentNode === el) el.removeChild(node)
      })
    el.classList.remove('mu-scrollbar')

    delete el.__mussel_scrollbar
  }
}
