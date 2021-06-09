export default function show (autoHide) {
  if (this.options.scrollbarVisible === false) return

  this.activated = true

  if (this.options.scrollbarVisible !== false) {
    this.el.setAttribute('activated', '')
    if (this.railX) this.railX.style.opacity = 1
    if (this.railY) this.railY.style.opacity = 1
  }

  if (this.hideTimer) clearTimeout(this.hideTimer)
  if (autoHide && !this.hover) this.hideTimer = setTimeout(this.hide, 1000)
}
