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
      return Object(this.fields).value || 'value'
    },
    labelField () {
      return Object(this.fields).label || 'label'
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
      const label =
        this.label === undefined
          ? Object(this.option)[this.labelField]
          : this.label
      return label || this.actualValue
    },
    actualIcon () {
      return this.multiple
        ? (this.actualSelected ? 'ok' : '_')
        : this.icon
    },
    actualSelected () {
      const { selectedValue: selected } = this.inputBox
      return this.multiple
        ? selected && selected.find(value => value === this.actualValue)
        : selected === this.actualValue
    }
  },
  created () {
    this.storedOption = {
      value: this.actualValue,
      label: this.actualLabel
    }
    this.inputBox.mountOption(this.storedOption)
  },
  beforeDestroy () {
    this.inputBox.unmountOption(this.storedOption)
  },
  methods: {
    onClick () {
      if (this.disabled) return
      if (this.inputBox) {
        this.inputBox.toggleSelection(this.actualValue, this.option)
      }
      this.$emit('click')
    }
  }
}
