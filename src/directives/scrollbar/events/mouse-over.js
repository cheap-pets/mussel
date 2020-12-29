export default function onMouseOver (event) {
  window.__mussel_scroller = this
  event.stopPropagation()
}
