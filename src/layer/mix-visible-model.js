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
      modalVisible: false
    }
  },
  watch: {
    visible: {
      handler (value) {
        if (value === !this.modalVisible) {
          this.$nextTick(value ? this.show : this.hide)
        }
      },
      immediate: true
    }
  },
  methods: {
    show () {
      this.modalVisible = true
      this.$emit('show')
      this.$emit('change', true)
    },
    hide () {
      this.modalVisible = false
      this.$emit('hide')
      this.$emit('change', false)
    }
  }
}
