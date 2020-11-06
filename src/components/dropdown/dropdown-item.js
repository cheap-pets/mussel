import ListItem from '../list/list-item.vue'

import { unsetOrFalse } from '@utils/prop'

export default {
  name: 'MusselDropdownItem',
  extends: ListItem,
  inject: {
    dropdown: {
      default: null
    },
    popupParams: {
      default: null
    }
  },
  computed: {
    actualIcon () {
      return this.icon || (this.actualSelected ? 'ok' : undefined)
    },
    actualIconIndent () {
      return (
        !unsetOrFalse(this.iconIndent) ||
        !unsetOrFalse(this.popupParams?.iconIndent)
      )
    }
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
      if (!this.disabled) {
        this.dropdown?.onItemClick({
          value: this.value,
          label: this.label
        })
        this.$emit('click')
      }
    }
  }
}
