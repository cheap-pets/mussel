import requestAnimationFrame from '@/utils/request-animation-frame'

export default function onScroll () {
  requestAnimationFrame(() => {
    if (!this.activated && !this.mouseInAction) this.show()

    this.setScrolling()
  }, 'scrollbar.onScroll')

  this.updatePosition()
}
