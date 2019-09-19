function isParentElement (element, parentElement) {
  while (Object(element.parentNode).nodeType === 1) {
    element = element.parentNode
    if (element === parentElement) return true
  }
  return false
}

export {
  isParentElement
}
