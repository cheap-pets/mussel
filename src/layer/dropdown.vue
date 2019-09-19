<template>
  <div class="mu-dropdown" :visible="dropdownVisible" :style="dropdownStyle">
    <slot />
  </div>
</template>

<script>
  import getClientRect from '../utils/client-rect'
  import { isParentElement } from '../utils/dom'

  document.addEventListener('mousedown', event => {
    if (window.__mussel_dropdown) {
      window.__mussel_dropdown.hideIf(event.target)
    }
  })

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
    model: {
      prop: 'visible',
      event: 'change'
    },
    props: {
      visible: Boolean,
      renderToBody: {
        type: Boolean,
        default: false
      },
      width: String,
      height: String
    },
    data () {
      return {
        dropdownVisible: false,
        style: {
          visibility: 'hidden',
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
    watch: {
      visible (value) {
        this.$nextTick(value ? this.show : this.hide)
      }
    },
    mounted () {
      if (this.renderToBody) {
        document.body.appendChild(this.$el)
      }
      window.addEventListener('resize', this.setPosition)
      window.addEventListener('scroll', this.setPosition)
    },
    beforeDestroy () {
      this.deactivate()
      if (this.$el.parentNode === document.body) {
        document.body.removeChild(this.$el)
      }
      window.removeEventListener('resize', this.setPosition)
      window.removeEventListener('scroll', this.setPosition)
    },
    methods: {
      deactivate () {
        if (window.__mussel_dropdown === this) window.__mussel_dropdown = null
      },
      show () {
        window.__mussel_dropdown = this
        this.dropdownVisible = true
        this.$nextTick(this.setPosition)
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.style.visibility = 'hidden'
        this.dropdownVisible = false
        this.$emit('hide')
        this.$emit('change', false)
      },
      hideIf (triggerEl) {
        if (!isParentElement(triggerEl, this.$parent.$el)) this.hide()
      },
      setPosition () {
        if (!this.dropdownVisible) return
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
            visibility: 'visible'
          }
        )
      }
    }
  }
</script>

<style lang="postcss">
  .mu-dropdown {
    position: absolute;
    z-index: 100;
    display: none;
    background: #fff;
    border: $dropdownBorder;
    box-shadow: $dropdownShadow;
    overflow: auto;

    &[visible] {
      display: block;
    }
  }
  body > .mu-dropdown {
    position: fixed;
  }
</style>
