<template>
  <mu-popup-editor-wrapper
    class="mu-search-box"
    :value-mode="valueMode"
    :valid="valid">
    <slot v-if="!options && isDropdownStyle" />
    <template v-else-if="isDropdownStyle">
      <mu-option
        v-for="(option, index) in options"
        :key="+new Date() + '_' + index"
        :icon-indent="popupIconIndent"
        :option="option"
        :fields="fields" />
      <div
        v-if="placeholder && !options.length"
        class="mu-search-box_placeholder mu-text-ellipsis mu-text-weak">
        {{ placeholder }}
      </div>
    </template>
  </mu-popup-editor-wrapper>
</template>

<script>
  import './search-box.pcss'

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
      value: null,
      fields: Object,
      options: Array,
      valueMode: String,
      popupStyle: String,
      editable: { type: Boolean, default: true },
      emitNullOnInput: { type: Boolean, default: true },
      popupMaxHeight: { type: String, default: '300px' }
    },
    data () {
      return {
        valid: false
      }
    },
    computed: {
      isDropdownStyle () {
        return this.valueMode === 'select' ||
          this.popupStyle === 'dropdown-list'
      }
    },
    watch: {
      value: {
        handler (v) {
          this.setValue(v, true)
        },
        immediate: true
      }
    },
    created () {
      this.params.editable = true
      this.popupParams.popupStyle = this.isDropdownStyle
        ? 'dropdown-list'
        : 'none'

      if (
        !this.icon &&
        !this.iconClass &&
        !this.isDropdownStyle
      ) {
        this.params.icon = 'search'
      }
    },
    methods: {
      setValue (value, valid) {
        const v = (isPlainObject(value)
          ? getOptionLabel(null, null, value, this.fields)
          : value
        ) || null
        if ((!valid || value !== null) && this.params.value !== v) {
          this.params.value = v
        }
        this.valid = this.valueMode === 'select' && valid
      },
      toggleSelection (value, label, option) {
        this.hidePopup()
        this.setValue(label, true)
        this.$emit('change', value, option || { label, value })
        this.$emit('optionclick', value, label, option)
        this.$el.querySelector('input').focus()
        this.focus()
      },
      onClearClick () {
        this.hidePopup()
        this.clear()
        this.$emit('change', null)
      },
      onInput (value) {
        this.valid = false
        if (this.__delayTimer) clearTimeout(this.__delayTimer)
        this.__delayTimer = setTimeout(() => {
          this.setValue(value)
          this.$emit('search', value)
          if (this.isDropdownStyle) {
            if (this.value !== null && this.emitNullOnInput) {
              this.$emit('change', null)
            }
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
    },
    preventBaseWatch: {
      value: true
    }
  }
</script>
