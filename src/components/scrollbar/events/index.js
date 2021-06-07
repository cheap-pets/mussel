import onKeyDown from './key-down'
import onDomChange from './dom-change'
import onMouseWheel from './mouse-wheel'
import onMouseEnter from './mouse-enter'
import onMouseLeave from './mouse-leave'
import onRailMouseDown from './rail-mouse-down'
import onThumbMouseDown from './thumb-mouse-down'

function bindEvents () {
  this.onKeyDown = onKeyDown.bind(this)
  this.onDomChange = onDomChange.bind(this)
  this.onMouseEnter = onMouseEnter.bind(this)
  this.onMouseLeave = onMouseLeave.bind(this)
  this.onMouseWheel = onMouseWheel.bind(this)
  this.onRailMouseDown = onRailMouseDown.bind(this)
  this.onThumbMouseDown = onThumbMouseDown.bind(this)

  this.el.addEventListener('scroll', this.updatePosition)

  this.el.addEventListener('mouseenter', this.onMouseEnter)
  this.el.addEventListener('mouseleave', this.onMouseLeave)

  this.el.addEventListener('keydown', this.onKeyDown)
  this.el.addEventListener('wheel', this.onMouseWheel)

  this.railX?.addEventListener('mousedown', this.onRailMouseDown)
  this.railY?.addEventListener('mousedown', this.onRailMouseDown)

  this.thumbX?.addEventListener('mousedown', this.onThumbMouseDown)
  this.thumbY?.addEventListener('mousedown', this.onThumbMouseDown)

  this.el.addEventListener('sizechange', this.onDomChange)
  if (this.mutationObserver) {
    this.el.addEventListener('domchange', this.onDomChange)
  }
}

function unbindEvents () {
  if (!this.el) return

  this.el.removeEventListener('scroll', this.updatePosition)

  this.el.removeEventListener('mouseenter', this.onMouseEnter)
  this.el.removeEventListener('mouseleave', this.onMouseLeave)

  this.el.removeEventListener('keydown', this.onKeyDown)
  this.el.removeEventListener('wheel', this.onMouseWheel)

  this.railX?.removeEventListener('mousedown', this.onRailMouseDown)
  this.railY?.removeEventListener('mousedown', this.onRailMouseDown)

  this.thumbX?.removeEventListener('mousedown', this.onThumbMouseDown)
  this.thumbY?.removeEventListener('mousedown', this.onThumbMouseDown)

  this.el.removeEventListener('sizechange', this.onDomChange)
  if (this.mutationObserver) {
    this.el.removeEventListener('domchange', this.onDomChange)
  }
}

export {
  bindEvents,
  unbindEvents
}
