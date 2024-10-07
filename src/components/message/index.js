import { pluginNotifier } from './notifier.js'
import { pluginMessageBox } from './message-box.js'

function install (app, options = {}) {
  app.config.globalProperties.$mussel.messageBox = {
    ...pluginNotifier(app),
    ...pluginMessageBox(app)
  }
}

export { default as MuStatusBox } from './status-box.vue'
export { install }
