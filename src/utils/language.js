export function isZh (defaultLang) {
  return (defaultLang ||
    navigator.language ||
    navigator.userLanguage
  ).indexOf('zh') === 0
}
