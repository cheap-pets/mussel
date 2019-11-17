import { isZh } from '../../utils/language'

import MessageBox from './message-box.vue'
import Notifier from './notifier.vue'

let $Vue

const alertTitle = isZh ? '提示' : 'Alert'
const confirmTitle = isZh ? '确认提示' : 'Confirm'
const warnTitle = isZh ? '确认警告' : 'Warning'

const okButton = {
  id: 'ok',
  caption: isZh ? '确定' : 'OK',
  action: 'close'
}

const cancelButton = {
  id: 'cancel',
  caption: isZh ? '取消' : 'CANCEL',
  action: 'close'
}

function showMessage (method, message, callback) {
  if (!$Vue) return
  const dialog = new $Vue({
    extends: MessageBox,
    data: {
      message
    },
    title: method === 'warn'
      ? warnTitle
      : (
        method === 'confirm'
          ? confirmTitle
          : alertTitle
      ),
    danger: method === 'warn',
    buttons: method !== 'alert'
      ? [okButton, cancelButton]
      : [okButton],
    primaryButton: 'ok'
  })
  if (callback) dialog.$on('hide', callback)
  dialog.show()
}

export function alert (message, callback) {
  showMessage('alert', message, callback)
}

export function confirm (message, callback) {
  showMessage('confirm', message, callback)
}

export function warn (message, callback) {
  showMessage('warn', message, callback)
}

let notifier

export function notify (notifyType, message, timeout) {
  if (!$Vue) return
  if (!notifier) {
    notifier = new $Vue(Notifier).$mount()
    document.body.appendChild(notifier.$el)
  }
  notifier.notify(notifyType, message, timeout)
}

export function install (Vue) {
  $Vue = Vue
}
