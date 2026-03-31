import en from './en'
import zh from './zh'

import { formatString } from '../utils/string'

const langs = { en, zh }

let resources
let currentLocale

function isZh () {
  return (navigator?.language || navigator?.userLanguage || '').startsWith('zh')
}

export function t (path, ...args) {
  if (!resources) init()

  const keys = path.split('.')
  let value = resources

  for (const key of keys) {
    value = value?.[key]
  }

  return typeof value === 'string'
    ? formatString(value, ...args)
    : value ?? path
}

export function setupLocale (locale, data) {
  if (!locale && window.navigator && isZh()) {
    locale = 'zh'
  } else {
    locale ||= 'en'
  }

  if (data) {
    langs[locale] = data
  }

  currentLocale = locale
  resources = langs[currentLocale]
}

function init () {
  setupLocale()
}

init()
