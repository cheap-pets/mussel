export default {
  model: {
    prop: 'visible',
    event: 'change'
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      actualVisible: false
    }
  },
  watch: {
    visible: {
      handler (value) {
        if (value === !this.actualVisible) {
          this.$nextTick(value ? this.show : this.hide)
        }
      },
      immediate: true
    }
  },
  methods: {
    show () {
      this.actualVisible = true
      this.$emit('show')
      this.$emit('change', true)
    },
    hide () {
      this.actualVisible = false
      this.$emit('hide')
      this.$emit('change', false)
    }
  }
}
