import { createVNode, render } from 'vue'
import { kebabCase } from './case'

// 与 app.mount 内部同路径：根 vnode 直接携带宿主 appContext，
// 组件 / 指令 / 注入 / globalProperties 全部继承宿主，且不为每次挂载创建 app。
export function createDynamicComponent ({ app, component, props }) {
  const container = app._container || document.body
  const el = document.createElement('div')
  const vnode = createVNode(component, props)

  vnode.appContext = app._context

  container.appendChild(el)
  render(vnode, el)

  let disposed = false

  return () => {
    if (disposed) return

    disposed = true
    render(null, el)
    el.remove()
  }
}

export function resolveAttrs (values, useKebabCase = true) {
  const attrs = {}

  Object
    .entries(values)
    .forEach(([key, value]) => {
      if (value != null && value !== false) {
        attrs[useKebabCase ? kebabCase(key) : key] = value === true ? '' : value
      }
    })

  return attrs
}
