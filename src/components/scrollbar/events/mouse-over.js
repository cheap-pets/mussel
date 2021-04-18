export default function onMouseOver (event) {
  window.__mussel_scrollbar = this
  event.stopPropagation()
}
