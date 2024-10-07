import { ButtonPresets } from '../button/button-presets'

export const DialogToolPresets = {
  ACCEPT: { name: 'ACCEPT', bindings: ButtonPresets.ACCEPT },
  OK: { name: 'OK', bindings: ButtonPresets.OK },
  CANCEL: { name: 'CANCEL', bindings: ButtonPresets.CANCEL, action: 'close' },
  YES: { name: 'YES', bindings: ButtonPresets.YES },
  NO: { name: 'NO', bindings: ButtonPresets.NO, action: 'close' },
  'OK!': { name: 'OK', bindings: ButtonPresets['OK!'] },
  'YES!': { name: 'YES', bindings: ButtonPresets['YES!'] },
  ' ': { is: 'div', bindings: { class: 'mu-space' } },
  '-': { is: 'div', bindings: { class: 'mu-divider' } }
}
