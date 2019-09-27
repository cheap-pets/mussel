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
        ? callbackIf('modal', modal => {
          const action = modal.$options.maskAction || modal.maskAction
          if (action === 'close') modal.hide(force)
        })
        : undefined
    )
}

function setPositionIf () {
  callbackIf('dropdown', dropdown => dropdown.setPosition())
}

window.addEventListener('blur', event => hideIf('dropdown'))

window.addEventListener(
  'keyup',
  event => event.keyCode === 27 &&
    (hideIf('dropdown') || hideIf('modal'))
)

window.addEventListener('mousedown', event => {
  const { __mussel_dropdown: dropdown } = window
  if (dropdown) dropdown.hideIf(event.target)
})

window.addEventListener('popstate', function () {
  hideIf('dropdown')
  hideIf('modal', true)
})

window.addEventListener('resize', setPositionIf)
window.addEventListener('scroll', setPositionIf)
