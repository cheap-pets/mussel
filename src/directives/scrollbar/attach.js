import methods from './methods'
import bindEvents from './events'

const SCROLLBAR_HTML = /* html */`
  <div class="mu-scrollbar_rail" axis="y">
    <div class="mu-scrollbar_thumb"></div>
  </div>
  <div class="mu-scrollbar_rail" axis="x">
    <div class="mu-scrollbar_thumb"></div>
  </div>`

function renderElements (el) {
  el.classList.add('mu-scrollbar')
  el.insertAdjacentHTML('afterbegin', SCROLLBAR_HTML)

  const rails = Array
    .from(el.childNodes)
    .filter(node => node.classList?.contains('mu-scrollbar_rail'))

  const railY = rails?.find(node => node.getAttribute('axis') === 'y')
  const railX = rails?.find(node => node.getAttribute('axis') === 'x')

  const thumbY = railY?.querySelector('.mu-scrollbar_thumb')
  const thumbX = railX?.querySelector('.mu-scrollbar_thumb')

  return {
    el,
    railX,
    railY,
    thumbX,
    thumbY
  }
}

export default function attach (el, binding) {
  if (el.__mussel_scroller) return

  const ctx = el.__mussel_scroller = {
    options: binding.value || {},
    ...renderElements(el),
    ...methods
  }
  bindEvents.call(ctx)
}