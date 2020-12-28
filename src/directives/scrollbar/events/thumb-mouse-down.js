export function onThumbMouseDown (event) {
  const isYAxis = event.target.parentNode.getAttribute('axis') === 'y'

  let { clientX, clientY } = event

  const onMouseMove = e => {
    const deltaX = isYAxis ? null : (e.clientX - clientX) / this.ratioX
    const deltaY = isYAxis ? (e.clientY - clientY) / this.ratioY : null

    this.scrollBy(deltaX, deltaY)

    clientX = e.clientX
    clientY = e.clientY
  }

  const onMouseUp = e => {
    this.scrolling = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  event.stopPropagation()
}
