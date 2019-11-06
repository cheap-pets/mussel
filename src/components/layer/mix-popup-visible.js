import './global-event-handler'

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
        if (!!value === !this.popupVisible) {
          return value ? this.show() : this.hide(true)
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
