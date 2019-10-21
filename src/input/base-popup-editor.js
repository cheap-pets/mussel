import BaseButtonEditor from './base-button-editor'
import PopupGroupMixin from '../layer/mix-popup-group'
import PopupEditorWrapper from './popup-editor-wrapper.vue'

export default {
  name: 'MusselBasePopupEditor',
  components: {
    'mu-popup-editor-wrapper': PopupEditorWrapper
  },
  extends: BaseButtonEditor,
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
