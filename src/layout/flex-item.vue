<template>
  <div :size="sizeAttr" :style="style">
    <slot />
  </div>
</template>

<script>
  export default {
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
      },
      overflow: String
    },
    computed: {
      // parentDirection () {
      //   let p = this.$parent
      //   let v
      //   while (p && !v) {
      //     v = p.flexDirection
      //     p = parent.$parent
      //   }
      //   return v || 'row'
      // },
      sizeUnit () {
        const s = String(this.size)
        return s.indexOf('%') > -1
          ? '%'
          : (
            s.indexOf('px') > -1
              ? 'px'
              : null
          )
      },
      sizeAttr () {
        return this.sizeUnit ? undefined : this.size
      },
      style () {
        return this.sizeUnit
          ? (
            this.parentDirection === 'row'
              ? { width: this.size }
              : { height: this.size }
          )
          : undefined
      }
    }
  }
</script>
