import '@events/layer-event-handlers'

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
  }
}
