import MessageBox from './message-box.vue'
import { isZh } from '../../utils/language'

let $Vue

export function alert (message, callback) {
  if (!$Vue) return
  const dialog = new $Vue({
    extends: MessageBox,
    data: {
      message
    },
    title: isZh ? '提示' : 'Alert',
    buttons: [{
      id: 'ok',
      caption: isZh ? '确定' : 'OK',
      action: 'close'
    }]
  })
  if (callback) dialog.$on('hide', callback)
  dialog.show()
}

export function confirm (message, callback) {
  if (!$Vue) return
  const dialog = new $Vue({
    extends: MessageBox,
    data: {
      message
    },
    title: isZh ? '确认提示' : 'Confirm',
    primaryButton: isZh ? '确定' : 'OK',
    buttons: [
      {
        id: 'ok',
        caption: isZh ? '确定' : 'OK',
        action: 'close'
      },
      {
        id: 'cancel',
        caption: isZh ? '取消' : 'CANCEL',
        action: 'close'
      }
    ]
  })
  if (callback) dialog.$on('hide', callback)
  dialog.show()
}

export function warn (message, callback) {
  if (!$Vue) return
  const dialog = new $Vue({
    extends: MessageBox,
    data: {
      message
    },
    danger: true,
    title: isZh ? '确认警告' : 'Warning',
    primaryButton: isZh ? '确定' : 'OK',
    buttons: [
      {
        id: 'ok',
        caption: isZh ? '确定' : 'OK',
        action: 'close'
      },
      {
        id: 'cancel',
        caption: isZh ? '取消' : 'CANCEL',
        action: 'close'
      }
    ]
  })
  if (callback) dialog.$on('hide', callback)
  dialog.show()
}

export function install (Vue) {
  $Vue = Vue
}
