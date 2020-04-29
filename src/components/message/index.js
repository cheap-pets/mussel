import Vue from 'vue'

import MessageBox from './message-box.vue'
import Notifier from './notifier.vue'

import { isZh } from '../../utils/language'

const alertTitle = isZh ? '提示' : 'Alert'
const errorTitle = isZh ? '错误' : 'Error'
const confirmTitle = isZh ? '确认提示' : 'Confirm'
const warnTitle = isZh ? '确认警告' : 'Warning'

const defaultButtons = [
  {
    id: 'ok',
    caption: isZh ? '确定' : 'OK',
    action: 'close'
  },
  {
    id: 'cancel',
    caption: isZh ? '取消' : 'CANCEL',
    action: 'close'
  },
  {
    id: 'yes',
    caption: isZh ? '是' : 'YES',
    action: 'close'
  },
  {
    id: 'no',
    caption: isZh ? '否' : 'NO',
    action: 'close'
  }
]

export function showMessage (options) {
  const { title, message, buttons, primaryButton, danger, callback } = options
  const dialog = new Vue({
    extends: MessageBox,
    data: {
      message
    },
    title,
    danger,
    buttons: buttons.map(btn =>
      (defaultButtons.find(item => item.id === btn) || btn)
    ),
    primaryButton: primaryButton === undefined
      ? buttons[0]
      : primaryButton
  })
  if (callback) dialog.$on('hide', callback)
  dialog.show()
}

export function alert (message, callback) {
  showMessage({
    title: alertTitle,
    buttons: ['ok'],
    message,
    callback
  })
}

export function error (message, callback) {
  showMessage({
    title: errorTitle,
    buttons: ['ok'],
    danger: true,
    message,
    callback
  })
}

export function confirm (message, callback) {
  showMessage({
    title: confirmTitle,
    buttons: ['ok', 'cancel'],
    message,
    callback
  })
}

export function warn (message, callback) {
  showMessage({
    title: warnTitle,
    buttons: ['ok', 'cancel'],
    danger: true,
    message,
    callback
  })
}

let notifier

export function notify (notifyType, message, timeout, onClickHandler) {
  if (!notifier) {
    notifier = new Vue(Notifier).$mount()
    document.body.appendChild(notifier.$el)
  }
  notifier.notify(notifyType, message, timeout, onClickHandler)
}
