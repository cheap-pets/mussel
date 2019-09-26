<template>
  <div class="mu-dropdown" :visible="actualVisible" :style="dropdownStyle">
    <slot />
  </div>
</template>

<script>
  import RenderToBodyMixin from './mix-render-to-body'
  import VisibleModelMixin from './mix-visible-model'

  import getClientRect from '../utils/client-rect'
  import { isParentElement } from '../utils/dom'

  function callbackIf (handler) {
    window.__mussel_dropdown && handler(window.__mussel_dropdown)
  }

  function hideIf () {
    callbackIf(dropdown => dropdown.hide())
  }

  function setPositionIf () {
    callbackIf(dropdown => dropdown.setPosition())
  }

  window.addEventListener('blur', hideIf)
  window.addEventListener('popstate', hideIf)
  window.addEventListener('resize', setPositionIf)
  window.addEventListener('scroll', setPositionIf)

  function popOnTop (parentRect, height) {
    return parentRect.bottom + 4 + height > window.innerHeight &&
      parentRect.top - height - 4 >= 0
  }

  function popOnRight (parentRect, width) {
    return parentRect.right + width > window.innerWidth &&
      parentRect.left - width >= 0
  }

  function getAbsolutePosition (isOnTop, isOnRight, parentRect, height, width) {
    const { top, bottom, left, right } = parentRect
    return {
      top: `${isOnTop ? top - height - 4 : bottom + 4}px`,
      left: `${isOnRight ? right - width : left}px`
    }
  }
  function getRelativePosition (isOnTop, isOnRight, parentRect, settingWidth) {
    return {
      top: isOnTop ? undefined : `${parentRect.height + 4}px`,
      bottom: isOnTop ? `${parentRect.height + 4}px` : undefined,
      left: isOnRight ? undefined : '0',
      right: isOnRight || !settingWidth ? '0' : undefined
    }
  }

  export default {
    name: 'MusselDropdown',
    mixins: [RenderToBodyMixin, VisibleModelMixin],
    provide () {
      return {
        keepIconIndent: this.keepIconIndent
      }
    },
    props: {
      keepIconIndent: Boolean,
      height: String,
      width: String
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
          width: undefined,
          height: undefined
        }
      }
    },
    computed: {
      dropdownStyle () {
        const s = { ...this.style }
        if (this.width) s.width = this.width
        if (this.height) s.height = this.height
        return s
      }
    },
    methods: {
      deactivate () {
        if (window.__mussel_dropdown === this) window.__mussel_dropdown = null
      },
      show () {
        window.__mussel_dropdown = this
        this.actualVisible = true
        this.$nextTick(this.setPosition)
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.style.opacity = 0
        this.style.visibility = 'hidden'
        this.actualVisible = false
        this.$emit('hide')
        this.$emit('change', false)
      },
      hideIf (triggerEl) {
        if (
          !isParentElement(triggerEl, this.$parent.$el) &&
          (!this.renderToBody || !isParentElement(triggerEl, this.$el))
        ) {
          this.hide()
        }
      },
      setPosition () {
        if (!this.actualVisible) return
        const { offsetHeight: height, offsetWidth: width } = this.$el
        const pRect = getClientRect(this.$parent.$el)
        const isOnTop = popOnTop(pRect, height)
        const isOnRight = !!this.width && popOnRight(pRect, width)

        Object.assign(
          this.style,
          this.renderToBody && !this.width ? { width: `${pRect.width}px` } : {},
          this.renderToBody
            ? getAbsolutePosition(isOnTop, isOnRight, pRect, height, width)
            : getRelativePosition(isOnTop, isOnRight, pRect, this.width),
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
  .mu-dropdown {
    position: absolute;
    z-index: 110;
    display: none;
    background: #fff;
    border: $dropdownBorder;
    box-shadow: $dropdownShadow;
    overflow: auto;
    transition: opacity .2s ease-in-out;

    &[visible] {
      display: block;
    }
  }
  body > .mu-dropdown {
    position: fixed;
  }
  .mu-dropdown-list, .mu-dropdown-menu {
    padding: $(dropdownListPadding);
  }
</style>
