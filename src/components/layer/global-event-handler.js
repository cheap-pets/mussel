function callbackIf (name, handler) {
  const popup = window['__mussel_' + name]
  if (popup) handler(popup)
  return popup
}

function hideIf (name, force) {
  return name === 'dropdown'
    ? callbackIf('dropdown', dropdown => dropdown.hide())
    : (
      name === 'modal'
        ? callbackIf(
          'modal',
          modal =>
            (
              modal.$options.maskAction ||
              modal.maskAction
            ) === 'close' &&
            modal.hide(force)
        )
        : undefined
    )
}

function setPositionIf () {
  callbackIf('dropdown', dropdown => dropdown.setPosition())
}

window.addEventListener('blur', () => hideIf('dropdown'))

window.addEventListener(
  'keyup',
  event => event.keyCode === 27 && (
    hideIf('dropdown') ||
    hideIf('modal')
  )
)

window.addEventListener(
  'mousedown',
  event => callbackIf(
    'dropdown',
    dropdown => dropdown.hideIf(event.target)
  )
)

window.addEventListener('popstate', () => {
  hideIf('dropdown')
  hideIf('modal', true)
})

window.addEventListener('resize', setPositionIf)
window.addEventListener('scroll', () => { hideIf('dropdown') })

window.addEventListener('mousewheel', ({ target }) => {
  while (target) {
    if (target.className.indexOf('mu-dropdown-panel') !== -1) return

    target = target.parentNode.nodeType === 1
      ? target.parentNode
      : undefined
  }
  hideIf('dropdown')
})

export {
  hideIf
}
