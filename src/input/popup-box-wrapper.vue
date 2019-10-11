<template>
  <mu-input-box-wrapper>
    <mu-dropdown
      v-if="!params.disabled"
      v-bind="dropdownParams"
      @change="setPopupVisible">
      <slot />
    </mu-dropdown>
  </mu-input-box-wrapper>
</template>

<script>
  import Dropdown from '../layer/dropdown.vue'
  import InputBoxWrapper from './input-box-wrapper.vue'

  export default {
    name: 'MusselPopupBoxWrapper',
    inject: ['inputBox', 'params', 'popupParams'],
    components: {
      'mu-input-box-wrapper': InputBoxWrapper,
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
        this.inputBox.setPopupVisible(value)
        this.params.focus = value
      }
    }
  }
</script>
