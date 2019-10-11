import InputBoxWrapper from './input-box-wrapper.vue'

export default {
  name: 'MusselBaseInputBox',
  components: {
    'mu-input-box-wrapper': InputBoxWrapper
  },
  provide () {
    return {
      inputBox: this,
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
        iconClass: p.iconClass,
        iconAlign: p.iconAlign,
        iconClickable: p.iconClickable,
        triggerType: p.triggerType,
        triggerOn: p.triggerOn,
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
    iconClickable: Boolean,
    editable: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: true
    },
    triggerType: String,
    triggerOn: Boolean
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
    triggerOn (value) {
      this.params.triggerOn = value
    },
    iconClickable (value) {
      this.params.iconClickable = value || !!this.triggerType
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
      if (this.iconClickable) this.$emit('buttonclick')
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
