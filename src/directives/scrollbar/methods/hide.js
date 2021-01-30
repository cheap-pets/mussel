export default function hide () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  // if (window.__mussel_scroller === this) {
  //   delete window.__mussel_scroller
  // }

  this.hideTimer = setInterval(() => {
    if (!this.scrolling && !this.hover) {
      this.activated = false
      this.el.removeAttribute('activated')
      clearInterval(this.hiderTimer)
    } else if (this.hover) {
      clearInterval(this.hiderTimer)
    }
  }, 1000)
}
