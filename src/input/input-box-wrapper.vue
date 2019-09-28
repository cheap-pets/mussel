<template>
  <div
    class="mu-input-box"
    :buttons="buttons"
    :readonly="params.readonly"
    :disabled="params.disabled">
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
      clickable
      trigger-type="close"
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
        const p = this.params
        return p.clearable && (!!p.value || p.value === 0)
      },
      iconAlign () {
        const p = this.params
        return (p.icon || p.iconClass || p.triggerType)
          ? p.iconAlign || 'right'
          : null
      },
      buttons () {
        return 0 + (this.clearable ? 1 : 0) + (this.iconAlign ? 1 : 0)
      },
      iconParams () {
        const p = this.params
        return this.iconAlign
          ? {
            icon: p.icon,
            iconClass: p.iconClass,
            clickable: p.iconClickable || !!p.triggerType,
            triggerType: p.triggerType,
            triggerOn: p.triggerOn
          }
          : null
      },
      inputParams () {
        const p = this.params
        return {
          type: p.type,
          value: p.value,
          focus: p.focus,
          readonly: p.readonly || !p.editable,
          disabled: p.disabled,
          placeholder: p.placeholder
        }
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
