export default {
  name: 'MusselBaseFlexItem',
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
