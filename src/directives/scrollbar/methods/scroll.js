export function scrollBy (deltaX, deltaY, event) {
  let preventDefault

  if (deltaX) {
    const last = this.el.scrollLeft
    this.el.scrollLeft += deltaX
    preventDefault = this.el.scrollLeft !== last
  }
  if (deltaY) {
    const last = this.el.scrollTop
    this.el.scrollTop += deltaY
    preventDefault = preventDefault || this.el.scrollTop !== last
  }
  if (event && preventDefault) {
    event.stopPropagation()
    event.preventDefault()
  }
}

export function scrollTo (x, y, event) {
  let preventDefault

  if (!isNaN(x)) {
    const last = this.el.scrollLeft
    this.el.scrollLeft = x
    preventDefault = this.el.scrollLeft !== last
  }
  if (!isNaN(y)) {
    const last = this.el.scrollTop
    this.el.scrollTop = y
    preventDefault = preventDefault || this.el.scrollTop !== last
  }
  if (event && preventDefault) {
    event.stopPropagation()
    event.preventDefault()
  }
}
