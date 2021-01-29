import './scrollbar.pcss'

import attach from './attach'

export default {
  inserted (el, binding) {
    attach(el, binding)
  }
}
