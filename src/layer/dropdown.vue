<template>
  <div class="mu-dropdown" :visible="visible" :style="style">
    <slot />
  </div>
</template>

<script>
  import getClientRect from '../utils/client-rect'

  export default {
    model: {
      prop: 'visible',
      event: 'change'
    },
    props: {
      visible: Boolean,
      renderToBody: {
        type: Boolean,
        default: true
      }
    },
    data () {
      return {
        top: undefined,
        left: undefined,
        right: undefined,
        bottom: undefined
      }
    },
    computed: {
      style () {
        return {
          top: this.top,
          left: this.left,
          right: this.right,
          bottom: this.bottom,
          width: this.width
        }
      }
    },
    watch: {
      visible (value) {
        if (value) this.$nextTick(this.setPosition)
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
      if (this.$el.parentNode === document.body) {
        document.body.removeChild(this.$el)
      }
      window.removeEventListener('resize', this.setPosition)
      window.removeEventListener('scroll', this.setPosition)
    },
    methods: {
      setPosition () {
        if (this.renderToBody) {
          const rect = getClientRect(this.$parent.$el)
          const h = this.$el.offsetHeight
          let top = rect.bottom + 1
          if (top + h > window.innerHeight && rect.top - h - 1 > 0) {
            top = rect.top - h - 1
          }
          this.left = rect.left + 'px'
          this.top = top + 'px'
          this.width = rect.width + 'px'
        }
      }
    }
  }
</script>

<style lang="postcss">
  .mu-dropdown {
    position: fixed;
    z-index: 100;
    display: none;
    background: #fff;
    box-shadow: $boxShadowLevel3;

    &[visible] {
      display: block;
    }
  }
</style>
