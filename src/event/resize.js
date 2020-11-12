import emit from './emit'
import { register } from './interceptor'
import delay from '@utils/delay'

function setInitialPosition (el) {
  const growEl = el.querySelector('.mu-resize-detector_grow')
  const growChild = growEl.querySelector('div')

  growChild.style.width = growEl.offsetWidth + 1 + 'px'
  growChild.style.height = growEl.offsetHeight + 1 + 'px'
  growEl.scrollLeft = growEl.scrollWidth
  growEl.scrollTop = growEl.scrollHeight

  const shrinkEl = el.querySelector('.mu-resize-detector_shrink')
  shrinkEl.scrollLeft = shrinkEl.scrollWidth
  shrinkEl.scrollTop = shrinkEl.scrollHeight
}

function renderDetector (parent) {
  if (window.getComputedStyle?.(parent).position === 'static') {
    parent.style.position = 'relative'
  }

  const el = document.createElement('div')
  el.className = 'mu-resize-detector'
  el.innerHTML =
    '<div class="mu-resize-detector_grow"><div></div></div>' +
    '<div class="mu-resize-detector_shrink"></div>'
  parent.appendChild(el)

  delay(10).then(() => {
    setInitialPosition(el)

    el.addEventListener('scroll', function () {
      emit(parent, 'sizechange')
      setInitialPosition()
    })
  })
}

function interceptorAdd (type, handler) {
  if (!this.querySelector('.mu-resize-detector')) {
    renderDetector(this)
  }
}

function interceptorRemove (type, handler) {

}

register('sizechange', {
  add: interceptorAdd,
  remove: interceptorRemove
})
