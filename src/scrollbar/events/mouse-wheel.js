export default function onMouseWheel (event) {
  if (this.mouseInAction) {
    event.preventDefault()
    return
  }

  const ratio = this.options.wheelSpeed * (event.deltaMode === 1 ? 10 : 1)

  let x = event.deltaX * ratio
  let y = event.deltaY * ratio

  if (event.shiftKey) [x, y] = [y, x]

  const deltaX = this.hiddenX ? null : x // ((x || !this.hiddenY) ? x : y)
  const deltaY = this.hiddenY ? null : y // ((y || !this.hiddenX) ? y : x)

  this.scrollBy(deltaX, deltaY, event)
}
