import { onMouseEnter, onMouseLeave } from './mouse-enter-leave'

export default function bindEvents () {
  this.el.addEventListener('mouseenter', onMouseEnter.bind(this))
  this.el.addEventListener('mouseleave', onMouseLeave.bind(this))
}
