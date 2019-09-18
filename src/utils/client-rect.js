export default function getClientRect (el) {
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
