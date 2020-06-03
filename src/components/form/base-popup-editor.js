import BaseEditor from './base-editor'
import PopupGroupMixin from '../layer/mix-popup-group'
import PopupEditorWrapper from './popup-editor-wrapper.vue'

export default {
  name: 'MusselBasePopupEditor',
  components: {
    'mu-popup-editor-wrapper': PopupEditorWrapper
  },
  extends: BaseEditor,
  mixins: [PopupGroupMixin],
  props: {
    editable: {
      type: Boolean,
      default: false
    },
    popupWidth: {
      type: String,
      default: 'inherit'
    }
  },
  methods: {
    onInputClick () {
      if (!this.readonly && !this.params.editable) {
        this.togglePopup()
      }
      this.$emit('inputclick')
    },
    onButtonClick () {
      this.focus()
      this.togglePopup()
      this.$emit('buttonclick')
    },
    onClearClick () {
      this.hidePopup()
      this.clear()
      this.$emit('change', '')
    }
  },
  created () {
    if (!this.icon &&
      !this.iconClass &&
      !this.triggerType
    ) {
      this.params.triggerType = 'expander'
    }
  }
}
