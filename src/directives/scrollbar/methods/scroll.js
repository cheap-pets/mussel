export function scrollBy (deltaX, deltaY, event) {
  let propagation = (deltaX || deltaY)
    ? this.options.propagation === true
    : this.options.propagation !== false

  if (deltaX) {
    const edge = this.el.scrollLeft
    this.el.scrollLeft += deltaX
    propagation = propagation && this.el.scrollLeft >= edge
  }
  if (deltaY) {
    const edge = this.el.scrollTop
    this.el.scrollTop += deltaY
    propagation = propagation && this.el.scrollTop >= edge
  }
  if (event && !propagation) {
    event.stopPropagation()
    event.preventDefault()
  }
}

export function scrollTo (x, y, event) {
  let propagation = this.options.propagation === true

  if (!isNaN(x)) {
    const edge = this.el.scrollLeft
    this.el.scrollLeft = x
    propagation = propagation && this.el.scrollLeft >= edge
  }
  if (!isNaN(y)) {
    const edge = this.el.scrollTop
    this.el.scrollTop = y
    propagation = propagation && this.el.scrollTop >= edge
  }
  if (event && !propagation) {
    event.stopPropagation()
    event.preventDefault()
  }
}
