export function onMouseEnter () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  if (!this.hover) {
    this.hover = true
    this.setPosition()
  }
}

export function onMouseLeave () {
  if (!this.hover) {
    this.hide()
  } else {
    this.hover = false
    setTimeout(onMouseLeave.bind(this), 1000)
  }
}
