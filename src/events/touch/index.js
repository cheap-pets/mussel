import * as Recognizers from './recognizers'

import { bind, unbind } from './touch'
import { EventInterceptor } from '../interceptor'
import { GESTURE_CONTEXT_PROP, EventTypes } from './constant'

function interceptorAdd (type, listener, options) {
  if (!this[GESTURE_CONTEXT_PROP]) bind(this, options)

  const { listeners, recognizers } = this[GESTURE_CONTEXT_PROP]

  if (!listeners[type]) {
    const gesture = EventTypes[type]

    listeners[type] = []

    if (!recognizers[gesture]) recognizers[gesture] = Recognizers[gesture]
  }

  listeners[type].push(listener)
}

function interceptorRemove (type, listener, options) {
  if (!this[GESTURE_CONTEXT_PROP]) return

  const listeners = this[GESTURE_CONTEXT_PROP][type]
  const idx = listeners?.indexOf(listener)

  if (idx >= 0) {
    listeners.splice(idx, 0)

    if (!listeners.length) delete listeners[type]
    if (Object.keys(listeners).length < 1) unbind(this, options)
  }
}

if ('ontouchstart' in window) {
  Object.keys(EventTypes).forEach(type => {
    EventInterceptor.register(type, {
      add: interceptorAdd,
      remove: interceptorRemove
    })
  })
}
