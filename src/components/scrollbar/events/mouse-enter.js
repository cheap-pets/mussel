export default function onMouseEnter () {
  this.hover = true
  if (!this.scrolling && this.options.scrollbarVisible === 'enter') {
    this.show()
    this.updatePosition()
  }
}
