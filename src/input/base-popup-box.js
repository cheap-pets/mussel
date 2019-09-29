import PopupBoxWrapper from './popup-box-wrapper.vue'
import BaseInputBox from './base-input-box'

export default {
  name: 'MusselBasePopupBox',
  components: {
    'mu-popup-box-wrapper': PopupBoxWrapper
  },
  extends: BaseInputBox,
  data () {
    const p = this
    return {
      params: {
        type: p.type,
        value: p.value,
        icon: p.icon,
        iconClass: p.iconClass,
        iconAlign: p.iconAlign,
        iconClickable: p.iconClickable,
        triggerType: p.triggerType,
        triggerOn: p.triggerOn,
        readonly: p.readonly,
        disabled: p.disabled,
        editable: p.editable,
        clearable: p.clearable,
        placeholder: p.placeholder,
        popupVisible: false,
        popupWidth: p.popupWidth,
        popupHeight: p.popupHeight,
        popupClassName: p.popupClassName,
        popupRenderToBody: p.popupRenderToBody,
        popupKeepIconIndent: p.popupKeepIconIndent,
        focus: false
      }
    }
  },
  props: {
    triggerType: {
      type: String,
      default: 'expander'
    },
    popupWidth: String,
    popupHeight: String,
    popupClassName: String,
    popupRenderToBody: Boolean,
    popupKeepIconIndent: Boolean
  },
  watch: {
    popupWidth (value) {
      this.params.popupWidth = value
    },
    popupHeight (value) {
      this.params.popupHeight = value
    },
    popupRenderToBody (value) {
      this.params.popupRenderToBody = value
    },
    popupKeepIconIndent (value) {
      this.params.popupKeepIconIndent = value
    }
  },
  methods: {
    setPopupVisible (value) {
      this.params.popupVisible = value
      this.params.focus = value
    },
    togglePopupVisible () {
      this.setPopupVisible(!this.params.popupVisible)
    },
    onInput (value) {
      this.setInputValue(value)
      this.$emit('change', value)
    },
    onInputClick () {
      if (!this.readonly && !this.params.editable) {
        this.togglePopupVisible()
      }
      this.$emit('inputclick')
    },
    onButtonClick () {
      this.$el.querySelector('.mu-input').focus()
      this.togglePopupVisible()
      if (this.iconClickable) this.$emit('buttonclick')
    },
    onClearClick () {
      this.params.value = ''
      this.setPopupVisible(false)
      this.$emit('change', '')
      this.$emit('clear', '')
    }
  }
}
