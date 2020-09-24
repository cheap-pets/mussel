import Vue from 'vue'

import Notifier from './notifier.vue'

let notifier

export function notify (notifyType, message, timeout, onClickHandler) {
  if (!notifier) {
    notifier = new Vue(Notifier).$mount()
    document.body.appendChild(notifier.$el)
  }
  notifier.notify(notifyType, message, timeout, onClickHandler)
}
