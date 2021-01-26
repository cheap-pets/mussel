import BaseEditorWrapper from './base-editor-wrapper.vue'

export default {
  name: 'MusselBaseButtonEditor',
  components: {
    'mu-editor-wrapper': BaseEditorWrapper
  },
  provide () {
    return {
      editor: this,
      params: this.params
    }
  },
  data () {
    const p = this
    if (p.iconPosition) {
      console.warn(
        'property "icon-position" is deprecated, use "icon-align" instead!'
      )
    }
    const params = {
      focus: false,
      type: p.type,
      value: p.value,
      icon: p.icon,
      iconClass: p.iconClass,
      iconAlign: p.iconPosition || p.iconAlign,
      iconClickable: p.iconClickable !== false,
      readonly: p.readonly,
      disabled: p.disabled,
      editable: p.editable,
      clearable: p.clearable,
      placeholder: p.placeholder,
      autofocus: p.autofocus
    }
    return { params }
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
    iconPosition: String,
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
    autofocus: Boolean
  },
  watch: {
    value: {
      handler (value) {
        if (!this.$options.preventBaseWatch?.value) this.setValue(value)
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
    editable (value) {
      this.editable = value
    },
    clearable (value) {
      this.params.clearable = value
    },
    placeholder (value) {
      this.params.placeholder = value
    },
    autofocus (value) {
      this.params.autofocus = value
    }
  },
  methods: {
    setValue (value) {
      this.params.value = value
    },
    onInput (value) {
      if (!this.editable && !value) return
      this.setValue(value)
      this.$emit('input', value)
      this.$emit('change', value)
    },
    onInputClick (event) {
      this.$emit('inputclick', event)
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
    onEscKey () {
      this.$emit('esckey', this)
    },
    onEnterKey () {
      this.$emit('enterkey', this)
    },
    onBlur () {
      this.$emit('blur', this)
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
