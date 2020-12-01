export default function emitEvent (el, eventName, options = {}) {
  const { canBubble = false, cancelable = true, data } = options

  const event = document.createEvent('CustomEvent')
  event.initCustomEvent(eventName, canBubble, cancelable, null)
  if (data) event.customData = data

  return el.dispatchEvent(event)
}
