import onKeyDown from './key-down'
import onMouseOver from './mouse-over'
import onMouseWheel from './mouse-wheel'
import onRailMouseDown from './rail-mouse-down'
import onThumbMouseDown from './thumb-mouse-down'
import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'

window.addEventListener('keydown', onKeyDown, true)

function debounceUpdatePosition () {
  if (this.updateTimer) clearTimeout(this.updateTimer)
  this.updateTimer = setTimeout(
    () => {
      this.updatePosition()
      delete this.updateTimer
    },
    200
  )
}

export default function bindEvents () {
  const debounceUpdate = debounceUpdatePosition.bind(this)

  this.el.addEventListener('scroll', () => this.updatePosition())
  this.el.addEventListener('mouseenter', onMouseEnter.bind(this))
  this.el.addEventListener('mouseleave', onMouseLeave.bind(this))
  this.el.addEventListener('mouseover', onMouseOver.bind(this))
  this.el.addEventListener('wheel', onMouseWheel.bind(this))
  this.el.addEventListener('domchange', debounceUpdate)
  this.el.addEventListener('sizechange', debounceUpdate)

  this.railX.addEventListener('mousedown', onRailMouseDown.bind(this))
  this.railY.addEventListener('mousedown', onRailMouseDown.bind(this))

  this.thumbX.addEventListener('mousedown', onThumbMouseDown.bind(this))
  this.thumbY.addEventListener('mousedown', onThumbMouseDown.bind(this))
}
