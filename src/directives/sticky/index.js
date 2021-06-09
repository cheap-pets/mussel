import './style.pcss'

import onParentScroll from './handle-parent-scroll'

export default {
  inserted (el, binding) {
    if (!el.__mussel_sticky) {
      const ctx = el.__mussel_sticky = { el, option: binding.value }

      ctx.onParentScroll = onParentScroll.bind(ctx)

      el.classList.add('mu-sticky')
      el.parentNode.addEventListener('scroll', ctx.onParentScroll, true)
      el.parentNode.addEventListener('sizechange', ctx.onParentScroll)
    }
  },
  unbind (el) {
    const ctx = el.__mussel_sticky

    if (ctx) {
      if (el.parentNode) {
        el.parentNode.removeEventListener('scroll', ctx.onParentScroll, true)
        el.parentNode.removeEventListener('sizechange', ctx.onParentScroll)
      }

      el.classList.remove('mu-sticky')
      delete el.__mussel_sticky
    }
  }
}
