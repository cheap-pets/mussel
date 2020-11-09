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
      rendered: false,
      popupVisible: false
    }
  },
  watch: {
    visible: {
      handler (value) {
        if (!value === !this.popupVisible) return

        if (value) this.show()
        else this.hide()
      },
      immediate: true
    }
  },
  methods: {
    async setPopupVisible (value) {
      if (
        !value === !this.popupVisible ||
        await this.beforeVisibleChange?.(value) === false
      ) return

      this.popupVisible = value
      await this.afterVisibleChange?.(value)

      if (value) this.$emit('show')
      else this.$emit('hide')

      this.$emit('change', value)
    },
    show () {
      this.rendered = true
      this.setPopupVisible(true)
    },
    hide () {
      this.setPopupVisible(false)
    }
  }
}
