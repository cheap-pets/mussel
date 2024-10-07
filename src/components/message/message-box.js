import { delay } from '@/utils/timer'
import { isString } from '@/utils/type'
import { MessageTypes } from './constant'
import { createDynamicComponent } from '@/utils/vue'

import MessageBox from './message-box.vue'

export function pluginMessageBox (app) {
  function showMessage (options) {
    const type = (options.type || 'ALERT').toUpperCase()

    options = {
      ...MessageTypes[type],
      ...isString(options) ? { message: options } : options
    }

    return new Promise(resolve => {
      let dispose

      const callback = btn => {
        options.callback?.(btn)
        resolve(btn)

        delay(300).then(() => {
          dispose?.()
          dispose = undefined
        })
      }

      const { icon, title, message, buttons } = options

      dispose = createDynamicComponent({
        appContext: app._context,
        container: app._container,
        component: MessageBox,
        props: { type, icon, title, message, buttons, callback }
      })
    })
  }

  function alert (message, callback) {
    return showMessage({
      type: 'alert',
      message,
      callback
    })
  }

  function confirm (message, callback) {
    return showMessage({
      type: 'confirm',
      message,
      callback
    })
  }

  function error (message, callback) {
    return showMessage({
      type: 'error',
      message,
      callback
    })
  }

  function warn (message, callback) {
    return showMessage({
      type: 'warn',
      message,
      callback
    })
  }

  return {
    showMessage,
    alert,
    confirm,
    error,
    warn
  }
}
