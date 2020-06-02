<template>
  <mu-popup-editor-wrapper class="mu-search-box">
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
      editable: {
        type: Boolean,
        default: true
      },
      popupStyle: {
        type: String,
        default: 'none'
      }
    },
    data () {
      return {

      }
    },
    created () {
      this.params.value = null
      this.params.editable = true
    },
    mounted () {

    },
    methods: {
      setValue (value) {
      },
      toggleSelection (value, option) {
        this.hidePopup()
        this.$emit('change', value)
        this.$emit('optionclick', value, option)
        this.focus()
      },
      onClearClick () {
        this.hidePopup()
        this.clear()
        this.$emit('change', null)
      },
      onInput (value) {
        if (this.__delayTimer) clearTimeout(this.__delayTimer)
        this.__delayTimer = setTimeout(() => {
          this.$emit('search', value)
          if (this.popupStyle !== 'none') this.showPopup()
        }, 500)
      }
    }
  }
</script>
