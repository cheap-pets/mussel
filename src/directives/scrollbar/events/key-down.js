function isEditableElement (target) {
  return ['input', 'select', 'textarea']
    .indexOf(target.tagName.toLowerCase()) !== -1 ||
    target.getAttribute('contenteditable') !== null
}

function getDeltaByKey (keyCode) {
  let deltaX, deltaY

  switch (keyCode) {
    case 'ArrowUp':
      deltaY = -100
      break
    case 'ArrowLeft':
      deltaX = -100
      break
    case 'ArrowDown':
      deltaY = 100
      break
    case 'ArrowRight':
      deltaX = 100
      break
  }

  return {
    deltaX,
    deltaY
  }
}

export default function onKeyDown (event) {
  if (isEditableElement(event.target)) return

  const { deltaX, deltaY } = getDeltaByKey.call(this, event.code)

  if (!this.hiddenY) {
    if (deltaY) this.scrollBy(null, deltaY, event)
    else if (event.code === 'Home') this.scrollTo(null, 0, event)
    else if (event.code === 'End') {
      this.scrollTo(null, this.el.scrollHeight, event)
    }
  }

  if (!this.hiddenX) {
    if (deltaX) this.scrollBy(deltaX, null, event)
  }
}
