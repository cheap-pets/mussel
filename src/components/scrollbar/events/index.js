import onKeyDown from './key-down'
import onMouseWheel from './mouse-wheel'
import onRailMouseDown from './rail-mouse-down'
import onThumbMouseDown from './thumb-mouse-down'
import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'

function debounceUpdatePosition () {
  if (this.scrolling) return
  if (this.updateTimer) clearTimeout(this.updateTimer)
  this.updateTimer = setTimeout(
    () => {
      this.updatePosition()
      delete this.updateTimer
    },
    200
  )
}

function bindEvents () {
  this.debounceUpdate = debounceUpdatePosition.bind(this)

  this.onKeyDown = onKeyDown.bind(this)
  this.onMouseEnter = onMouseEnter.bind(this)
  this.onMouseLeave = onMouseLeave.bind(this)
  this.onMouseWheel = onMouseWheel.bind(this)
  this.onRailMouseDown = onRailMouseDown.bind(this)
  this.onThumbMouseDown = onThumbMouseDown.bind(this)

  this.el.addEventListener('scroll', this.updatePosition)
  if (this.options.stickToParent) {
    this.el.parentNode.addEventListener('scroll', this.updatePosition)
  }

  this.el.addEventListener('mouseenter', this.onMouseEnter)
  this.el.addEventListener('mouseleave', this.onMouseLeave)

  this.el.addEventListener('keydown', this.onKeyDown)
  this.el.addEventListener('wheel', this.onMouseWheel)
  this.el.addEventListener('sizechange', this.debounceUpdate)

  this.railX?.addEventListener('mousedown', this.onRailMouseDown)
  this.railY?.addEventListener('mousedown', this.onRailMouseDown)

  this.thumbX?.addEventListener('mousedown', this.onThumbMouseDown)
  this.thumbY?.addEventListener('mousedown', this.onThumbMouseDown)

  if (this.mutationObserver) {
    this.el.addEventListener('domchange', this.debounceUpdate)
  }
}

function unbindEvents () {
  if (!this.el) return

  if (this.options.stickToParent) {
    this.el.parentNode?.removeEventListener('scroll', this.updatePosition)
  }

  this.el.removeEventListener('scroll', this.updatePosition)

  this.el.removeEventListener('mouseenter', this.onMouseEnter)
  this.el.removeEventListener('mouseleave', this.onMouseLeave)

  this.el.removeEventListener('keydown', this.onKeyDown)
  this.el.removeEventListener('wheel', this.onMouseWheel)
  this.el.removeEventListener('sizechange', this.debounceUpdate)

  this.railX?.removeEventListener('mousedown', this.onRailMouseDown)
  this.railY?.removeEventListener('mousedown', this.onRailMouseDown)

  this.thumbX?.removeEventListener('mousedown', this.onThumbMouseDown)
  this.thumbY?.removeEventListener('mousedown', this.onThumbMouseDown)

  if (this.mutationObserver) {
    this.el.removeEventListener('domchange', this.debounceUpdate)
  }
}

export {
  bindEvents,
  unbindEvents
}
