<template>
  <mu-input-box-wrapper>
    <mu-dropdown
      v-if="!disabled"
      v-model="dropdownVisible"
      v-bind="popupProps">
      <slot v-if="!options" />
      <template v-else>
        <mu-option
          v-for="option in options"
          :key="Object(option)[valueField] || option"
          :option="option"
          :fields="fields" />
      </template>
    </mu-dropdown>
  </mu-input-box-wrapper>
</template>

<script>
  import BaseInputBox from './base-input-box'

  export default {
    name: 'MusselComboBox',
    extends: BaseInputBox,
    props: {
      value: [String, Number, Array],
      popupRenderToBody: Boolean,
      keepIconIndent: Boolean,
      dropdownHeight: String,
      dropdownWidth: String,
      editable: {
        type: Boolean,
        default: false
      },
      fields: Object,
      options: Array,
      multiple: Boolean
    },
    computed: {
      valueField () {
        return Object(this.fields).value || 'value'
      },
      popupProps () {
        return {
          renderToBody: this.popupRenderToBody,
          keepIconIndent: this.keepIconIndent,
          dropdownHeight: this.dropdownHeight,
          dropdownWidth: this.dropdownWidth,
          class: 'mu-dropdown-list'
        }
      },
      inputReadonly () {
        return !this.editable || this.multiple
      },
      inputBtnType () {
        return this.inputReadonly ? 'icon' : 'button'
      }
    },
  }
</script>
