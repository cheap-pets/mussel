const handles = {}

function requestAnimationFrame (callback, id) {
  if (id && handles[id]) window.cancelAnimationFrame(handles[id])

  const handle = window.requestAnimationFrame(() => {
    try {
      callback()
    } finally {
      if (id) delete handles[id]
    }
  })

  if (id) handles[id] = handle
}

export default requestAnimationFrame
