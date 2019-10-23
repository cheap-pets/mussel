<template>
  <div
    class="mu-dropdown-panel"
    :popup-style="popupStyle"
    :style="style"
    :visible="popupVisible">
    <slot />
  </div>
</template>

<script>
  import RenderToBodyMixin from '../layer/mix-render-to-body'
  import PopupVisibleMixin from '../layer/mix-popup-visible'

  import { hideIf } from '../layer/global-event-handler'
  import { isParentElement } from '../utils/dom'
  import getClientRect from '../utils/client-rect'

  function popOnTop (parentRect, height) {
    return parentRect.bottom + 4 + height > window.innerHeight &&
      parentRect.top - height - 4 >= 0
  }

  function popOnRight (parentRect, width) {
    return (
      width < parentRect.width ||
      parentRect.left + width > window.innerWidth
    ) && parentRect.right - width >= 0
  }

  function getAbsolutePosition (isOnTop, isOnRight, parentRect, height, width) {
    const { top, bottom, left, right } = parentRect
    return {
      top: `${isOnTop ? top - height - 4 : bottom + 4}px`,
      left: `${isOnRight ? right - width : left}px`
    }
  }
  function getRelativePosition (isOnTop, isOnRight, parentRect) {
    return {
      top: isOnTop ? undefined : `${parentRect.height + 4}px`,
      bottom: isOnTop ? `${parentRect.height + 4}px` : undefined,
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
      popupStyle: String
    },
    data () {
      return {
        style: {
          visibility: 'hidden',
          opacity: 0,
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined,
          height: undefined,
          width: undefined,
          minWidth: undefined
        }
      }
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
        const w = this.width
        Object.assign(
          this.style,
          {
            width: w && w !== 'auto' && w !== 'inherit' && w !== 'fit-content'
              ? w
              : undefined,
            height: this.height
          }
        )
        this.$nextTick(this.setStyle)
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.style.opacity = 0
        this.style.visibility = 'hidden'
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
      setStyle () {
        if (!this.popupVisible) return

        const { offsetWidth, offsetHeight } = this.$el
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
            ),
          {
            visibility: 'visible',
            opacity: 1
          }
        )
      }
    }
  }
</script>

<style lang="postcss">
  .mu-dropdown-panel {
    position: absolute;
    z-index: 110;
    display: none;
    overflow: auto;
    background: $dropdownBackground;
    border: $dropdownBorder;
    border-radius: $(dropdownBorderRadiusPx)px;
    box-shadow: $dropdownShadow;
    transition: opacity .2s ease-in-out;

    &[visible] {
      display: block;
    }

    &[popup-style=dropdown-list],
    &[popup-style=dropdown-menu] {
      padding: $(dropdownListYPaddingPx)px 0;
    }

    & > .mu-list-item {
      padding: $(dropdownItemYPaddingPx)px $(listItemXPaddingPx)px;
      cursor: pointer;
    }
  }
  
  [popup-style=dropdown-menu] > .mu-list-item {
    &:hover {
      color: #fff;
      fill: #fff;
      background: $primaryColor;
    }
  }

  body > .mu-dropdown-panel {
    position: fixed;
  }
</style>
