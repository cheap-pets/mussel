<template>
  <div
    class="mu-dropdown-panel"
    :class="popupClass"
    :style="style"
    :popup-style="popupStyle"
    :visible="popupVisible"
    @scroll.stop
    @mousewheel.stop>
    <div
      ref="wrapper"
      class="mu-dropdown-panel_wrapper"
      :style="{ height, maxHeight }">
      <slot />
    </div>
  </div>
</template>

<script>
  import RenderToBodyMixin from '../layer/mix-render-to-body'
  import PopupVisibleMixin from '../layer/mix-popup-visible'

  import getClientRect from '@utils/client-rect'

  import { hideIf } from '../layer/global-event-handler'
  import { isParentElement } from '@utils/dom'

  function popOnTop (pRect, height) {
    return (pRect.bottom + 4 + height > window.innerHeight) &&
      (pRect.top - height - 4 >= 0)
  }

  function popOnRight (pRect, width) {
    return (
      width < pRect.width ||
      pRect.left + width > window.innerWidth
    ) && (pRect.right - width >= 0)
  }

  function getAbsolutePosition (isOnTop, isOnRight, pRect, height, width) {
    const { top, bottom, left, right } = pRect
    return {
      top: `${isOnTop ? top - height - 4 : bottom + 4}px`,
      left: `${isOnRight ? right - width : left}px`
    }
  }
  function getRelativePosition (isOnTop, isOnRight, pRect) {
    return {
      top: isOnTop ? undefined : `${pRect.height + 4}px`,
      bottom: isOnTop ? `${pRect.height + 4}px` : undefined,
      left: isOnRight ? undefined : '0',
      right: isOnRight ? '0' : undefined
    }
  }

  export default {
    name: 'MusselDropdownPanel',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    props: {
      width: String,
      height: String,
      maxHeight: String,
      popupClass: String,
      popupStyle: String
    },
    data () {
      return {
        style: {
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined,
          width: undefined,
          minWidth: undefined
        }
      }
    },
    mounted () {
      this.$emit('mounted', this.$el)
    },
    methods: {
      deactivate () {
        if (window.__mussel_dropdown === this) window.__mussel_dropdown = null
      },
      show () {
        const dd = window.__mussel_dropdown
        if (dd !== this) hideIf('dropdown', dd)
        window.__mussel_dropdown = this
        this.popupVisible = true

        const { width } = this
        Object.assign(
          this.style,
          {
            width: ['auto', 'inherit', 'fit-content'].indexOf(width) === -1
              ? width
              : undefined
          }
        )
        this.$nextTick(this.setPosition)
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.popupVisible = false

        this.$emit('hide')
        this.$emit('change', false)
      },
      hideIf (triggerEl) {
        if (
          !isParentElement(triggerEl, this.$parent.$el) &&
          (!this.renderToBody || !isParentElement(triggerEl, this.$el, true))
        ) {
          this.hide()
        }
      },
      setPosition () {
        if (this.setPositionTimer) clearTimeout(this.setPositionTimer)
        this.setPositionTimer = setTimeout(() => {
          if (!this.popupVisible) return

          const { offsetWidth, offsetHeight } = this.$refs.wrapper
          const pRect = getClientRect(this.$parent.$el)

          const width = !this.width || this.width === 'inherit'
            ? pRect.width
            : (
              this.width === 'auto' && offsetWidth < pRect.width
                ? pRect.width
                : null
            )
          const isOnTop = popOnTop(pRect, offsetHeight)
          const isOnRight = popOnRight(pRect, width || offsetWidth)

          Object.assign(
            this.style,
            width ? { width: width + 'px' } : {},
            this.renderToBody
              ? getAbsolutePosition(
                isOnTop,
                isOnRight,
                pRect,
                offsetHeight,
                width || offsetWidth
              )
              : getRelativePosition(
                isOnTop,
                isOnRight,
                pRect
              )
          )
        }, 0)
      }
    }
  }
</script>
