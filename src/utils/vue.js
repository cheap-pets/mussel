import { createApp /* , createVNode, render */ } from 'vue'

export function createDynamicComponent (options) {
  const container = options.container || document.body

  let app = createApp(options.component, options.props)
  let el = options.el || document.createElement('div')

  if (options.appContext) {
    Object.assign(app._context, options.appContext)
  }

  if (!options.el) {
    container.appendChild(el)
  }

  app.mount(el)

  return () => {
    app?.unmount()

    if (!options.el) {
      container.removeChild(el)
    }

    el = undefined
    app = undefined
  }
}

/*
export function renderComponent (options) {
  const container = options.container || document.body

  let el = options.el
  let vn = createVNode(options.component, options.props)

  if (!el) {
    el = document.createElement('div')
    container.appendChild(el)
  }

  vn.appContext = { ...options.appContext }
  render(vn, el)

  return () => {
    render(null, el)

    if (!options.el) {
      container.removeChild(el)
    }

    el = null
    vn = undefined
  }
}
*/
