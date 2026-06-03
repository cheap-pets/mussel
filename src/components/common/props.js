export const autoOrBool = {
  type: [String, Boolean],
  default: 'auto',
  validator: v => ['auto', true, false].includes(v)
}
