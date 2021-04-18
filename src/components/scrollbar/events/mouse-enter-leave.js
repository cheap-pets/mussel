export function onMouseEnter () {
  this.hover = true
  if (!this.scrolling && this.options.scrollbarVisible === 'enter') {
    this.show()
    this.updatePosition()
  }
}

export function onMouseLeave () {
  this.hover = false
  this.hide()
}
