import { attach, detach } from '../scrollbar'

export default {
  inserted (el, binding) {
    attach(el, binding.value)
  },
  unbind (el) {
    detach(el)
  }
}
