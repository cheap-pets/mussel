<template>
  <mu-button-editor-wrapper
    class="mu-popup-editor"
    :expanded="popupParams.visible">
    <mu-dropdown-panel
      v-bind="popupParams"
      @change="setPopupVisible"
      @mounted="onDropdownMounted"
      @beforedestroy="beforeDropdownDestroy">
      <slot />
    </mu-dropdown-panel>
    <slot name="expert" />
  </mu-button-editor-wrapper>
</template>

<script>
  import DropdownPanel from '../dropdown/dropdown-panel.vue'
  import ButtonEditorWrapper from './button-editor-wrapper.vue'

  export default {
    name: 'MusselPopupBoxWrapper',
    inject: ['params', 'popupParams'],
    components: {
      'mu-button-editor-wrapper': ButtonEditorWrapper,
      'mu-dropdown-panel': DropdownPanel
    },
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
