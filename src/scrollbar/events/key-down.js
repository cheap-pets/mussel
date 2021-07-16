function isEditableElement (target) {
  return ['input', 'select', 'textarea']
    .indexOf(target.tagName.toLowerCase()) !== -1 ||
    target.getAttribute('contenteditable') !== null
}

function getDeltaByKey (keyCode) {
  let deltaX, deltaY

  switch (keyCode) {
    case 37: // 'ArrowLeft'
      deltaX = -100
      break
    case 38: // 'ArrowUp'
      deltaY = -100
      break
    case 39: // 'ArrowRight'
      deltaX = 100
      break
    case 40: // 'ArrowDown'
      deltaY = 100
      break
  }

  return {
    deltaX,
    deltaY
  }
}

export default function onKeyDown (event) {
  if (isEditableElement(event.target)) return

  const { deltaX, deltaY } = getDeltaByKey.call(this, event.keyCode)

  if (!this.hiddenY) {
    if (deltaY) {
      this.scrollBy(null, deltaY, event)
    } else if (event.keyCode === 35) { // 'End'
      this.scrollTo(null, this.el.scrollHeight - this.el.clientHeight, event)
    } else if (event.keyCode === 36) { // 'Home'
      this.scrollTo(null, 0, event)
    }
  }

  if (!this.hiddenX && deltaX) this.scrollBy(deltaX, null, event)
}
