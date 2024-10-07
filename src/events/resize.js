import { EventInterceptor } from './interceptor'
import { dispatchCustomEvent } from './custom-event'

const OBSERVE_COUNT_SYMBOL = Symbol.for('mussel.event.resize.count')

const observer = new ResizeObserver(entries => {
  entries.forEach(entry => dispatchCustomEvent(entry.target, 'sizechange'))
})

const interceptor = {
  add () {
    const count = this[OBSERVE_COUNT_SYMBOL] || 0

    if (!count) observer.observe(this)

    this[OBSERVE_COUNT_SYMBOL] = count + 1
  },

  remove () {
    const count = this[OBSERVE_COUNT_SYMBOL] || 0

    if (count <= 1) {
      this[OBSERVE_COUNT_SYMBOL] = 0
      observer.unobserve(this)
    } else {
      this[OBSERVE_COUNT_SYMBOL]--
    }
  }
}

EventInterceptor.register('sizechange', interceptor)
