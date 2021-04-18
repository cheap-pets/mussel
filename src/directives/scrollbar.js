import { attach, detach } from '../components/scrollbar'

export default {
  inserted (el, binding) {
    attach(el, binding.value)
  },
  unbind (el) {
    detach(el)
  }
}
