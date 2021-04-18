import Vue from 'vue'

import lang from '@/lang'
import MessageDialog from './message-dialog.vue'

const Buttons = {
  OK: {
    id: 'ok',
    caption: lang.Button.OK,
    action: 'close',
    buttonType: 'primary'
  },
  CANCEL: {
    id: 'cancel',
    caption: lang.Button.CANCEL,
    action: 'close',
    buttonStyle: 'text'
  }
}

export function showMessage (options) {
  const { title, message, buttons, danger, callback } = options

  return new Promise(resolve => {
    const dialog = new Vue({
      extends: MessageDialog,
      title,
      message,
      danger,
      buttons
    })
    dialog.$once('hide', btn => {
      callback?.(btn)
      resolve(btn)
    })
    dialog.show()
  })
}

export function alert (message, callback) {
  return showMessage({
    title: lang.Dialog.ALERT,
    message,
    buttons: [Buttons.OK],
    callback
  })
}

export function confirm (message, callback) {
  return showMessage({
    title: lang.Dialog.CONFIRM,
    message,
    buttons: [
      Buttons.CANCEL,
      Buttons.OK
    ],
    callback
  })
}

export function error (message, callback) {
  return showMessage({
    title: lang.Dialog.ERROR,
    message,
    danger: true,
    buttons: [
      {
        ...Buttons.OK,
        buttonType: 'danger'
      }
    ],
    callback
  })
}

export function warn (message, callback) {
  return showMessage({
    title: lang.Dialog.WARN,
    message,
    danger: true,
    buttons: [
      Buttons.CANCEL,
      {
        ...Buttons.OK,
        buttonType: 'danger'
      }
    ],
    callback
  })
}
