import requestAnimationFrame from '@/utils/request-animation-frame'

export default function onScroll () {
  requestAnimationFrame(() => {
    // this.options.scrollbarVisible === 'scroll'
    if (!this.activated && !this.mouseInAction) this.show()
  }, 'scrollbar.onScroll')

  this.updatePosition()
}
