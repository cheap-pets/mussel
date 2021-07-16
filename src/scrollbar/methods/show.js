export default function show () {
  if (this.options.scrollbarVisible === false) return

  this.activated = true

  if (this.options.scrollbarVisible !== false) {
    this.el.setAttribute('activated', '')

    if (this.railX) this.railX.style.opacity = 1
    if (this.railY) this.railY.style.opacity = 1
  }

  if (this.hideTimer) clearTimeout(this.hideTimer)
}
