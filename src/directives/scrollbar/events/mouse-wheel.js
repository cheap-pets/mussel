export function onMouseWheel (event) {
  if (this.scrolling) {
    event.preventDefault()
    return
  }

  const magnification = event.deltaMode === 1 ? 10 : 1

  const x = event.deltaX * magnification
  const y = event.deltaY * magnification

  const deltaX = this.hiddenX ? null : (event.shiftKey ? y : x)
  const deltaY = this.hiddenY ? null : (event.shiftKey ? x : y)

  this.scrollBy(deltaX, deltaY, event)
}
