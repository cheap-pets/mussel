import requestAnimationFrame from '@/utils/request-animation-frame'

function onParentScroll (event) {
  const el = this.el
  const pEl = event.target
  const nEl = el.nextElementSibling

  requestAnimationFrame(
    function () {
      el.style.transform = (
        nEl &&
        pEl &&
        nEl.offsetTop + nEl.offsetHeight > pEl.scrollTop + el.offsetHeight &&
        el.offsetTop < pEl.scrollTop
      )
        ? `translate3d(0, ${pEl.scrollTop - el.clientTop}px, 0)`
        : null
    },
    'sticky.onParentScroll'
  )
}

export default onParentScroll
