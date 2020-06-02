<template>
  <mu-popup-editor-wrapper>
    <slot v-if="!options" />
    <template v-else>
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
      value: null,
      fields: Object,
      options: Array,
      multiple: Boolean,
      popupMaxHeight: {
        type: String,
        default: '300px'
      },
      popupStyle: {
        type: String,
        default: 'dropdown-list'
      }
    },
    data () {
      return {
        comboValue: null,
        mountedOptions: []
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
      this.delaySetValue()
    },
    methods: {
      setValue (value) {
        if (this.comboValue !== value) {
          this.comboValue = isEmptyValue(value)
            ? (this.multiple ? [] : null)
            : value
          this.delaySetValue()
        }
      },
      setInputValue () {
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
      delaySetValue (immediate = false) {
        if (this.__delayTimer) clearTimeout(this.__delayTimer)
        this.__delayTimer = setTimeout(this.setInputValue, 50)
        /*
        if (this.params.editable || immediate) {
          this.setInputValue()
        } else {
          this.delayTimer = setTimeout(
            this.setInputValue,
            50
          )
        }
        */
      },
      mountOption (option) {
        const { mountedOptions: options } = this
        if (!options.find(item => option === item)) {
          options.push(option)
          if (!this.params.editable) this.delaySetValue()
        }
      },
      unmountOption (option) {
        const { mountedOptions: options } = this
        const idx = options.findIndex(item => option === item)
        if (idx !== -1) options.splice(idx, 1)
      },
      toggleSelection (value, option) {
        if (this.multiple) {
          const { comboValue: values } = this
          const idx = values.indexOf(value)
          if (idx !== -1) values.splice(idx, 1)
          else values.push(value)
        } else {
          this.comboValue = value
        }

        this.delaySetValue(true)
        this.popupParams.visible = false
        this.focus()

        this.$emit('optionclick', value, option)
        this.$emit('change', this.comboValue)
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
