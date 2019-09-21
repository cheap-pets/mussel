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
          :fields="fields" />
      </template>
    </component>
  </div>
</template>

<script>
  import InputBox from './input-box.vue'
  import Dropdown from '../layer/dropdown.vue'
  import Option from './option.js'

  export default {
    popupComponent: Dropdown,
    optionComponent: Option,
    extends: InputBox,
    provide () {
      return {
        comboBox: this,
        multiple: this.multiple,
        comboValue: this.internalValue
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
        internalValue: null,
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
      inputBtnType () {
        return this.editable ? 'button' : 'icon'
      }
    },
    watch: {
      value: {
        handler (value) {
          this.internalValue = this.multiple
            ? (Array.isArray(value) ? [...value] : [])
            : value
          this.refreshInputValue()
        },
        immediate: true
      }
    },
    methods: {
      setInputValue (value) {
        this.refreshInputValue()
      },
      refreshInputValue () {
        if (this.rivTimer) {
          clearTimeout(this.rivTimer)
          this.rivTimer = null
        }
        this.rivTimer = setTimeout(() => {
          const { internalValue, multiple, mountedOptions: options } = this
          this.inputValue =
            !internalValue && isNaN(internalValue)
              ? ''
              : (multiple ? internalValue : [internalValue])
                .map(value =>
                  Object(options.find(item => item.value === value)).label || ''
                )
                .join(',')
        }, 50)
      },
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
      mountOption (option) {
        const { mountedOptions: options } = this
        if (!options.find(item => option.value === item.value)) {
          options.push(option)
          this.refreshInputValue()
        }
      },
      unmountOption (option) {
        const { mountedOptions: options } = this
        const idx = options.findIndex(item => option.value === item.value)
        if (idx !== -1) {
          options.splice(idx, 1)
          this.refreshInputValue()
        }
      },
      toggleSelection (value, hidePopup = true) {
        if (this.multiple) {
          const { internalValue: values } = this
          const idx = values.indexOf(value)
          if (idx !== -1) {
            values.splice(idx, 1)
          } else {
            values.push(value)
          }
          this.$emit('change', values)
        } else {
          this.internalValue = value
          this.$emit('change', value)
        }
        this.refreshInputValue()
        if (hidePopup) this.popupVisible = false
      },
      clear () {
        this.internalValue = this.multiple ? [] : null
        this.inputValue = ''
        this.$emit('change', '')
        this.$emit('clear', '')
      }
    }
  }
</script>
