export function onMouseWheel (event) {
  const magnification = event.deltaMode === 1 ? 10 : 1

  const deltaY = event.deltaY * magnification
  const deltaX = event.deltaX * magnification

  if (!this.hiddenY) this.el.scrollTop += event.shiftKey ? deltaX : deltaY
  if (!this.hiddenX) this.el.scrollLeft += event.shiftKey ? deltaY : deltaX

  this.updatePosition()
}
