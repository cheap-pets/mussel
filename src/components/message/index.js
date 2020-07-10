import Vue from 'vue'
import isString from 'lodash.isstring'

import MessageBox from './message-box.vue'
import Notifier from './notifier.vue'

import { isZh } from '../../utils/language'

const alertTitle = isZh ? '提示' : 'Alert'
const errorTitle = isZh ? '错误' : 'Error'
const confirmTitle = isZh ? '确认提示' : 'Confirm'
const warnTitle = isZh ? '确认警告' : 'Warning'

const dialogButtons = {
  ok: {
    id: 'ok',
    caption: isZh ? '确定' : 'OK',
    action: 'close'
  },
  cancel: {
    id: 'cancel',
    caption: isZh ? '取消' : 'CANCEL',
    action: 'close'
  },
  yes: {
    id: 'yes',
    caption: isZh ? '是' : 'YES',
    action: 'close'
  },
  no: {
    id: 'no',
    caption: isZh ? '否' : 'NO',
    action: 'close'
  }
}

export function showMessage (options) {
  const { title, message, buttons, primaryButton, danger, callback } = options

  return new Promise(resolve => {
    const dialog = new Vue({
      extends: MessageBox,
      title,
      message,
      danger,
      buttons: buttons.map(
        btn => isString(btn) ? (dialogButtons[btn] || btn) : btn
      ),
      primaryButton: primaryButton === undefined
        ? buttons[0]
        : primaryButton
    })
    dialog.$once('hide', btn => {
      if (callback) callback(btn)
      resolve(btn)
    })
    dialog.show()
  })
}

export function alert (message, callback) {
  return showMessage({
    title: alertTitle,
    buttons: ['ok'],
    message,
    callback
  })
}

export function error (message, callback) {
  return showMessage({
    title: errorTitle,
    buttons: ['ok'],
    danger: true,
    message,
    callback
  })
}

export function confirm (message, callback) {
  return showMessage({
    title: confirmTitle,
    buttons: ['ok', 'cancel'],
    message,
    callback
  })
}

export function warn (message, callback) {
  return showMessage({
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
