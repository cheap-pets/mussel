<template>
  <mu-popup-box-wrapper>
    <slot v-if="!options" />
    <template v-else>
      <mu-option
        v-for="(option, index) in options"
        :key="+new Date() + index"
        :keep-icon-indent="keepIconIndent"
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
      keepIconIndent: Boolean,
      popupClassName: {
        type: String,
        default: 'mu-dropdown-list'
      },
      value: undefined
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
      },
      options () {
        this.mountedOptions = []
      },
      value: {
        handler (value) {
          if (this.selectedValue !== value) {
            this.selectedValue = (value === undefined || value === null)
              ? (this.multiple ? [] : null)
              : value
            this.refreshInputValue()
          }
        },
        immediate: true
      }
    },
    created () {
      this.params.value = null
    },
    mounted () {
      this.params.editable = this.editable && !this.multiple
      this.refreshInputValue()
    },
    methods: {
      setInputValue () {
        // do nothing, juest overwrite InputBox's setInputValue()
      },
      setInputValueImmediately () {
        const { selectedValue: v, multiple, mountedOptions: options } = this
        if (!this.params.editable) {
          this.params.value = v
        }
        this.params.value =
          (v === null || v === undefined || v === '')
            ? ''
            : (
              this.params.editable
                ? v
                : (
                  (multiple ? v : [v])
                    .map(value =>
                      (options.find(item => item.value === value))?.label ||
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
        if (!options.find(item => option === item)) {
          options.push(option)
          if (!this.params.editable) this.refreshInputValue()
        }
      },
      unmountOption (option) {
        const { mountedOptions: options } = this
        const idx = options.findIndex(item => option === item)
        if (idx !== -1) {
          options.splice(idx, 1)
          // if (!this.params.editable) this.refreshInputValue()
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
        if (hidePopup) {
          this.popupParams.popupVisible = false
          this.focus()
        }
        this.$emit('optionclick', value, option)
      },
      onClearClick () {
        this.selectedValue = this.multiple ? [] : null
        this.hidePopup()
        this.clear()
        this.$emit('change', this.selectedValue)
      }
    }
  }
</script>
