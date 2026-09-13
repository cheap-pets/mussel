<script>
  import { inject, watch, cloneVNode } from 'vue'
  import { isDev } from '@/env'
  import { createTooltipAnchorHandlers } from './tooltip-controller'

  // renderless 组件：render fn 克隆唯一子节点并链式合并锚点事件，无模板形态，不用 <script setup>
  const ANCHOR_EVENTS = {
    mouseenter: 'onMouseenter',
    mouseleave: 'onMouseleave',
    focusin: 'onFocusin',
    focusout: 'onFocusout',
    click: 'onClick'
  }

  function mergeHandler (existing, extra) {
    if (!existing) return extra
    if (Array.isArray(existing)) return [...existing, extra]
    return [existing, extra]
  }

  function mergeAnchorEvents (child, handlers) {
    const merged = {}

    for (const [event, prop] of Object.entries(ANCHOR_EVENTS)) {
      merged[prop] = mergeHandler(child.props?.[prop], handlers[event])
    }

    return merged
  }

  // 纯文本（Symbol(Text)）、注释、fragment（多根）不可作为锚点
  function isValidChild (vnode) {
    return vnode && typeof vnode.type !== 'symbol'
  }

  export default {
    name: 'MusselTooltip',

    props: {
      content: String,
      placement: {
        type: String,
        default: 'top',
        validator: v => [
          'top', 'top-start', 'top-end',
          'bottom', 'bottom-start', 'bottom-end',
          'left', 'left-start', 'left-end',
          'right', 'right-start', 'right-end'
        ].includes(v)
      },
      trigger: {
        type: String,
        default: 'hover',
        validator: v => ['hover', 'focus', 'click'].includes(v)
      },
      arrow: { type: Boolean, default: true },
      disabled: Boolean
    },

    emits: ['show', 'hide'],

    setup (props, { slots, emit, expose }) {
      const controller = inject('$mussel').tooltip

      let anchorVnode

      function buildOptions () {
        return {
          content: slots.tooltip ? () => slots.tooltip() : props.content,
          placement: props.placement,
          trigger: props.trigger,
          arrow: props.arrow,
          disabled: props.disabled,
          onShow: () => emit('show'),
          onHide: () => emit('hide')
        }
      }

      const handlers = createTooltipAnchorHandlers(
        controller,
        () => anchorVnode?.el,
        buildOptions
      )

      // 显示中的热更新（同指令 updated 的字段 diff 语义）
      watch(
        () => [props.content, props.placement, props.trigger, props.arrow, props.disabled],
        () => {
          const anchor = anchorVnode?.el

          if (controller.state.anchor === anchor && controller.state.visible) {
            controller.show(anchor, buildOptions())
          }
        }
      )

      expose({
        show: () => anchorVnode?.el && controller.show(anchorVnode.el, buildOptions()),
        hide: controller.hide,
        updatePosition: controller.updatePosition
      })

      return () => {
        const children = slots.default?.() || []
        const child = children.length === 1 ? children[0] : null

        if (isDev && !isValidChild(child)) {
          console.warn(
            '[MUSSEL:Tooltip]',
            '<mu-tooltip> requires a single element (or single-root component) child node.'
          )
        }

        if (!isValidChild(child)) return children

        anchorVnode = cloneVNode(child, mergeAnchorEvents(child, handlers))

        return anchorVnode
      }
    }
  }
</script>
