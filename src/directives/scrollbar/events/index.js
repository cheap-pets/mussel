import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'

export default function bindEvents () {
  this.el.addEventListener('mouseenter', onMouseEnter.bind(this))
  this.el.addEventListener('mouseout', onMouseLeave.bind(this))
}
