import vars from '../variables'

import en from './en'
import zh from './zh'

function isZh () {
  return (
    vars.lang ||
    navigator.language ||
    navigator.userLanguage
  ).indexOf('zh') === 0
}

const lang = {}

;['Bar', 'Button', 'Dialog', 'Calendar'].forEach(prop => {
  Object.defineProperty(lang, prop, {
    get: () => isZh() ? zh[prop] : en[prop]
  })
})

export default lang
