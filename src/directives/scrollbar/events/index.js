import onKeyDown from './key-down'
import onMouseOver from './mouse-over'
import onMouseWheel from './mouse-wheel'
import onRailMouseDown from './rail-mouse-down'
import onThumbMouseDown from './thumb-mouse-down'
import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'

window.addEventListener('keydown', onKeyDown, true)

export default function bindEvents () {
  this.el.addEventListener('scroll', () => this.updatePosition())
  this.el.addEventListener('mouseenter', onMouseEnter.bind(this))
  this.el.addEventListener('mouseleave', onMouseLeave.bind(this))
  this.el.addEventListener('mouseover', onMouseOver.bind(this))
  this.el.addEventListener('wheel', onMouseWheel.bind(this))

  this.railX.addEventListener('mousedown', onRailMouseDown.bind(this))
  this.railY.addEventListener('mousedown', onRailMouseDown.bind(this))

  this.thumbX.addEventListener('mousedown', onThumbMouseDown.bind(this))
  this.thumbY.addEventListener('mousedown', onThumbMouseDown.bind(this))
}
