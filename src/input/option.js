import ListItem from '../list/list-item.vue'

export default {
  name: 'MusselOption',
  extends: ListItem,
  inject: {
    inputBox: {
      default: null
    },
    multiple: {
      default: false
    }
  },
  props: {
    value: undefined,
    fields: Array,
    option: [String, Number, Object]
  },
  computed: {
    valueField () {
      return this.fields?.value || 'value'
    },
    labelField () {
      return this.fields?.label || 'label'
    },
    actualValue () {
      const option = Object(this.option)
      const v =
        this.value === undefined
          ? (
            (this.valueField in option)
              ? option[this.valueField]
              : option.key
          )
          : this.value
      return v === undefined ? this.option : v
    },
    actualLabel () {
      const { params: { editable } } = this.inputBox
      const label = editable
        ? null
        : (
          this.label === undefined
            ? this.option?.[this.labelField]
            : this.label
        )
      return label || this.actualValue
    },
    actualIcon () {
      return this.multiple
        ? (this.actualSelected ? 'ok' : '_')
        : this.icon
    },
    actualSelected () {
      const { comboValue } = this.inputBox
      return this.multiple
        ? comboValue?.find(value => value === this.actualValue)
        : comboValue === this.actualValue
    }
  },
  created () {
    this.mountedOption = {
      value: this.actualValue,
      label: this.actualLabel
    }
    this.inputBox.mountOption(this.mountedOption)
  },
  beforeDestroy () {
    this.inputBox.unmountOption(this.mountedOption)
  },
  methods: {
    onClick () {
      if (this.disabled) return
      this.inputBox?.toggleSelection(this.actualValue, this.option)
      this.$emit('click')
    }
  }
}
