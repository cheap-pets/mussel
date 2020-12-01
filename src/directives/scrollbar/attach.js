const ELEMENT_CLASS = 'mu-scrollbar'

const SCROLLBAR_HTML = /* html */`
  <div class="mu_scrollbar_x-rail">
    <div class="mu_scrollbar_x-thumb"></div>
  </div>
  <div class="mu_scrollbar_y-rail">
    <div class="mu_scrollbar_y-thumb"></div>
  </div>`

function queryElements (el) {
  return {
    railX: el.querySelector('.mu_scrollbar_x-rail'),
    railY: el.querySelector('.mu_scrollbar_y-rail'),
    thumbX: el.querySelector('.mu_scrollbar_x-thumb'),
    thumbY: el.querySelector('.mu_scrollbar_y-thumb')
  }
}

export default function attach (el, options) {
  if (el.classList.contains(ELEMENT_CLASS)) return

  el.classList.add(ELEMENT_CLASS)
  el.insertAdjacentHTML('afterbegin', SCROLLBAR_HTML)
  el.__mussel_scrollbar = {
    ...queryElements(el)
  }
}
