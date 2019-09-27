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
      popupVisible: false
    }
  },
  watch: {
    visible: {
      handler (value) {
        if (value === !this.popupVisible) {
          this.$nextTick(value ? this.show : this.hide)
        }
      },
      immediate: true
    }
  },
  methods: {
    show () {
      this.popupVisible = true
      this.$emit('show')
      this.$emit('change', true)
    },
    hide () {
      this.popupVisible = false
      this.$emit('hide')
      this.$emit('change', false)
    }
  }
}
