<template>
  <mu-dialog-wrapper>
    <slot />
  </mu-dialog-wrapper>
</template>

<script>
  import BaseDialog from './base-dialog.vue'

  export default {
    name: 'MusselDialog',
    extends: BaseDialog
  }
</script>
