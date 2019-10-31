import ListItem from '../list/list-item.vue'

import { unsetOrFalse } from '../../utils/prop'

export default {
  name: 'MusselOption',
  extends: ListItem,
  inject: {
    editor: {
      default: null
    },
    multiple: {
      default: false
    },
    popupParams: {
      default: null
    }
  },
  props: {
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
      const { params: { editable } } = this.editor
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
    actualIconIndent () {
      return (
        !unsetOrFalse(this.iconIndent) ||
        !unsetOrFalse(this.popupParams?.iconIndent)
      )
    },
    actualSelected () {
      const { comboValue } = this.editor
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
    this.editor.mountOption(this.mountedOption)
  },
  beforeDestroy () {
    this.editor.unmountOption(this.mountedOption)
  },
  watch: {
    actualIcon: {
      handler (value) {
        const params = this.popupParams || { iconIndent: true }
        const indent = params.iconIndent
        if (value && !indent && indent !== false && indent !== 'false') {
          params.iconIndent = true
        }
      },
      immediate: true
    }
  },
  methods: {
    onClick () {
      if (this.disabled) return
      this.editor.toggleSelection(this.actualValue, this.option)
      this.$emit('click')
    }
  }
}
