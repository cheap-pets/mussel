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
  const { maxWheelDistance: max, wheelSpeed } = this.options
  const magnification = event.deltaMode === 1 ? 10 : 1

  const x = absMin(event.deltaX * magnification * wheelSpeed, max)
  const y = absMin(event.deltaY * magnification * wheelSpeed, max)

  const deltaX = this.hiddenX ? null : (event.shiftKey ? y : x)
  const deltaY = this.hiddenY ? null : (event.shiftKey ? x : y)

  console.log(deltaX, deltaY)

  this.scrollBy(deltaX, deltaY, event)
}
