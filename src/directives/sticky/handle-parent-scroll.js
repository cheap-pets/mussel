function onParentScroll (event) {
  const el = this.el
  const pEl = event.target
  const nEl = el.nextElementSibling

  if (
    nEl &&
    pEl &&
    nEl.offsetTop + nEl.offsetHeight > pEl.scrollTop + el.offsetHeight &&
    el.offsetTop < pEl.scrollTop
  ) {
    el.style.transform = `translate3d(0, ${pEl.scrollTop - el.offsetTop}px, 0)`
  } else {
    el.style.transform = null
  }
}

export default onParentScroll
