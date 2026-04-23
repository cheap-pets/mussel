export function updateTracks (el, ctx) {
  const computedStyle = window.getComputedStyle(el)

  const { trackX, thumbX, trackY, thumbY } = ctx.elements
  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = el
  const { overflowX, overflowY, paddingTop, paddingLeft } = computedStyle

  Object.assign(ctx, {
    trackX: (overflowX === 'auto') && (scrollWidth - clientWidth >= 1),
    trackY: (overflowY === 'auto') && (scrollHeight - clientHeight >= 1),
    scrollWidth,
    clientWidth,
    scrollHeight,
    clientHeight
  })

  const trackWidth = computedStyle.getPropertyValue('--mu-scrollbar_width')
  const trackMargin = computedStyle.getPropertyValue('--mu-scrollbar_margin')

  const cornerOffset = ` - ${trackWidth}`

  if (ctx.trackX) {
    Object.assign(trackX.style, {
      display: null,
      top: `calc(${clientHeight}px - ${paddingTop} - ${trackMargin} - ${trackWidth})`,
      left: `calc(-${paddingLeft} + ${trackMargin})`,
      width: `calc(${clientWidth}px - ${trackMargin} * 2${ctx.trackY ? cornerOffset : ''})`
    })

    thumbX.style.width = `${parseInt(trackX.clientWidth ** 2 / scrollWidth)}px`
  } else {
    trackX.style.display = 'none'
  }

  if (ctx.trackY) {
    Object.assign(trackY.style, {
      display: null,
      top: `calc(-${paddingTop} + ${trackMargin})`,
      left: `calc(${clientWidth}px - ${paddingLeft} - ${trackMargin} - ${trackWidth})`,
      height: `calc(${clientHeight}px - ${trackMargin} * 2${ctx.trackX ? cornerOffset : ''}`
    })

    thumbY.style.height = `${parseInt(trackY.clientHeight ** 2 / scrollHeight)}px`
  } else {
    trackY.style.display = 'none'
  }
}

export function updateThumbX (el, ctx) {
  if (!ctx.trackX) return

  const { scrollLeft } = el
  const { scrollWidth, clientWidth } = ctx
  const { trackX, thumbX } = ctx.elements

  ctx.ratioX =
    (trackX.clientWidth - thumbX.clientWidth) / (scrollWidth - clientWidth)

  thumbX.style.left = `${scrollLeft * ctx.ratioX}px`
}

export function updateThumbY (el, ctx) {
  if (!ctx.trackY) return

  const { scrollTop } = el
  const { scrollHeight, clientHeight } = ctx
  const { trackY, thumbY } = ctx.elements

  ctx.ratioY =
    (trackY.clientHeight - thumbY.clientHeight) / (scrollHeight - clientHeight)

  thumbY.style.top = `${scrollTop * ctx.ratioY}px`
}
