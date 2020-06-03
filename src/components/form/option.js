import ListItem from '../list/list-item.vue'

import { unsetOrFalse } from '../../utils/prop'
import { getOptionValue, getOptionLabel } from './combo-util'

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
    fields: Object,
    option: [String, Number, Object]
  },
  computed: {
    actualValue () {
      return getOptionValue(this.value, this.option, this.fields)
    },
    actualLabel () {
      return getOptionLabel(this.label, this.actualValue, this.option, this.fields)
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
    this.editor.mountOption?.(this.mountedOption)
  },
  beforeDestroy () {
    this.editor.unmountOption?.(this.mountedOption)
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
      this.editor.toggleSelection(
        this.actualValue,
        this.actualLabel,
        this.option,
        this.fields
      )
      this.$emit('click')
    }
  }
}
