<template>
  <div
    class="mu-editor"
    :buttons="buttons"
    :readonly="params.readonly"
    :disabled="params.disabled">
    <mu-editor-icon
      v-if="iconAlign === 'left'"
      v-bind="iconParams"
      @click="onButtonClick" />
    <mu-input
      v-bind="inputParams"
      @input="onInput"
      @click="onInputClick"
      @keypress.native="onKeyPress" />
    <mu-editor-icon
      v-if="clearable"
      clickable
      trigger-type="cancel"
      @click="onClearClick" />
    <mu-editor-icon
      v-if="iconAlign === 'right'"
      v-bind="iconParams"
      @click="onButtonClick" />
    <slot />
  </div>
</template>

<script>
  import './editor.pcss'

  import Input from './input.vue'
  import EditorIcon from './editor-icon'

  export default {
    name: 'MusselButtonEditorWrapper',
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
      }
    }
  }
</script>
