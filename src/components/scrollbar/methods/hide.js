export default function hide () {
  if (!this.scrolling && !this.hover) {
    this.activated = false

    if (this.railX) this.railX.style.opacity = 0
    if (this.railY) this.railY.style.opacity = 0

    this.hideTimer = setTimeout(() => {
      this.el.removeAttribute('activated')
      delete this.hideTimer
    }, 500)
  }
}
