<template>
  <div
    class="mu-input-box"
    :buttons="buttons"
    :disabled="params.disabled"
  >
    <mu-input-button
      v-if="iconAlign === 'left'"
      v-bind="iconParams"
      @click="onButtonClick" />
    <mu-input
      v-bind="inputParams"
      @input="onInput"
      @click="onInputClick"
      @keypress.native="onKeyPress" />
    <mu-input-button
      v-if="clearable"
      icon="close"
      clickable
      @click="onClearClick" />
    <mu-input-button
      v-if="iconAlign === 'right'"
      v-bind="iconParams"
      @click="onButtonClick" />
    <slot />
  </div>
</template>

<script>
  import './input-box.pcss'

  import Input from './input.vue'
  import InputButton from './input-button'

  export default {
    name: 'MusselInputBoxWrapper',
    components: {
      'mu-input': Input,
      'mu-input-button': InputButton
    },
    inject: ['inputBox', 'params'],
    computed: {
      clearable () {
        const { clearable, value } = this.params
        return clearable && String(value).length
      },
      iconAlign () {
        const { icon, iconClass, iconAlign } = this.params
        return (icon || iconClass)
          ? iconAlign || 'right'
          : null
      },
      iconParams () {
        const { icon, iconClass, iconClickable } = this.params
        return this.iconAlign
          ? {
            icon,
            iconClass,
            clickable: iconClickable
          }
          : null
      },
      inputParams () {
        const { type, value, readonly, disabled } = this.params
        return { type, value, readonly, disabled }
      },
      buttons () {
        return 0 + (this.clearable ? 1 : 0) + (this.iconAlign ? 1 : 0)
      }
    },
    methods: {
      onInput (value) {
        this.inputBox.onInput(value)
      },
      onInputClick () {
        this.inputBox.onInputClick()
      },
      onClearClick () {
        this.inputBox.onClearClick()
      },
      onButtonClick () {
        this.inputBox.onButtonClick()
      },
      onKeyPress (event) {
        this.inputBox.onKeyPress(event)
      }
    }
  }
</script>
