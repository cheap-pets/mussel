export function dispatchCustomEvent (el, type, options) {
  return el.dispatchEvent(
    new CustomEvent(type, {
      canBubble: false,
      cancelable: true,
      ...options
    })
  )
}
