<template>
  <div
    class="mu-editor"
    :clearable="clearable"
    :icon-align="iconAlign"
    :readonly="params.readonly"
    :disabled="params.disabled">
    <mu-input
      v-bind="inputParams"
      class="mu-editor_input"
      @blur="onBlur"
      @focus="onFocus"
      @click="onInputClick"
      @input="onInput"
      @esckey="onEscKey"
      @enterkey="onEnterKey"
      @keypress.native="onKeyPress" />
    <mu-icon
      v-if="clearable"
      class="mu-editor_eraser"
      icon="x"
      clickable
      @click="onClearClick" />
    <mu-icon
      v-if="iconParams"
      v-bind="iconParams"
      class="mu-editor_button"
      @click="onButtonClick" />
    <slot />
  </div>
</template>

<script>
  import Input from './input.vue'
  import Icon from '../icon/icon.vue'

  import './editor.pcss'

  export default {
    name: 'MusselBaseEditorWrapper',
    components: {
      'mu-input': Input,
      'mu-icon': Icon
    },
    inject: ['editor', 'params'],
    computed: {
      clearable () {
        const p = this.params
        return p.clearable && (!!p.value || p.value === 0)
      },
      iconAlign () {
        const p = this.params
        return (p.icon || p.iconClass) ? (p.iconAlign || 'right') : null
      },
      iconParams () {
        const p = this.params
        return this.iconAlign
          ? {
            icon: p.icon,
            iconClass: p.iconClass,
            clickable: p.iconClickable
          }
          : undefined
      },
      inputParams () {
        const p = this.params
        return {
          type: p.type,
          value: p.value,
          focus: p.focus,
          disabled: p.disabled,
          autofocus: p.autofocus,
          placeholder: p.placeholder,
          readonly: p.readonly || !p.editable
        }
      }
    },
    methods: {
      onInput (value) {
        this.editor.onInput(value)
      },
      onInputClick (event) {
        this.editor.onInputClick(event)
      },
      onClearClick () {
        this.editor.onClearClick()
      },
      onButtonClick () {
        this.editor.onButtonClick()
      },
      onKeyPress (event) {
        this.editor.onKeyPress(event)
      },
      onEscKey () {
        this.editor.onEscKey()
      },
      onEnterKey () {
        this.editor.onEnterKey()
      },
      onBlur () {
        this.editor.onBlur()
      },
      onFocus () {
        this.editor.onFocus()
      }
    }
  }
</script>
