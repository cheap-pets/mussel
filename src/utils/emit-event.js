export default function emitEvent (el, eventName, options = {}) {
  const { canBubble = false, cancelable = true, data } = options
  const event = document.createEvent('CustomEvent')
  if (data) event.customData = data
  event.initCustomEvent(eventName, canBubble, cancelable, null)
  return el.dispatchEvent(event)
}
