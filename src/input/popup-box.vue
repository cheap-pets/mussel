<template>
  <mu-popup-box-wrapper>
    <slot />
  </mu-popup-box-wrapper>
</template>

<script>
  import BasePopupBox from './base-popup-box'

  export default {
    name: 'MusselPopupBox',
    extends: BasePopupBox
  }
</script>
