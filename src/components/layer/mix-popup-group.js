export default {
  data () {
    return {
      popupParams: {
        visible: false,
        width: this.popupWidth,
        height: this.popupHeight,
        maxHeight: this.popupMaxHeight,
        popupClass: this.popupClass,
        popupStyle: this.popupStyle,
        iconIndent: this.popupIconIndent,
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
    popupClass: String,
    popupStyle: String,
    popupWidth: {
      type: String,
      default: 'auto'
    },
    popupHeight: String,
    popupMaxHeight: String,
    popupIconIndent: null,
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
    popupMaxHeight (value) {
      this.popupParams.maxHeight = value
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
