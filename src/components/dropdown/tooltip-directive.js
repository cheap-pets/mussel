import { isString, isObject } from '@/utils/type'
import { createTooltipAnchorHandlers } from './tooltip-controller'

const EVENT_NAMES = ['mouseenter', 'mouseleave', 'focusin', 'focusout', 'click']

// updated 按字段 diff：内联对象 value 每次渲染都是新引用，且无差别 show 会清掉 pending 的延迟隐藏
const SYNC_FIELDS = ['content', 'placement', 'trigger', 'arrow', 'disabled']

function resolveOptions (value) {
  if (isString(value)) return { content: value }
  if (isObject(value)) return value
  return {}
}

function optionsChanged (prev, next) {
  return SYNC_FIELDS.some(field => prev?.[field] !== next?.[field])
}

export function createTooltipDirective (controller) {
  function unbind (el) {
    const handlers = el._muTooltipHandlers

    if (handlers) {
      EVENT_NAMES.forEach(name => el.removeEventListener(name, handlers[name]))
      handlers.dispose()
      el._muTooltipHandlers = undefined
    }
  }

  return {
    mounted (el, { value }) {
      const handlers = createTooltipAnchorHandlers(
        controller,
        () => el,
        () => el._muTooltipOptions
      )

      el._muTooltipOptions = resolveOptions(value)
      el._muTooltipHandlers = handlers

      EVENT_NAMES.forEach(name => el.addEventListener(name, handlers[name]))
    },
    updated (el, { value }) {
      const prev = el._muTooltipOptions
      const next = resolveOptions(value)

      el._muTooltipOptions = next

      // 显示中的面板热更新：disabled / 空 content 即时隐藏，其余字段同步且不重播动画
      if (
        controller.state.anchor === el &&
        controller.state.visible &&
        optionsChanged(prev, next)
      ) controller.show(el, next)
    },
    beforeUnmount (el) {
      unbind(el)
      el._muTooltipOptions = undefined

      if (controller.state.anchor === el) controller.hide()
    }
  }
}
