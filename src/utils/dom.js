function isParentElement (element, parentElement, includeSelf) {
  if (includeSelf && element === parentElement) return true
  while (Object(element.parentNode).nodeType === 1) {
    element = element.parentNode
    if (element === parentElement) return true
  }
  return false
}

export {
  isParentElement
}
