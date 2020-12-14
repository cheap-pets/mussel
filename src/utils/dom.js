function whileParentElement (element, includeSelf, callback) {
  element = includeSelf ? element : Object(element).parentNode
  while (Object(element).nodeType === 1) {
    if (callback(element) === false) return
    element = element.parentNode
  }
}

function hasMaskParent (element) {
  let result = false
  whileParentElement(element, true, (el) => {
    result = String(el.className).indexOf('mu-modal-mask') !== -1
    return !result
  })
  return result
}

export {
  whileParentElement,
  hasMaskParent
}
