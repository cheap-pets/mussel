<template>
  <div>
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselFlexItem',
    inject: {
      parentDirection: {
        default: 'row'
      }
    },
    props: {
      size: {
        type: [Number, String],
        validator (value) {
          return value === undefined ||
            /^([1-8]|auto|([1-9]\d*(px|%)))$/.test(value)
        }
      }
    },
    computed: {
      sizeValue () {
        return this.size || this.$el?.getAttribute('size')
      },
      sizeUnit () {
        const s = String(this.sizeValue)
        return s.indexOf('%') > -1
          ? '%'
          : (
            s.indexOf('px') > -1
              ? 'px'
              : null
          )
      }
    },
    watch: {
      size () {
        this.setAttributes()
      },
      parentDirection () {
        this.setAttributes()
      }
    },
    mounted () {
      const { width, height } = Object(this.$el.style)
      this.flexItemOriginStyles = {
        width,
        height
      }
      this.setAttributes()
    },
    methods: {
      setAttributes () {
        const { $el, sizeValue, sizeUnit } = this
        if (!$el) return
        if (!sizeValue || sizeUnit) $el.removeAttribute('size')
        else if (sizeValue) $el.setAttribute('size', sizeValue)
        Object.assign(
          $el.style,
          this.flexItemOriginStyles,
          sizeUnit
            ? {
              [this.parentDirection === 'row' ? 'width' : 'height']: sizeValue
            }
            : undefined
        )
      }
    }
  }
</script>
