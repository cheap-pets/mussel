import { t } from '@/langs'

export const MessageTypes = {
  ALERT: {
    icon: 'info',
    buttons: ['#OK'],
    get title () { return t('Message.ALERT') }
  },
  SUCCESS: {
    icon: 'ok',
    buttons: ['#OK'],
    get title () { return t('Message.SUCCESS') }
  },
  CONFIRM: {
    icon: 'question',
    buttons: ['#CANCEL', '#OK'],
    get title () { return t('Message.CONFIRM') }
  },
  ERROR: {
    icon: 'x',
    buttons: ['#OK!'],
    danger: true,
    get title () { return t('Message.ERROR') }
  },
  WARN: {
    icon: 'alert',
    buttons: ['#CANCEL', '#OK!'],
    danger: true,
    get title () { return t('Message.WARN') }
  }
}
