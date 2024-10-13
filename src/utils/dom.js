import { isString } from './type'

export function findUp (el, callback) {
  while (Object(el).nodeType === 1) {
    const result = callback(el)

    if (result === false) break
    if (result) return el

    el = el.parentNode
  }
}

export function resolveElement (el) {
  return isString(el)
    ? document.querySelector(el)
    : el
}

export function isInputElement (el) {
  return (
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName.toUpperCase()) ||
    el.hasAttribute('contenteditable')
  )
}

export function resolveSafeHTML (html = '') {
  return html
    .replace(/\s+on\w+="[^"]*"/gi, '') // event bindings
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // <script> node
}

export function isElementInViewport (el) {
  const { innerHeight, innerWidth } = window
  const { top, left, height, width } = el.getBoundingClientRect()

  const xInView = (left <= innerWidth) && ((left + width) >= 0)
  const yInView = (top <= innerHeight) && ((top + height) >= 0)

  return xInView && yInView
}
