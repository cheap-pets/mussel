export function dispatchCustomEvent (el, type, options) {
  return el.dispatchEvent(
    new CustomEvent(type, {
      bubbles: false,
      cancelable: true,
      ...options
    })
  )
}
