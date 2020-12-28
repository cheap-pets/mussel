export function onMouseEnter () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  if (!this.hover && !this.scrolling) this.show()
  this.hover = true
}

export function onMouseLeave () {
  this.hover = false
  this.hide()
}
