import { getClientRect, pointInElementRect } from '@/utils/client-rect'

function scrollIf (target, clientX, clientY) {
  if (pointInElementRect({ clientX, clientY }, target)) {
    let deltaY, deltaX

    if (target.getAttribute('axis') === 'y') {
      const thumbYRect = getClientRect(this.thumbY)
      deltaY = clientY < thumbYRect.top
        ? -100
        : (clientY > thumbYRect.bottom ? 100 : null)
    } else {
      const thumbXRect = getClientRect(this.thumbX)
      deltaX = clientX < thumbXRect.left
        ? -100
        : (clientX > thumbXRect.right ? 100 : null)
    }
    if (deltaX || deltaY) {
      this.scrollBy(deltaX, deltaY)
      return true
    }
  }
  return false
}

export default function onRailMouseDown (event) {
  this.mouseInAction = true
  this.setScrolling()

  let { clientX, clientY } = event
  let suspend = true

  const doScroll = () => scrollIf.call(this, event.target, clientX, clientY)

  const timer = setInterval(() => {
    suspend = suspend || !doScroll()
  }, 100)

  const onMouseMove = e => {
    suspend = false
    clientX = e.clientX
    clientY = e.clientY
  }

  const onMouseUp = e => {
    this.mouseInAction = false
    clearInterval(timer)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  suspend = !doScroll()
}
