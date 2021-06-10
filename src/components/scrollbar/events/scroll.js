import requestAnimationFrame from '@/utils/request-animation-frame'
import { isIE } from '@/utils/browser'

export default function onScroll () {
  requestAnimationFrame(() => {
    if (!this.activated && !this.mouseInAction) this.show()

    if (!isIE) this.setScrolling()
  }, 'scrollbar.onScroll')

  this.updatePosition()
}
