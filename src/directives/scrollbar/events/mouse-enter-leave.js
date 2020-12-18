export function onMouseEnter () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  if (!this.hover) {
    this.hover = true
    this.show()
    this.updatePosition()
  }
}

export function onMouseLeave () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  if (!this.hover) {
    this.hide()
  } else {
    this.hover = false
    this.hideTimer = setTimeout(onMouseLeave.bind(this), 1000)
  }
}
