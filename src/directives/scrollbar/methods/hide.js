export default function hide () {
  if (this.hideTimer) clearTimeout(this.hideTimer)

  this.hideTimer = setTimeout(() => {
    if (!this.scrolling && !this.hover) this.el.removeAttribute('activated')
  }, 3000)
}
