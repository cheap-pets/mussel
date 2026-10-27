import { baseColorNames, specColorNames } from '@/colors'

export const autoOrBool = {
  type: [String, Boolean],
  default: 'auto',
  validator: v => ['auto', true, false].includes(v)
}

export const colorProp = {
  type: String,
  validator: v => [...baseColorNames, specColorNames].includes(v)
}
