import { t } from '@/langs'

function tb (btnId) {
  return t(`Button.${btnId}`)
}

export const ButtonPresets = {
  '#YES': {
    name: 'YES',
    primary: true,
    get caption () { return tb('YES') }
  },
  '#YES!': {
    name: 'YES',
    danger: true,
    get caption () { return tb('YES') }
  },
  '#NO': {
    name: 'NO',
    action: 'close',
    buttonStyle: 'text',
    get caption () { return tb('NO') }
  },
  '#OK': {
    name: 'OK',
    primary: true,
    get caption () { return tb('OK') }
  },
  '#OK!': {
    name: 'OK',
    danger: true,
    get caption () { return tb('OK') }
  },
  '#ACCEPT': {
    name: 'ACCEPT',
    primary: true,
    get caption () { return tb('ACCEPT') }
  },
  '#CANCEL': {
    name: 'CANCEL',
    action: 'close',
    buttonStyle: 'text',
    get caption () { return tb('CANCEL') }
  },
  '#CLOSE': {
    name: 'CLOSE',
    action: 'close',
    buttonStyle: 'text',
    get caption () { return tb('CLOSE') }
  },
  ' ': { is: 'div', class: 'flex-space' },
  '-': { is: 'div', class: 'flex-divider' }
}
