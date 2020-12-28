export function getClientRect (el) {
  const {
    top,
    bottom,
    left,
    right,
    width: w,
    height: h
  } = el.getBoundingClientRect()

  return {
    top,
    bottom,
    left,
    right,
    width: w || right - left,
    height: h || bottom - top
  }
}

export function pointInElementRect (point, el) {
  const rect = getClientRect(el)

  return point.clientX >= rect.left &&
    point.clientX <= rect.right &&
    point.clientY >= rect.top &&
    point.clientY <= rect.bottom
}
