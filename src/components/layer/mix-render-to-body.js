export default {
  props: {
    renderToBody: {
      type: Boolean,
      default: true
    }
  },
  mounted () {
    if (this.renderToBody) {
      document.body.appendChild(this.$el)
    }
  },
  beforeDestroy () {
    this.deactivate()
    const pEl = this.$el.parentNode
    if (this.$el && pEl && pEl !== Object(this.$parent).$el) {
      pEl.removeChild(this.$el)
    }
  }
}
