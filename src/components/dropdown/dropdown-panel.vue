<template>
  <div
    v-if="rendered"
    v-show="popupVisible"
    class="mu-dropdown-panel"
    :popup-style="popupStyle"
    :slide="slide"
    :style="rect"
    @scroll.stop
    @wheel.stop>
    <div
      ref="wrapper"
      v-mussel-scrollbar="{ overflow }"
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
  import RenderToBodyMixin from '@/mixins/mix-render-to-body'
  import PopupVisibleMixin from '@/mixins/mix-popup-visible'

  import delay from '@/utils/delay'

  import { getClientRect } from '@/utils/client-rect'
  import { hideIf } from '@/events/global-layer-events'

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

  function getAbsolutePosition (isOnTop, isOnRight, pRect) {
    const { top, bottom, left, right } = pRect
    const { innerHeight, innerWidth } = window

    return {
      ...isOnTop
        ? { bottom: `${innerHeight - top + 4 - 10}px` }
        : { top: `${bottom + 4 - 10}px` },
      ...isOnRight
        ? { right: `${innerWidth - right - 10}px` }
        : { left: `${left - 10}px` }
    }
  }

  function getRelativePosition (isOnTop, isOnRight, pRect) {
    return {
      ...isOnTop
        ? { bottom: `${pRect.height + 4 - 10}px` }
        : { top: `${pRect.height + 4 - 10}px` },
      ...isOnRight
        ? { right: '-10px' }
        : { left: '-10px' }
    }
  }

  export default {
    name: 'MusselDropdownPanel',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    inject: {
      editor: {
        default: null
      }
    },
    props: {
      width: String,
      height: String,
      minWidth: String,
      maxHeight: String,
      popupStyle: String,
      overflow: {
        type: String,
        default: 'auto'
      }
    },
    data () {
      return {
        rect: {
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined
        },
        slide: undefined,
        direction: undefined,
        wrapperWidth: undefined,
        wrapperMinWidth: undefined
      }
    },
    mounted () {
      if (this.editor) this.setRendered()
    },
    methods: {
      setRendered () {
        this.rendered = true
        delay().then(() => this.$emit('mounted', this.$el))
      },
      show () {
        if (!this.rendered) this.setRendered()
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

        delay(100)
          .then(() => {
            this.popupVisible = false
            this.slide = undefined

            this.$emit('hide')
            this.$emit('change', false)
          })
      },
      hideIf (triggerEl) {
        if (
          !this.$parent.$el.contains(triggerEl) &&
          (
            !this.renderToBody ||
            !(triggerEl === this.$el || this.$el.contains(triggerEl))
          )
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
            this.slide = 'in'
          })
      }
    }
  }
</script>
