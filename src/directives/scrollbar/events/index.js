import { isThisSecond } from 'date-fns'
import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'
import { onMouseWheel } from './mouse-wheel'

export default function bindEvents () {
  this.el.addEventListener('mouseenter', onMouseEnter.bind(this))
  this.el.addEventListener('mouseleave', onMouseLeave.bind(this))
  this.el.addEventListener('wheel', onMouseWheel.bind(this))
}
