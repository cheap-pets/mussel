export default function scrollBy (deltaX, deltaY, event) {
  let preventDefault

  if (deltaX) {
    const last = this.el.scrollLeft
    this.el.scrollLeft += deltaX
    preventDefault = preventDefault || this.el.scrollLeft !== last
  }
  if (deltaY) {
    const last = this.el.scrollTop
    this.el.scrollTop += deltaY
    preventDefault = this.el.scrollTop !== last
  }
  if (event && preventDefault) event.preventDefault()
}
