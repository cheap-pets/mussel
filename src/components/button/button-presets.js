import lang from '@/langs'

export const ButtonPresets = {
  ACCEPT: {
    caption: lang.Button.ACCEPT,
    primary: true
  },
  OK: {
    caption: lang.Button.OK,
    primary: true
  },
  CANCEL: {
    caption: lang.Button.CANCEL,
    buttonStyle: 'text'
  },
  YES: {
    caption: lang.Button.YES,
    primary: true
  },
  NO: {
    caption: lang.Button.NO,
    buttonStyle: 'text'
  },
  'OK!': {
    caption: lang.Button.OK,
    danger: true
  },
  'YES!': {
    caption: lang.Button.YES,
    danger: true
  }
}
