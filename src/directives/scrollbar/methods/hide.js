export default function hide () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  this.hideTimer = setInterval(() => {
    if (!this.scrolling && !this.hover) {
      this.el.removeAttribute('activated')
      clearInterval(this.hiderTimer)
    } else if (this.hover) {
      clearInterval(this.hiderTimer)
    }
  }, 3000)
}
