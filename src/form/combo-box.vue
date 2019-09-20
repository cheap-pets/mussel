<template>
  <div
    class="mu-input-box"
    :buttons="buttons"
    :fixed="isListStyle"
    :disabled="disabled">
    <mu-input
      :type="type"
      :value="inputValue"
      :disabled="disabled"
      :readonly="inputReadonly"
      :focus="dropdownVisible"
      @input="onInput"
      @click="onInputClick" />
    <mu-input-button
      v-if="clearBtnVisible"
      button-type="button"
      icon="close"
      @click="clear" />
    <mu-input-button
      v-if="inputBtnType"
      class="mu-expand-trigger"
      icon="key-down"
      :trigger-on="dropdownVisible"
      :button-type="buttonType"
      :focus="dropdownVisible"
      @click="onButtonClick" />
    <dropdown
      v-if="inputBtnType"
      v-model="dropdownVisible"
      class="mu-dropdown-list"
      :width="dropdownWidth"
      :height="dropdownHeight"
      :keep-icon-indent="keepIconIndent">
      <slot />
    </dropdown>
  </div>
</template>

<script>
  import InputBox from './input-box.vue'
  import Dropdown from '../layer/dropdown.vue'

  export default {
    components: {
      Dropdown
    },
    extends: InputBox,
    props: {
      value: [String, Number, Array],
      keepIconIndent: Boolean,
      dropdownHeight: String,
      dropdownWidth: String,
      dropdownStyle: {
        type: String,
        default: 'dropdownList',
        validator (value) {
          return [
            'none',
            'dropdown',
            'dropdownList',
            'drawer',
            'drawerList'
          ].indexOf(value) !== -1
        }
      },
      clearable: {
        type: Boolean,
        default: true
      }
    },
    data () {
      return {
        dropdownVisible: false
      }
    },
    computed: {
      isListStyle () {
        return this.dropdownStyle.indexOf('List') > 0
      },
      inputBtnType () {
        return this.isListStyle
          ? 'icon'
          : (this.dropdownStyle === 'none' ? false : 'button')
      },
      inputReadonly () {
        return this.readonly || this.isListStyle
      }
    },
    methods: {
      onInput (value) {
        this.inputValue = value
        this.$emit('input', value)
        this.$emit('change', { value })
      },
      onInputClick () {
        if (this.isListStyle) this.dropdownVisible = !this.dropdownVisible
      },
      onButtonClick () {
        this.dropdownVisible = !this.dropdownVisible
      },
      selectOption (option) {
        this.inputValue = option.label || option.value
        this.dropdownVisible = false
        this.$emit('change', option)
      }
    }
  }
</script>
