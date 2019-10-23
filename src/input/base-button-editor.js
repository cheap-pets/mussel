import ButtonEditorWrapper from './button-editor-wrapper.vue'

export default {
  name: 'MusselBaseButtonEditor',
  components: {
    'mu-button-editor-wrapper': ButtonEditorWrapper
  },
  provide () {
    return {
      editor: this,
      params: this.params
    }
  },
  data () {
    const p = this
    return {
      params: {
        focus: false,
        type: p.type,
        value: p.value,
        icon: p.icon,
        iconClickable: p.iconClickable !== false,
        iconClass: p.iconClass,
        iconAlign: p.iconAlign,
        triggerType: p.triggerType,
        readonly: p.readonly,
        disabled: p.disabled,
        editable: p.editable,
        clearable: p.clearable,
        placeholder: p.placeholder
      }
    }
  },
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    placeholder: String,
    readonly: Boolean,
    disabled: Boolean,
    type: {
      type: String,
      default: 'text'
    },
    value: {
      type: [String, Number]
    },
    icon: String,
    iconClass: String,
    iconAlign: {
      type: String,
      default: 'right',
      validator (value) {
        return ['left', 'right'].indexOf(value) !== -1
      }
    },
    iconClickable: null,
    editable: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: true
    },
    triggerType: String
  },
  watch: {
    value: {
      handler (value) {
        this.setInputValue(value)
      },
      immediate: true
    },
    readonly (value) {
      this.params.readonly = value
    },
    disabled (value) {
      this.params.disabled = value
    },
    type (value) {
      this.params.type = value
    },
    icon (value) {
      this.params.icon = value
    },
    iconClass (value) {
      this.params.iconClass = value
    },
    iconAlign (value) {
      this.params.iconAlign = value
    },
    triggerType (value) {
      this.params.triggerType = value
    },
    editable (value) {
      this.editable = value
    },
    clearable (value) {
      this.params.clearable = value
    },
    placeholder (value) {
      this.params.placeholder = value
    }
  },
  methods: {
    setInputValue (value) {
      this.params.value = value
    },
    onInput (value) {
      this.setInputValue(value)
      this.$emit('input', value)
      this.$emit('change', value)
    },
    onInputClick () {
      this.$emit('inputclick')
    },
    onClearClick () {
      this.clear()
      this.$emit('change', '')
    },
    onButtonClick () {
      this.focus()
      if (this.params.iconClickable) this.$emit('buttonclick')
    },
    onKeyPress (event) {
      this.$emit('keypress', event)
    },
    clear () {
      this.params.value = ''
      this.focus()
      this.$emit('clear')
    },
    focus () {
      this.$el.querySelector('.mu-input').focus()
    }
  }
}
