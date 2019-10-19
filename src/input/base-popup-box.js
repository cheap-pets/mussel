import PopupGroupMixin from '../layer/mix-popup-group'
import PopupBoxWrapper from './popup-box-wrapper.vue'
import BaseInputBox from './base-input-box'

export default {
  name: 'MusselBasePopupBox',
  components: {
    'mu-popup-box-wrapper': PopupBoxWrapper
  },
  extends: BaseInputBox,
  mixins: [PopupGroupMixin],
  props: {
    triggerType: {
      type: String,
      default: 'expander'
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onInputClick () {
      if (!this.readonly && !this.popupParams.editable) {
        this.togglePopup()
      }
      this.$emit('inputclick')
    },
    onButtonClick () {
      this.focus()
      this.togglePopup()
      if (this.iconClickable) this.$emit('buttonclick')
    },
    onClearClick () {
      this.hidePopup()
      this.clear()
      this.$emit('change', '')
    }
  }
}
