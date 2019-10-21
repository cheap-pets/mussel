<template>
  <mu-button-editor-wrapper>
    <mu-dropdown
      v-show="!params.disabled"
      v-bind="dropdownParams"
      @change="setPopupVisible">
      <slot />
    </mu-dropdown>
  </mu-button-editor-wrapper>
</template>

<script>
  import Dropdown from '../layer/dropdown.vue'
  import ButtonEditorWrapper from './button-editor-wrapper.vue'

  export default {
    name: 'MusselPopupBoxWrapper',
    inject: ['editor', 'params', 'popupParams'],
    components: {
      'mu-button-editor-wrapper': ButtonEditorWrapper,
      'mu-dropdown': Dropdown
    },
    computed: {
      dropdownParams () {
        const p = this.popupParams
        return {
          width: p.popupWidth,
          height: p.popupHeight,
          visible: p.popupVisible,
          className: p.popupClassName,
          renderToBody: p.popupRenderToBody
        }
      }
    },
    methods: {
      setPopupVisible (value) {
        this.editor.setPopupVisible(value)
        this.params.triggerOn = value
        this.params.focus = value
      }
    }
  }
</script>
