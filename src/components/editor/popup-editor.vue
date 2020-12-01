<template>
  <mu-popup-editor-wrapper>
    <slot />
  </mu-popup-editor-wrapper>
</template>

<script>
  import BasePopupEditor from './base-popup-editor'

  export default {
    name: 'MusselPopupEditor',
    extends: BasePopupEditor
  }
</script>
