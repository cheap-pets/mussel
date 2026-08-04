export function updateTracks (el, ctx) {
  const computedStyle = window.getComputedStyle(el)

  const { trackX, thumbX, trackY, thumbY } = ctx.elements
  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = el
  const { overflowX, overflowY, paddingTop, paddingLeft } = computedStyle

  const showX = (overflowX === 'auto') && (scrollWidth - clientWidth >= 1)
  const showY = (overflowY === 'auto') && (scrollHeight - clientHeight >= 1)

  Object.assign(ctx, {
    trackX: showX,
    trackY: showY,
    scrollWidth,
    clientWidth,
    scrollHeight,
    clientHeight
  })

  const trackWidth = computedStyle.getPropertyValue('--mu-scrollbar_width')
  const trackMargin = computedStyle.getPropertyValue('--mu-scrollbar_margin')

  const cornerOffset = ` - ${trackWidth}`

  if (showX) {
    Object.assign(trackX.style, {
      display: null,
      top: `calc(${clientHeight}px - ${paddingTop} - ${trackMargin} - ${trackWidth})`,
      left: `calc(-${paddingLeft} + ${trackMargin})`,
      width: `calc(${clientWidth}px - ${trackMargin} * 2${showY ? cornerOffset : ''})`
    })

    thumbX.style.width = `${parseInt(trackX.clientWidth ** 2 / scrollWidth)}px`
    ctx.ratioX = (trackX.clientWidth - thumbX.clientWidth) / (scrollWidth - clientWidth)
  } else {
    trackX.style.display = 'none'
  }

  if (showY) {
    Object.assign(trackY.style, {
      display: null,
      top: `calc(-${paddingTop} + ${trackMargin})`,
      left: `calc(${clientWidth}px - ${paddingLeft} - ${trackMargin} - ${trackWidth})`,
      height: `calc(${clientHeight}px - ${trackMargin} * 2${showX ? cornerOffset : ''})`
    })

    thumbY.style.height = `${parseInt(trackY.clientHeight ** 2 / scrollHeight)}px`
    ctx.ratioY = (trackY.clientHeight - thumbY.clientHeight) / (scrollHeight - clientHeight)
  } else {
    trackY.style.display = 'none'
  }
}

// 比例由 updateTracks 一次算好缓存进 ctx，滚动路径仅写 style，避免 reflow
// ratioX <= 0（拇指被 min-length 钳到 ≥ 轨道宽度的极端窄容器）时不挪拇指
export function updateThumbX (el, ctx) {
  if (!ctx.trackX || ctx.ratioX <= 0) return

  ctx.elements.thumbX.style.left = `${el.scrollLeft * ctx.ratioX}px`
}

export function updateThumbY (el, ctx) {
  if (!ctx.trackY || ctx.ratioY <= 0) return

  ctx.elements.thumbY.style.top = `${el.scrollTop * ctx.ratioY}px`
}
