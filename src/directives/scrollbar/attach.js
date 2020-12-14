const ELEMENT_CLASS = 'mu-scrollbar'

const SCROLLBAR_HTML = /* html */`
  <div class="mu-scrollbar_rail" axis="y">
    <div class="mu-scrollbar_thumb"></div>
  </div>
  <div class="mu-scrollbar_rail" axis="x">
    <div class="mu-scrollbar_thumb"></div>
  </div>`

function renderElements (el) {
  el.insertAdjacentHTML('afterbegin', SCROLLBAR_HTML)

  const rails = Array
    .from(el.childNodes)
    .find(node => node.classList.contains('mu_scrollbar-rail'))

  const railY = rails?.find(node => node.getAttribute('axis') === 'y')
  const railX = rails?.find(node => node.getAttribute('axis') === 'x')

  const thumbY = railY?.querySelector('mu-scrollbar_thumb')
  const thumbX = railX?.querySelector('mu-scrollbar_thumb')

  return {
    railX,
    railY,
    thumbX,
    thumbY
  }
}

export default function attach (el, options) {
  if (el.__mussel_scrollbar) return

  el.classList.add(ELEMENT_CLASS)
  el.__mussel_scrollbar = {
    ...renderElements(el)
  }
}
