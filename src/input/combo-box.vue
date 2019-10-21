<template>
  <mu-popup-editor-wrapper>
    <slot v-if="!options" />
    <template v-else>
      <mu-option
        v-for="(option, index) in options"
        :key="+new Date() + '_' + index"
        :keep-icon-indent="keepIconIndent"
        :option="option"
        :fields="fields" />
    </template>
  </mu-popup-editor-wrapper>
</template>

<script>
  import BasePopupEditor from './base-popup-editor'
  import Option from './option.js'

  function isEmptyValue (v) {
    return v === undefined || v === null || v === ''
  }

  export default {
    name: 'MusselComboBox',
    components: {
      'mu-option': Option
    },
    extends: BasePopupEditor,
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
        comboValue: null,
        mountedOptions: []
      }
    },
    computed: {
      valueField () {
        return this.fields?.value || 'value'
      }
    },
    watch: {
      multiple (value) {
        this.params.editable = this.editable && !value
      },
      options () {
        this.mountedOptions = []
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
      setInputValue (value) {
        if (this.comboValue !== value) {
          this.comboValue = isEmptyValue(value)
            ? (this.multiple ? [] : null)
            : value
          this.refreshInputValue()
        }
      },
      setInputValueImmediately () {
        const {
          mountedOptions: options,
          comboValue: v,
          multiple,
          params
        } = this
        params.value = isEmptyValue(v)
          ? ''
          : (
            params.editable
              ? v
              : (
                (multiple ? v : [v])
                  .map(value =>
                    options.find(item => item.value === value)?.label || ''
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
          this.rivTimer = setTimeout(
            this.setInputValueImmediately,
            50
          )
        }
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
        if (idx !== -1) options.splice(idx, 1)
      },
      toggleSelection (value, option, hidePopup = true) {
        if (this.multiple) {
          const { comboValue: values } = this
          const idx = values.indexOf(value)
          if (idx !== -1) {
            values.splice(idx, 1)
          } else {
            values.push(value)
          }
          this.$emit('change', values)
        } else {
          this.comboValue = value
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
        this.comboValue = this.multiple ? [] : null
        this.hidePopup()
        this.clear()
        this.$emit('change', this.comboValue)
      }
    }
  }
</script>
