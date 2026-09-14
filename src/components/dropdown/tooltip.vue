<script>
  // 无渲染组件：render fn 克隆唯一子节点并链式合并锚点事件
  // 无模板形态，不用 <script setup>

  import { inject, watch, cloneVNode, onBeforeUnmount, onUpdated } from 'vue'
  import { isDev } from '@/env'
  import { ANCHOR_EVENTS, SYNC_FIELDS, createTooltipAnchorHandlers } from './tooltip-core'

  function mergeHandler (existing, extra) {
    return !existing
      ? extra
      : Array.isArray(existing)
        ? [...existing, extra]
        : [existing, extra]
  }

  function mergeAnchorEvents (child, handlers) {
    const merged = {}
    const props = child.props || {}

    ANCHOR_EVENTS.forEach(event => {
      const prop = `on${event[0].toUpperCase()}${event.slice(1)}`

      merged[prop] = mergeHandler(props[prop], handlers[event])
    })

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
        () => SYNC_FIELDS.map(field => props[field]),
        () => controller.sync(anchorVnode?.el, buildOptions())
      )

      // 仅当显示中的就是本组件锚点时收起，避免误关别人的 tooltip
      function releaseAnchor () {
        if (controller.state.anchor === anchorVnode?.el) controller.hide()
      }

      onBeforeUnmount(() => {
        // 清掉 300ms 显示延迟窗口内的 pending showTimer（DOM 移除不派发 mouseleave）
        handlers.dispose()
        releaseAnchor()
      })

      // 子节点被 v-if 摘除时 render 提前 return，anchorVnode 保留旧 vnode，
      // 其 el 已脱离文档
      onUpdated(() => {
        if (anchorVnode?.el && !anchorVnode.el.isConnected) releaseAnchor()
      })

      expose({
        show: () => {
          if (anchorVnode?.el) controller.show(anchorVnode.el, buildOptions())
        },
        hide: () => {
          if (controller.state.anchor === anchorVnode?.el) controller.hide()
        },
        updatePosition: () => {
          if (controller.state.anchor === anchorVnode?.el) controller.updatePosition()
        }
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

        return isValidChild(child)
          ? (anchorVnode = cloneVNode(child, mergeAnchorEvents(child, handlers)))
          : children
      }
    }
  }
</script>
