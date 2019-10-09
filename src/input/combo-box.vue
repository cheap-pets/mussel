<template>
  <mu-popup-box-wrapper>
    <slot v-if="!options" />
    <template v-else>
      <mu-option
        v-for="option in options"
        :key="Object(option)[valueField] || option"
        :option="option"
        :fields="fields" />
    </template>
  </mu-popup-box-wrapper>
</template>

<script>
  import BasePopupBox from './base-popup-box'
  import Option from './option.js'

  export default {
    name: 'MusselComboBox',
    components: {
      'mu-option': Option
    },
    extends: BasePopupBox,
    provide () {
      return {
        multiple: this.multiple
      }
    },
    props: {
      fields: Object,
      options: Array,
      multiple: Boolean,
      popupClassName: {
        type: String,
        default: 'mu-dropdown-list'
      },
      value: [String, Number, Array]
    },
    data () {
      return {
        selectedValue: null,
        mountedOptions: []
      }
    },
    computed: {
      valueField () {
        return Object(this.fields).value || 'value'
      }
    },
    watch: {
      multiple (value) {
        this.params.editable = this.editable && !value
      }
    },
    created () {
      this.params.value = null
    },
    mounted () {
      this.params.editable = this.editable && !this.multiple
      this.selectedValue = this.value || (this.multiple ? [] : null)
      this.setInputValueImmediately()
    },
    methods: {
      setInputValue () {
        // do nothing, juest overwrite InputBox's setInputValue()
      },
      setInputValueImmediately () {
        const { selectedValue, multiple, mountedOptions: options } = this
        if (!this.params.editable) {
          this.params.value = selectedValue
        }
        this.params.value = (!selectedValue && selectedValue !== 0)
          ? ''
          : (
            this.params.editable
              ? selectedValue
              : (
                (multiple ? selectedValue : [selectedValue])
                  .map(value =>
                    Object(options.find(item => item.value === value)).label ||
                    ''
                  )
                  .join(',')
              )
          )
      },
      refreshInputValue (immediate = false) {
        if (this.rivTimer) {
          clearTimeout(this.rivTimer)
          this.rivTimer = null
        }
        if (this.params.editable || immediate) {
          this.setInputValueImmediately()
        } else {
          this.rivTimer = setTimeout(this.setInputValueImmediately, 50)
        }
      },
      onInput (value) {
        this.params.value = value
        this.selectedValue = value
        this.$emit('input', value)
        this.$emit('change', value)
      },
      mountOption (option) {
        const { mountedOptions: options } = this
        if (!options.find(item => option.value === item.value)) {
          options.push(option)
          if (!this.params.editable) this.refreshInputValue()
        }
      },
      unmountOption (option) {
        const { mountedOptions: options } = this
        const idx =
          options.findIndex(item => option.value === item.value)
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
        if (hidePopup) this.params.popupVisible = false
        this.$emit('optionclick', value, option)
      },
      onClearClick () {
        this.selectedValue = this.multiple ? [] : null
        this.params.value = ''
        this.$emit('change', this.selectedValue)
        this.$emit('clear')
      }
    }
  }
</script>
