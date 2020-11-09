<template>
  <div
    v-if="rendered"
    v-show="popupVisible"
    class="mu-dropdown-panel"
    :class="popupClass"
    :style="style"
    :popup-style="popupStyle"
    @scroll.stop
    @mousewheel.stop>
    <div
      ref="wrapper"
      class="mu-dropdown-panel_wrapper"
      :style="{
        visibility: wrapperVisibility,
        minWidth: wrapperMinWidth,
        width: wrapperWidth,
        maxHeight,
        height
      }"
      :slide="slide"
      :direction="direction">
      <slot />
    </div>
  </div>
</template>

<script>
  import RenderToBodyMixin from '../layer/mix-render-to-body'
  import PopupVisibleMixin from '../layer/mix-popup-visible'

  import getClientRect from '@utils/client-rect'
  import delay from '@utils/delay'

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
      minWidth: String,
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
          bottom: undefined
        },
        slide: false,
        direction: undefined,
        wrapperWidth: undefined,
        wrapperMinWidth: undefined,
        wrapperVisibility: false
      }
    },
    mounted () {
      this.$emit('mounted', this.$el)
    },
    methods: {
      hideIf (triggerEl) {
        if (
          !isParentElement(triggerEl, this.$parent.$el) &&
          (!this.renderToBody || !isParentElement(triggerEl, this.$el, true))
        ) {
          this.hide()
        }
      },
      deactivate () {
        if (window.__mussel_dropdown === this) {
          window.__mussel_dropdown = null
        }
      },
      async beforeVisibleChange (visible) {
        if (visible) {
          this.wrapperVisibility = 'hidden'
          this.slide = false
          const dd = window.__mussel_dropdown
          if (dd !== this) hideIf('dropdown', dd)
          window.__mussel_dropdown = this
        } else {
          this.deactivate()
          this.slide = 'out'
          await delay(100)
          this.wrapperVisibility = 'hidden'
        }
      },
      async afterVisibleChange (visible) {
        await this.$nextTick()
        if (visible) {
          await this.setPosition()
        }
      },
      async setPosition () {
        if (!this.popupVisible) return
        const el = this.$refs.wrapper
        const pRect = getClientRect(this.$parent.$el)

        this.wrapperWidth = (!this.width || this.width === 'inherit')
          ? (pRect.width + 'px')
          : (this.width === 'auto' ? undefined : this.width)

        this.wrapperMinWidth = this.minWidth || (pRect.width + 'px')
        await delay()

        const isOnTop = popOnTop(pRect, el.offsetHeight)
        const isOnRight = popOnRight(pRect, el.offsetWidth)
        this.direction = isOnTop ? 'up' : 'down'

        Object.assign(
          this.style,
          this.renderToBody
            ? getAbsolutePosition(
              isOnTop,
              isOnRight,
              pRect,
              el.offsetHeight,
              el.offsetWidth
            )
            : getRelativePosition(
              isOnTop,
              isOnRight,
              pRect
            )
        )
        await delay()

        this.wrapperVisibility = 'visible'
        this.slide = 'in'
      }
    }
  }
</script>
