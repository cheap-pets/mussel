<template>
  <mu-popup-editor-wrapper
    class="mu-search-box"
    :value-mode="valueMode"
    :selected="selected">
    <slot v-if="!options && isDropdownStyle" />
    <template v-else-if="isDropdownStyle">
      <mu-option
        v-for="(option, index) in options"
        :key="+new Date() + '_' + index"
        :icon-indent="popupIconIndent"
        :option="option"
        :fields="fields" />
    </template>
  </mu-popup-editor-wrapper>
</template>

<script>
  import isPlainObject from 'lodash.isplainobject'
  import BasePopupEditor from './base-popup-editor'
  import Option from './option.js'

  import { getOptionLabel } from './combo-util'

  export default {
    name: 'MusselSearchBox',
    components: {
      'mu-option': Option
    },
    extends: BasePopupEditor,
    props: {
      value: String,
      fields: Object,
      options: Array,
      valueMode: String,
      popupStyle: String,
      editable: { type: Boolean, default: true },
      popupMaxHeight: { type: String, default: '300px' }
    },
    data () {
      return {
        selected: false
      }
    },
    computed: {
      isDropdownStyle () {
        return this.valueMode === 'select' ||
          this.popupStyle === 'dropdown-list'
      }
    },
    created () {
      this.params.value = null
      this.params.editable = true
      this.popupParams.popupStyle = this.isDropdownStyle
        ? 'dropdown-list'
        : 'none'

      if (
        !this.icon &&
        !this.iconClass &&
        !this.triggerType &&
        !this.isDropdownStyle
      ) {
        this.params.triggerType = undefined
        this.params.icon = 'search'
      }
    },
    methods: {
      setValue (value) {
        if (isPlainObject(value)) {
          this.selected = this.valueMode === 'select'
          this.params.value = getOptionLabel(null, null, value, this.fields)
        } else {
          this.params.value = value
        }
      },
      toggleSelection (value, label, option) {
        this.selected = this.valueMode === 'select'
        this.hidePopup()
        this.setValue(label)
        this.$emit('change', option || { value, label })
        this.$emit('optionclick', value, option)
        this.focus()
      },
      onClearClick () {
        this.hidePopup()
        this.clear()
        this.$emit('change', null)
      },
      onInput (value) {
        this.selected = false
        if (this.__delayTimer) clearTimeout(this.__delayTimer)
        this.__delayTimer = setTimeout(() => {
          this.setValue(value)
          this.$emit('search', value)
          if (this.isDropdownStyle) {
            this.$emit('change', null)
            this.showPopup()
          }
        }, 500)
      },
      onButtonClick () {
        if (!this.isDropdownStyle) {
          this.$emit('search', this.params.value)
        } else {
          this.focus()
          this.togglePopup()
        }
      },
      onInputClick (event) {
        event.target.select()
      }
    }
  }
</script>
