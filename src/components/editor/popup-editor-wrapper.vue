<template>
  <mu-editor-wrapper
    class="mu-button-editor mu-popup-editor"
    :expanded="popupParams.visible"
    :popup-style="popupParams.popupStyle">
    <mu-dropdown-panel
      v-if="popupParams.popupStyle !== 'none'"
      v-bind="popupParams"
      @change="setPopupVisible"
      @mounted="onDropdownMounted"
      @hook:before-destroy="beforeDropdownDestroy">
      <slot />
    </mu-dropdown-panel>
    <slot name="expert" />
  </mu-editor-wrapper>
</template>

<script>
  import DropdownPanel from '../dropdown/dropdown-panel.vue'
  import BaseEditorWrapper from './base-editor-wrapper.vue'

  export default {
    name: 'MusselPopupBoxWrapper',
    components: {
      'mu-editor-wrapper': BaseEditorWrapper,
      'mu-dropdown-panel': DropdownPanel
    },
    inject: ['params', 'popupParams'],
    methods: {
      setPopupVisible (value) {
        this.popupParams.visible = value
        this.params.focus = value
      },
      onDropdownMounted (el) {
        this.$emit('dropdownmounted', el)
      },
      beforeDropdownDestroy () {
        this.$emit('beforedropdowndestroy')
      }
    }
  }
</script>
