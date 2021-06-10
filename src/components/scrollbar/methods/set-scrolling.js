export default function setScrolling () {
  if (this.scrollingTimer) this.scrolling = true
  else {
    this.el.setAttribute('scrolling', '')

    this.scrolling = false
    this.scrollingTimer = setInterval(
      () => {
        if (this.scrolling) this.scrolling = false
        else if (!this.mouseInAction) {
          this.el.removeAttribute('scrolling', '')
          clearInterval(this.scrollingTimer)
          delete this.scrollingTimer
        }
      },
      500
    )
  }
}
