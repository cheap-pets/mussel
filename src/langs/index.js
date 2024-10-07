import en from './en'
import zh from './zh'

function isZh () {
  return (
    navigator.language ||
    navigator.userLanguage
  ).indexOf('zh') === 0
}

const lang = {}

;['Page', 'Button', 'Message', 'Calendar'].forEach(prop => {
  Object.defineProperty(lang, prop, {
    get: () => isZh() ? zh[prop] : en[prop]
  })
})

export default lang
