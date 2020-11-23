<template>
  <div
    v-if="rendered"
    v-show="popupVisible"
    class="mu-dropdown-panel"
    :popup-style="popupStyle"
    :slide="slide"
    :style="rect"
    @scroll.stop
    @mousewheel.stop>
    <div
      ref="wrapper"
      class="mu-dropdown-panel_wrapper"
      :direction="direction"
      :style="{
        minWidth: wrapperMinWidth,
        width: wrapperWidth,
        maxHeight,
        height
      }">
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
    const { innerHeight, innerWidth } = window

    return {
      ...isOnTop
        ? { bottom: `${innerHeight - top + 4}px` }
        : { top: `${bottom + 4}px` },
      ...isOnRight
        ? { right: `${innerWidth - right}px` }
        : { left: `${left}px` }
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
      popupStyle: String
    },
    data () {
      return {
        rect: {
          height: 0,
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined
        },
        slide: false,
        direction: undefined,
        wrapperWidth: undefined,
        wrapperMinWidth: undefined
      }
    },
    mounted () {
      this.$emit('mounted', this.$el)
    },
    methods: {
      show () {
        this.rendered = true
        if (this.popupVisible) return

        const dd = window.__mussel_dropdown
        if (dd !== this) hideIf('dropdown', dd)
        window.__mussel_dropdown = this

        this.slide = undefined
        this.popupVisible = true
        delay().then(this.setPosition)

        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        if (!this.popupVisible) return

        this.deactivate()
        this.slide = 'out'
        this.rect.height = undefined

        delay(100)
          .then(() => {
            this.popupVisible = false
            this.slide = undefined
            this.rect = undefined

            this.$emit('hide')
            this.$emit('change', false)
          })
      },
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
      setPosition () {
        const el = this.$refs.wrapper
        const pRect = getClientRect(this.$parent.$el)

        this.wrapperMinWidth = this.minWidth || (pRect.width + 'px')
        this.wrapperWidth = !this.width || this.width === 'inherit'
          ? (pRect.width + 'px')
          : (this.width === 'auto' ? undefined : this.width)

        delay()
          .then(() => {
            const isOnTop = popOnTop(pRect, el.offsetHeight)
            const isOnRight = popOnRight(pRect, el.offsetWidth)

            this.direction = isOnTop ? 'up' : 'down'
            this.rect = {
              ...this.renderToBody
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
            }

            return delay()
          })
          .then(() => {
            this.rect.height = el.offsetHeight + 'px'
            this.slide = 'in'
          })
      }
    }
  }
</script>
