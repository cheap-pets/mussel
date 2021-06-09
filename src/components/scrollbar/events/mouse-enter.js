export default function onMouseEnter () {
  this.hover = true

  if (!this.mouseInAction && this.options.scrollbarVisible === 'enter') {
    this.show()
    this.updatePosition()
  }
}
