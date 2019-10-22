export default {
  data () {
    return {
      popupParams: {
        visible: false,
        width: this.popupWidth,
        height: this.popupHeight,
        className: this.popupClass,
        renderToBody: this.popupRenderToBody
      }
    }
  },
  provide () {
    return {
      popupParams: this.popupParams
    }
  },
  props: {
    triggerMode: {
      type: String,
      default: 'tap',
      validator (v) {
        return ['tap', 'hover'].indexOf(v) !== -1
      }
    },
    popupClass: String,
    popupWidth: String,
    popupHeight: String,
    popupRenderToBody: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    popupWidth (value) {
      this.popupParams.width = value
    },
    popupHeight (value) {
      this.popupParams.height = value
    },
    popupRenderToBody (value) {
      this.popupParams.renderToBody = value
    }
  },
  methods: {
    setPopupVisible (value) {
      this.popupParams.visible = value
    },
    togglePopup () {
      this.setPopupVisible(!this.popupParams.visible)
    },
    showPopup () {
      this.setPopupVisible(true)
    },
    hidePopup () {
      this.setPopupVisible(false)
    }
  }
}
