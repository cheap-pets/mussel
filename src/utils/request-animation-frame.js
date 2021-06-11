import { isIE } from './browser'

const rafs = {}
const lastCall = {}

function requestAnimationFrame (callback, id, options = {}) {
  if (id) {
    const { cancelPrevious } = options
    const previous = rafs[id]

    if (isIE) {
      if (previous) {
        lastCall[id] = callback
        return
      }

      rafs[id] = window.requestAnimationFrame(() => {
        delete rafs[id]

        const last = lastCall[id]
        if (last) {
          delete lastCall[id]
          last()
        }
      })

      callback()
    } else {
      if (previous) {
        if (cancelPrevious) window.cancelAnimationFrame(previous)
        else return
      }

      rafs[id] = window.requestAnimationFrame(() => {
        delete rafs[id]
        callback()
      })
    }
  } else {
    window.requestAnimationFrame(callback)
  }
}

export default requestAnimationFrame
