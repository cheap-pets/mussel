export default {
  data () {
    return {
      popupParams: {
        popupVisible: false,
        popupWidth: this.popupWidth,
        popupHeight: this.popupHeight,
        popupClassName: this.popupClassName,
        popupRenderToBody: this.popupRenderToBody
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
    popupWidth: String,
    popupHeight: String,
    popupClassName: String,
    popupRenderToBody: Boolean
  },
  watch: {
    popupWidth (value) {
      this.popupParams.popupWidth = value
    },
    popupHeight (value) {
      this.popupParams.popupHeight = value
    },
    popupRenderToBody (value) {
      this.popupParams.popupRenderToBody = value
    }
  },
  methods: {
    setPopupVisible (value) {
      this.popupParams.popupVisible = value
    },
    togglePopup () {
      this.setPopupVisible(!this.popupParams.popupVisible)
    },
    showPopup () {
      this.setPopupVisible(true)
    },
    hidePopup () {
      this.setPopupVisible(false)
    }
  }
}
