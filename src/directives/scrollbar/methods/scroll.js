export function scrollBy (deltaX, deltaY, event) {
  let propagation = this.options.propagation !== false

  if (deltaX) {
    const oldX = this.el.scrollLeft
    this.el.scrollLeft += deltaX
    propagation = propagation && this.el.scrollLeft === oldX
  }
  if (deltaY) {
    const oldY = this.el.scrollTop
    this.el.scrollTop += deltaY
    propagation = propagation && this.el.scrollTop === oldY
  }

  if (event && !propagation) {
    event.stopPropagation()
    event.preventDefault()
  }
}

export function scrollTo (x, y, event) {
  let propagation = this.options.propagation !== false

  if (!isNaN(x)) {
    const oldX = this.el.scrollLeft
    this.el.scrollLeft = x
    propagation = propagation && this.el.scrollLeft !== oldX
  }
  if (!isNaN(y)) {
    const oldY = this.el.scrollTop
    this.el.scrollTop = y
    propagation = propagation && this.el.scrollTop !== oldY
  }

  if (event && !propagation) {
    event.stopPropagation()
    event.preventDefault()
  }
}
