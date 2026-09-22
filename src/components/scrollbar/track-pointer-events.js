export function onTrackXPointerDown (event, el, ctx) {
  const { trackX, thumbX } = ctx.elements

  const targetIsThumb = event.target === thumbX

  const thbWidth = thumbX.offsetWidth
  const halfWidth = thbWidth / 2

  const startX = targetIsThumb ? thumbX.offsetLeft + halfWidth : event.offsetX
  const startPageX = event.pageX

  const max = trackX.clientWidth - thbWidth

  function updateScrollLeft (x) {
    if (ctx.ratioX <= 0) return
    el.scrollLeft = Math.max(Math.min(x - halfWidth, max), 0) / ctx.ratioX
  }

  if (!targetIsThumb) updateScrollLeft(startX)

  function onPointerMove (e) {
    updateScrollLeft(startX + e.pageX - startPageX)
  }

  function stopDrag () {
    ctx.dragController?.abort()
    ctx.dragController = null
  }

  const controller = new AbortController()
  const options = { signal: controller.signal }

  // 上一个拖拽会话未正常结束时先行释放，避免 window 监听叠加
  ctx.dragController?.abort()
  ctx.dragController = controller

  trackX.setPointerCapture(event.pointerId)

  window.addEventListener('pointermove', onPointerMove, options)
  window.addEventListener('pointerup', stopDrag, options)
  window.addEventListener('pointercancel', stopDrag, options)

  event.stopPropagation()
  event.preventDefault()
}

export function onTrackYPointerDown (event, el, ctx) {
  const { trackY, thumbY } = ctx.elements

  const targetIsThumb = event.target === thumbY

  const thbHeight = thumbY.offsetHeight
  const halfHeight = thbHeight / 2

  const startY = targetIsThumb ? thumbY.offsetTop + halfHeight : event.offsetY
  const startPageY = event.pageY

  const max = trackY.clientHeight - thbHeight

  function updateScrollTop (y) {
    if (ctx.ratioY <= 0) return
    el.scrollTop = Math.max(Math.min(y - halfHeight, max), 0) / ctx.ratioY
  }

  if (!targetIsThumb) updateScrollTop(startY)

  function onPointerMove (e) {
    updateScrollTop(startY + e.pageY - startPageY)
  }

  function stopDrag () {
    ctx.dragController?.abort()
    ctx.dragController = null
  }

  const controller = new AbortController()
  const options = { signal: controller.signal }

  ctx.dragController?.abort()
  ctx.dragController = controller

  trackY.setPointerCapture(event.pointerId)

  window.addEventListener('pointermove', onPointerMove, options)
  window.addEventListener('pointerup', stopDrag, options)
  window.addEventListener('pointercancel', stopDrag, options)

  event.stopPropagation()
  event.preventDefault()
}
