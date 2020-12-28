import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'
import { onMouseWheel } from './mouse-wheel'
import { onRailMouseDown } from './rail-mouse-down'
import { onThumbMouseDown } from './thumb-mouse-down'

export default function bindEvents () {
  this.el.addEventListener('mouseenter', onMouseEnter.bind(this))
  this.el.addEventListener('mouseleave', onMouseLeave.bind(this))
  this.el.addEventListener('wheel', onMouseWheel.bind(this))
  this.el.addEventListener('scroll', () => this.updatePosition())

  this.railX.addEventListener('mousedown', onRailMouseDown.bind(this))
  this.railY.addEventListener('mousedown', onRailMouseDown.bind(this))

  this.thumbX.addEventListener('mousedown', onThumbMouseDown.bind(this))
  this.thumbY.addEventListener('mousedown', onThumbMouseDown.bind(this))
}
