<template>
  <div
    class="mu-input-box mu-combo-box"
    :fixed="!editable"
    :buttons="buttons"
    :disabled="disabled">
    <mu-input
      :type="type"
      :value="inputValue"
      :disabled="disabled"
      :readonly="readonly || !editable"
      :focus="popupVisible"
      @input="onInput"
      @click="onInputClick" />
    <mu-input-button
      v-if="clearBtnVisible"
      button-type="button"
      icon="close"
      @click="clear" />
    <mu-input-button
      class="mu-expand-trigger"
      icon="key-down"
      :trigger-on="popupVisible"
      :button-type="inputBtnType"
      :focus="popupVisible"
      @click="onButtonClick" />
    <component
      :is="$options.popupComponent"
      v-if="!disabled"
      v-model="popupVisible"
      v-bind="popupProps">
      <slot v-if="!options" />
      <template v-else>
        <component
          :is="$options.optionComponent"
          v-for="option in options"
          :key="Object(option)[valueField] || option"
          :option="option"
          :fields="fields"
          @click="toggleOption(option)" />
      </template>
    </component>
  </div>
</template>

<script>
  import isPlainObject from 'lodash.isplainobject'
  import InputBox from './input-box.vue'
  import Dropdown from '../layer/dropdown.vue'
  import Option from './option.js'

  export default {
    popupComponent: Dropdown,
    optionComponent: Option,
    extends: InputBox,
    props: {
      value: [String, Number, Array],
      keepIconIndent: Boolean,
      dropdownHeight: String,
      dropdownWidth: String,
      clearable: {
        type: Boolean,
        default: true
      },
      editable: {
        type: Boolean,
        default: false
      },
      fields: Object,
      options: Array,
      multiple: Boolean
    },
    data () {
      return {
        popupVisible: false
      }
    },
    computed: {
      valueField () {
        return Object(this.fields).value
      },
      popupProps () {
        return {
          keepIconIndent: this.keepIconIndent,
          dropdownHeight: this.dropdownHeight,
          dropdownWidth: this.dropdownWidth,
          class: 'mu-dropdown-list'
        }
      },
      inputBtnType () {
        return this.editable ? 'button' : 'icon'
      }
    },
    methods: {
      onInput (value) {
        this.inputValue = value
        this.$emit('input', value)
        this.$emit('change', { value })
      },
      onInputClick () {
        if (!this.editable) this.popupVisible = !this.popupVisible
      },
      onButtonClick () {
        this.popupVisible = !this.popupVisible
      },
      appendOption (option) {
        if (this.options) return
      },
      removeOption (option) {
        if (this.options) return
      },
      Option (option) {
        this.inputValue = option.label || option.value
        this.popupVisible = false
        this.$emit('change', option)
      }
    }
  }
</script>
