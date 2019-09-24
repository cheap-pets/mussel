window.addEventListener('keyup', event => {
  // const tag = String(event.target.tagName).toLowerCase()
  if (event.keyCode === 27) {
    const { __mussel_dropdown: dropdown, __mussel_modal: modal } = window

    if (dropdown) {
      dropdown.hide()
    } else if (modal) {
      if (modal.maskAction === 'close') modal.hide()
    }
  }
})

window.addEventListener('mousedown', event => {
  const { __mussel_dropdown: dropdown } = window
  if (dropdown) {
    dropdown.hideIf(event.target)
  }
})

function hideIf () {
  const { __mussel_dropdown: dropdown, __mussel_modal: modal } = window

  if (dropdown) dropdown.hide()
  if (modal) modal.hide()
}

window.addEventListener('popstate', hideIf)
