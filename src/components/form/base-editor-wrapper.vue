<template>
  <div
    class="mu-editor"
    :buttons="buttons"
    :readonly="params.readonly"
    :disabled="params.disabled">
    <mu-editor-icon
      v-if="iconPosition === 'left'"
      v-bind="iconParams"
      @click="onButtonClick" />
    <mu-input
      v-bind="inputParams"
      @input="onInput"
      @click="onInputClick"
      @blur="onBlur"
      @esckey="onEscKey"
      @enterkey="onEnterKey"
      @keypress.native="onKeyPress" />
    <mu-editor-icon
      v-if="clearable"
      clickable
      trigger-type="clear"
      @click="onClearClick" />
    <mu-editor-icon
      v-if="iconPosition === 'right'"
      v-bind="iconParams"
      @click="onButtonClick" />
    <slot />
  </div>
</template>

<script>
  import Input from './input.vue'
  import EditorIcon from './editor-icon'

  export default {
    name: 'MusselBaseEditorWrapper',
    components: {
      'mu-input': Input,
      'mu-editor-icon': EditorIcon
    },
    inject: ['editor', 'params'],
    computed: {
      clearable () {
        const p = this.params
        return p.clearable && (!!p.value || p.value === 0)
      },
      iconPosition () {
        const p = this.params
        return (p.icon || p.iconClass || p.triggerType)
          ? p.iconPosition || 'right'
          : null
      },
      buttons () {
        return 0 + (this.clearable ? 1 : 0) + (this.iconPosition ? 1 : 0)
      },
      iconParams () {
        const p = this.params
        return this.iconPosition
          ? {
            icon: p.icon,
            iconClass: p.iconClass,
            clickable: p.iconClickable,
            triggerType: p.triggerType
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
        this.editor.onInput(value)
      },
      onInputClick () {
        this.editor.onInputClick()
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
      }
    }
  }
</script>
