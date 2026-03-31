import { t } from '@/langs'

export const ButtonPresets = {
  '#YES': {
    name: 'YES',
    primary: true,
    get caption () { return t('Button.YES') }
  },
  '#YES!': {
    name: 'YES',
    danger: true,
    get caption () { return t('Button.YES') }
  },
  '#NO': {
    name: 'NO',
    action: 'close',
    buttonStyle: 'text',
    get caption () { return t('Button.NO') }
  },
  '#OK': {
    name: 'OK',
    primary: true,
    get caption () { return t('Button.OK') }
  },
  '#OK!': {
    name: 'OK',
    danger: true,
    get caption () { return t('Button.OK') }
  },
  '#ACCEPT': {
    name: 'ACCEPT',
    primary: true,
    get caption () { return t('Button.ACCEPT') }
  },
  '#CANCEL': {
    name: 'CANCEL',
    action: 'close',
    buttonStyle: 'text',
    get caption () { return t('Button.CANCEL') }
  },
  ' ': { is: 'div', class: 'mu-space' },
  '-': { is: 'div', class: 'mu-divider' }
}
