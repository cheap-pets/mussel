export function onTrackXMouseDown (event, el, ctx) {
  const { trackX, thumbX } = ctx.elements

  const targetIsThumb = event.target === thumbX

  const thbWidth = thumbX.offsetWidth
  const halfWidth = thbWidth / 2

  const startX = targetIsThumb ? thumbX.offsetLeft + halfWidth : event.offsetX
  const startPageX = event.pageX

  const max = trackX.clientWidth - thbWidth

  function updateScrollLeft (x) {
    el.scrollLeft = Math.max(Math.min(x - halfWidth, max), 0) / ctx.ratioX
  }

  if (!targetIsThumb) updateScrollLeft(startX)

  function onMouseMove (e) {
    updateScrollLeft(startX + e.pageX - startPageX)
  }

  function onMouseUp () {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  event.stopPropagation()
  event.preventDefault()
}

export function onTrackYMouseDown (event, el, ctx) {
  const { trackY, thumbY } = ctx.elements

  const targetIsThumb = event.target === thumbY

  const thbHeight = thumbY.offsetHeight
  const halfHeight = thbHeight / 2

  const startY = targetIsThumb ? thumbY.offsetTop + halfHeight : event.offsetY
  const startPageY = event.pageY

  const max = trackY.clientHeight - thbHeight

  function updateScrollTop (y) {
    el.scrollTop = Math.max(Math.min(y - halfHeight, max), 0) / ctx.ratioY
  }

  if (!targetIsThumb) updateScrollTop(startY)

  function onMouseMove (e) {
    updateScrollTop(startY + e.pageY - startPageY)
  }

  function onMouseUp () {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  event.stopPropagation()
  event.preventDefault()
}
