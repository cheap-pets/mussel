<template>
  <div
    class="mu-input-box mu-combo-box"
    :fixed="inputReadonly"
    :buttons="buttons"
    :disabled="disabled">
    <mu-input
      :type="type"
      :title="inputValue"
      :value="inputValue"
      :disabled="disabled"
      :readonly="readonly || inputReadonly"
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
          :fields="fields" />
      </template>
    </component>
  </div>
</template>

<script>
  import Dropdown from '../layer/dropdown.vue'
  import InputBox from './input-box.vue'
  import Option from './option.js'

  export default {
    popupComponent: Dropdown,
    optionComponent: Option,
    extends: InputBox,
    provide () {
      return {
        comboBox: this,
        multiple: this.multiple
      }
    },
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
        selectedValue: null,
        popupVisible: false,
        mountedOptions: []
      }
    },
    computed: {
      valueField () {
        return Object(this.fields).value || 'value'
      },
      popupProps () {
        return {
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
    watch: {
      value: {
        handler (value) {
          if (value !== this.selectedValue) {
            this.selectedValue = this.multiple
              ? (Array.isArray(value) ? [...value] : [])
              : value
            this.refreshInputValue()
          }
        },
        immediate: true
      }
    },
    methods: {
      setInputValue () {
        // do nothing, juest overwrite InputBox's setInputValue()
      },
      setInputValueImmediately () {
        const { selectedValue, multiple, mountedOptions: options } = this
        if (!this.inputReadonly) {
          this.inputValue = selectedValue
        }
        this.inputValue = !selectedValue && isNaN(selectedValue)
          ? ''
          : (multiple ? selectedValue : [selectedValue])
            .map(value =>
              Object(options.find(item => item.value === value)).label || ''
            )
            .join(',')
      },
      refreshInputValue (immediate = false) {
        if (this.rivTimer) {
          clearTimeout(this.rivTimer)
          this.rivTimer = null
        }
        if (!this.inputReadonly || immediate) {
          this.setInputValueImmediately()
        } else {
          this.rivTimer = setTimeout(this.setInputValueImmediately, 50)
        }
      },
      onInput (value) {
        this.inputValue = value
        this.selectedValue = value
        this.$emit('input', value)
        this.$emit('change', value)
      },
      onInputClick () {
        if (!this.editable || this.multiple) {
          this.popupVisible = !this.popupVisible
        }
      },
      onButtonClick () {
        this.popupVisible = !this.popupVisible
      },
      mountOption (option) {
        const { mountedOptions: options } = this
        if (!options.find(item => option.value === item.value)) {
          options.push(option)
          if (!this.inputReadonly) this.refreshInputValue()
        }
      },
      unmountOption (option) {
        const { mountedOptions: options } = this
        const idx = options.findIndex(item => option.value === item.value)
        if (idx !== -1) {
          options.splice(idx, 1)
          // if (!this.inputReadonly) this.refreshInputValue()
        }
      },
      toggleSelection (value, option, hidePopup = true) {
        if (this.multiple) {
          const { selectedValue: values } = this
          const idx = values.indexOf(value)
          if (idx !== -1) {
            values.splice(idx, 1)
          } else {
            values.push(value)
          }
          this.$emit('change', values)
        } else {
          this.selectedValue = value
          this.$emit('change', value)
        }
        this.refreshInputValue(true)
        if (hidePopup) this.popupVisible = false
        this.$emit('optionclick', value, option)
      },
      clear () {
        this.selectedValue = this.multiple ? [] : null
        this.inputValue = ''
        this.$emit('change', this.selectedValue)
        this.$emit('clear', '')
      }
    }
  }
</script>
