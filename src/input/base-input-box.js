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
    const {
      readonly,
      disabled,
      type,
      value,
      icon,
      iconClass,
      iconAlign,
      iconClickable,
      clearable
    } = this
    return {
      params: {
        readonly,
        disabled,
        type,
        value,
        icon,
        iconClass,
        iconAlign,
        iconClickable,
        clearable
      }
    }
  },
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    readonly: Boolean,
    disabled: Boolean,
    type: {
      type: String,
      default: 'text'
    },
    value: [String, Number],
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
    clearable: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    value: {
      handler (value) {
        this.setInputValue(value)
      },
      immediate: true
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
      this.params.value = ''
      this.$emit('change', '')
      this.$emit('clear', '')
    },
    onButtonClick () {
      this.$el.querySelector('.mu-input').focus()
      this.$emit('buttonclick')
    },
    onKeyPress (event) {
      this.$emit('keypress', event)
    }
  }
}
