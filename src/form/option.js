import ListItem from '../list/list-item.vue'

export default {
  extends: ListItem,
  inject: {
    comboBox: {
      default: null
    },
    multiple: {
      default: false
    },
    comboValue: {
      default: null
    }
  },
  props: {
    value: String,
    fields: Array,
    option: [String, Number, Object]
  },
  computed: {
    valueField () {
      return Object(this.fields).value || 'value'
    },
    labelField () {
      return Object(this.fields).label || 'label'
    },
    _value () {
      const v =
        this.value === undefined
          ? Object(this.option)[this.valueField]
          : this.value
      return v === undefined ? this.option : v
    },
    _label () {
      const label =
        this.label === undefined
          ? Object(this.option)[this.labelField]
          : this.label
      return label || this._value
    },
    _icon () {
      return this.multiple
        ? (this._selected ? 'ok' : '_')
        : this.icon
    },
    _selected () {
      return this.multiple
        ? !!this.comboBox.internalValue.find(value => value === this._value)
        : this.comboBox.internalValue === this._value
    }
  },
  created () {
    this.comboBox.mountOption({ value: this._value, label: this._label })
  },
  beforeDestroy () {
    this.comboBox.unmountOption({ value: this._value, label: this._label })
  },
  methods: {
    onClick () {
      if (this.disabled) return
      if (this.comboBox) {
        this.comboBox.toggleSelection(this._value)
      }
      this.$emit('click')
    }
  }
}
