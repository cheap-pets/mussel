<template>
  <div
    class="mu-input-box"
    :buttons="buttons"
    :disabled="disabled"
    :select-only="isListStyle"
    :select-on="dropdownVisible">
    <mu-input
      :type="type"
      :value="inputValue"
      :disabled="disabled"
      :readonly="inputReadonly"
      :focus="dropdownVisible"
      @change="onChange"
      @click="onInputClick" />
    <mu-input-button
      v-if="clearBtnVisible"
      button-type="button"
      icon="close"
      @click="clear" />
    <mu-input-button
      v-if="buttonType"
      :button-type="buttonType"
      :focus="dropdownVisible"
      :icon-class="iconClass"
      :icon="icon"
      @click="onButtonClick" />
    <dropdown
      v-if="buttonType"
      v-model="dropdownVisible"
      :height="dropdownHeight"
      :width="dropdownWidth">
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
      dropdownHeight: String,
      dropdownWidth: String,
      dropdownStyle: {
        type: String,
        default: 'dropdownList',
        validator (value) {
          return ['none', 'dropdown', 'dropdownList', 'drawer', 'drawerList'].indexOf(value) !== -1
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
      buttonType () {
        return this.isListStyle
          ? 'icon'
          : (this.dropdownStyle === 'none' ? false : 'button')
      },
      inputReadonly () {
        return this.readonly || this.isListStyle
      }
    },
    methods: {
      onInputClick () {
        if (this.isListStyle) this.dropdownVisible = !this.dropdownVisible
      },
      onButtonClick () {
        this.dropdownVisible = !this.dropdownVisible
      }
    }
  }
</script>
