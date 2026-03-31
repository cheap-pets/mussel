import { t } from '@/langs'

export const ButtonPresets = {
  ACCEPT: {
    get caption () { return t('Button.ACCEPT') },
    primary: true
  },
  OK: {
    get caption () { return t('Button.OK') },
    primary: true
  },
  CANCEL: {
    get caption () { return t('Button.CANCEL') },
    buttonStyle: 'text'
  },
  YES: {
    get caption () { return t('Button.YES') },
    primary: true
  },
  NO: {
    get caption () { return t('Button.NO') },
    buttonStyle: 'text'
  },
  'OK!': {
    get caption () { return t('Button.OK') },
    danger: true
  },
  'YES!': {
    get caption () { return t('Button.YES') },
    danger: true
  }
}
