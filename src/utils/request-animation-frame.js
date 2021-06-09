import { isIE } from './browser'

const handles = {}

function requestAnimationFrame (callback, id, options = {}) {
  const { cancelPrevious } = options
  const previous = handles[id]

  if (id && previous) {
    if (cancelPrevious) window.cancelAnimationFrame(previous)
    else return
  }

  const handle = window.requestAnimationFrame(() => {
    delete handles[id]
    if (!isIE) callback()
  })

  if (id) handles[id] = handle
  if (isIE) callback()
}

export default requestAnimationFrame
