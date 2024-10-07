import { shallowReactive } from 'vue'
import { isString } from '@/utils/type'
import { MessageTypes } from './constant'
import { createDynamicComponent } from '@/utils/vue'

import Notifier from './notifier.vue'

const NOTIFY_TYPES = ['ALERT', 'ERROR', 'WARN', 'SUCCESS']

export function pluginNotifier (app) {
  const notifications = shallowReactive([])

  let counter = 0
  let exist

  function dismiss (id) {
    const idx = notifications.findIndex(el => el.id === id)

    if (idx !== -1) notifications.splice(idx, 1)
  }

  function notify (options = {}) {
    if (isString(options)) options = { message: options }
    else if (!options.message) return

    exist = exist || !!createDynamicComponent({
      container: app._container,
      appContext: app._context,
      component: Notifier,
      props: { notifications }
    })

    const { type = 'alert', duration = 3000, ...notifyOptions } = options

    const messageType = NOTIFY_TYPES.includes(type.toUpperCase()) ? type : 'alert'
    const defaultOption = MessageTypes[messageType.toUpperCase()]
    const id = ++counter

    notifications.unshift({
      ...defaultOption,
      ...notifyOptions,
      type: messageType,
      id
    })

    setTimeout(() => dismiss(id), duration)
  }

  return {
    notify
  }
}
