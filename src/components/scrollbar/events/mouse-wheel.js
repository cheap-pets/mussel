function absMin (value, maxValue) {
  return maxValue && Math.abs(value) > maxValue
    ? Math.sign(value) * maxValue
    : value
}

export default function onMouseWheel (event) {
  if (this.scrolling) {
    event.preventDefault()
    return
  }

  if (!this.activated) this.show(true)

  const { maxWheelDistance: max, wheelSpeed } = this.options
  const magnification = event.deltaMode === 1 ? 10 : 1

  const x = absMin(event.deltaX * magnification * wheelSpeed, max)
  const y = absMin(event.deltaY * magnification * wheelSpeed, max)

  // if (event.shiftKey) [x, y] = [y, x]

  const deltaX = this.hiddenX ? null : x // ((x || !this.hiddenY) ? x : y)
  const deltaY = this.hiddenY ? null : y // ((y || !this.hiddenX) ? y : x)

  this.scrollBy(deltaX, deltaY, event)
}
